# Load Test Pass/Fail Criteria

Use this with `load-test-k6.js` and `VERIFY_STAGING_DEPLOY.md`.

## Smoke Test

Purpose:

Confirm deploy is alive and basic endpoints respond.

Target:

- 25 to 100 virtual users.
- 2 minutes.

Pass:

- Failed requests below 2%.
- p95 below 800 ms.
- `/readyz` ready.

Fail:

- Any repeated 500 errors.
- p95 above 1500 ms.
- Redis errors in logs.

## 100K Readiness Test

Purpose:

Confirm backend can handle early production traffic.

Target:

- 300 to 800 virtual users, depending on hosting limits.
- 10 to 20 minutes.

Pass:

- API p95 below 800 ms.
- Error rate below 1%.
- Redis evictions 0.
- Supabase slow queries do not grow.

Fail:

- Error rate above 2%.
- Supabase CPU stays high.
- Scanner lag grows while API is under load.

## 300K Readiness Test

Purpose:

Confirm horizontal API scaling and Redis sharing work.

Target:

- Multiple API instances.
- 1000+ virtual users.
- 30 minutes.

Pass:

- API p95 below 1000 ms.
- Error rate below 1%.
- Payment status p95 below 1200 ms.

Fail:

- Rate limit behaves differently between API instances.
- Redis reconnect errors repeat.
- Payment status endpoint becomes slow.

## 1.5M Readiness Test

Purpose:

Confirm architecture is ready for large public rollout.

Target:

- Realistic mixed traffic.
- Multiple API instances.
- Scanner workers running.
- Wallet pool fully imported.

Pass:

- API p95 below 1200 ms.
- 5xx below 1%.
- Wallet audit clean.
- Scanner confirmation delay stays acceptable.

Fail:

- Duplicate wallet assignment.
- Wrong payment confirmation.
- TONAPI quota reached.
- Database saturation.
