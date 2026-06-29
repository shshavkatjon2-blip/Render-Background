# Scanner package.json fix

Render error:

```text
Invalid package.json: Unexpected token "c", "const fs ="...
```

Meaning:

`package.json` currently contains JavaScript code. It must contain JSON and start with `{`.

Fix:

1. Open the scanner worker GitHub repo.
2. Open root `package.json`.
3. Replace it with the `package.json` in this folder.
4. Commit changes.
5. Redeploy scanner worker.

Correct Render settings:

```text
Build Command: npm install --omit=dev
Start Command: npm run start:scanner
Root Directory: empty
```

Do not paste `render-build-fix.cjs` content into `package.json`.
