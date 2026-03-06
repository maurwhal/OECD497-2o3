# OECD 497 - 2-out-of-3 Decision Helper

A browser-based tool that implements the **OECD TG 497 "2-out-of-3" (2o3)** skin-sensitisation hazard decision logic across the three key events (KEs). In addition to the official 2o3 methods, the tool also includes **expanded support for additional assays** commonly used in skin-sensitisation workflows.

**Acronyms used:**
- **BR** = Borderline Range
- **DA** = Defined Approach

### KE1 - Protein Binding (TG 442C)
- **DPRA** (mean or cysteine-only)
- **ADRA** (mean or NAC-only)
- **kDPRA** (potency context; not used in the 2o3 hazard aggregation)

### KE2 - Keratinocyte Activation (TG 442D)
- **KeratinoSens™**
- **LuSens**
- **EpiSensA**

### KE3 - Dendritic Cell Activation (TG 442E)
- **h-CLAT**
- **U-SENS**
- **IL-8 Luc**
- **GARDskin**

The tool calculates a per-assay call (Positive / Negative / Inconclusive, with confidence) and a **Final 2o3 Hazard Decision**, following the TG 497 rules. Borderline values and test limitations (for example, precipitation/insolubility, viability gates) are handled per OECD guidance.

---

## How to use

1. **Open the app**  
   https://maurwhal.github.io/OECD497-2o3/

2. **Select assays**  
   Enable or disable any method (DPRA, ADRA, LuSens, U-SENS, and others). Only **DPRA, KeratinoSens™, and h-CLAT** are required for the official **TG 497 2o3** decision; other methods are optional and recorded for completeness.

3. **Enter assay data**  
   Provide the numeric values for each enabled assay (for example, percent depletion, Imax fold-induction, RFI percent, decision value). If the study had limitations, tick **set this assay to Inconclusive**.

4. **Review assay-level calls**  
   Each card shows the call, confidence (High or Low), any Borderline Range flag, any limitations, and a copy-ready **Excel blurb** that summarises the study data.

5. **View the Final 2o3 Decision**  
   The bottom card shows the OECD TG 497 outcome (Sensitiser / Non-sensitiser / Inconclusive). A conclusive prediction requires **two concordant High-confidence results across two or more different KEs**.

6. **Support tools**  
   - **BR cheat-sheet** - Thresholds and Borderline Ranges  
   - **OECD 497 DA snippet** - Auto-generated, copy-ready summary paragraph  
   - **Clear inputs** - Remove all values  
   - **Reset selection** - Restore the default DPRA + KeratinoSens™ + h-CLAT panel

---

## Privacy and Data Handling

This application processes all information **entirely in the browser**.

- No data is uploaded, stored, transmitted, or logged.  
- All calculations and logic run locally on the user's device.  
- Values can be cleared at any time using **Clear inputs** or by refreshing the page.

---

## Notes

- TG 497 logic is applied as described in the guideline (publication: June 2025).  
- Borderline Ranges and validity criteria follow TG 442C / TG 442D / TG 442E.  
- Additional assays (ADRA, kDPRA, LuSens, EpiSensA, U-SENS, IL-8 Luc, GARDskin) are included for convenience even though they are **not** all part of the TG 497 2o3 hazard determination.

---

## Attribution
Created by Maura Lavelle. AI tools supported code editing and error checking; the author verified results. If an error is found or an improvement is suggested, please open an issue or contact the author.

## Disclaimer
This tool is provided "as is" without warranties of any kind. Accuracy is intended, but the author is not responsible for any errors, omissions, miscalculations, or for actions or decisions taken based on the outputs. Users remain responsible for interpreting their own data and for any conclusions drawn.

## License and reuse
All rights reserved. For reuse or distribution beyond fair use, please contact the author to request permission.
