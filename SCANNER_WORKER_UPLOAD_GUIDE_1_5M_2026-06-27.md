# Scanner Worker Upload Guide - 1.5M

Live API is already correct:

```text
version=v1.7.3-1-5m-scanner-heartbeat-20260627
worker_mode=api
payment_scanner_enabled=false
```

Current problem:

```text
scanner_worker_alive=false
heartbeats=[]
```

This means the API is live, but the separate Render Background Worker is not running against the same Supabase project.

## Upload Package

Use:

```text
outputs/UPLOAD_READY_SCANNER_WORKER_ONLY_1_5M_2026-06-27.zip
```

## Render Service

Create or update a separate Render service:

```text
Service type: Background Worker
Name: vidipay-payment-scanner-1-5m
Build command: npm ci --omit=dev
Start command: npm run start:scanner
```

Do not use this as the public API web service. It is only for scanner worker.

## Required Env

Use:

```text
outputs/RENDER_SCANNER_WORKER_ENV_COMPLETE_1_5M.env
```

Copy secret values from the public API service:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_TOKEN
BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TONAPI_KEY
REDIS_URL
```

Keep these exactly:

```text
WORKER_MODE=scanner
PAYMENT_SCANNER_ENABLED=true
PAYMENT_SCANNER_WORKER_ID=scanner-render-1
TON_PAYMENT_MIN_RECEIVED=6.90
TON_PAYMENT_MAX_RECEIVED=7.05
```

## Verify

After the worker is live, wait 30 seconds and check:

```text
https://vidipay-backend.onrender.com/admin/payment-scanner/status
```

Expected:

```text
heartbeat_available=true
scanner_worker_alive=true
heartbeat_stale=false
latest_scanner_heartbeat.scanner_enabled=true
latest_scanner_heartbeat.last_error=null
```

Real automatic TON deposit confirmation is not fully live until `scanner_worker_alive=true`.
