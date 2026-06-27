-- VidiPay 1.5M SAFE main SQL.
-- Paste this whole file into Supabase SQL Editor and run it.
-- This version avoids failing when optional tables/columns are missing.

select now() as vidipay_1_5m_safe_sql_started_at;

do $$
declare
  has_duplicate_wallet_users boolean := false;
  has_duplicate_wallet_addresses boolean := false;
  has_duplicate_tx_hashes boolean := false;
begin
  -- payment_wallets migration and wallet claim RPC.
  if to_regclass('public.payment_wallets') is null then
    raise notice 'Skipped wallet migration: public.payment_wallets table does not exist.';
  else
    execute 'alter table public.payment_wallets add column if not exists assigned_to_telegram_id text';
    execute 'alter table public.payment_wallets add column if not exists assigned_until timestamptz';
    execute 'alter table public.payment_wallets add column if not exists cooldown_until timestamptz';
    execute 'alter table public.payment_wallets add column if not exists last_assigned_at timestamptz';
    execute 'alter table public.payment_wallets add column if not exists last_scanned_at timestamptz';
    execute 'alter table public.payment_wallets add column if not exists updated_at timestamptz default now()';
    execute 'alter table public.payment_wallets add column if not exists is_active boolean default true';
    execute 'alter table public.payment_wallets add column if not exists network text default ''TON''';
    execute 'alter table public.payment_wallets add column if not exists token text default ''TON''';

    execute 'update public.payment_wallets set network = ''TON'' where network is null or trim(network) = ''''';
    execute 'update public.payment_wallets set token = ''TON'' where token is null or trim(token) = '''' or upper(token) = ''TONCOIN''';

    execute 'select exists (
      select 1
      from public.payment_wallets
      where assigned_to_telegram_id is not null
      group by network, token, assigned_to_telegram_id
      having count(*) > 1
    )' into has_duplicate_wallet_users;

    if has_duplicate_wallet_users then
      raise notice 'Skipped payment_wallets_one_wallet_per_user_idx: duplicate assigned users already exist.';
    else
      execute 'create unique index if not exists payment_wallets_one_wallet_per_user_idx
        on public.payment_wallets (network, token, assigned_to_telegram_id)
        where assigned_to_telegram_id is not null';
    end if;

    execute 'create index if not exists payment_wallets_claim_queue_idx
      on public.payment_wallets (network, token, is_active, assigned_to_telegram_id, cooldown_until, last_assigned_at)';

    execute $sql$
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
      as $fn$
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
      $fn$;
    $sql$;
  end if;

  -- payment_orders migration and scanner claim RPC.
  if to_regclass('public.payment_orders') is null then
    raise notice 'Skipped payment order migration: public.payment_orders table does not exist.';
  else
    execute 'alter table public.payment_orders add column if not exists scanner_claimed_until timestamptz';
    execute 'alter table public.payment_orders add column if not exists scanner_claimed_by text';
    execute 'alter table public.payment_orders add column if not exists last_checked_at timestamptz';
    execute 'alter table public.payment_orders add column if not exists network text default ''TON''';
    execute 'alter table public.payment_orders add column if not exists token text default ''TON''';
    execute 'alter table public.payment_orders add column if not exists updated_at timestamptz default now()';
    execute 'alter table public.payment_orders add column if not exists created_at timestamptz default now()';
    execute 'alter table public.payment_orders add column if not exists status text default ''pending''';
    execute 'alter table public.payment_orders add column if not exists wallet_address text';

    execute 'update public.payment_orders set network = ''TON'' where network is null or trim(network) = ''''';
    execute 'update public.payment_orders set token = ''TON'' where token is null or trim(token) = '''' or upper(token) = ''TONCOIN''';

    execute 'create index if not exists idx_payment_orders_scanner_claim
      on public.payment_orders (status, network, token, scanner_claimed_until, last_checked_at, created_at)';

    execute $sql$
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
      as $fn$
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
      $fn$;
    $sql$;
  end if;

  -- Optional performance indexes. Each index is created only when its table/columns exist.
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'telegram_id') then
    execute 'create index if not exists idx_users_telegram_id on public.users (telegram_id)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'referrer_id') then
    execute 'create index if not exists idx_users_referrer_id on public.users (referrer_id)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'created_at') then
    execute 'create index if not exists idx_users_created_at on public.users (created_at desc)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_orders' and column_name = 'telegram_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_orders' and column_name = 'status')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_orders' and column_name = 'created_at') then
    execute 'create index if not exists idx_payment_orders_telegram_status_created on public.payment_orders (telegram_id, status, created_at desc)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_orders' and column_name = 'status')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_orders' and column_name = 'wallet_address')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_orders' and column_name = 'created_at') then
    execute 'create index if not exists idx_payment_orders_status_wallet_created on public.payment_orders (status, wallet_address, created_at desc)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_orders' and column_name = 'wallet_address') then
    execute 'create index if not exists idx_payment_orders_wallet_address on public.payment_orders (wallet_address)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_orders' and column_name = 'paid_at') then
    execute 'create index if not exists idx_payment_orders_paid_at on public.payment_orders (paid_at desc)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_wallets' and column_name = 'assigned_to_telegram_id') then
    execute 'create index if not exists idx_payment_wallets_assigned_telegram on public.payment_wallets (assigned_to_telegram_id)';
  end if;

  if to_regclass('public.payment_wallets') is not null
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_wallets' and column_name = 'address') then
    execute 'select exists (
      select 1
      from public.payment_wallets
      where address is not null
      group by address
      having count(*) > 1
    )' into has_duplicate_wallet_addresses;
    if has_duplicate_wallet_addresses then
      raise notice 'Skipped idx_payment_wallets_address_unique: duplicate wallet addresses already exist.';
    else
      execute 'create unique index if not exists idx_payment_wallets_address_unique on public.payment_wallets (address)';
    end if;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_transactions' and column_name = 'telegram_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_transactions' and column_name = 'created_at') then
    execute 'create index if not exists idx_payment_transactions_telegram_created on public.payment_transactions (telegram_id, created_at desc)';
  end if;

  if to_regclass('public.payment_transactions') is not null
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_transactions' and column_name = 'tx_hash') then
    execute 'select exists (
      select 1
      from public.payment_transactions
      where tx_hash is not null
      group by tx_hash
      having count(*) > 1
    )' into has_duplicate_tx_hashes;
    if has_duplicate_tx_hashes then
      raise notice 'Skipped idx_payment_transactions_tx_hash_unique: duplicate tx_hash values already exist.';
    else
      execute 'create unique index if not exists idx_payment_transactions_tx_hash_unique on public.payment_transactions (tx_hash)';
    end if;
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_transactions' and column_name = 'to_wallet')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'payment_transactions' and column_name = 'created_at') then
    execute 'create index if not exists idx_payment_transactions_to_wallet_created on public.payment_transactions (to_wallet, created_at desc)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'withdraws' and column_name = 'telegram_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'withdraws' and column_name = 'created_at') then
    execute 'create index if not exists idx_withdraws_telegram_created on public.withdraws (telegram_id, created_at desc)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'withdraws' and column_name = 'status')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'withdraws' and column_name = 'created_at') then
    execute 'create index if not exists idx_withdraws_status_created on public.withdraws (status, created_at desc)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'telegram_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'notifications' and column_name = 'created_at') then
    execute 'create index if not exists idx_notifications_telegram_created on public.notifications (telegram_id, created_at desc)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'view_logs' and column_name = 'telegram_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'view_logs' and column_name = 'created_at') then
    execute 'create index if not exists idx_view_logs_telegram_created on public.view_logs (telegram_id, created_at desc)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'view_logs' and column_name = 'telegram_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'view_logs' and column_name = 'video_id') then
    execute 'create index if not exists idx_view_logs_telegram_video on public.view_logs (telegram_id, video_id)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'referrals' and column_name = 'referrer_telegram_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'referrals' and column_name = 'created_at') then
    execute 'create index if not exists idx_referrals_referrer_created on public.referrals (referrer_telegram_id, created_at desc)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'referrals' and column_name = 'referred_telegram_id') then
    execute 'create index if not exists idx_referrals_referred on public.referrals (referred_telegram_id)';
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'bonus_logs' and column_name = 'telegram_id')
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'bonus_logs' and column_name = 'created_at') then
    execute 'create index if not exists idx_bonus_logs_telegram_created on public.bonus_logs (telegram_id, created_at desc)';
  end if;
end $$;

select
  'safe_main_sql_finished' as check_name,
  now() as finished_at;
