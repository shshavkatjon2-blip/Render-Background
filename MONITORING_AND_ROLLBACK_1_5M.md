# Monitoring And Rollback For 1.5M

Use this after staging deploy and before production rollout.

## Must Monitor

API service:

- `/healthz` status.
- `/readyz` status.
- 5xx error rate.
- p95 response time.
- CPU and memory.
- Restart count.

Scanner worker:

- Worker restart count.
- Last scanner run time.
- Scanner `lastError`.
- Pending payment order age.
- TONAPI or TON RPC rate-limit errors.

Supabase:

- CPU.
- RAM.
- Disk.
- Slow queries.
- Connection count.
- `payment_orders` pending count.
- `payment_wallets` available count.

Redis:

- Memory usage.
- Connection count.
- Evictions.
- Reconnect errors.

## Healthy Starting Targets

- API p95 under 800 ms.
- `/settings` under 300 ms.
- `/payment/status/:telegram_id` under 1000 ms.
- `/readyz` returns ready.
- API 5xx below 1%.
- Redis evictions: 0.
- Pending payment orders should not grow without scanner confirmations.

## First 24 Hours

Check every 15 minutes:

1. API health.
2. Scanner logs.
3. Supabase slow queries.
4. Redis errors.
5. Payment order pending count.
6. Wallet pool available count.

## Emergency Rollback

Use rollback if:

- API 5xx stays above 5% for 10 minutes.
- `/readyz` fails repeatedly.
- Scanner confirms wrong payments.
- Wallet assignment duplicates appear.
- Supabase CPU stays overloaded.

Rollback steps:

1. Stop scanner worker first.
2. Switch Telegram bot/menu URL back to the previous stable backend URL.
3. Roll public API service back to previous deploy.
4. Keep database untouched unless a specific bad migration is identified.
5. Run `supabase-wallet-pool-audit.sql`.
6. Run `npm run verify:staging` against the restored backend.

## Do Not Do During Incident

- Do not delete wallet rows.
- Do not delete payment orders.
- Do not regenerate live private keys.
- Do not run destructive SQL.
- Do not change both API and database at the same time.

## Safe Recovery Order

1. Restore API availability.
2. Stop duplicate/incorrect scanner work.
3. Confirm wallet assignment data.
4. Confirm payment transaction data.
5. Resume scanner with small `PAYMENT_SCAN_BATCH_SIZE`.
6. Increase scanner speed only after logs stay clean.
