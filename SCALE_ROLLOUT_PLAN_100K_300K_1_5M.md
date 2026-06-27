# Scale Rollout Plan: 100K To 1.5M

This plan is for staged rollout after the staging backend passes verification.

## Stage 1: 100K Users

Infrastructure starter:

- 2 public API instances.
- 1 scanner worker.
- 1 Redis instance, 1 GB preferred.
- Supabase Pro or equivalent.
- TONAPI quota confirmed.

Pass criteria:

- API p95 under 800 ms.
- API 5xx below 1%.
- `/readyz` stays ready.
- Redis evictions are 0.
- Wallet duplicate audit returns 0 rows.
- Pending payment order age does not continuously grow.

Stop criteria:

- API p95 above 1500 ms for 10 minutes.
- API 5xx above 5% for 10 minutes.
- Redis evictions above 0.
- Scanner confirms duplicate or wrong order.
- Supabase CPU stays overloaded.

## Stage 2: 300K Users

Infrastructure:

- 3 to 5 public API instances.
- 2 scanner workers only if pending payment age grows.
- Redis 2 GB or higher.
- Supabase database plan upgraded if CPU or slow queries rise.

Pass criteria:

- API p95 under 1000 ms.
- `/payment/status/:telegram_id` under 1200 ms p95.
- Scanner has no repeated TONAPI errors.
- Wallet pool available count is healthy.
- No duplicate assigned wallet per user.

Stop criteria:

- More than 2% payment status failures.
- Scanner lag grows for 30 minutes.
- Supabase slow queries repeatedly hit payment/user endpoints.
- Redis reconnect errors repeat.

## Stage 3: 1.5M Users

Infrastructure:

- 6 to 12 public API instances.
- 3 to 8 scanner workers, scaled by pending payment age and TONAPI quota.
- Redis 4 GB or higher.
- Supabase higher tier or dedicated Postgres.
- Separate monitoring alerts.
- CDN/static frontend with cache-busted app URL.

Pass criteria:

- API p95 under 1200 ms.
- API 5xx below 1%.
- Payment status p95 under 1500 ms.
- Scanner catches payments within target window.
- Wallet audit clean.
- No database saturation.

Stop criteria:

- Any wrong payment confirmation.
- Duplicate wallet assignment.
- API 5xx above 5%.
- Supabase cannot keep connection count stable.
- TONAPI quota reached.

## Rollout Rule

Do not jump from 100K readiness directly to 1.5M. Move stage by stage and keep each stage stable for at least 24 hours.
