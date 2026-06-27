# Verify Staging Deploy

Run this after API service and scanner worker are deployed.

## Basic Check

```powershell
$env:BASE_URL="https://your-staging-api.example.com"
npm run verify:staging
```

## Full Check With User And Admin

```powershell
$env:BASE_URL="https://your-staging-api.example.com"
$env:TEST_TG_ID="8188152343"
$env:ADMIN_TOKEN="your-admin-token"
npm run verify:staging
```

## Expected

- `/healthz` returns OK.
- `/readyz` returns ready.
- `/settings` returns under 1500 ms.
- HTTP 4xx/5xx responses fail the check.
- `/healthz` body must include `status: "ok"`.
- `/readyz` body must include `status: "ready"`.
- Admin pagination endpoints must return 2xx/3xx status.
- Failed count should be `0`.

If `/readyz` fails, check Supabase env first.

If Redis has problems, backend may still respond through memory fallback, but production should not rely on fallback.
