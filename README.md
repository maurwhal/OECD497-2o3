# OECD 497 — 2‑out‑of‑3 Decision Helper

A simple, browser‑based tool that follows the **OECD TG 497 “2‑out‑of‑3” (2o3)** hazard decision logic using the three key events (KEs):
- **KE1 (TG 442C)** Protein binding — DPRA (mean or cysteine‑only)
- **KE2 (TG 442D)** Keratinocyte activation — KeratinoSens™
- **KE3 (TG 442E)** Dendritic cell activation — h‑CLAT

The app shows a per‑assay call and a **Final 2o3 Decision**. Borderline values or assays marked with limitations (e.g., precipitation/insolubility) are handled per the guideline.

---

## How to use

1. **Open the page** (locally by double‑clicking `index.html`, or via your GitHub Pages site).
2. **Enter KE1 (DPRA)**  
   - Provide **Mean peptide depletion (%)**.  
   - If Lysine co‑elutes, enter **Cys‑only (%)** and toggle **co‑elution** (if present).  
   - If precipitation/insolubility or other limitations occurred, tick the **Inconclusive** checkbox for KE1.
3. **Enter KE2 (KeratinoSens™)**  
   - Provide **Max luciferase induction (Imax, fold)** and, if available, **Viability (%)** at that concentration.  
   - Optional notes: **EC1.5 (µM)** and **IC50 (µM)** (not required for 2o3, but useful context).  
   - Tick **Inconclusive** if there were test limitations.
4. **Enter KE3 (h‑CLAT)**  
   - Provide **RFI CD86 (%)** and/or **RFI CD54 (%)** (and optional **cell viability (%)** at the effective concentration).  
   - Tick **Inconclusive** if there were test limitations.
5. **Read the results**  
   - Each KE shows its **Assay call** (Positive/Negative/Inconclusive, with confidence).  
   - The bottom panel shows the **Final 2o3 Decision** (Conclusive or Inconclusive), following OECD TG 497 logic.
6. **Borderline ranges**  
   - Values near the guideline thresholds are treated as **borderline (low confidence)**. Two concordant **high‑confidence** results across ≥2 different KEs are required for a **conclusive** outcome.
7. **Handy controls**  
   - **BR cheat‑sheet** — quick reminder of thresholds/borderline ranges.  
   - **Clear inputs** — wipe all values.  
   - **Reset selection** — re‑enable default assay selections.

---

## Optional: Upload reports/images/text (auto‑parse)

At the bottom of the page, you can **upload a PDF, image, or text**, or paste text directly, then:

1. (Optional) Enable **OCR** for images.  
2. Click **Parse & preview** to see what was found.  
3. Click **Apply to fields** to fill the inputs automatically.

The parser looks for phrases such as:
- “**mean peptide depletion**”, “**cysteine**”, “**lysine**” (for DPRA, in %)  
- “**max luciferase**”, “**Imax**”, “**viability**” (for KeratinoSens™, fold and %)  
- “**RFI CD86**”, “**RFI CD54**” (for h‑CLAT, in %)

> **Privacy:** Any files, images, or text you upload are only used to run the application. None of it will be saved or downloaded by the app.

---

## Notes

- This tool mirrors the OECD TG 497 2o3 concept to integrate **KE1/KE2/KE3** assay outcomes.  
- Borderline handling and positivity thresholds follow the guideline (e.g., DPRA % depletion, KeratinoSens™ Imax/viability, h‑CLAT RFI thresholds).  
- The page is fully client‑side; no data is sent to a server.

© Maura Lavelle — a *Marvelous Maura Model*.