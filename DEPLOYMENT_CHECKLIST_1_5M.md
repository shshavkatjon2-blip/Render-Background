# Deploy This Backend

This folder is the backend-only staging upload package for the 1.5M scaling work.

Main guide:

```text
MASTER_GUIDE_1_5M.md
```

## Services

Create two services from the same backend code:

1. Public API service.
2. Payment scanner worker service.

## Public API Service

Build command:

```bash
npm ci --omit=dev
```

Start command:

```bash
npm start
```

Health check:

```text
/healthz
```

Important env:

```env
PAYMENT_SCANNER_ENABLED=false
RATE_LIMIT_BACKEND=redis
REDIS_URL=
SETTINGS_CACHE_TTL_MS=1500
```

Full env template:

```text
env.api.1_5m.template
```

## Scanner Worker Service

Build command:

```bash
npm ci --omit=dev
```

Start command:

```bash
npm run start:scanner
```

Important env:

```env
WORKER_MODE=scanner
PAYMENT_SCANNER_ENABLED=true
RATE_LIMIT_BACKEND=redis
REDIS_URL=
PAYMENT_SCAN_BATCH_SIZE=50
PAYMENT_SCAN_INTERVAL_MS=15000
```

Full env template:

```text
env.scanner.1_5m.template
```

Redis setup guide:

```text
REDIS_SETUP_1_5M.md
```

Scanner safety guide:

```text
SCANNER_WORKER_SAFETY_1_5M.md
```

Env verification guide:

```text
ENV_VERIFY_BEFORE_DEPLOY_1_5M.md
```

## Required Shared Env

Both API and scanner worker need these values:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_TOKEN=
BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
PUBLIC_BACKEND_URL=
PUBLIC_APP_URL=
GAME_URL=
ALLOWED_ORIGINS=
TONAPI_KEY=
TONAPI_BASE_URL=https://tonapi.io
TON_RPC_ENDPOINT=
TON_RPC_KEY=
TON_SIGNER_KEYS_DIR=
```

## Before Deploy

Run this read-only snapshot first:

```text
supabase-preflight-snapshot-1_5m.sql
```

Run this SQL on staging Supabase:

```text
RUN_ALL_STAGING_SQL_1_5M.sql
```

Then verify that RPCs, columns, and indexes exist:

```text
supabase-post-migration-verify-1_5m.sql
```

After wallet public SQL batches are imported, run:

```text
supabase-wallet-pool-audit.sql
```

## After Deploy

Verify environment values first:

```bash
npm run verify:env:api
```

For the scanner worker:

```bash
npm run verify:env:scanner
```

Open:

```text
https://your-api-url/healthz
https://your-api-url/readyz
```

Expected:

```json
{"status":"ok"}
{"status":"ready"}
```

Or run:

```powershell
$env:BASE_URL="https://your-api-url"
npm run verify:staging
```

Then follow:

```text
POST_DEPLOY_CHECKLIST_1_5M.md
MONITORING_AND_ROLLBACK_1_5M.md
LOAD_TEST_PASS_FAIL_1_5M.md
SCALE_ROLLOUT_PLAN_100K_300K_1_5M.md
```
