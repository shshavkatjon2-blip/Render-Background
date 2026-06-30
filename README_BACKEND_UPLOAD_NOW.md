# Backend Upload

Upload the contents of this folder to the GitHub repo connected to `vidipay-backend`.

Repo root must contain:

```text
server.js
start-scanner.js
package.json
render-build-fix.cjs
scripts/
```

Repo root must not contain:

```text
Dockerfile
.dockerignore
package-lock.json
node_modules/
.env
.env.local
```

Render backend:

```text
Build Command: node render-build-fix.cjs && npm install --omit=dev --no-audit --no-fund
Start Command: npm start
```

Scanners are already live, so this upload is only to keep backend code aligned with remote signer and wallet final gate checks.
