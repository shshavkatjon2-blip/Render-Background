# VidiPay 1.5M Master Guide

This is the main guide for the 1.5M scaling package.

## What Was Prepared

Backend scaling:

- Public API service can run without scanner work.
- Scanner worker can run separately with `npm run start:scanner`.
- Redis-based shared rate limit was added.
- Settings short cache was added.
- Admin heavy lists now support pagination.
- `/healthz` and `/readyz` were added.

Database scaling:

- Wallet claim RPC was prepared.
- Scanner claim RPC was prepared.
- Large table indexes were prepared.
- One ordered SQL bundle was prepared: `RUN_ALL_STAGING_SQL_1_5M.sql`.
- Post-migration verification SQL was prepared: `supabase-post-migration-verify-1_5m.sql`.
- Wallet pool audit SQL was prepared: `supabase-wallet-pool-audit.sql`.

Wallet pool:

- Large wallet generator was prepared.
- Wallet pool validator was prepared.
- Public SQL batch import flow was documented.
- Private key safety rules were documented.

Deploy safety:

- API and scanner env templates were prepared.
- API/scanner env verification script was added.
- Redis setup guide was prepared.
- Scanner worker safety guide was prepared.
- Post-deploy checklist was prepared.
- Monitoring and rollback plan was prepared.
- Load test pass/fail rules were prepared.
- 100K -> 300K -> 1.5M rollout plan was prepared.

## Files To Upload

Backend upload package:

```text
UPLOAD_READY_1_5M_BACKEND_STAGING_2026-06-26_SAFE_NO_SECRETS.zip
```

Use this for backend service deployment.

Full staging/reference package:

```text
SCALING_1_5M_STAGING_2026-06-26_SAFE_NO_SECRETS.zip
```

Use this as the full reference package. Do not upload it over the live app directly.

## Supabase SQL Order

Run this first to capture current state:

```text
supabase-preflight-snapshot-1_5m.sql
```

Run this first on staging Supabase:

```text
RUN_ALL_STAGING_SQL_1_5M.sql
```

Immediately verify the migration result:

```text
supabase-post-migration-verify-1_5m.sql
```

After wallet public SQL batches are imported, run:

```text
supabase-wallet-pool-audit.sql
```

## Backend Deploy Order

1. Create Redis.
2. Deploy Public API service from backend upload package.
3. Put values from `env.api.1_5m.template` into API service.
4. Deploy Scanner Worker service from the same backend upload package.
5. Put values from `env.scanner.1_5m.template` into scanner worker.
6. Confirm API `/healthz`.
7. Confirm API `/readyz`.
8. Confirm `/scanner/healthz`.
9. Run `npm run verify:live`.
10. Run `npm run verify:staging`.

## Build And Start Commands

Public API:

```bash
npm ci --omit=dev
npm start
```

Scanner worker:

```bash
npm ci --omit=dev
npm run start:scanner
```

## Wallet Pool Flow

Generate:

```powershell
npm run generate:ton-wallets:large -- --count=1500000 --sql-batch-size=5000 --out=D:\vidipay-ton-wallet-pool-1_5m
```

Verify:

```powershell
npm run wallets:verify -- --pool=D:\vidipay-ton-wallet-pool-1_5m --expected-count=1500000
```

Import only:

```text
public-addresses-*.sql
```

Never upload:

```text
private-keys/
```

## Verification

Basic:

```powershell
$env:BASE_URL="https://your-api-url"
npm run verify:live
```

Staging:

```powershell
$env:BASE_URL="https://your-api-url"
npm run verify:staging
```

Full:

```powershell
$env:BASE_URL="https://your-api-url"
$env:TEST_TG_ID="8188152343"
$env:ADMIN_TOKEN="your-admin-token"
npm run verify:staging
```

Expected:

- Failed count: `0`.
- `/healthz` OK.
- `/readyz` ready.
- `/scanner/healthz` status `ok` before real deposit testing.
- `/settings` fast.
- Admin list endpoints below 500 status.

## Rollout Stages

Start with 100K readiness.

Move to 300K only after 24 hours stable.

Move to 1.5M only after 300K is stable and wallet/scanner audits are clean.

## Stop Immediately If

- Wrong payment is confirmed.
- Duplicate wallet assignment appears.
- API 5xx stays above 5%.
- Redis evictions appear.
- Supabase is saturated.
- TONAPI quota is reached.

## Current Status

Prepared and locally checked:

- Backend syntax: OK.
- Wallet generator syntax: OK.
- Wallet verifier smoke test: OK.
- Package JSON: OK.
- Env verification commands added.
- Strict staging verification added.
- Upload ZIPs created.

Still must be done on real services:

- Run Supabase SQL bundle.
- Run post-migration SQL verification.
- Create Redis service.
- Deploy API service.
- Deploy scanner worker.
- Generate and verify real wallet pool.
- Import public wallet SQL batches.
- Run wallet pool audit.
- Run staging verification.
- Run load tests.
