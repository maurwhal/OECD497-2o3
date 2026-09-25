**Privacy & Data Handling**


This application processes all information entirely in your browser.

Nothing you enter is sent to any server.
All calculations, rendering, and Report Interpreter logic run locally on your device.
The app does not upload, store, or transmit any data.
You may clear all inputs at any time using Clear inputs or by refreshing the page.

**Exception — PDF upload on the 2o3 page.** Loads the pdf.js library from a public CDN (cdnjs.cloudflare.com) the first time you use it; this is a one-time script download, not a data upload — the PDF file you choose and any values extracted from it are processed entirely on your device and never leave your browser.


**Exception — "Look up MW & vapor pressure (EPA CompTox)" on the PoD calculator.** This button asks for a password, then sends the CAS number you entered and that password to a small password-protected server (a Cloudflare Worker) run by the site owner. That server calls the US EPA CompTox Chemicals Dashboard (comptox.epa.gov) with the owner's API key and returns molecular weight and vapor pressure data. Only the CAS number and password are sent, nothing else you have entered on the page. The password is remembered only for the current browser tab (session storage) and is forgotten when the tab closes. It only runs when you click that button.
