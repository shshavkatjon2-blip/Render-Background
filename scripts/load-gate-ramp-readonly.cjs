const fs = require("fs");
const path = require("path");
const {
  arg,
  boolArg,
  numberArg,
  readEnv,
  backendUrlFrom,
  fetchJson,
  percentile
} = require("./common.cjs");

const env = readEnv(arg("env", "C:/Users/MYCOM Official Win/Desktop/vidipay-backend/.env"));
const backend = backendUrlFrom(env);
const profile = arg("profile", "10k");
const profiles = {
  smoke: "120x8,240x12,360x16",
  "10k": "240x12,600x24,1200x48",
  "100k": "300x16,900x32,2400x64"
};
const phasesArg = arg("phases", profiles[profile] || profiles["10k"]);
const timeoutMs = numberArg("timeout-ms", 25000);
const maxP95Ms = numberArg("max-p95-ms", 3500);
const maxFailureCount = numberArg("max-failures", 0);
const pauseMs = numberArg("pause-ms", 5000);
const reportDir = arg("report-dir", path.join(__dirname, "..", "reports"));
const includeDeepGateEndpoints = boolArg("include-deep-gates");

const baseEndpoints = [
  "/healthz",
  "/readyz",
  "/settings",
  "/ops/final-gate",
  "/ops/scanner-shards",
  "/ops/ton-signer",
  "/ops/redis-deep",
  "/ops/wallet-capacity"
];

const deepGateEndpoints = [
  "/ops/canary-wave-supervisor/summary?fresh=true",
  "/ops/canary-10-20-batch-monitor/summary?fresh=true",
  "/ops/rollback-command-center/summary?fresh=true",
  "/ops/load-ramp-command-center/summary?fresh=true",
  "/ops/load-10k-gate/summary?fresh=true",
  "/ops/load-100k-gate/summary?fresh=true"
];

const endpoints = includeDeepGateEndpoints ? [...baseEndpoints, ...deepGateEndpoints] : baseEndpoints;

function safeName(value) {
  return String(value).replace(/[^a-z0-9_.-]+/gi, "_").replace(/^_+|_+$/g, "");
}

function parsePhases(value) {
  return String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => {
      const match = part.match(/^(\d+)x(\d+)$/i);
      if (!match) throw new Error(`Invalid phase "${part}". Use format requestsxconcurrency, e.g. 120x8.`);
      return {
        name: `phase_${index + 1}_${match[1]}x${match[2]}`,
        requests: Number(match[1]),
        concurrency: Number(match[2])
      };
    });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function worker(state, phase) {
  while (state.next < phase.requests) {
    const index = state.next;
    state.next += 1;
    const endpoint = endpoints[index % endpoints.length];
    const result = await fetchJson(`${backend}${endpoint}`, { timeoutMs });
    state.results.push({
      endpoint,
      ok: result.ok,
      status: result.status,
      ms: result.ms,
      status_field: result.json && result.json.status ? result.json.status : null
    });
  }
}

function summarizeResults(results) {
  const latencies = results.map((item) => item.ms);
  const failures = results.filter((item) => !item.ok);
  const byEndpoint = {};
  for (const item of results) {
    if (!byEndpoint[item.endpoint]) byEndpoint[item.endpoint] = { count: 0, failures: 0, latencies: [] };
    byEndpoint[item.endpoint].count += 1;
    if (!item.ok) byEndpoint[item.endpoint].failures += 1;
    byEndpoint[item.endpoint].latencies.push(item.ms);
  }
  for (const item of Object.values(byEndpoint)) {
    item.p50_ms = percentile(item.latencies, 50);
    item.p95_ms = percentile(item.latencies, 95);
    item.p99_ms = percentile(item.latencies, 99);
    delete item.latencies;
  }
  return {
    failure_count: failures.length,
    failures: failures.slice(0, 20),
    latency: {
      min_ms: latencies.length ? Math.min(...latencies) : null,
      p50_ms: percentile(latencies, 50),
      p95_ms: percentile(latencies, 95),
      p99_ms: percentile(latencies, 99),
      max_ms: latencies.length ? Math.max(...latencies) : null
    },
    by_endpoint: byEndpoint
  };
}

async function gateSnapshot() {
  const [gate, shards, signer, rollback, loadRamp] = await Promise.all([
    fetchJson(`${backend}/ops/final-gate`, { timeoutMs }),
    fetchJson(`${backend}/ops/scanner-shards`, { timeoutMs }),
    fetchJson(`${backend}/ops/ton-signer`, { timeoutMs }),
    fetchJson(`${backend}/ops/rollback-command-center/summary?fresh=true`, { timeoutMs }),
    fetchJson(`${backend}/ops/load-ramp-command-center/summary?fresh=true`, { timeoutMs })
  ]);
  const gateBody = gate.json || {};
  const finalGate = gateBody.gate || gateBody || {};
  const shardBody = shards.json || {};
  const shardData = shardBody.shards || {};
  const signerBody = signer.json || {};
  const signerData = signerBody.ton_signer || signerBody || {};
  const rollbackBody = rollback.json || {};
  const loadRampBody = loadRamp.json || {};
  const scannerWorkersAlive = Number(shardData.scanner_workers_alive || shardBody.scanner?.scanner_workers_alive || 0);
  const activeShards = Number(shardData.active_shards || 0);
  const duplicateShards = shardData.duplicate_shards || [];
  return {
    ok:
      gate.ok &&
      shards.ok &&
      signer.ok &&
      rollback.ok &&
      loadRamp.ok &&
      finalGate.status === "ready" &&
      finalGate.ready_for_1_5m_public_traffic === true &&
      scannerWorkersAlive >= 64 &&
      activeShards >= 64 &&
      !duplicateShards.length &&
      (signerData.ok === true || signerData.signer_ready === true || signerData.remote_signer?.ok === true) &&
      rollbackBody.stop_now !== true &&
      loadRampBody.stop_now !== true,
    final_gate: finalGate.status || null,
    ready_for_1_5m_public_traffic: finalGate.ready_for_1_5m_public_traffic === true,
    scanner_workers_alive: scannerWorkersAlive,
    active_shards: activeShards,
    duplicate_shards: duplicateShards,
    signer_ok: signerData.ok === true || signerData.signer_ready === true || signerData.remote_signer?.ok === true,
    rollback_status: rollbackBody.status || null,
    rollback_stop_now: rollbackBody.stop_now === true,
    load_ramp_status: loadRampBody.status || null,
    load_ramp_stop_now: loadRampBody.stop_now === true
  };
}

async function runPhase(phase) {
  const before = await gateSnapshot();
  const startedAt = Date.now();
  const state = { next: 0, results: [] };
  await Promise.all(Array.from({ length: phase.concurrency }, () => worker(state, phase)));
  const elapsedMs = Date.now() - startedAt;
  const after = await gateSnapshot();
  const summary = summarizeResults(state.results);
  const ok =
    before.ok &&
    after.ok &&
    summary.failure_count <= maxFailureCount &&
    summary.latency.p95_ms !== null &&
    summary.latency.p95_ms <= maxP95Ms;
  return {
    ...phase,
    ok,
    read_only: true,
    started_at: new Date(startedAt).toISOString(),
    elapsed_ms: elapsedMs,
    throughput_rps: Number((phase.requests / (elapsedMs / 1000)).toFixed(2)),
    before,
    after,
    ...summary
  };
}

async function main() {
  const phases = parsePhases(phasesArg);
  fs.mkdirSync(reportDir, { recursive: true });
  const phaseReports = [];
  for (let index = 0; index < phases.length; index += 1) {
    const phaseReport = await runPhase(phases[index]);
    phaseReports.push(phaseReport);
    console.log(JSON.stringify({
      phase: phaseReport.name,
      ok: phaseReport.ok,
      requests: phaseReport.requests,
      concurrency: phaseReport.concurrency,
      failure_count: phaseReport.failure_count,
      p95_ms: phaseReport.latency.p95_ms,
      throughput_rps: phaseReport.throughput_rps,
      final_gate_after: phaseReport.after.final_gate,
      scanner_workers_alive_after: phaseReport.after.scanner_workers_alive
    }));
    if (index + 1 < phases.length) await sleep(pauseMs);
  }

  const blockers = [];
  for (const phase of phaseReports) {
    if (!phase.before.ok) blockers.push(`${phase.name}_pre_gate_not_ready`);
    if (!phase.after.ok) blockers.push(`${phase.name}_post_gate_not_ready`);
    if (phase.failure_count > maxFailureCount) blockers.push(`${phase.name}_failures_${phase.failure_count}`);
    if (phase.latency.p95_ms === null || phase.latency.p95_ms > maxP95Ms) blockers.push(`${phase.name}_p95_${phase.latency.p95_ms}_above_${maxP95Ms}`);
  }

  const report = {
    ok: blockers.length === 0,
    read_only: true,
    generated_at: new Date().toISOString(),
    backend,
    thresholds: {
      profile,
      phases: phasesArg,
      timeout_ms: timeoutMs,
      max_p95_ms: maxP95Ms,
      max_failure_count: maxFailureCount,
      pause_ms: pauseMs,
      endpoint_count: endpoints.length,
      include_deep_gate_endpoints: includeDeepGateEndpoints
    },
    blockers,
    phases: phaseReports
  };
  const reportFile = path.join(reportDir, `load-gate-ramp-readonly-${safeName(new Date().toISOString())}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(path.join(reportDir, "latest-load-gate-ramp-readonly.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({
    ok: report.ok,
    report_file: reportFile,
    blockers
  }, null, 2));
  process.exit(report.ok ? 0 : 2);
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message || String(error) }, null, 2));
  process.exit(1);
});
