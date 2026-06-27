# Final Batch Summary 1.5M - 2026-06-26

Scope: only 1.5M backend/database scaling package.

## Completed

- Added `verify-env-1_5m.js`.
- Added `npm run verify:env:api`.
- Added `npm run verify:env:scanner`.
- Made `verify-staging-deploy.js` strict for 4xx/5xx and health/ready body status.
- Added simple Supabase main SQL and verify SQL fallback.
- Added API/scanner env verification guide.
- Added scanner worker safety guide.
- Updated Redis 1.5M requirements.
- Updated Render configs so API and scanner worker are separate.
- Added code-level guard so public API cannot run the payment scanner.
- Added scanner heartbeat table SQL and `/admin/payment-scanner/status`.
- Added post-deploy checklist steps for env verification.
- Updated master/start/deploy docs.

## Not Changed

- Frontend UI was not changed.
- Telegram bot URL was not changed.
- Payment amount logic was not changed.
- Wallet UI was not changed.

## Required Next Real-Service Steps

1. Upload latest backend ZIP to backend service.
2. Set API env and run `npm run verify:env:api`.
3. Set scanner env and run `npm run verify:env:scanner`.
4. Run `COPY_THIS_SCANNER_HEARTBEAT_SQL_1_5M.sql` in Supabase.
5. Open `/healthz`.
6. Open `/readyz`.
7. Open `/admin/payment-scanner/status` and confirm `scanner_worker_alive=true`.
8. Run `npm run verify:staging` with `BASE_URL`.
9. Watch Redis and scanner logs before real traffic.
