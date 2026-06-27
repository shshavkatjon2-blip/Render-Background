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
    "start:scanner": "node scripts/start-scanner.js",
    "generate:ton-wallets": "node scripts/generate-ton-wallet-pool.js",
    "generate:ton-wallets:large": "node scripts/generate-ton-wallet-pool-large.js",
    "verify:env": "node scripts/verify-env-1_5m.js",
    "verify:env:api": "node scripts/verify-env-1_5m.js api",
    "verify:env:scanner": "node scripts/verify-env-1_5m.js scanner",
    "verify:live": "node scripts/verify-live-1_5m.js",
    "verify:package": "node scripts/verify-package-1_5m.js",
    "verify:staging": "node scripts/verify-staging-deploy.js",
    "wallets:verify": "node scripts/verify-ton-wallet-pool.js"
  },
  dependencies: {
    "@orbs-network/ton-access": "^2.3.3",
    "@supabase/supabase-js": "^2.50.0",
    "@ton/crypto": "^3.3.0",
    "@ton/ton": "^16.3.0",
    cors: "^2.8.5",
    dotenv: "^16.4.5",
    express: "^4.21.0",
    helmet: "^8.0.0",
    "object-assign": "^4.1.1",
    vary: "^1.1.2",
    redis: "^4.7.0"
  }
};

console.log("=== VIDIPAY SCANNER BUILD FIX START ===");
console.log("cwd=", process.cwd());
console.log("files_before=", fs.readdirSync(".").join(", "));
fs.rmSync("node_modules", { recursive: true, force: true });
fs.rmSync("package-lock.json", { force: true });
fs.writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
JSON.parse(fs.readFileSync("package.json", "utf8"));
console.log("package_json_rewritten=true");
console.log("server_js_exists=", fs.existsSync("server.js"));
console.log("scanner_entry_exists=", fs.existsSync("scripts/start-scanner.js"));
console.log("=== VIDIPAY SCANNER BUILD FIX END ===");
