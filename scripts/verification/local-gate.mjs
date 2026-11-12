#!/usr/bin/env node
// Local merge gate for periods when hosted CI is unavailable (e.g. Actions billing lock).
// Mirrors the required checks in .github/governance/ruleset-master.json as far as a
// workstation can. Honest outcomes: a step that cannot run is NOT_RUN, never PASS.
// Exit 0 = every step PASS; 1 = a step FAILED; 3 = nothing failed but gate INCOMPLETE.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const have = (cmd) => spawnSync(cmd, ["--version"], { stdio: "ignore" }).status === 0;
const sh = (command) => spawnSync(command, { shell: true, stdio: "inherit" }).status === 0;
const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "origin/master";

const steps = [
  { check: "Typecheck", run: () => sh("npx tsc --noEmit") },
  { check: "Unit tests", run: () => sh("npm run test:unit") },
  {
    check: "Registry, drift, neutrality, secrets guards + build",
    run: () =>
      sh(
        "npm run verify:registry && npm run verify:drift && npm run verify:neutrality && npm run verify:secrets && npm run verify:home-bundle:build",
      ),
  },
  {
    check: "Lint (changed files)",
    run: () =>
      sh(
        `files=$(git diff --name-only --diff-filter=ACMR "${base}...HEAD" -- '*.ts' '*.tsx' '*.js' '*.mjs' | grep -v '^mobile/' || true); [ -z "$files" ] || echo "$files" | xargs npx eslint --no-warn-ignored`,
      ),
  },
  {
    check: "Secret scan (gitleaks)",
    run: () =>
      have("gitleaks")
        ? sh(`gitleaks detect --no-banner --redact --log-opts="${base}..HEAD"`)
        : "NOT_RUN: gitleaks not installed",
  },
  {
    check: "Mobile typecheck (Expo)",
    run: () =>
      have("node") &&
      sh("npm --prefix mobile ci --no-audit --fund=false && npm --prefix mobile run typecheck"),
  },
  {
    check: "Migration dry-run + sim smoke",
    run: () => "NOT_RUN: needs Docker/Postgres 17 (tools/sim-lab/up.sh)",
  },
];

const results = steps.map((s) => {
  console.log(`\n=== ${s.check} ===`);
  const t = Date.now();
  const out = s.run();
  const status = out === true ? "PASS" : out === false ? "FAIL" : "NOT_RUN";
  return {
    check: s.check,
    status,
    detail: typeof out === "string" ? out : undefined,
    seconds: Math.round((Date.now() - t) / 1000),
  };
});

const head = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
const verdict = results.some((r) => r.status === "FAIL")
  ? "FAIL"
  : results.some((r) => r.status === "NOT_RUN")
    ? "INCOMPLETE"
    : "PASS";
mkdirSync("artifacts", { recursive: true });
writeFileSync(
  "artifacts/local-gate.json",
  JSON.stringify({ head, base, verdict, results }, null, 2),
);
console.log(`\nLOCAL GATE ${verdict} @ ${head.slice(0, 12)}`);
for (const r of results)
  console.log(`  ${r.status.padEnd(7)} ${r.check}${r.detail ? ` (${r.detail})` : ""}`);
process.exit(verdict === "PASS" ? 0 : verdict === "FAIL" ? 1 : 3);
