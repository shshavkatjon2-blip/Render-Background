# Redis Setup For 1.5M Staging

Redis is required before running more than one public API backend instance.

Create one Redis service and put the same `REDIS_URL` into both:

- API service.
- Scanner worker service.

API env:

```env
RATE_LIMIT_BACKEND=redis
REDIS_URL=
PAYMENT_SCANNER_ENABLED=false
```

Scanner env:

```env
RATE_LIMIT_BACKEND=redis
REDIS_URL=
WORKER_MODE=scanner
PAYMENT_SCANNER_ENABLED=true
```

If Redis is temporarily unavailable, the backend falls back to memory rate limit, but production should not rely on fallback.

## Required Before 100K+ Users

- Use a managed Redis service, not local Redis.
- Use the same `REDIS_URL` in every API instance and scanner worker.
- Keep Redis in the same region as the backend if possible.
- Confirm `RATE_LIMIT_BACKEND=redis` with `npm run verify:env:api`.
- Confirm scanner uses the same Redis with `npm run verify:env:scanner`.

## Stop If

- Redis evictions are above `0`.
- Redis connection errors repeat in backend logs.
- API falls back to memory rate limit during real traffic.
