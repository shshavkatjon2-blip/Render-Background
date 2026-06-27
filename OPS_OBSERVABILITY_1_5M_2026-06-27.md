# Ops observability - 1.5M

This package adds safe public diagnostics for deployment and load-readiness checks.

## Endpoints

```text
GET /healthz
GET /readyz
GET /scanner/healthz
GET /ops/readiness
GET /ops/metrics
GET /ops/deploy
GET /ops/live
```

These endpoints do not return secrets, wallet private keys, transaction hashes, or raw user rows.

## What to watch

- `/scanner/healthz` must become `status=ok` before real TON deposit testing.
- `/ops/readiness` should become `status=ready` before a public push.
- `/ops/metrics` shows process uptime, memory, request counters, slow requests, and rate-limit backend.
- `/ops/deploy` shows whether API and scanner service shape are correct.
- `/ops/live` combines scanner, metrics, deploy shape, and warnings in one response.

## Local package check

```powershell
npm run verify:package
```

## Live check

```powershell
npm run verify:live
```

If scanner is still stale, deploy or fix the separate Render Background Worker.
