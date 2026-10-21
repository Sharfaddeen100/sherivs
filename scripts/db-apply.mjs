#!/usr/bin/env node
/**
 * CoreGrid — apply database migrations in order via node-postgres.
 *
 * Usage:
 *   SHERIVS_DATABASE_TARGET=development DATABASE_URL="postgresql://..." \
 *     node scripts/db-apply.mjs
 *
 * Requires an explicit SHERIVS_DATABASE_TARGET. Unscoped DATABASE_URL is
 * accepted only for development and never as a staging/production fallback.
 * Applies every file in database/supabase/migrations/ in filename order.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { pgSslConfig } from "./lib/pg-ssl.mjs";
import { requirePostgresTarget } from "./lib/sherivs-db-target.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MIGRATIONS_DIR = join(ROOT, "database", "supabase", "migrations");

const resolved = requirePostgresTarget();
const dbUrl = resolved.connectionString;

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();
if (files.length === 0) {
  console.error(`No .sql migrations found in ${MIGRATIONS_DIR}`);
  process.exit(2);
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: pgSslConfig(dbUrl),
});
await client.connect();

let failed = false;
for (const file of files) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  try {
    await client.query(sql);
    console.log(`OK    ${file}`);
  } catch (err) {
    failed = true;
    console.error(`FAIL  ${file}`);
    console.error(err instanceof Error ? err.message : String(err));
    break;
  }
}

await client.end();
if (failed) {
  console.error(`Aborted after ${files.length} migrations (see FAIL above).`);
  process.exit(1);
}
console.log(`Applied ${files.length} migrations in order.`);
