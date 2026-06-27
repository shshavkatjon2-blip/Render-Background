# Env Verify Before Deploy

Run these checks after setting Render environment variables and before real traffic.

## Public API Service

Expected service:

```text
Web Service
```

Run command in the backend service shell if available:

```bash
npm run verify:env:api
```

Must end with:

```text
ENV CHECK OK
```

Important expected values:

```env
PAYMENT_SCANNER_ENABLED=false
RATE_LIMIT_BACKEND=redis
REDIS_URL=redis://...
```

## Scanner Worker Service

Expected service:

```text
Background Worker
```

Run command in the worker shell if available:

```bash
npm run verify:env:scanner
```

Must end with:

```text
ENV CHECK OK
```

Important expected values:

```env
WORKER_MODE=scanner
PAYMENT_SCANNER_ENABLED=true
RATE_LIMIT_BACKEND=redis
REDIS_URL=redis://...
```

## If The Check Fails

Do not start real traffic yet.

Fix the missing or wrong env keys shown by the script, redeploy/restart, then run the check again.
