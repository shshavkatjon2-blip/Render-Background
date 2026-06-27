# API Scanner Guard Fixed For 1.5M

Problem found:

```json
"payment_scanner_enabled": true
```

was still shown on the public API service.

Fix applied in the backend package:

- Scanner mode is now controlled by `WORKER_MODE=scanner`.
- Public API mode cannot start the payment scanner anymore.
- `PAYMENT_SCANNER_ENABLED=true` only matters inside the scanner worker.
- Public API `/` should now show `payment_scanner_enabled: false` after redeploy.

Expected public API:

```json
"worker_mode": "api",
"payment_scanner_enabled": false
```

Expected scanner worker:

```env
WORKER_MODE=scanner
PAYMENT_SCANNER_ENABLED=true
```
