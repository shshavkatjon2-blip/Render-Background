# Verify 1.5M Wallet Pool

Run this after wallet generation and before importing public SQL batches into Supabase.

## Verify Full Pool

```powershell
npm run wallets:verify -- --pool=D:\vidipay-ton-wallet-pool-1_5m --expected-count=1500000
```

Expected:

```text
Wallet pool verification: ok
```

The script writes:

```text
wallet-pool-verification-report.json
```

## What It Checks

- Public SQL batch files exist.
- SQL row count matches expected count.
- Public manifest rows match SQL rows.
- CSV rows match SQL rows.
- Private key JSON file count matches SQL rows.
- Private key sample files are valid JSON and contain recovery material.
- SHA256 checksum is recorded for every SQL batch.

## Important

Only import `public-addresses-*.sql` into Supabase.

Do not upload `private-keys/` anywhere public.
