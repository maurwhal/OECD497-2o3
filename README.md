# OECD 497 – 2-out-of-3 Decision Helper  
*A Marvelous Maura Model*

This little web app helps simplify decisions under **OECD TG 497** by organizing inputs by the **three Key Events (KEs)** and applying the 2-out-of-3 (2o3) logic with borderline ranges.

## What it does
- **KE1, KE2, KE3 sections**: Click to reveal inputs for the study types you have (e.g., DPRA/ADRA, KeratinoSens/LuSens/EpiSensA, h-CLAT/U-SENS/IL-8 Luc/GARDskin).
- **Drop-downs + numeric fields**: Choose the study, enter the values from your report, and the app makes a **per-assay call** (Positive/Negative/Inconclusive) with a short rationale.
- **Precipitation / insolubility / limitations flag**: For each assay you can tick a box for precipitation, insolubility, or other irregularities. When checked, that assay is treated as **Inconclusive (Low confidence)** in the 2o3 combination—so you don’t accidentally over-weight compromised results.
- **2o3 final decision**: The app looks across KEs and reports **Inconclusive** unless there are **two concordant, High-confidence** results across at least two different KEs.  
- **BR cheat-sheet**: A quick reference for borderline ranges is built in.

> All logic runs locally in your browser; no data is uploaded anywhere.

## How to use
1. Open the app (GitHub Pages link or by double-clicking `index.html` locally).
2. In each KE section, **check the assays you have** and enter their values.
3. If a test had precipitation/insolubility/other limitations, **tick the flag**.
4. Review the **per-assay calls** and the **2o3 Decision (hazard)** panel at the bottom.

That’s it—simple and fast for routine evaluations.

## Notes
- **Borderline** results reduce confidence (shown as *Low*), but you’ll still see the call.
- **kDPRA** is included for context/potency but **not** combined in the 2o3 hazard decision.
- Use this as a helper alongside the official OECD TG 497 text and your lab/report SOPs.

## Feedback / Support
If you see anything that isn’t working for you or have a feature request, please email me: **lavellemaur at gmail.com**

---

Made with ❤️ as a **Marvelous Maura Model**.
