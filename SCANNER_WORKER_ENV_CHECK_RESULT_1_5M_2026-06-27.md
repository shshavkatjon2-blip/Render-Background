# Scanner Worker Env Check Result - 2026-06-27

Generated:

```text
outputs/RENDER_SCANNER_WORKER_ENV_READY_FILLED_1_5M.env
```

Result:

```text
required_missing_count=0
redis_present=false
ENV CHECK OK
```

Meaning:

- Scanner worker has the required Supabase service role, admin, bot, webhook, and TonAPI keys.
- `SUPABASE_ANON_KEY` is not required by the backend scanner.
- `REDIS_URL` was not found locally. Scanner worker can still run with `RATE_LIMIT_BACKEND=memory`.
- Public API should still use Redis before heavy 1.5M traffic.
- TON auto payout is disabled in this worker env. Deposit scanning can work; automatic refund payout requires a later signer/RPC setup.
