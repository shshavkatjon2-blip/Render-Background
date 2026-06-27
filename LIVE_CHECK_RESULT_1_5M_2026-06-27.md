create table if not exists public.payment_scanner_heartbeats (
  worker_id text primary key,
  worker_mode text not null default 'scanner',
  network text not null default 'TON',
  token text not null default 'TON',
  scanner_enabled boolean not null default false,
  running boolean not null default false,
  last_seen_at timestamptz not null default now(),
  last_run_at timestamptz,
  last_error text,
  checked_total bigint not null default 0,
  confirmed_total bigint not null default 0,
  scan_interval_ms integer not null default 15000,
  scan_batch_size integer not null default 50,
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_scanner_heartbeats_last_seen
  on public.payment_scanner_heartbeats (last_seen_at desc);

create index if not exists idx_payment_scanner_heartbeats_network_token_seen
  on public.payment_scanner_heartbeats (network, token, last_seen_at desc);

select
  'scanner_heartbeat_ready' as status,
  count(*) as existing_workers
from public.payment_scanner_heartbeats;
