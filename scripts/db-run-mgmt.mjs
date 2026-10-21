#!/usr/bin/env node
/**
 * Sherivs — run a SQL verification/query file via the Supabase Management API.
 *
 * Usage:
 *   SHERIVS_DATABASE_TARGET=staging SHERIVS_PROJECT_REF=<ref> \
 *     SUPABASE_ACCESS_TOKEN="sbp_..." node scripts/db-run-mgmt.mjs <sql> [project-ref]
 *
 * Requires an explicit target and project ref. Production is not the default.
 * Reads the access token from the environment ONLY. Executes the file through
 * POST /v1/projects/{ref}/database/query and prints the response.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireManagementTarget } from "./lib/sherivs-db-target.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/db-run-mgmt.mjs <path-to-sql-file> [project-ref]");
  process.exit(2);
}
const { projectRef } = requireManagementTarget(process.env, process.argv[3]);
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN is required.");
  process.exit(2);
}

const query = readFileSync(join(ROOT, target), "utf8")
  // Strip psql-only meta lines (e.g. `\set ON_ERROR_STOP on`) — the SQL API
  // rejects backslash commands, and psql variables are not used by the checks.
  .split(/\r?\n/)
  .filter((line) => !line.trim().startsWith("\\"))
  .join("\n");
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query }),
});
const text = await res.text();
if (!res.ok) {
  console.error(`FAIL ${target} [${res.status}] ${text.slice(0, 1000)}`);
  process.exit(1);
}
console.log(`OK    ${target}`);
if (text && text !== "[]") console.log(text.slice(0, 8000));
