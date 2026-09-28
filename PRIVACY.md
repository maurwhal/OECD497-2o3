**Privacy & Data Handling**


This application processes all information entirely in your browser.

Nothing you enter is sent to any server.
All calculations, rendering, and Report Interpreter logic run locally on your device.
The app does not upload, store, or transmit any data.
You may clear all inputs at any time using Clear inputs or by refreshing the page.

**Exception — PDF upload on the 2o3 page.** Loads the pdf.js library from a public CDN (cdnjs.cloudflare.com) the first time you use it; this is a one-time script download, not a data upload — the PDF file you choose and any values extracted from it are processed entirely on your device and never leave your browser.


**Exception — the two vapor pressure lookup buttons on the PoD calculator ("Look up MW & vapor pressure (EPA CompTox)" and "Look up vapor pressure (EPA EPI Suite)").** Each button asks for a password (shared between the two), then sends the CAS number you entered and that password to a small password-protected server (a Cloudflare Worker) run by the site owner. That server calls either the US EPA CompTox Chemicals Dashboard (comptox.epa.gov, with the owner's API key) or EPA's EPI Suite web tool (episuite.dev, no key needed), depending on which button you clicked, and returns molecular weight and/or vapor pressure data. Only the CAS number and password are sent, nothing else you have entered on the page. The password is remembered only for the current browser tab (session storage) and is forgotten when the tab closes. It only runs when you click one of those buttons.
