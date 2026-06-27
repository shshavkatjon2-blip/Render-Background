# Wallet Pool Audit

Run this after importing wallet public SQL batches into Supabase.

File:

```text
supabase-wallet-pool-audit.sql
```

## Good Result

- `total_wallets` equals imported wallet count.
- Duplicate address query returns `0` rows.
- Invalid address query returns `0` rows.
- One Telegram user should not have more than one assigned wallet.
- `pending_orders_without_wallet` should be `0` or very low during normal operation.

## Important

This audit is read-only. It does not delete or update anything.
