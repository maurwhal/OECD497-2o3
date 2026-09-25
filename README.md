# Skin Sensitization Toolkit

A browser-based toolkit for skin-sensitisation hazard and potency assessment.
It started as the **OECD TG 497 "2-out-of-3" (2o3)** decision helper and has
grown to include a point-of-departure calculator and a potency category
classifier; more tools may be added over time.

**Acronyms used:**
- **BR** = Borderline Range
- **DA** = Defined Approach
- **PoD** = Point of Departure

## Tools

### OECD 497 2-out-of-3 Decision Helper (`2o3.html`)

Implements the OECD TG 497 "2o3" skin-sensitisation hazard decision logic
across the three key events (KEs), plus expanded support for additional
assays commonly used in skin-sensitisation workflows.

- **KE1 – Protein Binding (TG 442C)**: DPRA (mean or cysteine-only), ADRA
  (mean or NAC-only), kDPRA (potency context; not used in the 2o3 hazard
  aggregation, but does drive a 1A/Not 1A/BL classification in the
  house-style output).
- **KE2 – Keratinocyte Activation (TG 442D)**: KeratinoSens™, LuSens,
  EpiSensA.
- **KE3 – Dendritic Cell Activation (TG 442E)**: h-CLAT, U-SENS, IL-8 Luc,
  GARDskin.

The tool calculates a per-assay call (Positive / Negative / Inconclusive,
with confidence) and a **Final 2o3 Hazard Decision**, following the TG 497
rules. Borderline values and test limitations (e.g. precipitation/
insolubility, viability gates) are handled per OECD guidance.

Also includes:
- A **Report interpreter** modal for entering up to 3 runs per assay with
  averaging, applied straight into the assay call and the house-style cells
  below (no separate copy-paste format to keep in sync).
- An **OECD 497 DA snippet** — an auto-generated, copy-ready summary
  paragraph.
- A canvas-based **"Explain this call"** view per assay showing the
  threshold/borderline band and where the entered value falls.
- **MML Style Excel Blurb** — a separate panel that renders DPRA/
  KeratinoSens/h-CLAT/U-SENS/kDPRA results in the `Call (label value, ...)`
  grammar used by the MML High-EC3 review process, from a dedicated set of
  "for house-style cell" input fields (kept separate from the RFI%/SI%
  fields used for the hazard call, since those are different quantities).
- **PDF upload** for lab reports: detects lab and assay type from known
  signature strings; currently extracts values only for IIVS DPRA reports
  (the one parser validated in the source project this was ported from —
  everything else is detected but flagged as "no parser yet" rather than
  guessed).

### Point-of-Departure Calculator (`pod.html`)

Reproduces the published Natsch et al. ("Integrated Skin Sensitization
Assessment Based on OECD Methods (III)", ALTEX, doi:10.14573/altex.2302081s3,
Supplementary Material ESM3) regression models for estimating EC3%/PV% and
dose-per-surface-area from KeratinoSens, kDPRA, and h-CLAT data — both the
LLNA-trained and extended-PV-trained model families. Includes a built-in
self-check against the paper's own DNCB and cinnamic aldehyde worked
examples; **check that self-check panel before trusting a real result.**

Also includes a **"Look up MW & vapor pressure (EPA CompTox)"** button. It asks
for a password, then a small Cloudflare Worker (`cloudflare-worker/worker.js`)
calls the EPA CompTox CTX API on the page's behalf and returns the molecular
weight (EPA average mass) and vapor pressure (median of EPA's experimental
records, otherwise the median of EPA's predicted values, clearly labeled as
predicted), with every record and its source listed. A Worker is needed because
EPA's server sends a duplicated CORS header on successful replies, which
browsers refuse to read; the EPA API key lives only inside the Worker, never in
this site's code. The vapor pressure box has a unit dropdown (Pa, mmHg/Torr,
kPa, atm, bar); whatever you pick is converted to Pa, which is what the
equations use. An "About CompTox lookup" button in the page header explains
how the lookup works.

This is not SARA-ICE — see the hub page (`index.html`) for why.

### Potency Category Classifier (`potency.html`)

Bins a single input value into the published Potency Categories
([Na et al. 2022](https://journals.sagepub.com/doi/full/10.1097/DER.0000000000000854): Extreme / Strong / Moderate / Weak / Very weak / Non-sensitizer),
using the dose-range table from Na et al. (2022, Dermatitis) and Lee et al.
(2024, Food Chem. Toxicol.), plus the LLNA%/SENS-IS tables from Na et al.
(2022, Regul. Toxicol. Pharmacol.). Three independent entry points, each
using its own published boundaries (a dose-based µg/cm² table is not the
same scale as the LLNA%-derived table, so they are not cross-applied):

- **Dose (µg/cm²)** — accepts a NOEL, LLNA EC3 (converted to dose), or PoD
  output. Includes a one-click "Use PoD calculator's last result" button
  that autofills from whatever `pod.html` last computed (via a small shared
  `localStorage` key — no other tool needs to be open for this page to work
  on its own).
- **LLNA EC3 (%)** — a separate, LLNA-specific %-to-category table.
- **SENS-IS** — a direct lookup on the lowest concentration testing
  positive.

This is **not** a substitute for the full weight-of-evidence process
described in those papers (which also considers LOEL, guinea pig data,
structural alerts, exposure, and data-quality judgement) — it only bins the
one value you give it, and says so on the page.

## How to use

1. **Open the app**
   https://maurwhal.github.io/OECD497-2o3/

2. **Pick a tool** from the hub, or go straight to
   `2o3.html`, `pod.html`, or `potency.html`.

3. **2o3 tool**: select assays, enter data (or upload a lab report PDF for
   IIVS DPRA), and review the per-assay calls, the Final 2o3 Decision, and
   the MML Style Excel Blurb.

4. **PoD calculator**: enter MW, vapor pressure, and whichever of
   KeratinoSens/kDPRA/h-CLAT data you have, or load a worked example first
   to confirm the self-check passes.

5. **Potency classifier**: enter a dose, an LLNA EC3%, or a SENS-IS result
   (or all three, to cross-check) to get a WoE potency category.

## Privacy and Data Handling

See `PRIVACY.md`. In short: everything runs in your browser, nothing is
uploaded anywhere, except (a) the 2o3 page's PDF-upload feature loads the
pdf.js library from a CDN on first use (the PDF itself is never uploaded),
and (b) the PoD calculator's CompTox lookup button sends the CAS number you entered, plus the password, to a password-protected Cloudflare Worker that retrieves MW/vapor pressure data from EPA.

## Notes

- TG 497 logic is applied as described in the guideline (2025/2026 update).
- Borderline Ranges and validity criteria follow TG 442C / TG 442D / TG 442E.
- Additional assays (ADRA, kDPRA, LuSens, EpiSensA, U-SENS, IL-8 Luc,
  GARDskin) are included for convenience even though they are not all part
  of the TG 497 2o3 hazard determination.
- SARA-ICE's ED01/POD/GHS output is a proprietary Bayesian model whose
  coefficients aren't published, so it isn't reproduced here — the hub links
  to the official NTP tool instead.

## Attribution

Created by Maura Lavelle. AI tools supported code editing and error
checking; the author verified results. If an error is found or an
improvement is suggested, please open an issue or contact the author.

## Disclaimer

This tool is provided "as is" without warranties of any kind. Accuracy is
intended, but the author is not responsible for any errors, omissions,
miscalculations, or for actions or decisions taken based on the outputs.
Users remain responsible for interpreting their own data and for any
conclusions drawn.

## License and reuse

All rights reserved. For reuse or distribution beyond fair use, please
contact the author to request permission.
