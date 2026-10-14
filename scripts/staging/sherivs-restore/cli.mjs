#!/usr/bin/env node
/**
 * SHERIVS staging-only restore CLI.
 *
 * Default: refuse. Never applies migrations merely because credentials exist.
 *
 *   node scripts/staging/sherivs-restore/cli.mjs --mode=manifest
 *   node scripts/staging/sherivs-restore/cli.mjs --mode=offline
 *   node scripts/staging/sherivs-restore/cli.mjs --mode=preflight
 *
 * Execute still requires confirmation flags AND a future process that opts
 * into a live connector. This file does not construct a live pg client.
 */

import { pathToFileURL } from "node:url";
import { runRestore, assertExecuteAuthorization, selectMode } from "./runner.mjs";
import { createLogger } from "./redact.mjs";
import { MODES, PINNED_SOURCE_COMMIT, STAGING_PROJECT_REF } from "./constants.mjs";

function parseArgs(argv) {
  const args = {
    mode: null,
    confirmStagingRef: null,
    confirmSourceCommit: null,
    iAuthorizeStagingRestore: false,
    allowNetwork: false,
    allowLiveCatalog: false,
  };
  for (const raw of argv) {
    if (raw === "--i-authorize-staging-restore") {
      args.iAuthorizeStagingRestore = true;
      continue;
    }
    if (raw === "--allow-network") {
      args.allowNetwork = true;
      continue;
    }
    if (raw === "--allow-live-catalog") {
      args.allowLiveCatalog = true;
      continue;
    }
    const m = raw.match(/^--([^=]+)=(.*)$/);
    if (!m) continue;
    if (m[1] === "mode") args.mode = m[2];
    if (m[1] === "confirm-staging-ref") args.confirmStagingRef = m[2];
    if (m[1] === "confirm-source-commit") args.confirmSourceCommit = m[2];
  }
  return args;
}

export function help() {
  return [
    "SHERIVS staging-only migration runner (ACTIVE-V1).",
    "Does not use DATABASE_URL. Does not default to production.",
    "",
    "Modes:",
    "  --mode=manifest     verify pinned 71-file git source (no database)",
    "  --mode=offline      source + staging identity + TLS + ledger (no database)",
    "  --mode=preflight    same as offline; live catalog remains NOT_CHECKED unless separately enabled",
    "  --mode=execute      requires --confirm-staging-ref --confirm-source-commit --i-authorize-staging-restore",
    "                      Credentials alone never start apply. Live pg is not constructed here.",
    "",
    `Pinned commit: ${PINNED_SOURCE_COMMIT}`,
    `Pinned staging ref: ${STAGING_PROJECT_REF}`,
    "",
    "Written human authorization is still required before any live execute.",
  ].join("\n");
}

export async function main(argv = process.argv.slice(2), options = {}) {
  const logger = options.logger ?? createLogger();
  const args = parseArgs(argv);
  if (!args.mode) {
    logger.error("mode_required", { help: true });
    return { ok: false, code: "MODE_REQUIRED", help: help(), exitCode: 2 };
  }
  try {
    selectMode(args.mode);
  } catch (err) {
    return { ok: false, code: err.code, error: err.message, help: help(), exitCode: 2 };
  }

  if (args.mode === MODES.EXECUTE) {
    try {
      assertExecuteAuthorization(args);
    } catch (err) {
      return { ok: false, code: err.code, error: err.message, exitCode: 2 };
    }
    if (!options.connector) {
      return {
        ok: false,
        code: "LIVE_EXECUTE_NOT_ENABLED",
        error:
          "execute refused: this CLI does not construct a live database client. A later authorized process must inject a connector after written approval.",
        exitCode: 2,
      };
    }
  }

  if (args.mode === MODES.PREFLIGHT && args.allowLiveCatalog && !options.allowLiveConnector) {
    return {
      ok: false,
      code: "LIVE_CATALOG_NOT_ENABLED",
      error: "live catalog is not enabled in this process; catalog remains NOT_CHECKED",
      exitCode: 2,
    };
  }

  const result = await runRestore({
    mode: args.mode,
    confirmStagingRef: args.confirmStagingRef,
    confirmSourceCommit: args.confirmSourceCommit,
    iAuthorizeStagingRestore: args.iAuthorizeStagingRestore,
    allowNetwork: false,
    allowLiveCatalog: false,
    env: options.env ?? process.env,
    logger,
    connector: options.connector,
    ledger: options.ledger,
    skipOfflinePreflight: options.skipOfflinePreflight,
    sqlByFilename: options.sqlByFilename,
    loadedFiles: options.loadedFiles,
    manifest: options.manifest,
  });
  return { ...result, exitCode: result.ok ? 0 : 1 };
}

const isDirect =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirect) {
  main().then((result) => {
    if (result.help) console.error(result.help);
    process.exitCode = result.exitCode ?? 1;
  });
}
