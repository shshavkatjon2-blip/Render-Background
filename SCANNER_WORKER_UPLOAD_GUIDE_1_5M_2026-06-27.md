# Scanner Worker Upload Guide - 1.5M

Use this package only for the separate TON payment scanner worker.

## Current live signal

The public API is live when:

```text
/healthz -> worker_mode=api
```

The scanner worker is live only when:

```text
/scanner/healthz -> status=ok
```

If `/scanner/healthz` returns `stale`, the API is working but the background scanner worker is not heartbeating.

## Upload package

Upload this safe package:

```text
outputs/UPLOAD_READY_SCANNER_WORKER_ONLY_1_5M_2026-06-27_SAFE_NO_SECRETS.zip
```

Do not upload an old non-safe zip.

## Render service

Create or update a separate Render service:

```text
Service type: Background Worker
Name: vidipay-payment-scanner-1-5m
Build command: npm ci --omit=dev
Start command: npm run start:scanner
```

Do not use this service as the public API web service.

## Required env

Paste real values in Render Environment. Do not put keys inside GitHub files.

Required for scanner heartbeat and deposit scanning:

```text
NODE_ENV=production
WORKER_MODE=scanner
PAYMENT_SCANNER_ENABLED=true
PAYMENT_SCANNER_WORKER_ID=scanner-render-1
SUPABASE_URL=<same project as API>
SUPABASE_SERVICE_ROLE_KEY=<same project as API>
TONAPI_KEY=<real key>
TONAPI_BASE_URL=https://tonapi.io
PUBLIC_BACKEND_URL=https://vidipay-backend.onrender.com
TON_PAYMENT_MIN_RECEIVED=6.90
TON_PAYMENT_MAX_RECEIVED=7.05
PAYMENT_SCAN_INTERVAL_MS=15000
PAYMENT_SCAN_BATCH_SIZE=50
```

Recommended but not required for scanner-only worker:

```text
RATE_LIMIT_BACKEND=redis
REDIS_URL=<redis url>
```

Auto payout is intentionally disabled until signer keys and RPC are ready:

```text
TON_AUTO_PAYOUT_ENABLED=false
TON_SIGNER_ENABLED=false
```

## Fail-fast behavior

Version `v1.7.8-1-5m-runtime-capacity-20260627` refuses to start the scanner worker if these values are missing or placeholder-like:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TONAPI_KEY
TONAPI_BASE_URL
PAYMENT_SCANNER_ENABLED=true
```

This is intentional. It prevents a fake live worker that never confirms deposits.

Version `v1.7.8-1-5m-runtime-capacity-20260627` also adds `/ops/readiness`, which shows whether the API, scanner heartbeat, and TON payment range are ready for real testing.

## Verify after deploy

Wait 30-60 seconds, then open:

```text
https://vidipay-backend.onrender.com/scanner/healthz
https://vidipay-backend.onrender.com/ops/readiness
```

Expected:

```json
{
  "status": "ok",
  "heartbeat_available": true,
  "heartbeat_stale": false,
  "scanner_worker_alive": true
}
```

If the result is still `stale`, check:

1. Worker service type is `Background Worker`, not Web Service.
2. Worker start command is `npm run start:scanner`.
3. Worker has the same `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as the public API.
4. `COPY_THIS_SCANNER_HEARTBEAT_SQL_1_5M.sql` was run in the same Supabase project.
