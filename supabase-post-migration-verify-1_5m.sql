-- VidiPay 1.5M post-migration verification.
-- Run after RUN_ALL_STAGING_SQL_1_5M.sql.
-- Read-only checks only.

select
  now() as verified_at;

select
  'function_claim_payment_wallet' as check_name,
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'claim_payment_wallet'
  ) as ok;

select
  'function_claim_pending_payment_orders' as check_name,
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'claim_pending_payment_orders'
  ) as ok;

with required_columns(table_name, column_name) as (
  values
    ('payment_wallets', 'assigned_to_telegram_id'),
    ('payment_wallets', 'assigned_until'),
    ('payment_wallets', 'cooldown_until'),
    ('payment_wallets', 'last_assigned_at'),
    ('payment_wallets', 'last_scanned_at'),
    ('payment_wallets', 'is_active'),
    ('payment_wallets', 'network'),
    ('payment_wallets', 'token'),
    ('payment_orders', 'scanner_claimed_until'),
    ('payment_orders', 'scanner_claimed_by'),
    ('payment_orders', 'last_checked_at')
)
select
  required_columns.table_name,
  required_columns.column_name,
  exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = required_columns.table_name
      and c.column_name = required_columns.column_name
  ) as ok
from required_columns
order by required_columns.table_name, required_columns.column_name;

with required_indexes(index_name) as (
  values
    ('payment_wallets_one_wallet_per_user_idx'),
    ('payment_wallets_claim_queue_idx'),
    ('idx_payment_orders_scanner_claim'),
    ('idx_users_telegram_id'),
    ('idx_payment_orders_telegram_status_created'),
    ('idx_payment_wallets_address_unique'),
    ('idx_payment_transactions_tx_hash_unique')
)
select
  required_indexes.index_name,
  exists (
    select 1
    from pg_indexes i
    where i.schemaname = 'public'
      and i.indexname = required_indexes.index_name
  ) as ok
from required_indexes
order by required_indexes.index_name;

select
  count(*) as wallet_duplicate_groups
from (
  select address
  from public.payment_wallets
  where network = 'TON'
    and token = 'TON'
  group by address
  having count(*) > 1
) duplicates;

select
  count(*) as multi_wallet_user_groups
from (
  select assigned_to_telegram_id
  from public.payment_wallets
  where network = 'TON'
    and token = 'TON'
    and assigned_to_telegram_id is not null
  group by assigned_to_telegram_id
  having count(*) > 1
) duplicates;

select
  'post_migration_expected_result' as check_name,
  'All ok columns should be true. wallet_duplicate_groups and multi_wallet_user_groups should be 0.' as expected;
