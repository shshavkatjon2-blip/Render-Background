# Public scanner health check

This package adds a safe public endpoint:

```text
GET /scanner/healthz
```

It does not return secrets, user data, wallet addresses, transaction hashes, or raw heartbeat rows.

Expected status values:

- `ok` - scanner worker heartbeat is fresh.
- `stale` - heartbeat table exists, but the latest scanner heartbeat is too old or missing.
- `unavailable` - heartbeat table cannot be read yet.

Use this after deploying both services:

```powershell
curl.exe -s https://vidipay-backend.onrender.com/scanner/healthz
```

For live deposit tests, the result should become `ok` after the scanner worker is deployed with `WORKER_MODE=scanner` and the heartbeat SQL has been run.
