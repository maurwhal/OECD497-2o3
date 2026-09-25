// Cloudflare Worker: password-protected proxy for the EPA CompTox (CTX) API.
//
// Why it exists: EPA's server sends a duplicated CORS header on successful
// replies, so a web page cannot read them. This Worker calls EPA server-side
// (no browser rules), and replies to the page with a single, correct header.
//
// Two secrets are set in the Cloudflare dashboard (never in this file):
//   CTX_API_KEY     your EPA CTX API key
//   PROXY_PASSWORD  the password the page must send
//
// Request:  POST  { "password": "...", "cas": "104-55-2" }
// Reply:    { ok, cas, name, dtxsid, url, mw, vp: { pa, basis, n, records[] } }

const EPA = 'https://comptox.epa.gov/ctx-api';
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
  const res = await fetch(EPA + path, { headers: { 'x-api-key': env.CTX_API_KEY } });
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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'Send JSON: {"password":"...","cas":"..."}' }, 400); }

    if (!env.PROXY_PASSWORD || !env.CTX_API_KEY) return json({ error: 'Worker is missing its secrets (PROXY_PASSWORD / CTX_API_KEY)' }, 500);
    if (!(await samePassword(body.password || '', env.PROXY_PASSWORD))) return json({ error: 'Incorrect password' }, 401);

    const cas = String(body.cas || '').trim();
    if (!CAS_RE.test(cas)) return json({ error: 'That does not look like a CAS number' }, 400);

    try {
      const hits = await epaGet('/chemical/search/equal/' + encodeURIComponent(cas), env);
      if (!hits.length) return json({ ok: false, cas, error: 'Not found in CompTox' }, 404);
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
            basis: 'predicted',
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

      return json({
        ok: true,
        cas,
        name: chem.preferredName || '',
        dtxsid: chem.dtxsid,
        url: 'https://comptox.epa.gov/dashboard/chemical/details/' + chem.dtxsid,
        mw,
        vp,
      });
    } catch (e) {
      return json({ ok: false, error: String((e && e.message) || e) }, 502);
    }
  },
};
