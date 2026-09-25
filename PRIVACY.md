**Privacy & Data Handling**


This application processes all information entirely in your browser.

Nothing you enter is sent to any server.
All calculations, rendering, and Report Interpreter logic run locally on your device.
The app does not upload, store, or transmit any data.
You may clear all inputs at any time using Clear inputs or by refreshing the page.

**Exception — PDF upload on the 2o3 page.** Loads the pdf.js library from a public CDN (cdnjs.cloudflare.com) the first time you use it; this is a one-time script download, not a data upload — the PDF file you choose and any values extracted from it are processed entirely on your device and never leave your browser.

**Exception — "Look up MW & vapor pressure (PubChem)" on the PoD calculator.** This button sends the CAS number you entered to PubChem (a public NCBI/NIH database) to retrieve molecular weight and vapor pressure data, and displays PubChem's own sources back to you with links. This is the only feature in this toolkit that transmits anything you've entered to a third party — it only runs when you click that specific button, and only the CAS number is sent (nothing else you've entered on the page). Everything else on the PoD calculator, and the calculator's own math, runs entirely locally.

**Exception — "Look up MW & vapor pressure (EPA CompTox)" on the PoD calculator.** This button sends the CAS number you entered, along with your own CTX API key, to the US EPA CompTox servers (comptox.epa.gov) to retrieve molecular weight and vapor pressure data. The key is saved only in your browser's local storage on your device (never in this site's code or on any server of ours) and you can remove it with "Forget key". It only runs when you click that button.
