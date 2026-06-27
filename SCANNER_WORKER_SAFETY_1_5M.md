# Scanner Worker Safety For 1.5M

The scanner worker must be separate from the public API service.

## Required Setup

Public API:

```env
PAYMENT_SCANNER_ENABLED=false
```

Scanner worker:

```env
WORKER_MODE=scanner
PAYMENT_SCANNER_ENABLED=true
PAYMENT_SCANNER_WORKER_ID=scanner-render-1
PAYMENT_SCAN_BATCH_SIZE=50
PAYMENT_SCAN_INTERVAL_MS=15000
```

## First Start

1. Start API service first.
2. Confirm `/readyz` returns `ready`.
3. Run `COPY_THIS_SCANNER_HEARTBEAT_SQL_1_5M.sql` once in Supabase.
4. Start scanner worker.
5. Open `/admin/payment-scanner/status` with admin token.
6. Confirm `heartbeat_available=true`.
7. Confirm `heartbeat_stale=false` after one scan interval.
8. Watch scanner logs for 10 minutes.
9. Do not increase batch size until pending orders process cleanly.

## Scaling Scanner Later

Add a second scanner only after:

- `claim_pending_payment_orders` exists.
- Scanner logs have no duplicate confirmations.
- Pending orders are growing faster than one scanner can process.

Every scanner must have a unique `PAYMENT_SCANNER_WORKER_ID`.

## Scanner Health Endpoint

Use:

```text
/admin/payment-scanner/status
```

Expected healthy values:

- `heartbeat_available=true`.
- `heartbeat_stale=false`.
- `scanner_worker_alive=true`.
- `latest_scanner_heartbeat.scanner_enabled=true`.
- `latest_scanner_heartbeat.last_error=null`.
