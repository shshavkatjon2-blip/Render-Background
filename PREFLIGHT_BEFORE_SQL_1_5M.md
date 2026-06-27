# Preflight Before Scaling SQL

Run this before the main scaling SQL bundle.

File:

```text
supabase-preflight-snapshot-1_5m.sql
```

Purpose:

- Capture table row counts.
- Capture existing columns.
- Capture existing indexes.
- Check duplicate wallet address groups.
- Check current payment order status counts.
- Check active/assigned/available wallet counts.

This script is read-only and does not modify anything.

After saving the result, run:

```text
RUN_ALL_STAGING_SQL_1_5M.sql
```
