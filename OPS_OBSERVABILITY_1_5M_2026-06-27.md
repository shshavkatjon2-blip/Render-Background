# Live check result - 2026-06-27

Latest expected package version:

```text
v1.7.8-1-5m-runtime-capacity-20260627
```

The public API can be live while the scanner worker is still stale.

Check after deploying both API and scanner worker:

```powershell
curl.exe -s https://vidipay-backend.onrender.com/healthz
curl.exe -s https://vidipay-backend.onrender.com/scanner/healthz
curl.exe -s https://vidipay-backend.onrender.com/ops/live
```

Expected:

```text
/healthz version=v1.7.8-1-5m-runtime-capacity-20260627
/scanner/healthz status=ok
/ops/live status=ready
```

If scanner is stale, fix the separate Render Background Worker before real TON deposit testing.
