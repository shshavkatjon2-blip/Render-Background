-- VidiPay 1.5M MAIN SQL - SIMPLE VERSION.
-- Use this if the SAFE version gives error 42601.
-- Paste this whole file into Supabase SQL Editor and run it.
-- This file avoids DO blocks and nested dynamic SQL.

select now() as vidipay_1_5m_main_sql_started_at;

-- payment_wallets columns required for one-user-one-wallet assignment.
alter table public.payment_wallets
add column if not exists assigned_to_telegram_id text;

alter table public.payment_wallets
add column if not exists assigned_until timestamptz;

alter table public.payment_wallets
add column if not exists cooldown_until timestamptz;

alter table public.payment_wallets
add column if not exists last_assigned_at timestamptz;

alter table public.payment_wallets
add column if not exists last_scanned_at timestamptz;

alter table public.payment_wallets
add column if not exists updated_at timestamptz default now();

alter table public.payment_wallets
add column if not exists is_active boolean default true;

alter table public.payment_wallets
add column if not exists network text default 'TON';

alter table public.payment_wallets
add column if not exists token text default 'TON';

alter table public.payment_wallets
alter column network set default 'TON';

alter table public.payment_wallets
alter column token set default 'TON';

update public.payment_wallets
set network = 'TON'
where network is null or trim(network) = '';

update public.payment_wallets
set token = 'TON'
where token is null or trim(token) = '' or upper(token) = 'TONCOIN';

create index if not exists payment_wallets_claim_queue_idx
on public.payment_wallets (network, token, is_active, assigned_to_telegram_id, cooldown_until, last_assigned_at);

create index if not exists idx_payment_wallets_assigned_telegram
on public.payment_wallets (assigned_to_telegram_id);

create index if not exists idx_payment_wallets_address
on public.payment_wallets (address);

create or replace function public.claim_payment_wallet(
  p_order_id text,
  p_telegram_id text,
  p_assigned_until timestamptz,
  p_network text default 'TON',
  p_token text default 'TON'
)
returns setof public.payment_wallets
language plpgsql
security definer
set search_path = public
as $vidipay_claim_wallet$
begin
  return query
  update public.payment_wallets wallet
  set
    assigned_to_telegram_id = p_telegram_id,
    assigned_until = p_assigned_until,
    last_assigned_at = now(),
    updated_at = now()
  where wallet.id = (
    select candidate.id
    from public.payment_wallets candidate
    where candidate.network = p_network
      and candidate.token = p_token
      and candidate.is_active = true
      and (
        candidate.assigned_to_telegram_id = p_telegram_id
        or candidate.assigned_to_telegram_id is null
      )
      and (
        candidate.cooldown_until is null
        or candidate.cooldown_until <= now()
        or candidate.assigned_to_telegram_id = p_telegram_id
      )
    order by
      case when candidate.assigned_to_telegram_id = p_telegram_id then 0 else 1 end,
      candidate.last_assigned_at asc nulls first,
      candidate.id asc
    for update skip locked
    limit 1
  )
  returning wallet.*;
end;
$vidipay_claim_wallet$;

-- payment_orders columns required for scanner workers.
alter table public.payment_orders
add column if not exists scanner_claimed_until timestamptz;

alter table public.payment_orders
add column if not exists scanner_claimed_by text;

alter table public.payment_orders
add column if not exists last_checked_at timestamptz;

alter table public.payment_orders
add column if not exists network text default 'TON';

alter table public.payment_orders
add column if not exists token text default 'TON';

alter table public.payment_orders
add column if not exists updated_at timestamptz default now();

alter table public.payment_orders
add column if not exists created_at timestamptz default now();

alter table public.payment_orders
add column if not exists status text default 'pending';

alter table public.payment_orders
add column if not exists wallet_address text;

alter table public.payment_orders
alter column network set default 'TON';

alter table public.payment_orders
alter column token set default 'TON';

update public.payment_orders
set network = 'TON'
where network is null or trim(network) = '';

update public.payment_orders
set token = 'TON'
where token is null or trim(token) = '' or upper(token) = 'TONCOIN';

create index if not exists idx_payment_orders_scanner_claim
on public.payment_orders (status, network, token, scanner_claimed_until, last_checked_at, created_at);

create index if not exists idx_payment_orders_telegram_status_created
on public.payment_orders (telegram_id, status, created_at desc);

create index if not exists idx_payment_orders_status_wallet_created
on public.payment_orders (status, wallet_address, created_at desc);

create index if not exists idx_payment_orders_wallet_address
on public.payment_orders (wallet_address);

create or replace function public.claim_pending_payment_orders(
  p_limit integer,
  p_worker_id text,
  p_network text default 'TON',
  p_token text default 'TON',
  p_claim_seconds integer default 90
)
returns setof public.payment_orders
language plpgsql
security definer
set search_path = public
as $vidipay_claim_orders$
begin
  return query
  with picked as (
    select payment_orders.id
    from public.payment_orders
    where payment_orders.status = 'pending'
      and payment_orders.network = p_network
      and payment_orders.token = p_token
      and payment_orders.wallet_address is not null
      and (
        payment_orders.scanner_claimed_until is null
        or payment_orders.scanner_claimed_until <= now()
      )
    order by
      payment_orders.last_checked_at asc nulls first,
      payment_orders.created_at asc
    for update skip locked
    limit least(greatest(coalesce(p_limit, 50), 1), 500)
  )
  update public.payment_orders target
  set
    scanner_claimed_until = now() + make_interval(secs => least(greatest(coalesce(p_claim_seconds, 90), 30), 600)),
    scanner_claimed_by = p_worker_id,
    updated_at = now()
  where target.id in (select picked.id from picked)
  returning target.*;
end;
$vidipay_claim_orders$;

select 'vidipay_1_5m_main_sql_finished' as check_name, now() as finished_at;
