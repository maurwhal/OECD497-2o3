// Cloudflare Worker: password-protected proxy for two chemical property
// lookups (EPA CompTox and EPA EPI Suite), used by the PoD calculator.
//
// Why it exists: both EPA-hosted APIs are unreachable directly from a browser.
// CompTox sends a duplicated CORS header on successful replies, which browsers
// refuse to read. EPI Suite (episuite.dev) sends no CORS header at all, so a
// browser fetch is blocked outright. This Worker calls each one server-side
// (no browser rules apply there) and replies to the page with a single,
// correct CORS header.
//
// Two secrets are set in the Cloudflare dashboard (never in this file):
//   CTX_API_KEY     your EPA CTX (CompTox) API key — not needed for EPI Suite,
//                    which is public with no key
//   PROXY_PASSWORD  the password the page must send, for both lookups
//
// Request:  POST  { "password": "...", "cas": "104-55-2", "source": "comptox" | "episuite" }
//           "source" defaults to "comptox" if omitted.
// Reply (comptox): { ok, cas, name, dtxsid, url, mw, vp: { pa, basis, n, records[] } }
// Reply (episuite): { ok, cas, name, mw, url, vp: { pa, basis, n, records[] } }
//   vp.basis is 'experimental' (EPI Suite's own curated literature values) or
//   'calculated' (its "Selected" MPBPVP estimate) — experimental is always
//   preferred, same as CompTox; calculated is used only as a fallback.

const CTX_BASE = 'https://comptox.epa.gov/ctx-api';
const EPISUITE_BASE = 'https://episuite.dev/api';
const MMHG_TO_PA = 133.322;
const CAS_RE = /^\d{2,7}-\d{2}-\d$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, CORS),
  });
}

// Compare SHA-256 digests so the check does not leak the password length.
async function samePassword(given, expected) {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(String(given))),
    crypto.subtle.digest('SHA-256', enc.encode(String(expected))),
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function median(values) {
  const s = values.slice().sort((p, q) => p - q);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

async function epaGet(path, env) {
  const res = await fetch(CTX_BASE + path, { headers: { 'x-api-key': env.CTX_API_KEY } });
  if (res.status === 400 || res.status === 404) return [];
  if (res.status === 401 || res.status === 403) throw new Error('EPA rejected the API key stored in the Worker');
  if (!res.ok) throw new Error('EPA returned HTTP ' + res.status);
  return res.json();
}

function vpRows(rows) {
  return (Array.isArray(rows) ? rows : []).filter(
    (r) => r.propName === 'Vapor Pressure' && r.propUnit === 'mmHg' && r.propValue != null
  );
}

// Calculated (predicted) vapor pressure is preferred over experimental, always —
// not just when experimental is missing. Experimental is used only as a
// fallback when CompTox has no predicted value on file for this chemical.
async function lookupComptox(cas, env) {
  const hits = await epaGet('/chemical/search/equal/' + encodeURIComponent(cas), env);
  if (!hits.length) return { ok: false, cas, error: 'Not found in CompTox' };
  const chem = hits[0];
  const id = encodeURIComponent(chem.dtxsid);

  const detail = await epaGet('/chemical/detail/search/by-dtxsid/' + id, env);
  const mw = detail && detail.averageMass ? Number(detail.averageMass) : null;

  let vp = { pa: null, basis: null, n: 0, records: [] };
  const exp = vpRows(await epaGet('/chemical/property/experimental/search/by-dtxsid/' + id, env));
  if (exp.length) {
    vp = {
      pa: median(exp.map((r) => r.propValue)) * MMHG_TO_PA,
      basis: 'experimental',
      n: exp.length,
      records: exp.map((r) => ({
        pa: r.propValue * MMHG_TO_PA,
        mmHg: r.propValue,
        tempC: r.expDetailsTemperatureC == null ? null : r.expDetailsTemperatureC,
        source: r.publicSourceName || r.sourceName || '',
      })),
    };
  } else {
    const pred = vpRows(await epaGet('/chemical/property/predicted/search/by-dtxsid/' + id, env));
    if (pred.length) {
      vp = {
        pa: median(pred.map((r) => r.propValue)) * MMHG_TO_PA,
        basis: 'calculated',
        n: pred.length,
        records: pred.map((r) => ({
          pa: r.propValue * MMHG_TO_PA,
          mmHg: r.propValue,
          tempC: null,
          source: (r.modelName || '') + (r.sourceName ? ' (' + r.sourceName + ')' : ''),
        })),
      };
    }
  }

  return {
    ok: true,
    cas,
    name: chem.preferredName || '',
    dtxsid: chem.dtxsid,
    url: 'https://comptox.epa.gov/dashboard/chemical/details/' + chem.dtxsid,
    mw,
    vp,
  };
}

// EPI Suite (episuite.dev, EPA's own web successor to the EPI Suite desktop
// app) reports both a curated set of experimental literature values and a
// calculated MPBPVP estimate ("Selected", the best of its Antoine/Grain/
// Mackay/SubCooled sub-models). Experimental is preferred, same as CompTox;
// calculated is used only when EPI Suite has no experimental value on file.
// No API key needed.
async function lookupEpiSuite(cas, env) {
  const res = await fetch(EPISUITE_BASE + '/submit?cas=' + encodeURIComponent(cas));
  if (res.status === 404) return { ok: false, cas, error: 'Not found in EPI Suite' };
  if (!res.ok) throw new Error('EPI Suite returned HTTP ' + res.status);
  const data = await res.json();

  const vpBlock = data.vaporPressure || {};
  let vp = { pa: null, basis: null, n: 0, records: [] };

  const expVals = (Array.isArray(vpBlock.experimentalValues) ? vpBlock.experimentalValues : [])
    .filter((r) => r.units === 'mmHg' && r.value != null);
  if (expVals.length) {
    vp = {
      pa: median(expVals.map((r) => r.value)) * MMHG_TO_PA,
      basis: 'experimental',
      n: expVals.length,
      records: expVals.map((r) => ({
        pa: r.value * MMHG_TO_PA,
        mmHg: r.value,
        tempC: r.temperatureC == null ? null : r.temperatureC,
        source: [r.author, r.year].filter(Boolean).join(' ') || r.source || '',
      })),
    };
  } else {
    const est = vpBlock.estimatedValue || {};
    const models = Array.isArray(est.model) ? est.model : [];
    const selected = models.find((m) => m.type === 'Selected') || (est.pa != null ? est : null);
    if (selected && selected.pa != null) {
      vp = {
        pa: selected.pa,
        basis: 'calculated',
        n: models.length || 1,
        records: models.map((m) => ({ pa: m.pa, mmHg: m.mmHg, tempC: null, source: m.type + ' (MPBPVP)' })),
      };
    }
  }

  const chem = data.chemicalProperties || {};
  return {
    ok: true,
    cas,
    name: chem.name || '',
    mw: chem.molecularWeight != null ? Number(chem.molecularWeight) : null,
    url: 'https://episuite.dev/?cas=' + encodeURIComponent(cas),
    vp,
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'Send JSON: {"password":"...","cas":"...","source":"comptox"|"episuite"}' }, 400); }

    if (!env.PROXY_PASSWORD || !env.CTX_API_KEY) return json({ error: 'Worker is missing its secrets (PROXY_PASSWORD / CTX_API_KEY)' }, 500);
    if (!(await samePassword(body.password || '', env.PROXY_PASSWORD))) return json({ error: 'Incorrect password' }, 401);

    const cas = String(body.cas || '').trim();
    if (!CAS_RE.test(cas)) return json({ error: 'That does not look like a CAS number' }, 400);

    const source = body.source === 'episuite' ? 'episuite' : 'comptox';

    try {
      const result = source === 'episuite' ? await lookupEpiSuite(cas, env) : await lookupComptox(cas, env);
      return json(result, result.ok ? 200 : 404);
    } catch (e) {
      return json({ ok: false, error: String((e && e.message) || e) }, 502);
    }
  },
};
