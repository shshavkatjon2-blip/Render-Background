# Runtime and capacity readiness - 1.5M

This package adds runtime controls and capacity diagnostics for larger traffic.

## Runtime controls

```env
REQUEST_SLOW_MS=1500
SERVER_KEEP_ALIVE_TIMEOUT_MS=65000
SERVER_HEADERS_TIMEOUT_MS=70000
SERVER_REQUEST_TIMEOUT_MS=120000
SHUTDOWN_GRACE_MS=25000
CAPACITY_INITIAL_USERS=100000
CAPACITY_TARGET_USERS=1500000
```

## New diagnostics

```text
GET /ops/capacity
```

This endpoint reports:

- whether scanner heartbeat is live
- whether TON payment range is valid
- whether Redis is configured for API traffic
- whether real TON deposit testing is safe to start
- whether 100K+ traffic readiness is blocked

## Current hard rule

Real TON deposit tests should start only when:

```text
/scanner/healthz -> status=ok
/ops/capacity -> ready_for_real_ton_deposit_test=true
```

100K+ public traffic should start only when:

```text
/ops/capacity -> ready_for_100k_public_traffic=true
```
