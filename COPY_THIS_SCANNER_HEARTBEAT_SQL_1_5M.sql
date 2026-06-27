# 1.5M Backend Batch Status

This package contains only 1.5M backend/database scaling work.

## Added In This Batch

- API/scanner env verification script.
- Strict staging deploy verification.
- Simple Supabase SQL fallback files.
- API and scanner service separation instructions.
- Redis requirement documented for 1.5M mode.

## Commands

API env check:

```bash
npm run verify:env:api
```

Scanner env check:

```bash
npm run verify:env:scanner
```

Live/staging endpoint check:

```bash
BASE_URL=https://your-backend-url npm run verify:staging
```

## Pass Conditions

- `verify:env:api` ends with `ENV CHECK OK`.
- `verify:env:scanner` ends with `ENV CHECK OK`.
- `verify:staging` has `Failed: 0`.
- `/healthz` returns `status: "ok"`.
- `/readyz` returns `status: "ready"`.

## Not Changed

- Frontend UI was not changed.
- Telegram bot menu URL was not changed.
- Payment amount and wallet UI behavior were not changed.
