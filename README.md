# Skin Sensitization Toolkit

A browser-based toolkit for skin-sensitisation hazard and potency assessment.
It started as the **OECD TG 497 "2-out-of-3" (2o3)** decision helper and has
grown to include a point-of-departure calculator; more tools may be added
over time.

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
- **RIFM house-style cells** — a separate panel that renders DPRA/
  KeratinoSens/h-CLAT/U-SENS/kDPRA results in the `Call (label value, ...)`
  grammar used by RIFM's High-EC3 review process, from a dedicated set of
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
dose-per-skin-area from KeratinoSens, kDPRA, and h-CLAT data — both the
LLNA-trained and extended-PV-trained model families. Includes a built-in
self-check against the paper's own DNCB and cinnamic aldehyde worked
examples; **check that self-check panel before trusting a real result.**

Also includes an optional **"Look up MW & vapor pressure (PubChem)"**
button that resolves the entered CAS number on PubChem and fills those two
fields from PubChem's computed MW and experimental vapor pressure data,
with an expandable Sources panel showing exactly what was found and where
(with links). This is the one feature in the toolkit that sends anything
(the CAS number) to a third party — see `PRIVACY.md`.

This is not SARA-ICE — see the hub page (`index.html`) for why.

## How to use

1. **Open the app**
   https://maurwhal.github.io/OECD497-2o3/

2. **Pick a tool** from the hub, or go straight to
   `2o3.html` or `pod.html`.

3. **2o3 tool**: select assays, enter data (or upload a lab report PDF for
   IIVS DPRA), and review the per-assay calls, the Final 2o3 Decision, and
   the RIFM house-style cells.

4. **PoD calculator**: enter MW, vapor pressure, and whichever of
   KeratinoSens/kDPRA/h-CLAT data you have, or load a worked example first
   to confirm the self-check passes.

## Privacy and Data Handling

See `PRIVACY.md`. In short: everything runs in your browser, nothing is
uploaded anywhere, except (a) the 2o3 page's PDF-upload feature loads the
pdf.js library from a CDN on first use (the PDF itself is never uploaded),
and (b) the PoD calculator's PubChem lookup button sends the CAS number you
entered to PubChem to retrieve MW/vapor pressure data.

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
