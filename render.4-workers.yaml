Upload these files to the scanner worker GitHub repo root.

Render service type must be Background Worker.

Required root files:

server.js
package.json
render.yaml
render-build-fix.cjs
scripts/

Default render.yaml creates 16 worker shards for 1.5M runtime.

Render settings:

Build Command: node render-build-fix.cjs && npm install --omit=dev --no-audit --no-fund
Start Command: npm run start:scanner

Required env:

SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TONAPI_KEY
TONAPI_BASE_URL=https://tonapi.io
WORKER_MODE=scanner
PAYMENT_SCANNER_ENABLED=true
