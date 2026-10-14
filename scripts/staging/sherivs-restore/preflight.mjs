/**
 * Offline-testable preflight. Live catalog is a separate, explicit path
 * and is not invoked by default. Historical GATE4 emptiness is never
 * treated as current catalog proof.
 */

import {
  MODES,
  PINNED_SOURCE_COMMIT,
  PINNED_SOURCE_TREE,
  STAGING_PROJECT_REF,
} from "./constants.mjs";
import { inspectWorkingTree, loadApprovedManifest, resolvePinnedSource } from "./source.mjs";
import { resolveStagingTarget } from "./target.mjs";
import { inspectTlsPosture } from "./tls.mjs";
import { evaluateLedger } from "./ledger.mjs";

export const LIVE_CATALOG_SQL = `
SELECT
  current_database() AS current_database,
  inet_server_addr() AS inet_server_addr,
  current_user AS current_user,
  version() AS version,
  (SELECT extname FROM pg_extension WHERE extname = 'pgcrypto') AS pgcrypto,
  (SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp') AS uuid_ossp,
  (SELECT pubname FROM pg_publication WHERE pubname = 'supabase_realtime') AS supabase_realtime,
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r') AS public_table_count;
`.trim();

export function catalogNotAssumedFromPriorReport() {
  return {
    catalog: "NOT_CHECKED",
    emptiness: "UNKNOWN",
    note: "GATE4 emptiness is historical and is not current catalog proof",
  };
}

export function runOfflinePreflight(options = {}) {
  const checks = [];
  const manifest = options.manifest ?? loadApprovedManifest();

  try {
    const source = resolvePinnedSource({
      manifest,
      gitFn: options.gitFn,
      git: options.git,
      migrationsDir: options.migrationsDir,
      commit: options.commit ?? PINNED_SOURCE_COMMIT,
      root: options.root,
    });
    checks.push({
      name: "source_manifest",
      ok: true,
      count: source.count,
      sourceCommit: source.sourceCommit,
      sourceTree: source.sourceTree,
      sourceKind: source.sourceKind,
      working: source.working,
    });
  } catch (err) {
    checks.push({
      name: "source_manifest",
      ok: false,
      code: err.code,
      detail: err.message,
    });
  }

  if (options.commit && options.commit !== PINNED_SOURCE_COMMIT) {
    checks.push({
      name: "source_commit_pin",
      ok: false,
      code: "WRONG_SOURCE_COMMIT",
      detail: options.commit,
    });
  } else {
    checks.push({
      name: "source_commit_pin",
      ok: true,
      sourceCommit: PINNED_SOURCE_COMMIT,
    });
  }

  if (options.expectTree && options.expectTree !== PINNED_SOURCE_TREE) {
    checks.push({
      name: "source_tree_pin",
      ok: false,
      code: "WRONG_GIT_TREE",
      detail: options.expectTree,
    });
  } else {
    checks.push({
      name: "source_tree_pin",
      ok: true,
      sourceTree: PINNED_SOURCE_TREE,
    });
  }

  try {
    const target = resolveStagingTarget(options.env ?? {}, {
      extraAllowHosts: options.extraAllowHosts,
      refuseUnprefixed: true,
    });
    checks.push({
      name: "target_identity",
      ok: true,
      projectRef: target.projectRef,
      hostname: target.hostname,
      kind: target.kind,
      liveIdentity: target.liveIdentity,
      usedFallback: false,
      redactedUrl: target.redactedUrl,
    });
    const tls = inspectTlsPosture(options.env?.STAGING_DATABASE_URL || options.env?.SHERIVS_RLS_STAGING_URL, options.env ?? {});
    checks.push({
      name: "tls",
      ok: tls.ok,
      ...tls,
    });
  } catch (err) {
    checks.push({
      name: "target_identity",
      ok: false,
      code: err.code,
      detail: err.message,
    });
    checks.push({
      name: "tls",
      ok: false,
      code: "TLS_SKIPPED_NO_TARGET",
      detail: "tls not evaluated because staging target was refused",
    });
  }

  const ledgerEval = evaluateLedger(options.ledgerRows ?? [], manifest);
  checks.push({
    name: "ledger",
    ok: ledgerEval.ok && (ledgerEval.action === "fresh_apply" || ledgerEval.action === "already_complete"),
    ...ledgerEval,
  });

  checks.push({
    name: "catalog",
    ok: true,
    ...catalogNotAssumedFromPriorReport(),
  });

  const working = inspectWorkingTree(options.root);
  checks.push({
    name: "working_tree_note",
    ok: true,
    ...working,
  });

  const failed = checks.filter((c) => c.ok === false);
  return {
    mode: options.mode ?? MODES.OFFLINE,
    stagingRefRequired: STAGING_PROJECT_REF,
    ok: failed.length === 0,
    failed: failed.map((f) => f.name),
    checks,
    liveCatalog: false,
  };
}

export function liveCatalogPlan() {
  return {
    requires: [
      "--allow-live-catalog",
      `--confirm-staging-ref=${STAGING_PROJECT_REF}`,
    ],
    sets: "default_transaction_read_only=on",
    sql: LIVE_CATALOG_SQL,
    doesNotAssumeHistoricalEmptiness: true,
  };
}
