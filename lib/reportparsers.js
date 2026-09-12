/*
reportparsers.js — browser-side lab report PDF detection/extraction.

Ported from the High-EC3 project's pdf_extraction_tool_v1.py. IMPORTANT: that
tool's own docstring is explicit that, as of this port, exactly ONE (lab,assay)
extraction parser exists (IIVS DPRA) and even it is UNVALIDATED against real
PyMuPDF output. Every other lab/assay combination there reports
"template_not_recognized" -- detection succeeding just means "this looks like
a report of this type", not "values were extracted".

This module keeps that same honesty: it detects lab + assay from the same
signature strings, runs the IIVS DPRA windowed-search parser (same algorithm),
and for anything else returns detected-only with no fabricated values. Do not
add new per-lab regexes here without first grep-ing real extracted text (the
project's own development discipline) -- guessing a layout produces "it ran"
output that can be silently wrong.
*/
(function (global) {
  'use strict';

  var LAB_SIGNATURES = {
    IIVS: ['Institute for In Vitro Sciences', 'IIVS'],
    Givaudan: ['Givaudan Schweiz AG', 'Givaudan International'],
    BASF: ['BASF SE'],
    Gentronix: ['Gentronix Limited', 'Gentronix Study'],
    CharlesRiver: ['Charles River Laboratories', 'Charles River Den Bosch'],
    Envigo: ['Envigo CRS', 'Envigo Study'],
    Eurofins: ['Eurofins Munich', 'Eurofins Biopharma', 'Eurofins Analytik'],
    Bioassay: ['Bioassay Labor', 'Bioassay Labor für biologische Analytik'],
  };

  var ASSAY_SIGNATURES = {
    DPRA: ['Direct Peptide Reactivity Assay', 'DPRA'],
    kDPRA: ['kinetic Direct Peptide Reactivity', 'k-DPRA', 'kDPRA'],
    KeratinoSens: ['KeratinoSens'],
    hCLAT: ['Human Cell Line Activation Test', 'h-CLAT', 'hCLAT'],
    USens: ['U-SENS', 'U937 Cell Line Activation', 'MUSST'],
  };

  var CAS_RE = /\b(\d{2,7}-\d{2}-\d)\b/g;

  function detect(text, sigMap) {
    var hits = [];
    var low = text.toLowerCase();
    Object.keys(sigMap).forEach(function (key) {
      var sigs = sigMap[key];
      for (var i = 0; i < sigs.length; i++) {
        if (low.indexOf(sigs[i].toLowerCase()) >= 0) { hits.push(key); break; }
      }
    });
    if (!hits.length) return null;
    if (hits.indexOf('kDPRA') >= 0 && hits.indexOf('DPRA') >= 0) {
      hits = hits.filter(function (h) { return h !== 'DPRA'; });
    }
    return hits.length === 1 ? hits[0] : { ambiguous: hits };
  }

  function parseIivsDpra(text) {
    var matches = [];
    var m;
    CAS_RE.lastIndex = 0;
    while ((m = CAS_RE.exec(text))) matches.push(m);
    if (!matches.length) return { status: 'template_not_recognized', note: 'no CAS-number-shaped token found in extracted text' };

    var candidates = [];
    matches.forEach(function (mm) {
      var start = Math.max(0, mm.index - 400);
      var end = Math.min(text.length, mm.index + mm[0].length + 400);
      var window = text.slice(start, end);
      var verdictM = /\b(Non[- ]?[Ss]ensitizer|[Ss]ensitizer)\b/.exec(window);
      var pctMatches = window.match(/(-?\d+\.?\d*)\s*%/g) || [];
      var nums = pctMatches.slice(0, 3).map(function (s) { return parseFloat(s); });
      if (!verdictM && !nums.length) return;
      var call = verdictM ? HouseStyle.normalize_call(verdictM[1]) : null;
      var cys = null, lys = null, avg = null;
      if (nums.length >= 3) { cys = nums[0]; lys = nums[1]; avg = nums[2]; }
      else if (nums.length === 2) { cys = nums[0]; lys = nums[1]; }
      else if (nums.length === 1) { cys = nums[0]; }
      candidates.push({ cas: mm[1], call: call, cys: cys, lys: lys, avg: avg });
    });

    if (!candidates.length) return { status: 'template_not_recognized', note: 'CAS token(s) found but no nearby verdict/percentages' };

    var runs = candidates.filter(function (c) { return c.call !== null; })
      .map(function (c) { return { call: c.call, cys: c.cys, lys: c.lys, avg: c.avg }; });

    if (!runs.length) {
      return { status: 'check', note: candidates.length + ' candidate window(s) with numbers but no parseable Sensitizer/Non-sensitizer verdict — manual check needed', candidates: candidates };
    }

    return { status: runs.length === candidates.length ? 'ok' : 'check', runs: runs, candidates: candidates };
  }

  async function ensurePdfJs() {
    if (global.pdfjsLib) return global.pdfjsLib;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.min.mjs', true);
    // Fallback: some environments need the legacy build; the .mjs above is a module.
    if (!global.pdfjsLib) throw new Error('pdf.js failed to load');
    global.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs';
    return global.pdfjsLib;
  }

  function loadScript(src, isModule) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      if (isModule) s.type = 'module';
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  async function extractText(file) {
    var pdfjsLib = await ensurePdfJs();
    var buf = await file.arrayBuffer();
    var doc = await pdfjsLib.getDocument({ data: buf }).promise;
    var parts = [];
    for (var i = 1; i <= doc.numPages; i++) {
      var page = await doc.getPage(i);
      var content = await page.getTextContent();
      parts.push(content.items.map(function (it) { return it.str; }).join(' '));
    }
    return parts.join('\n');
  }

  function parseAny(text) {
    if (!text || text.trim().length < 200) {
      return { lab: null, assay: null, status: 'text_extraction_failed', note: 'Very little text extracted — this may be a scanned/image-only PDF that needs OCR.' };
    }
    var lab = detect(text, LAB_SIGNATURES);
    var assay = detect(text, ASSAY_SIGNATURES);
    var labName = typeof lab === 'string' ? lab : (lab ? 'UNKNOWN (ambiguous: ' + lab.ambiguous.join(',') + ')' : 'UNKNOWN');
    var assayName = typeof assay === 'string' ? assay : (assay ? 'UNKNOWN (ambiguous: ' + assay.ambiguous.join(',') + ')' : 'UNKNOWN');

    if (typeof lab === 'string' && lab === 'IIVS' && assay === 'DPRA') {
      var result = parseIivsDpra(text);
      return Object.assign({ lab: labName, assay: assayName }, result);
    }

    return {
      lab: labName, assay: assayName,
      status: (typeof lab === 'string' && typeof assay === 'string') ? 'template_not_recognized' : 'unknown',
      note: (typeof lab === 'string' && typeof assay === 'string')
        ? 'Recognized as ' + labName + ' ' + assayName + ', but no extraction parser is implemented for this lab/assay combination yet — enter values manually.'
        : 'Could not confidently identify the lab and/or assay type from this PDF.',
    };
  }

  function applyToState(found, ctx) {
    if (!found || found.status === 'template_not_recognized' || found.status === 'unknown' || found.status === 'text_extraction_failed') return;
    var ensureInputs = ctx.ensureInputs, update = ctx.update, casHint = ctx.casHint;
    if (found.assay === 'DPRA' && found.runs && found.runs.length) {
      // Multi-substance IIVS tables can yield one candidate per row/substance;
      // prefer the one matching the entered CAS if given, else take the first.
      var chosen = found.runs[0];
      if (casHint && found.candidates) {
        var match = found.candidates.find(function (c) { return c.cas === casHint; });
        if (match && match.call !== null) chosen = { call: match.call, cys: match.cys, lys: match.lys, avg: match.avg };
      }
      var d = ensureInputs('DPRA');
      // 3 numbers found near the CAS token in IIVS layout = Cys%, Lys%, Mean% (per
      // High-EC3 project's known IIVS table order). Fewer numbers found -> only
      // partial data was recoverable; leave the rest for manual entry.
      if (chosen.lys !== null && chosen.lys !== undefined) d.lysDepletion = chosen.lys;
      if (chosen.avg !== null && chosen.avg !== undefined) d.meanDepletion = chosen.avg;
      else if (chosen.cys !== null && chosen.cys !== undefined && (chosen.lys === null || chosen.lys === undefined)) d.meanDepletion = chosen.cys;
      update();
    }
  }

  global.ReportParsers = {
    ensurePdfJs: ensurePdfJs,
    extractText: extractText,
    parseAny: parseAny,
    applyToState: applyToState,
    _internal: { detect: detect, parseIivsDpra: parseIivsDpra, LAB_SIGNATURES: LAB_SIGNATURES, ASSAY_SIGNATURES: ASSAY_SIGNATURES },
  };
})(window);
