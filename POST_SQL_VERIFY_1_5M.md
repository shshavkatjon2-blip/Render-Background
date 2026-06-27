# Post SQL Verification

Run this after `RUN_ALL_STAGING_SQL_1_5M.sql`.

File:

```text
supabase-post-migration-verify-1_5m.sql
```

Expected:

- `function_claim_payment_wallet` is `true`.
- `function_claim_pending_payment_orders` is `true`.
- Every required column check is `true`.
- Every required index check is `true`.
- `wallet_duplicate_groups` is `0`.
- `multi_wallet_user_groups` is `0`.

If any `ok` value is `false`, do not deploy scanner workers yet.
