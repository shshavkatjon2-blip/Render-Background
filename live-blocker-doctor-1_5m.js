const DEFAULT_BASE_URL = "https://vidipay-backend.onrender.com";
const { execFileSync } = require("child_process");

function arg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : (process.env[name.toUpperCase()] || fallback);
}

function normalizeBaseUrl(raw) {
  const value = String(raw || DEFAULT_BASE_URL).replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(value)) throw new Error("base URL must start with http:// or https://");
  return value;
}

function get(obj, path, fallback = undefined) {
  return path.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj) ?? fallback;
}

async function fetchJson(baseUrl, path) {
  const url = `${baseUrl}${path}`;
  const started = Date.now();
  let status = 200;
  let text = "";
  let lastError = null;
  for (const bin of ["curl.exe", "curl"]) {
    try {
      text = execFileSync(bin, ["-s", "--max-time", "25", url], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      });
      break;
    } catch (err) {
      lastError = err;
      status = err.status || 1;
    }
  }
  if (!text) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      status = res.status;
      text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      throw new Error(`${path} request failed: ${(lastError && lastError.message) || err.message}`);
    }
  }
  if (!text.trim()) throw new Error(`${path} returned an empty response`);
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (err) {
    throw new Error(`${path} returned non-JSON: ${text.slice(0, 160)}`);
  }
  return { path, ok: true, status, ms: Date.now() - started, body };
}

function add(checks, group, name, ok, detail = "", critical = true) {
  checks.push({ group, name, ok: Boolean(ok), detail: String(detail ?? ""), critical });
}

async function main() {
  const baseUrl = normalizeBaseUrl(arg("base-url", DEFAULT_BASE_URL));
  const paths = [
    "/healthz",
    "/ops/final-gate",
    "/ops/scanner-shards",
    "/ops/wallet-capacity",
    "/ops/ton-signer"
  ];
  const responses = {};
  for (const path of paths) responses[path] = await fetchJson(baseUrl, path);

  const health = responses["/healthz"].body || {};
  const gate = responses["/ops/final-gate"].body || {};
  const scanner = responses["/ops/scanner-shards"].body || {};
  const wallet = responses["/ops/wallet-capacity"].body || {};
  const signer = responses["/ops/ton-signer"].body || {};

  const checks = [];
  for (const path of paths) {
    add(checks, "http", `${path} http_ok`, responses[path].ok, `status=${responses[path].status} ms=${responses[path].ms}`);
    add(checks, "http", `${path} fast_under_3000ms`, responses[path].ms < 3000, `ms=${responses[path].ms}`, false);
  }

  add(checks, "api", "health_status_ok", health.status === "ok", health.status);
  add(checks, "api", "worker_mode_api", health.worker_mode === "api", health.worker_mode);
  add(checks, "api", "version_present", Boolean(health.version), health.version);
  add(checks, "api", "booted_at_present", Boolean(health.booted_at), health.booted_at);
  add(checks, "api", "uptime_positive", Number(health.uptime_seconds || 0) > 0, `uptime=${health.uptime_seconds}`);

  add(checks, "redis", "redis_ready", get(gate, "redis.ok") === true, get(gate, "redis.message", ""));
  add(checks, "redis", "redis_deep_ready", get(gate, "redis_deep.ok") === true, "ping set/get lock");
  add(checks, "contract", "backend_version_contract_ok", get(gate, "contract.checks", []).some((c) => c.name === "backend_version" && c.ok), "");
  add(checks, "contract", "api_scanner_disabled", get(gate, "contract.checks", []).some((c) => c.name === "api_scanner_disabled" && c.ok), "");
  add(checks, "contract", "payment_range_ok", get(gate, "contract.checks", []).some((c) => c.name === "payment_range" && c.ok), "");
  add(checks, "contract", "backlog_audit_ok", get(gate, "backlog.ok") === true, "");
  add(checks, "contract", "scale_contract_not_blocked", get(gate, "contract.status") !== "blocked", get(gate, "contract.status", ""));

  const scannerBody = scanner.scanner || {};
  const shards = scanner.shards || {};
  const latestRows = Array.isArray(shards.latest_rows) ? shards.latest_rows : [];
  const workerIds = new Set(latestRows.map((row) => row.worker_id).filter(Boolean));
  const shardIndexes = latestRows.map((row) => Number(row.shard_index)).filter(Number.isFinite);
  add(checks, "scanner", "heartbeat_table_available", scannerBody.heartbeat_available === true, "");
  add(checks, "scanner", "scanner_not_stale", scannerBody.heartbeat_stale === false, `latest=${scannerBody.latest_seen_at}`);
  add(checks, "scanner", "workers_alive_min_4", Number(scannerBody.scanner_workers_alive || 0) >= 4, `alive=${scannerBody.scanner_workers_alive}`);
  add(checks, "scanner", "active_shards_4", Number(shards.active_shards || 0) >= 4, `active=${shards.active_shards}`);
  add(checks, "scanner", "expected_shard_count_4", Number(shards.expected_shard_count || 0) === 4, `expected=${shards.expected_shard_count}`);
  add(checks, "scanner", "duplicate_shards_zero", (shards.duplicate_shards || []).length === 0, JSON.stringify(shards.duplicate_shards || []));
  add(checks, "scanner", "missing_shards_zero", (shards.missing_shard_sample || []).length === 0, JSON.stringify(shards.missing_shard_sample || []));
  add(checks, "scanner", "workers_seen_min_4", Number(scannerBody.scanner_workers_seen || 0) >= 4, `seen=${scannerBody.scanner_workers_seen}`, false);
  add(checks, "scanner", "latest_rows_unique_workers", workerIds.size === latestRows.length, `rows=${latestRows.length} unique=${workerIds.size}`, false);
  add(checks, "scanner", "latest_rows_valid_shards", shardIndexes.every((idx) => idx >= 0 && idx < 4), `indexes=${shardIndexes.join(",")}`, false);

  const capacity = wallet.wallet_capacity || {};
  const counts = capacity.counts || {};
  const available = Number(get(counts, "available_wallets.count", 0));
  const total = Number(get(counts, "total_wallets.count", 0));
  const assigned = Number(get(counts, "assigned_wallets.count", 0));
  add(checks, "wallet", "wallet_endpoint_ok", wallet.status !== "error", wallet.status);
  add(checks, "wallet", "wallet_count_mode_readable", Boolean(capacity.count_mode), capacity.count_mode);
  add(checks, "wallet", "total_wallets_readable", total >= 0, `total=${total}`);
  add(checks, "wallet", "active_wallets_readable", Number(get(counts, "active_wallets.count", 0)) >= 0, `active=${get(counts, "active_wallets.count", 0)}`);
  add(checks, "wallet", "available_wallets_readable", available >= 0, `available=${available}`);
  add(checks, "wallet", "assigned_wallets_readable", assigned >= 0, `assigned=${assigned}`);
  add(checks, "wallet", "wallet_capacity_1_5m", available >= 1500000, `available=${available}`);
  add(checks, "wallet", "wallet_gap_closed", Number(capacity.capacity_gap || -1) >= 0, `gap=${capacity.capacity_gap}`);
  add(checks, "wallet", "wallet_ratio_full", Number(capacity.available_ratio_to_target || 0) >= 1, `ratio=${capacity.available_ratio_to_target}`);

  const ton = signer.ton_signer || {};
  const signerInfo = ton.signer || {};
  const remote = ton.remote_signer || {};
  const rpc = ton.rpc || {};
  add(checks, "signer", "auto_payout_enabled", ton.auto_payout_enabled === true, "");
  add(checks, "signer", "signer_enabled", ton.signer_enabled === true, "");
  add(checks, "signer", "signer_ready", ton.ok === true, `ok=${ton.ok}`);
  add(checks, "signer", "signer_mode_remote", signerInfo.signer_mode === "remote", `mode=${signerInfo.signer_mode}`);
  add(checks, "signer", "remote_signer_configured", remote.configured === true || signerInfo.remote_signer_configured === true, "");
  add(checks, "signer", "remote_signer_ok", remote.ok === true, JSON.stringify(remote).slice(0, 180));
  add(checks, "signer", "rpc_configured", rpc.configured === true, rpc.endpoint);
  add(checks, "signer", "rpc_api_key_used", rpc.api_key_used === true, "");
  add(checks, "signer", "rpc_ok", rpc.ok === true, JSON.stringify(rpc).slice(0, 180));
  add(checks, "signer", "payout_amount_6_16", Number(ton.payout_amount_ton || 0) === 6.16, `amount=${ton.payout_amount_ton}`);
  add(checks, "signer", "gas_reserve_positive", Number(ton.gas_reserve_ton || 0) > 0, `gas=${ton.gas_reserve_ton}`);

  add(checks, "final", "final_gate_ready", get(gate, "gate.ready_for_1_5m_public_traffic") === true, get(gate, "gate.status", ""));
  add(checks, "final", "final_blockers_empty", (get(gate, "gate.blockers", []) || []).length === 0, JSON.stringify(get(gate, "gate.blockers", [])));
  add(checks, "final", "required_checks_all_ok", (get(gate, "gate.required", []) || []).every((item) => item.ok === true), "");
  add(checks, "final", "generated_at_present", Boolean(get(gate, "gate.generated_at")), get(gate, "gate.generated_at", ""));
  add(checks, "final", "target_users_1_5m", Number(get(gate, "gate.target_users", 0)) === 1500000, `target=${get(gate, "gate.target_users", 0)}`);

  const failedCritical = checks.filter((item) => item.critical && !item.ok);
  const failedWarnings = checks.filter((item) => !item.critical && !item.ok);
  const passed = checks.filter((item) => item.ok);

  console.log(`base_url=${baseUrl}`);
  console.log(`checks_total=${checks.length}`);
  console.log(`passed=${passed.length}`);
  console.log(`failed_critical=${failedCritical.length}`);
  console.log(`failed_warning=${failedWarnings.length}`);
  console.log("");
  for (const item of checks) {
    console.log(`${item.ok ? "OK" : (item.critical ? "FAIL" : "WARN")} [${item.group}] ${item.name} ${item.detail}`.trim());
  }

  if (failedCritical.length) {
    console.log("");
    console.log("NEXT_ACTIONS");
    const names = new Set(failedCritical.map((item) => item.name));
    if ([...names].some((name) => name.includes("scanner") || name.includes("shard") || name.includes("worker"))) {
      console.log("- Start 4 Render Background Workers with npm run start:scanner and unique shard indexes 0..3.");
    }
    if ([...names].some((name) => name.includes("wallet"))) {
      console.log("- Import/generate 1,399,999 more unused TON wallet public addresses, then rerun wallet capacity audit.");
    }
    if ([...names].some((name) => name.includes("signer") || name.includes("rpc"))) {
      console.log("- Configure TON_REMOTE_SIGNER_URL and TON_REMOTE_SIGNER_TOKEN on backend, then verify /ops/ton-signer.");
    }
    process.exit(1);
  }

  console.log("");
  console.log("LIVE_1_5M_GATE_READY");
}

main().catch((err) => {
  console.error(`doctor_failed=${err.message}`);
  process.exit(1);
});
