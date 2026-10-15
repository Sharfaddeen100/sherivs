#!/usr/bin/env node
/**
 * Positive isolation check for a disposable PostgreSQL endpoint.
 * Does not connect. Does not print secrets or full URLs.
 *
 * Exit 0: loopback development URL, no live project refs.
 * Exit 2: not qualified. Do not open a database connection.
 */
import { qualifyDisposablePostgres } from "./lib/sherivs-disposable-pg.mjs";

const result = qualifyDisposablePostgres(process.env);
console.log(JSON.stringify(result, null, 2));
if (!result.qualified) {
  process.exit(2);
}
