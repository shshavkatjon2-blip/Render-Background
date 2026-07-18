const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SHARD_COUNT = 128;
const OUTPUT_FILE = path.join(ROOT, "render.128-workers.yaml");
const CHECK_ONLY = process.argv.includes("--check");

function serviceYaml(index) {
  return `  - type: worker
    name: vidipay-payment-scanner-128-${index}
    runtime: node
    plan: standard
    buildCommand: node render-build-fix.cjs && npm install --omit=dev --no-audit --no-fund
    startCommand: npm run start:scanner
    envVars:
      - key: NODE_ENV
        value: production
      - key: WORKER_MODE
        value: scanner
      - key: PAYMENT_SCANNER_ENABLED
        value: true
      - key: PAYMENT_SCANNER_WORKER_ID
        value: scanner-128-${index}
      - key: PAYMENT_SCANNER_SHARD_COUNT
        value: ${SHARD_COUNT}
      - key: PAYMENT_SCANNER_SHARD_INDEX
        value: ${index}
      - key: PAYMENT_SCAN_INTERVAL_MS
        value: 3000
      - key: PAYMENT_SCAN_BATCH_SIZE
        value: 500
      - key: PAYMENT_SCAN_CONCURRENCY
        value: 32
      - key: PAYMENT_SCAN_JITTER_MS
        value: 2500
      - key: PAYMENT_SCAN_ORDER_DELAY_MS
        value: 10
      - key: PAYMENT_SCAN_MAX_ERRORS_PER_RUN
        value: 500
      - key: TONAPI_REQUEST_TIMEOUT_MS
        value: 12000
      - key: TONAPI_RETRY_COUNT
        value: 2
      - key: TONAPI_RETRY_BASE_MS
        value: 250
      - key: TONAPI_BASE_URL
        value: https://tonapi.io
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: TONAPI_KEY
        sync: false`;
}

function blueprintYaml() {
  return [
    "# VidiPay scanner worker blueprint (128 shards).",
    "# Prepared for the 64-to-128 scanner rollout after the 10/10 canary gate is clean.",
    "# Keep production on render.64-workers.yaml until the rollout window; do not mix 64 and 128 workers.",
    "services:",
    ...Array.from({ length: SHARD_COUNT }, (_, index) => serviceYaml(index))
  ].join("\n") + "\n";
}

function collectNumbers(text, regex) {
  const numbers = [];
  for (const match of text.matchAll(regex)) numbers.push(Number(match[1]));
  return numbers;
}

function validateExactRange(errors, label, values) {
  const seen = new Set(values);
  if (values.length !== SHARD_COUNT) {
    errors.push(`${label} expected ${SHARD_COUNT} entries, got ${values.length}`);
  }
  if (seen.size !== values.length) {
    errors.push(`${label} contains duplicate values`);
  }
  for (let index = 0; index < SHARD_COUNT; index += 1) {
    if (!seen.has(index)) errors.push(`${label} missing ${index}`);
  }
  for (const value of values) {
    if (!Number.isInteger(value) || value < 0 || value >= SHARD_COUNT) {
      errors.push(`${label} has out-of-range value ${value}`);
    }
  }
}

function validate(text) {
  const errors = [];
  const serviceCount = (text.match(/^\s+- type: worker$/gm) || []).length;
  const names = collectNumbers(text, /^\s+name: vidipay-payment-scanner-128-(\d+)$/gm);
  const workerIds = collectNumbers(text, /^\s+value: scanner-128-(\d+)$/gm);
  const shardIndexes = collectNumbers(text, /- key: PAYMENT_SCANNER_SHARD_INDEX\r?\n\s+value: (\d+)/g);
  const shardCountEntries = (text.match(/- key: PAYMENT_SCANNER_SHARD_COUNT\r?\n\s+value: 128/g) || []).length;

  if (serviceCount !== SHARD_COUNT) {
    errors.push(`worker service count expected ${SHARD_COUNT}, got ${serviceCount}`);
  }
  validateExactRange(errors, "service names", names);
  validateExactRange(errors, "worker ids", workerIds);
  validateExactRange(errors, "shard indexes", shardIndexes);
  if (shardCountEntries !== SHARD_COUNT) {
    errors.push(`PAYMENT_SCANNER_SHARD_COUNT value 128 expected ${SHARD_COUNT} entries, got ${shardCountEntries}`);
  }
  if (text.includes("scanner-64-") || text.includes("scanner-256-")) {
    errors.push("blueprint contains old scanner-64 or scanner-256 identifiers");
  }
  if (text.includes("vidipay-payment-scanner-64-") || text.includes("vidipay-payment-scanner-256-")) {
    errors.push("blueprint contains old 64/256 service names");
  }
  if (text.includes("npm ci")) {
    errors.push("blueprint contains npm ci instead of safe npm install command");
  }
  if (text.includes("value: 512      - key") || text.includes("value: 60000      - key")) {
    errors.push("blueprint contains glued YAML env rows");
  }
  if (!text.includes("sync: false")) {
    errors.push("blueprint must keep secret env vars unsynced");
  }
  return errors;
}

function main() {
  if (!CHECK_ONLY) {
    fs.writeFileSync(OUTPUT_FILE, blueprintYaml(), "utf8");
  }

  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`missing ${OUTPUT_FILE}`);
    process.exit(1);
  }

  const text = fs.readFileSync(OUTPUT_FILE, "utf8");
  const errors = validate(text);
  if (errors.length) {
    console.error("render.128-workers.yaml check failed");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`${CHECK_ONLY ? "checked" : "wrote"} ${path.relative(ROOT, OUTPUT_FILE).replace(/\\/g, "/")}`);
  console.log(`workers=${SHARD_COUNT}`);
  console.log("shard_indexes=0..127");
  console.log("duplicate_shards=none_in_blueprint");
}

main();
