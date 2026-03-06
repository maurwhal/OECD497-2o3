# OECD 497 — 2‑out‑of‑3 Decision Helper

A browser‑based tool that implements the **OECD TG 497 “2‑out‑of‑3” (2o3)** skin‑sensitisation hazard decision logic across the three key events (KEs). In addition to the official 2o3 methods, the tool also includes **expanded support for additional assays** commonly used in skin‑sensitisation workflows.

### KE1 — Protein Binding (TG 442C)
- **DPRA** (mean or cysteine‑only)
- **ADRA** (mean or NAC‑only)
- **kDPRA** (*potency context; not used in the 2o3 hazard aggregation*)

### KE2 — Keratinocyte Activation (TG 442D)
- **KeratinoSens™**
- **LuSens**
- **EpiSensA**

### KE3 — Dendritic Cell Activation (TG 442E)
- **h‑CLAT**
- **U‑SENS**
- **IL‑8 Luc**
- **GARDskin**

The tool calculates a per‑assay call (Positive / Negative / Inconclusive, with confidence) and a **Final 2o3 Hazard Decision**, following the TG 497 rules. Borderline values and test limitations (e.g., precipitation/insolubility, viability gates) are handled per OECD guidance.

This is a personal project created by **Maura Lavelle** and is **not affiliated with or representative of my employer or any organization**.

---

## How to use

1. **Open the page**  
   Open the HTML file locally in any modern browser — everything runs fully offline.

2. **Select assays**  
   Enable/disable any method (DPRA, ADRA, LuSens, U‑SENS, etc.). Only **DPRA, KeratinoSens™, and h‑CLAT** are required for the official **TG 497 2o3** decision; other methods are optional and recorded for completeness.

3. **Enter assay data**  
   Provide the numeric values for each enabled assay (e.g., % depletion, Imax fold‑induction, RFI %, DV). If the study had limitations, tick **set this assay to Inconclusive**.

4. **Review assay‑level calls**  
   Each card displays the call, confidence (High/Low), borderline flags, any limitations, and a copy‑ready **Excel blurb** that summarises the study data.

5. **View the Final 2o3 Decision**  
   The bottom card shows the OECD TG 497 outcome (Sensitiser / Non‑sensitiser / Inconclusive). A conclusive prediction requires **two concordant High‑confidence results across ≥2 different KEs**.

6. **Support tools**  
   - **BR cheat‑sheet** — Thresholds and borderline ranges  
   - **OECD 497 DA snippet** — Auto‑generated, copy‑ready summary paragraph  
   - **Clear inputs** — Remove all values  
   - **Reset selection** — Restore the default DPRA + KeratinoSens™ + h‑CLAT panel

---

## Privacy & Data Handling

This application processes all information **entirely in your browser**.

- No data is uploaded, stored, transmitted, or logged.  
- All calculations and logic run locally on your device.  
- You may clear all values at any time using **Clear inputs** or by refreshing the page.

---

## Notes

- TG 497 logic is applied as described in the guideline.  
- Borderline ranges and validity criteria follow TG 442C / TG 442D / TG 442E.  
- Additional assays (ADRA, kDPRA, LuSens, EpiSensA, U‑SENS, IL‑8 Luc, GARDskin) are included for convenience even though they are **not** all part of the TG 497 2o3 hazard determination.

© **Maura Lavelle** — a *Marvelous Maura Model*.
