/*
housestyle.js — JS port of housestyle_render_v1.py (RIFM High-EC3 project).
Shared house-style rendering for RIFM skin-sensitization data. Values-in ->
house-style-string-out. Ported line-for-line from the Python reference so the
same inputs produce the same cell text.

HOUSE-STYLE SPEC (see High-EC3 CLAUDE.md for the authoritative legend)
Cell grammar : Call (label value, label value, ...) [trailing note]
No '=' signs. Fields are label-first ("Cys 2.2%").
Separators   : commas BETWEEN fields; semicolons BETWEEN expanded runs/studies.
Default      : arithmetic mean of the GOOD runs -> one averaged segment.
Precision    : keep source data verbatim; averaged values inherit source dp.
>X bounds    : preserve the report's own ">X"; otherwise fall back to the
               assay default when the field was not reached.
Tokens       : n.i. no induction | n.d. not determined | n.r. not reported |
               n/a assay not performed | >X exceeds top tested concentration.
*/
(function (global) {
  'use strict';

  var LABEL_FIRST = true;

  var QUAL = {
    'ni': 'n.i.', 'n.i.': 'n.i.', 'no induction': 'n.i.',
    'nd': 'n.d.', 'n.d.': 'n.d.', 'not determined': 'n.d.',
    'nr': 'n.r.', 'n.r.': 'n.r.', 'not reported': 'n.r.',
    'na': 'n/a', 'n/a': 'n/a', 'not applicable': 'n/a',
  };
  var QUAL_VALUES = Object.keys(QUAL).map(function (k) { return QUAL[k]; });
  var NUM_RE = /^\s*([<>]=?)?\s*(-?\d+(?:\.\d+)?)\s*$/;

  function normalize_call(tok) {
    if (tok === null || tok === undefined) return null;
    var t = String(tok).trim();
    var low = t.toLowerCase();
    if (['positive', 'pos', 'sensitizer', 'sensitiser'].indexOf(low) >= 0) return 'Pos';
    if (['negative', 'neg', 'non-sensitizer', 'non-sensitiser', 'nonsensitizer', 'non sensitizer', 'minimal'].indexOf(low) >= 0) return 'Neg';
    if (['borderline', 'bl', 'equivocal'].indexOf(low) >= 0) return 'BL';
    if (['inconclusive', 'nc', 'no conclusion'].indexOf(low) >= 0) return 'Inconclusive';
    return t;
  }

  function _parse(v) {
    // returns {num, dp, prefix, qual}
    if (v === null || v === undefined) return { num: null, dp: 0, prefix: '', qual: null };
    if (typeof v === 'boolean') return { num: null, dp: 0, prefix: '', qual: null };
    if (typeof v === 'number') {
      if (Number.isInteger(v)) return { num: v, dp: 0, prefix: '', qual: null };
      var s = String(v);
      var dp = s.indexOf('.') >= 0 ? s.split('.')[1].length : 0;
      return { num: v, dp: dp, prefix: '', qual: null };
    }
    var str = String(v).trim();
    if (str === '') return { num: null, dp: 0, prefix: '', qual: null };
    var low = str.toLowerCase();
    if (QUAL.hasOwnProperty(low)) return { num: null, dp: 0, prefix: '', qual: QUAL[low] };
    var m = NUM_RE.exec(str);
    if (m) {
      var prefix = m[1] || '';
      var numStr = m[2];
      var dp2 = numStr.indexOf('.') >= 0 ? numStr.split('.')[1].length : 0;
      return { num: parseFloat(numStr), dp: dp2, prefix: prefix, qual: null };
    }
    return { num: null, dp: 0, prefix: '', qual: str };
  }

  function _fmtNum(x, dp) {
    if (dp <= 0 && Number(x) === Math.trunc(Number(x))) return String(Math.round(x));
    return Number(x).toFixed(dp);
  }

  function _display(v) {
    var p = _parse(v);
    if (p.qual !== null) return p.qual;
    if (p.num === null) return v !== null && v !== undefined ? String(v).trim() : '';
    return p.prefix + _fmtNum(p.num, p.dp);
  }

  function _mean(values, floorZero, autoExtendCap) {
    // autoExtendCap: only set by _dpraAvg. Averaging two DIFFERENT fields
    // (Cys, Lys) into a derived Avg can genuinely need one more decimal
    // place than either source had (7 and 8 average to 7.5) - dropping that
    // digit silently rounds the displayed value, which matters right at a
    // BR boundary (e.g. 4.945 vs 4.95). Elsewhere _mean() averages several
    // runs of the SAME field, where "inherit source decimal places" is the
    // documented house-style convention and autoExtendCap is left unset.
    var nums = [], dp = 0;
    (values || []).forEach(function (v) {
      var p = _parse(v);
      if (p.num === null || p.prefix) return; // skip qualitative/bounded
      var n = p.num;
      if (floorZero && n < 0) n = 0;
      nums.push(n);
      dp = Math.max(dp, p.dp);
    });
    if (!nums.length) return null;
    var sum = nums.reduce(function (a, b) { return a + b; }, 0);
    var avg = sum / nums.length;
    if (autoExtendCap != null) {
      for (var d = dp; d <= autoExtendCap; d++) {
        var scaled = avg * Math.pow(10, d);
        if (Math.abs(scaled - Math.round(scaled)) < 1e-9) { dp = d; break; }
        dp = autoExtendCap;
      }
    }
    return _fmtNum(avg, dp);
  }

  function _pct(v) {
    var d = _display(v);
    if (QUAL_VALUES.indexOf(d) >= 0 || d === '') return d || 'n.r.';
    return d + '%';
  }

  function _field(label, value) {
    return LABEL_FIRST ? (label + ' ' + value) : (value + ' ' + label);
  }

  function _good(runs) {
    return (runs || []).filter(function (r) {
      if (!r) return false;
      if (r.exclude) return false;
      var c = (r.call || '').toString().trim().toLowerCase();
      if (c === 'inconclusive' || c === 'invalid') return false;
      return true;
    });
  }

  function _wrap(call, inner, note) {
    var cell = call + ' (' + inner + ')';
    if (note) cell += ' [' + note + ']';
    return cell;
  }

  function join_studies(cells) {
    return (cells || []).filter(Boolean).join('; ');
  }

  // ---- DPRA ----
  function _dpraAvg(cys, lys) { return _mean([cys, lys], true, 2); }
  function _dpraSeg(cys, lys, avg, subcall, note) {
    if (avg === undefined || avg === null) avg = _dpraAvg(cys, lys);
    var parts = [_field('Cys', _pct(cys)), _field('Lys', _pct(lys)), _field('Avg', _pct(avg))];
    var seg = parts.join(', ');
    if (subcall) seg = subcall + ' ' + seg;
    if (note) seg = seg + ' [' + note + ']';
    return seg;
  }
  function render_dpra(runs, call, expand, note) {
    call = normalize_call(call);
    if (!expand) {
      var good = _good(runs);
      var inner;
      if (good.length === 1 && good[0].avg !== undefined && good[0].avg !== null) {
        var r = good[0];
        inner = _dpraSeg(r.cys, r.lys, r.avg);
      } else {
        var cys = _mean(good.map(function (r) { return r.cys; }));
        var lys = _mean(good.map(function (r) { return r.lys; }));
        inner = _dpraSeg(cys, lys, _dpraAvg(cys, lys));
      }
      return _wrap(call, inner, note);
    }
    var segs = (runs || []).map(function (r) {
      return _dpraSeg(r.cys, r.lys, r.avg, r.call ? normalize_call(r.call) : null, r.note);
    });
    return _wrap(call, segs.join('; '), note);
  }

  // ---- KeratinoSens ----
  function render_ks(runs, call, note) {
    call = normalize_call(call);
    var good = _good(runs);
    var imax = _mean(good.map(function (r) { return r.imax; }));
    var ec15 = _mean(good.map(function (r) { return r.ec15; }));
    var ic50 = _mean(good.map(function (r) { return r.ic50; }));
    var ic30 = _mean(good.map(function (r) { return r.ic30; }));
    function srcBound(key) {
      for (var i = 0; i < good.length; i++) {
        var p = _parse(good[i][key]);
        if (p.prefix) return _display(good[i][key]);
      }
      return null;
    }
    var ec15v = ec15 !== null ? ec15 : (srcBound('ec15') || '>2000');
    var ic50v = ic50 !== null ? ic50 : (srcBound('ic50') || '>2000');
    var ic30v = ic30 !== null ? ic30 : 'n.r.';
    var imaxv = imax !== null ? imax : 'n.r.';
    var parts = [
      _field('Imax', _display(imaxv)),
      _field('EC1.5', _display(ec15v)),
      _field('IC50', _display(ic50v)),
      _field('IC30', _display(ic30v)),
    ];
    return _wrap(call, parts.join(', '), note);
  }

  // ---- h-CLAT ----
  function _minBound(a, b) {
    var pa = _parse(a), pb = _parse(b);
    if (pa.num !== null && pb.num !== null && !pa.prefix && !pb.prefix) return pa.num <= pb.num ? a : b;
    if (pa.num !== null && !pa.prefix) return a;
    if (pb.num !== null && !pb.prefix) return b;
    return pa.num !== null ? a : b;
  }
  function render_hclat(runs, call, note) {
    call = normalize_call(call);
    var good = _good(runs);
    var ec150 = _mean(good.map(function (r) { return r.ec150; }));
    var ec200 = _mean(good.map(function (r) { return r.ec200; }));
    var cv75 = _mean(good.map(function (r) { return r.cv75; }));
    function srcBound(key) {
      for (var i = 0; i < good.length; i++) {
        var p = _parse(good[i][key]);
        if (p.prefix) return _display(good[i][key]);
      }
      return null;
    }
    var ec150v = ec150 !== null ? ec150 : (srcBound('ec150') || '>1000');
    var ec200v = ec200 !== null ? ec200 : (srcBound('ec200') || '>1000');
    var cv75v = cv75 !== null ? cv75 : (srcBound('cv75') || '>1000');
    var mitSupplied = null;
    for (var i = 0; i < good.length; i++) {
      if (good[i].mit !== undefined && good[i].mit !== null) { mitSupplied = good[i].mit; break; }
    }
    var mitv = mitSupplied !== null ? mitSupplied : _minBound(ec150v, ec200v);
    var parts = [
      _field('EC150', _display(ec150v)),
      _field('EC200', _display(ec200v)),
      _field('MIT', _display(mitv)),
      _field('CV75', _display(cv75v)),
    ];
    return _wrap(call, parts.join(', '), note);
  }

  // ---- U-Sens ----
  function render_usens(runs, call, note) {
    call = normalize_call(call);
    var good = _good(runs);
    var ec150 = _mean(good.map(function (r) { return r.ec150; }));
    var cv70 = _mean(good.map(function (r) { return r.cv70; }));
    function srcBound(key) {
      for (var i = 0; i < good.length; i++) {
        var p = _parse(good[i][key]);
        if (p.prefix) return _display(good[i][key]);
      }
      return null;
    }
    var ec150v = ec150 !== null ? ec150 : (srcBound('ec150') || '>200');
    var cv70v = cv70 !== null ? cv70 : (srcBound('cv70') || '>200');
    var parts = [_field('EC150', _display(ec150v)), _field('CV70', _display(cv70v))];
    return _wrap(call, parts.join(', '), note);
  }

  // ---- kDPRA ----
  function render_kdpra(runs, call, note) {
    var good = _good(runs);
    var lk = _mean(good.map(function (r) { return r.log_kmax; }));
    var lkv;
    if (lk === null) {
      var bound = null;
      for (var i = 0; i < good.length; i++) {
        var p = _parse(good[i].log_kmax);
        if (p.prefix) { bound = good[i].log_kmax; break; }
      }
      lkv = bound !== null ? bound : 'n.r.';
    } else {
      lkv = lk;
    }
    var pct = _mean(good.map(function (r) { return r.pct_depletion; }));
    var pctv = pct !== null ? _pct(pct) : 'n.r.';
    var parts = [_field('log kmax', _display(lkv)), '% depletion @24h,5mM ' + pctv];
    return _wrap(String(call).trim(), parts.join(', '), note);
  }

  global.HouseStyle = {
    LABEL_FIRST: LABEL_FIRST,
    normalize_call: normalize_call,
    join_studies: join_studies,
    render_dpra: render_dpra,
    render_ks: render_ks,
    render_hclat: render_hclat,
    render_usens: render_usens,
    render_kdpra: render_kdpra,
  };
})(window);
