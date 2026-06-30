# Upload This Backend Signer Autofix

Upload the contents of this folder to the `vidipay-backend` repo root.

This version fixes:

- Render env values accidentally pasted as `KEY=value`
- TON RPC fallback when the configured key/endpoint fails
- clearer `/ops/ton-signer` diagnostics
- safe `ton-signer-keys` folder placeholder

Required Render env:

```env
TON_AUTO_PAYOUT_ENABLED=true
TON_SIGNER_ENABLED=true
REQUIRE_TON_AUTO_PAYOUT_FOR_1_5M=true
TON_SIGNER_NETWORK=mainnet
TON_RPC_ENDPOINT=https://toncenter.com/api/v2/jsonRPC
TON_RPC_API_KEY=PASTE_REAL_TONCENTER_KEY_ONLY
TON_SIGNER_KEYS_DIR=/opt/render/project/src/ton-signer-keys
```

Do not paste `TON_RPC_API_KEY=` into the value field. Paste only the key.

The folder `ton-signer-keys` is included only as a safe placeholder. Real private key JSON files must be added only through a secure private deployment path.

## Safer Remote Signer Option

If you do not want private keys on Render, run the private signer service from:

```text
outputs/TON_REMOTE_SIGNER_PRIVATE_SERVICE_2026-06-30
```

Then add these to backend Render env:

```env
TON_REMOTE_SIGNER_URL=https://your-private-signer-domain
TON_REMOTE_SIGNER_TOKEN=same_private_signer_token
TON_AUTO_PAYOUT_ENABLED=true
TON_SIGNER_ENABLED=true
```

When remote signer is healthy, backend can payout without local `ton-signer-keys` files.
