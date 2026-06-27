# Run SQL In This Order

Recommended: take a read-only snapshot, then run one bundled file on staging Supabase.

`supabase-preflight-snapshot-1_5m.sql`

`RUN_ALL_STAGING_SQL_1_5M.sql`

Then verify the migration result:

`supabase-post-migration-verify-1_5m.sql`

Then run scanner heartbeat SQL:

`COPY_THIS_SCANNER_HEARTBEAT_SQL_1_5M.sql`

If you prefer separate files, run them in this exact order:

1. `supabase-1_5m-wallet-rpc.sql`
2. `supabase-1_5m-scanner-rpc.sql`
3. `supabase-1_5m-indexes.sql`
4. `supabase-scanner-heartbeat-1_5m.sql`

Reason:

- Wallet RPC creates wallet assignment columns before wallet indexes are used.
- Scanner RPC creates scanner claim columns before scanner indexes are used.
- Indexes go last so they build on columns that already exist.
- Scanner heartbeat goes last because it is monitoring only and must not block the core migration.

After staging passes, repeat the same order on production during low traffic.
