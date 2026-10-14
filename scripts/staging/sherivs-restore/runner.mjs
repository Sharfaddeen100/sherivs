/**
 * Staging-only restore orchestrator. Modes: manifest, offline, preflight, execute.
 * Execute never runs unless confirmation flags name staging ref + source commit.
 * This module does not open a network connection unless a live connector is injected.
 */

import { randomUUID } from "node:crypto";
import {
  LEDGER_SCHEMA,
  MODES,
  PINNED_SOURCE_COMMIT,
  SCHEMA_MIGRATIONS_TABLE,
  STAGING_PROJECT_REF,
  TX_OUTCOME,
} from "./constants.mjs";
import { createLogger, redactError } from "./redact.mjs";
import {
  loadApprovedManifest,
  resolvePinnedSource,
  verifyLoadedFiles,
} from "./source.mjs";
import { resolveStagingTarget } from "./target.mjs";
import { inspectTlsPosture, strictTlsConfig } from "./tls.mjs";
import {
  createMemoryLedger,
  evaluateLedger,
  versionOf,
} from "./ledger.mjs";
import { runOfflinePreflight, catalogNotAssumedFromPriorReport } from "./preflight.mjs";

function fail(code, detail) {
  const err = new Error(`${code}: ${detail}`);
  err.code = code;
  throw err;
}

export function assertExecuteAuthorization(flags = {}) {
  const ref = String(flags.confirmStagingRef ?? "").trim();
  const commit = String(flags.confirmSourceCommit ?? "").trim();
  const authorize = Boolean(flags.iAuthorizeStagingRestore);
  if (!authorize) {
    fail(
      "EXECUTE_AUTHORIZATION_MISSING",
      "--i-authorize-staging-restore is required for execute mode",
    );
  }
  if (ref !== STAGING_PROJECT_REF) {
    fail(
      "EXECUTE_CONFIRM_REF",
      `--confirm-staging-ref must equal ${STAGING_PROJECT_REF}`,
    );
  }
  if (commit !== PINNED_SOURCE_COMMIT) {
    fail(
      "EXECUTE_CONFIRM_COMMIT",
      `--confirm-source-commit must equal ${PINNED_SOURCE_COMMIT}`,
    );
  }
  return { ok: true, confirmStagingRef: ref, confirmSourceCommit: commit };
}

export function selectMode(argvMode) {
  const mode = String(argvMode ?? "").trim();
  if (!Object.values(MODES).includes(mode)) {
    fail(
      "MODE_REQUIRED",
      `mode must be one of ${Object.values(MODES).join(", ")}`,
    );
  }
  return mode;
}

function loadSqlMap(options) {
  if (options.sqlByFilename) return options.sqlByFilename;
  if (options.loadedFiles) {
    return Object.fromEntries(
      options.loadedFiles.map((f) => [
        f.filename,
        Buffer.isBuffer(f.bytes) ? f.bytes.toString("utf8") : String(f.bytes),
      ]),
    );
  }
  const verified = resolvePinnedSource(options);
  return Object.fromEntries(
    (verified.loaded ?? []).map((f) => [
      f.filename,
      Buffer.isBuffer(f.bytes) ? f.bytes.toString("utf8") : String(f.bytes),
    ]),
  );
}

async function applySequence({
  manifest,
  ledger,
  connector,
  sqlByFilename,
  logger,
  attemptId,
}) {
  const applied = [];
  const connections = [];
  for (const file of manifest.files) {
    const sql = sqlByFilename[file.filename];
    if (typeof sql !== "string") {
      fail("MISSING_MIGRATION", `no SQL loaded for ${file.filename}`);
    }
    logger.info("migration_start", {
      seq: file.seq,
      filename: file.filename,
      sha256: file.sha256,
      attemptId,
    });
    await ledger.recordStarted({
      seq: file.seq,
      filename: file.filename,
      content_checksum: file.sha256,
      source_commit: manifest.sourceCommit,
      manifest_id: manifest.manifestId,
      attempt_id: attemptId,
    });
    const label = `apply:${file.filename}`;
    try {
      await connector.withConnection(label, async (client) => {
        connections.push(client.id);
        await client.query("BEGIN");
        try {
          await client.query(sql);
          await client.query(
            `INSERT INTO ${LEDGER_SCHEMA}.${SCHEMA_MIGRATIONS_TABLE}(version)
             VALUES ($1)
             ON CONFLICT (version) DO NOTHING`,
            [versionOf(file.filename)],
          );
          await ledger.markSucceededInTransaction(
            client,
            file.filename,
            attemptId,
          );
          await client.query("COMMIT");
        } catch (inner) {
          try {
            await client.query("ROLLBACK");
          } catch {
            /* connection may already be aborted */
          }
          throw inner;
        }
      });
      applied.push({ seq: file.seq, filename: file.filename, sha256: file.sha256 });
      logger.info("migration_ok", {
        seq: file.seq,
        filename: file.filename,
        sha256: file.sha256,
        attemptId,
      });
    } catch (err) {
      const redacted = redactError(err);
      await ledger.recordFailed(
        file.filename,
        attemptId,
        err,
        "apply",
        TX_OUTCOME.ROLLED_BACK,
      );
      logger.error("migration_fail", {
        seq: file.seq,
        filename: file.filename,
        sha256: file.sha256,
        attemptId,
        phase: "apply",
        error: redacted.message,
        succeededCount: applied.length,
      });
      return {
        ok: false,
        stopped: true,
        retried: false,
        failed: {
          seq: file.seq,
          filename: file.filename,
          sha256: file.sha256,
          phase: "apply",
          error: redacted.message,
        },
        applied,
        connections,
        succeededCount: applied.length,
      };
    }
  }
  return {
    ok: true,
    stopped: false,
    retried: false,
    applied,
    connections,
    succeededCount: applied.length,
  };
}

export async function runRestore(options = {}) {
  const logger = options.logger ?? createLogger();
  const mode = selectMode(options.mode);
  const manifest = options.manifest ?? loadApprovedManifest();
  const attemptId = options.attemptId ?? randomUUID();

  if (mode === MODES.MANIFEST) {
    const source = options.loadedFiles
      ? { ...verifyLoadedFiles(options.loadedFiles, manifest), sourceKind: "injected" }
      : resolvePinnedSource(options);
    logger.info("manifest_ok", {
      count: source.count,
      sourceCommit: source.sourceCommit,
      sourceTree: source.sourceTree,
      sourceKind: source.sourceKind,
    });
    return { ok: true, mode, source };
  }

  if (mode === MODES.OFFLINE || mode === MODES.PREFLIGHT) {
    if (mode === MODES.PREFLIGHT && options.allowLiveCatalog) {
      fail(
        "LIVE_CATALOG_NOT_RUN",
        "live catalog is implemented as a plan only in this process unless a live connector is explicitly provided; default is offline NOT_CHECKED",
      );
    }
    const preflight = runOfflinePreflight({
      ...options,
      manifest,
      mode,
    });
    logger.info("preflight_complete", {
      ok: preflight.ok,
      failed: preflight.failed,
      catalog: catalogNotAssumedFromPriorReport().catalog,
    });
    return { ok: preflight.ok, mode, preflight };
  }

  if (mode === MODES.EXECUTE) {
    assertExecuteAuthorization(options);
    if (!options.skipOfflinePreflight) {
      const preflight = runOfflinePreflight({ ...options, manifest, mode: MODES.OFFLINE });
      if (!preflight.ok) {
        return { ok: false, mode, preflight, reason: "PREFLIGHT_FAILED" };
      }
    }
    const target = resolveStagingTarget(options.env ?? {}, {
      extraAllowHosts: options.extraAllowHosts,
    });
    if (!target.liveIdentity && !options.allowFixtureTarget) {
      fail(
        "TARGET_NOT_LIVE_IDENTITY",
        "fixture/synthetic URL is not proof of live staging identity",
      );
    }
    const tls = inspectTlsPosture(
      options.env?.STAGING_DATABASE_URL || options.env?.SHERIVS_RLS_STAGING_URL,
      options.env ?? {},
    );
    if (!tls.ok) fail(tls.code, tls.detail);

    const ledger = options.ledger ?? createMemoryLedger(options.ledgerRows ?? []);
    if (typeof ledger.bootstrap === "function") {
      await ledger.bootstrap();
    }
    const rows = await ledger.load();
    const decision = evaluateLedger(rows, manifest);
    if (decision.action === "already_complete") {
      logger.info("already_complete", { succeededMatching: decision.succeededMatching });
      return { ok: true, mode, alreadyComplete: true, decision, retried: false };
    }
    if (decision.action !== "fresh_apply") {
      logger.error("ledger_blocks_execute", { reason: decision.reason });
      return { ok: false, mode, decision, retried: false };
    }

    const connector = options.connector;
    if (!connector) {
      fail(
        "CONNECTOR_REQUIRED",
        "execute mode requires an injected connector; refusing implicit network",
      );
    }
    if (connector.allowNetwork && !options.allowNetwork) {
      fail(
        "NETWORK_DISABLED",
        "live network is not enabled for this process",
      );
    }

    const sqlByFilename = loadSqlMap(options);

    const result = await applySequence({
      manifest,
      ledger,
      connector,
      sqlByFilename,
      logger,
      attemptId,
    });
    return {
      ok: result.ok,
      mode,
      attemptId,
      target: { hostname: target.hostname, projectRef: target.projectRef, kind: target.kind },
      retried: false,
      ...result,
    };
  }

  fail("MODE_REQUIRED", "unhandled mode");
}

export { strictTlsConfig, loadSqlMap };
