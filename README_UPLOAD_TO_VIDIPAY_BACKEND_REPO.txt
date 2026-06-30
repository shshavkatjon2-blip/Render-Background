Upload these files to GitHub repo root:

vidipay-backend

Render is cloning this repo for the live API:

https://github.com/shshavkatjon2-blip/vidipay-backend

Required root files:

server.js
start-scanner.js
package.json
render.yaml
render-build-fix.cjs
scripts/

Do not upload this folder itself as a nested folder.
Do not upload node_modules.
Do not upload an old package-lock.json.
Do not upload Dockerfile for this backend service.
If GitHub already has package-lock.json from an older upload, delete it from the repo before redeploying.
If GitHub already has Dockerfile from an older upload, delete it from the repo before redeploying.
The current package.json and render-build-fix.cjs both include @ton/core for @ton/ton runtime startup.
The current package.json and render-build-fix.cjs also include jssha and the TON runtime dependencies used by @ton/crypto.
This package is Node runtime only. Removing Dockerfile avoids Render Docker registry cache importer failures.
Scanner workers now start from root start-scanner.js, so Render will not fail if scripts/start-scanner.js is missing in an old worker checkout.
The scripts/ folder is still included for diagnostics, wallet tools, and audits.

Render settings:

Build Command: node render-build-fix.cjs && npm install --omit=dev --no-audit --no-fund
Start Command: npm start
