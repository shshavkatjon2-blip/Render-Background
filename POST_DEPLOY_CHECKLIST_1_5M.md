# Post Deploy Checklist

Run after staging deploy.

## Immediate Checks

1. Run `npm run verify:env:api`.
2. Run `npm run verify:env:scanner`.
3. Open `/healthz`.
4. Open `/readyz`.
5. Run `npm run verify:staging`.
6. Run `supabase-wallet-pool-audit.sql`.
7. Open `/admin/payment-scanner/status` with admin token and confirm `heartbeat_available=true`.
8. Confirm `scanner_worker_alive=true` and `heartbeat_stale=false` after the scanner worker has run at least once.
9. Confirm Redis has no connection errors.
10. Confirm scanner worker logs have no repeated errors.

## Payment Flow Check

1. Create or use one test Telegram user.
2. Confirm `/payment/status/:telegram_id` returns a wallet address.
3. Confirm the wallet address is from `payment_wallets`.
4. Send a small controlled test payment only after scanner heartbeat is fresh.
5. Confirm one payment transaction is recorded.
6. Confirm withdraw unlock is updated only for that user.

## Scale Check

1. Run smoke load test.
2. Watch p95 response time.
3. Watch Supabase slow queries.
4. Watch Redis memory and evictions.
5. Watch scanner pending order age.

## Pass Criteria

- Verification failed count is `0`.
- Wallet audit duplicate queries return `0` rows.
- API p95 is stable.
- Scanner has no repeated TONAPI errors.
- Redis evictions are `0`.
