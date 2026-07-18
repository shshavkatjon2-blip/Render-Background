# Scanner 128 Rollout Ready Note

This is a preparation note only. Do not switch live production from 64 to 128 while the 10-user canary is still running.

## Prepared File

- `render.128-workers.yaml`

## Generate And Check

```bash
npm run ops:scanner-blueprint:128
npm run verify:scanner-blueprint:128
```

## Safe Cutover Rule

Keep the live scanner pool on `render.64-workers.yaml` until the 10/10 canary gate is clean.

During cutover, every live scanner worker must be on the same shard map:

- `PAYMENT_SCANNER_SHARD_COUNT=128`
- `PAYMENT_SCANNER_SHARD_INDEX=0..127`
- worker ids use `scanner-128-{index}`
- service names use `vidipay-payment-scanner-128-{index}`

Do not run a mixed 64/128 scanner pool.

## Post-Deploy Checks

After deploying the 128 blueprint, verify read-only ops before opening any larger stage:

- `/ops/scanner-shards`: `scanner_workers_alive>=128`
- `/ops/scanner-shards`: `active_shards=128`
- `/ops/scanner-shards`: `duplicate_shards=[]`
- `/ops/rollback-command-center/summary?fresh=true`: `stop_now=false`
- `/ops/final-gate`: ready
- refund safety: `failed_refunds_24h=0`
- refund safety: `stale_processing_refunds_15m=0`
- refund safety: `retry_pending_refunds=0`

If any check fails, roll back to the last clean 64-worker blueprint and keep the canary stage closed.
