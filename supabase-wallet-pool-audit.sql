-- VidiPay wallet pool audit.
-- Run this after importing public-addresses-*.sql batches.
-- This script only reads data. It does not modify rows.

select
  count(*) as total_wallets,
  count(*) filter (where is_active = true) as active_wallets,
  count(*) filter (where is_active = false) as inactive_wallets,
  count(*) filter (where assigned_to_telegram_id is not null) as assigned_wallets,
  count(*) filter (where assigned_to_telegram_id is null) as available_wallets,
  count(*) filter (where assigned_until is not null and assigned_until > now()) as temporarily_assigned_wallets,
  count(*) filter (where cooldown_until is not null and cooldown_until > now()) as cooldown_wallets
from public.payment_wallets
where network = 'TON'
  and token = 'TON';

select
  address,
  count(*) as duplicate_count
from public.payment_wallets
where network = 'TON'
  and token = 'TON'
group by address
having count(*) > 1
order by duplicate_count desc, address
limit 50;

select
  address
from public.payment_wallets
where network = 'TON'
  and token = 'TON'
  and not (
    address like 'EQ%'
    or address like 'UQ%'
    or address like '0:%'
  )
order by created_at desc nulls last
limit 50;

select
  assigned_to_telegram_id,
  count(*) as assigned_wallet_count
from public.payment_wallets
where network = 'TON'
  and token = 'TON'
  and assigned_to_telegram_id is not null
group by assigned_to_telegram_id
having count(*) > 1
order by assigned_wallet_count desc
limit 50;

select
  count(*) as pending_orders_without_wallet
from public.payment_orders
where network = 'TON'
  and token = 'TONCOIN'
  and status = 'pending'
  and wallet_address is null;

select
  wallet_address,
  count(*) as pending_order_count
from public.payment_orders
where network = 'TON'
  and token = 'TONCOIN'
  and status = 'pending'
  and wallet_address is not null
group by wallet_address
having count(*) > 1
order by pending_order_count desc
limit 50;

select
  status,
  count(*) as order_count
from public.payment_orders
where network = 'TON'
  and token = 'TONCOIN'
group by status
order by order_count desc;

select
  'audit_expected_result' as check_name,
  'duplicates should return 0 rows, invalid addresses should return 0 rows, pending_orders_without_wallet should be 0 or very low' as expected;
