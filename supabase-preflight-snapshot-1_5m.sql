-- VidiPay 1.5M preflight snapshot.
-- Run this before RUN_ALL_STAGING_SQL_1_5M.sql.
-- This script only reads metadata/data. It does not modify anything.

select
  now() as snapshot_at;

select
  'users' as table_name,
  count(*) as row_count
from public.users
union all
select
  'payment_wallets' as table_name,
  count(*) as row_count
from public.payment_wallets
union all
select
  'payment_orders' as table_name,
  count(*) as row_count
from public.payment_orders
union all
select
  'payment_transactions' as table_name,
  count(*) as row_count
from public.payment_transactions
union all
select
  'withdraws' as table_name,
  count(*) as row_count
from public.withdraws
union all
select
  'notifications' as table_name,
  count(*) as row_count
from public.notifications;

select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('payment_wallets', 'payment_orders', 'users', 'withdraws', 'payment_transactions')
order by table_name, ordinal_position;

select
  indexname,
  tablename,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('payment_wallets', 'payment_orders', 'users', 'withdraws', 'payment_transactions', 'notifications')
order by tablename, indexname;

select
  count(*) as duplicate_wallet_address_groups
from (
  select address
  from public.payment_wallets
  group by address
  having count(*) > 1
) duplicates;

select
  status,
  count(*) as payment_order_count
from public.payment_orders
group by status
order by payment_order_count desc;

select
  count(*) as active_wallets,
  count(*) filter (where assigned_to_telegram_id is not null) as assigned_wallets,
  count(*) filter (where assigned_to_telegram_id is null) as available_wallets
from public.payment_wallets
where network = 'TON'
  and token = 'TON';

select
  'preflight_expected_result' as check_name,
  'Save these results before running scaling SQL. Duplicate wallet address groups should be 0.' as expected;
