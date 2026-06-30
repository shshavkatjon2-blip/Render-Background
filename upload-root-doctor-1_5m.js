const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || process.cwd());

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function fail(errors, message) {
  errors.push(message);
}

function main() {
  const errors = [];
  const warnings = [];

  for (const rel of ["server.js", "package.json", "render-build-fix.cjs", "render.yaml"]) {
    if (!exists(rel)) fail(errors, `Missing required root file: ${rel}`);
  }
  if (!exists("scripts/start-scanner.js")) fail(errors, "Missing scripts/start-scanner.js; scanner workers cannot start.");
  if (exists("Dockerfile")) fail(errors, "Dockerfile exists in backend repo root; delete it to force Render Node runtime.");
  if (exists(".dockerignore")) warnings.push(".dockerignore exists; backend Node runtime does not need it.");
  if (exists("package-lock.json")) fail(errors, "package-lock.json exists; delete old lockfile before Render deploy.");
  if (exists("node_modules")) fail(errors, "node_modules exists; never upload node_modules to GitHub.");
  if (exists(".env") || exists(".env.local")) fail(errors, "Secret .env file exists in repo root; remove it from upload.");

  const pkgPath = path.join(root, "package.json");
  if (exists("package.json")) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const deps = pkg.dependencies || {};
    for (const name of ["@supabase/supabase-js", "@ton/ton", "@ton/core", "@ton/crypto", "jssha", "redis"]) {
      if (!deps[name]) fail(errors, `package.json missing dependency: ${name}`);
    }
    if (!pkg.scripts?.start) fail(errors, "package.json missing scripts.start");
    if (!pkg.scripts?.["start:scanner"]) fail(errors, "package.json missing scripts.start:scanner");
  }

  console.log(`upload_root=${root}`);
  for (const warning of warnings) console.log(`WARN ${warning}`);

  if (errors.length) {
    console.log("UPLOAD_ROOT_CHECK_FAILED");
    for (const error of errors) console.log(`FAIL ${error}`);
    process.exit(1);
  }

  console.log("UPLOAD_ROOT_CHECK_OK");
}

main();
