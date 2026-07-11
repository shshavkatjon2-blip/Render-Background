const fs = require("fs");

function readEnv(filePath) {
  const env = {};
  if (!filePath || !fs.existsSync(filePath)) return env;
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[line.slice(0, eq).trim()] = value;
  }
  return env;
}

function arg(name, fallback = "") {
  const found = process.argv.find((item) => item.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
}

function boolArg(name) {
  return process.argv.includes(`--${name}`);
}

function numberArg(name, fallback) {
  const value = Number(arg(name, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function backendUrlFrom(env, fallback = "https://vidipay-backend-1.onrender.com") {
  return String(arg("backend", env.PUBLIC_BACKEND_URL || fallback)).replace(/\/$/, "");
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

async function fetchJson(url, options = {}) {
  const timeoutMs = options.timeoutMs || 25000;
  const controller = new AbortController();
  const startedAt = Date.now();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body,
      signal: controller.signal
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_) {
      json = { raw: text.slice(0, 1000) };
    }
    return { ok: response.ok, status: response.status, ms: Date.now() - startedAt, json, text };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - startedAt,
      json: { error: error && error.name === "AbortError" ? "timeout" : String(error && error.message ? error.message : error) },
      text: ""
    };
  } finally {
    clearTimeout(timeout);
  }
}

function compactEndpointResult(name, result) {
  return {
    name,
    ok: result.ok,
    status: result.status,
    ms: result.ms,
    status_field: result.json && result.json.status ? result.json.status : null
  };
}

module.exports = {
  arg,
  boolArg,
  numberArg,
  readEnv,
  backendUrlFrom,
  percentile,
  fetchJson,
  compactEndpointResult
};
