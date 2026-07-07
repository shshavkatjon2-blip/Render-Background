process.env.WORKER_MODE = "scanner";
process.env.PAYMENT_SCANNER_ENABLED = process.env.PAYMENT_SCANNER_ENABLED || "true";

const fs = require("fs");
const path = require("path");

const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TONAPI_KEY",
  "TONAPI_BASE_URL"
];

function hasRealValue(name) {
  const raw = String(process.env[name] || "").trim();
  if (!raw) return false;
  if (/^(PASTE|CHANGE|TODO|YOUR_|placeholder)/i.test(raw)) return false;
  return true;
}

const missing = REQUIRED.filter((name) => !hasRealValue(name));
const shardCount = Math.max(1, Number(process.env.PAYMENT_SCANNER_SHARD_COUNT || 1));
const shardIndex = Number(process.env.PAYMENT_SCANNER_SHARD_INDEX || 0);
const localShardSpan = Math.max(1, Math.floor(Number(process.env.PAYMENT_SCANNER_LOCAL_SHARD_SPAN || process.env.PAYMENT_SCANNER_VIRTUAL_SHARDS_PER_WORKER || 1)));
const shardGroupIndex = Math.max(0, Math.floor(Number(process.env.PAYMENT_SCANNER_SHARD_GROUP_INDEX ?? process.env.PAYMENT_SCANNER_SHARD_INDEX ?? 0)));

if (missing.length) {
  console.error("[scanner] Cannot start VidiPay payment scanner.");
  console.error(`[scanner] Missing required Render env: ${missing.join(", ")}`);
  console.error("[scanner] Required service type: Background Worker");
  console.error("[scanner] Required start command: npm run start:scanner");
  process.exit(1);
}

if (!Number.isInteger(shardCount) || !Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount) {
  console.error("[scanner] Invalid shard env.");
  console.error("[scanner] PAYMENT_SCANNER_SHARD_INDEX must be between 0 and PAYMENT_SCANNER_SHARD_COUNT - 1");
  process.exit(1);
}

if (!Number.isInteger(localShardSpan) || localShardSpan < 1) {
  console.error("[scanner] Invalid logical shard env.");
  console.error("[scanner] PAYMENT_SCANNER_LOCAL_SHARD_SPAN must be a positive integer");
  process.exit(1);
}

if (localShardSpan > 1 && shardGroupIndex * localShardSpan >= shardCount) {
  console.error("[scanner] Invalid logical shard group env.");
  console.error("[scanner] PAYMENT_SCANNER_SHARD_GROUP_INDEX * PAYMENT_SCANNER_LOCAL_SHARD_SPAN must be lower than PAYMENT_SCANNER_SHARD_COUNT");
  process.exit(1);
}

console.log("[scanner] Starting VidiPay payment scanner worker");
console.log(`[scanner] Shard ${shardIndex + 1}/${shardCount}`);
if (localShardSpan > 1) {
  const firstShard = shardGroupIndex * localShardSpan;
  const lastShard = Math.min(shardCount - 1, firstShard + localShardSpan - 1);
  console.log(`[scanner] Logical shard fan-out ${firstShard}-${lastShard}/${shardCount} span=${localShardSpan} group=${shardGroupIndex}`);
}
console.log("[scanner] Root start file active: start-scanner.js");
console.log("[scanner] Expected heartbeat endpoint: /scanner/healthz -> status=ok");

const candidates = [
  path.join(__dirname, "server.js"),
  path.join(__dirname, "..", "server.js")
];
const serverPath = candidates.find((candidate) => fs.existsSync(candidate));

if (!serverPath) {
  console.error("[scanner] Cannot find server.js next to start-scanner.js or one folder above.");
  console.error(`[scanner] checked=${candidates.join(", ")}`);
  process.exit(1);
}

require(serverPath);
