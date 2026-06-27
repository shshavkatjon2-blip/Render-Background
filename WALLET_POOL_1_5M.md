# 1.5M Wallet Pool Generation

Use this only on a secure machine with enough disk space.

Example:

```powershell
npm run generate:ton-wallets:large -- --count=1500000 --sql-batch-size=5000 --out=D:\vidipay-ton-wallet-pool-1_5m
```

Output:

- `private-keys/` - private wallet JSON files, sharded by folders.
- `public-addresses-00001.sql` and later - Supabase import batches.
- `wallets-summary.csv` - public address summary.
- `wallet-manifest.public.jsonl` - public metadata one wallet per line.
- `signer-env-snippet.txt` - local signer env helper.

Security rule:

Do not upload `private-keys/` to GitHub, Supabase, Render, frontend hosting, Telegram, or any public server.

Import rule:

Only run `public-addresses-*.sql` files in Supabase. These contain public wallet addresses only.
