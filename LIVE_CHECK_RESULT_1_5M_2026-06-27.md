# Live Check Result - 2026-06-27

Checked live URL:

```text
https://vidipay-backend.onrender.com
```

## Passed

- `/healthz` is OK.
- `/readyz` is ready.
- Backend version is `v1.7.3-1-5m-scanner-heartbeat-20260627`.
- Public API worker mode is `api`.
- Public API scanner is disabled: `payment_scanner_enabled=false`.
- `/payment/status/8188152343` returns a TON wallet address.
- Wallet pool is loaded:
  - total: `100054`
  - active: `100054`
  - assigned: `50`
  - available: `100004`
- Admin endpoints answer.

## Not Passed Yet

Scanner worker heartbeat:

```text
heartbeat_available=true
scanner_worker_alive=false
heartbeats=[]
```

Meaning:

```text
API is deployed, but the separate scanner Background Worker is not running or is using wrong env/Supabase keys.
```

## Next Required Action

Deploy the scanner as a separate Render Background Worker using:

```text
outputs/UPLOAD_READY_SCANNER_WORKER_ONLY_1_5M_2026-06-27.zip
```

Start command:

```text
npm run start:scanner
```
