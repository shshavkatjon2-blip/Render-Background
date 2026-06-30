const fs = require("fs");

const pkg = {
  name: "vidipay-backend",
  version: "1.0.0",
  description: "VidiPay Backend",
  main: "server.js",
  engines: {
    node: ">=20 <25"
  },
  scripts: {
    start: "node server.js",
    "start:scanner": "node start-scanner.js",
    "generate:ton-wallets": "node scripts/generate-ton-wallet-pool.js",
    "generate:ton-wallets:large": "node scripts/generate-ton-wallet-pool-large.js",
    "verify:env": "node scripts/verify-env-1_5m.js",
    "verify:env:api": "node scripts/verify-env-1_5m.js api",
    "verify:env:scanner": "node scripts/verify-env-1_5m.js scanner",
    "verify:live": "node scripts/verify-live-1_5m.js",
    "verify:package": "node scripts/verify-package-1_5m.js",
    "verify:render": "node scripts/verify-render-blueprints-1_5m.js",
    "verify:sql": "node scripts/verify-sql-package-1_5m.js",
    "verify:contract": "node scripts/verify-contract-1_5m.js",
    "verify:blockers": "node scripts/verify-remaining-blockers-package-1_5m.js",
    "verify:ops": "node scripts/verify-hyperscale-operations-package-1_5m.js",
    "verify:control-tower": "node scripts/verify-control-tower-package-1_5m.js",
    "verify:live:ops": "node scripts/verify-live-ops-1_5m.js",
    "verify:final-live-gate": "node scripts/final-live-gate-1_5m.js",
    "verify:wallet-sql": "node scripts/verify-public-wallet-sql-batches-1_5m.js",
    "verify:all": "npm run verify:package && npm run verify:render && npm run verify:sql && npm run verify:contract && npm run verify:blockers && npm run verify:ops && npm run verify:control-tower && npm run verify:infra-autopilot && npm run verify:upload-audit",
    "verify:staging": "node scripts/verify-staging-deploy.js",
    "diagnose:live": "node scripts/diagnose-live-control-tower-1_5m.js",
    "launch:manifest": "node scripts/build-production-launch-manifest-1_5m.js",
    "closeout:kit": "node scripts/generate-closeout-execution-kit-1_5m.js",
    "ops:infra-autopilot": "node scripts/generate-infra-autopilot-kit-1_5m.js",
    "ops:scanner-blueprints": "node scripts/generate-scanner-worker-blueprints-1_5m.js",
    "verify:render-env-file": "node scripts/verify-render-env-file-1_5m.js",
    "verify:signer-keys": "node scripts/verify-signer-keys-dir-1_5m.js",
    "verify:infra-autopilot": "node scripts/verify-infra-autopilot-package-1_5m.js",
    "verify:upload-audit": "node scripts/final-upload-audit-1_5m.js",
    "doctor:live": "node scripts/live-blocker-doctor-1_5m.js",
    "doctor:upload-root": "node scripts/upload-root-doctor-1_5m.js",
    "ops:wallet-manifest": "node scripts/generate-wallet-import-manifest-1_5m.js",
    "ops:scanner-matrix": "node scripts/generate-scanner-shard-env-matrix-1_5m.js",
    "ops:render-env-bundle": "node scripts/generate-render-env-bundle-1_5m.js",
    "wallets:topup-plan": "node scripts/plan-wallet-topup-1_5m.js",
    "wallets:generate-missing": "node scripts/generate-missing-ton-wallets-to-target-1_5m.js",
    "wallets:public-import": "node scripts/build-public-wallet-import-from-keys-dir-1_5m.js",
    "wallets:verify": "node scripts/verify-ton-wallet-pool.js"
  },
  dependencies: {
    "@orbs-network/ton-access": "^2.3.3",
    "@supabase/auth-js": "^2.69.1",
    "@supabase/functions-js": "^2.4.4",
    "@supabase/postgrest-js": "^1.19.4",
    "@supabase/realtime-js": "^2.11.10",
    "@supabase/storage-js": "^2.7.1",
    "@supabase/supabase-js": "^2.50.0",
    "@ton/core": "^0.63.1",
    "@ton/crypto-primitives": "2.1.0",
    "@ton/crypto": "^3.3.0",
    "@ton/ton": "^16.3.0",
    axios: "^1.15.0",
    cors: "^2.8.5",
    dataloader: "^2.2.3",
    dotenv: "^16.4.5",
    express: "^4.21.0",
    "follow-redirects": "^1.16.0",
    "form-data": "^4.0.5",
    helmet: "^8.0.0",
    "https-proxy-agent": "^5.0.1",
    jssha: "3.2.0",
    "object-assign": "^4.1.1",
    "proxy-from-env": "^2.1.0",
    vary: "^1.1.2",
    redis: "^4.7.0",
    tweetnacl: "1.0.3",
    zod: "^3.25.76"
  }
};

console.log("=== VIDIPAY API BUILD FIX START ===");
console.log("cwd=", process.cwd());
console.log("files_before=", fs.readdirSync(".").join(", "));
fs.rmSync("node_modules", { recursive: true, force: true });
fs.rmSync("package-lock.json", { force: true });
fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
JSON.parse(fs.readFileSync("package.json", "utf8"));
console.log("package_json_rewritten=true");
console.log("server_js_exists=", fs.existsSync("server.js"));
console.log("scripts_dir_exists=", fs.existsSync("scripts"));
console.log("node_modules_removed=", !fs.existsSync("node_modules"));
console.log("=== VIDIPAY API BUILD FIX END ===");
