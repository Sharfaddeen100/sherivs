#!/usr/bin/env node
/**
 * Disposable-only execution harness CLI (pre-execution).
 *
 * Default --operation=inspect. Does not connect. Does not print secrets
 * or connection strings. Apply operations are refused:
 * DISPOSABLE_LIVE_EXECUTE_NOT_ENABLED.
 *
 * Never uses DATABASE_URL. Never imports pg.
 */
import { runDisposableExecution } from "./lib/sherivs-disposable-exec.mjs";

function parseOperation(argv) {
  for (const raw of argv) {
    const match = String(raw).match(/^--operation=(.*)$/);
    if (match) return match[1];
    if (raw === "--help" || raw === "-h") return "help";
  }
  return "inspect";
}

const operation = parseOperation(process.argv.slice(2));
if (operation === "help") {
  console.log(
    [
      "SHERIVS-001 disposable execution harness (pre-execution).",
      "Does not connect. Does not use DATABASE_URL. Does not execute SQL.",
      "",
      "  --operation=inspect                  hash pinned proposed SQL; qualify (default)",
      "  --operation=apply-proposed-freeze    refused until live execute is enabled",
      "  --operation=apply-proposed-rollback  refused until live execute is enabled",
    ].join("\n"),
  );
  process.exit(0);
}

const result = await runDisposableExecution(process.env, { operation });
console.log(JSON.stringify(result, null, 2));

if (result.operation === "inspect") {
  const shaOk = Array.isArray(result.artifacts) &&
    result.artifacts.length === 2 &&
    result.artifacts.every((item) => item.shaMatches);
  process.exit(shaOk ? 0 : 2);
}

process.exit(2);
