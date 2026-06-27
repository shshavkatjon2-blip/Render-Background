# Scanner Worker Env Check Result - 2026-06-27

Use this no-secret template:

```text
outputs/UPLOAD_READY_SCANNER_WORKER_ONLY_1_5M_2026-06-27/RENDER_SCANNER_WORKER_ENV_NOW_NO_SECRETS.env
```

The template intentionally does not include real keys.

Required real values must be pasted in Render Environment:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TONAPI_KEY
TONAPI_BASE_URL=https://tonapi.io
WORKER_MODE=scanner
PAYMENT_SCANNER_ENABLED=true
```

Expected worker behavior:

- If required values are missing, worker exits immediately with a clear Render log error.
- If values are correct, `/scanner/healthz` becomes `status=ok` within 30-60 seconds.
- Scanner worker can use `RATE_LIMIT_BACKEND=memory`; the public API should still use Redis before heavy traffic.
- TON auto payout is disabled in this worker env. Deposit scanning can work; automatic refund payout requires signer/RPC setup.
