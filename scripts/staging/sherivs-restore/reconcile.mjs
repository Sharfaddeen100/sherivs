/**
 * Three-source restore reconciliation.
 *
 * Authority order:
 * 1. Pinned migration manifest and SHA-256 checksums
 * 2. Supabase schema_migrations metadata when available
 * 3. Observed database catalog (tables / policies)
 *
 * A private-ledger SUCCEEDED row is never sufficient on its own.
 * Schema existence is never treated as proof that application behaviour
 * is secure.
 *
 * Offline: catalog and vendor history are typically unknown. That is
 * recorded honestly. Execute mode refuses to apply or to claim
 * already_complete until both are supplied as observations (injected in
 * tests; a future read-only staging catalog for live).
 */

import { LEDGER_STATUS, PINNED_SOURCE_COMMIT } from "./constants.mjs";
import { evaluateLedger } from "./ledger.mjs";
import {
  compareCatalog,
  extractExpectedObjects,
  versionOfFilename,
} from "./catalog-contract.mjs";

function refuse(reason, extra = {}) {
  return {
    action: "refuse",
    ok: false,
    retried: false,
    autoRetry: false,
    securityProof: false,
    reason,
    ...extra,
  };
}

function vendorVersionSet(vendorHistory) {
  const versions = new Set();
  for (const version of vendorHistory?.versions ?? []) {
    versions.add(String(version));
  }
  for (const entry of vendorHistory?.entries ?? []) {
    if (entry?.version) versions.add(String(entry.version));
  }
  return versions;
}

function vendorChecksumMismatches(manifest, vendorHistory) {
  const mismatches = [];
  const byVersion = new Map();
  for (const entry of vendorHistory?.entries ?? []) {
    if (entry?.version) byVersion.set(String(entry.version), entry);
  }
  if (byVersion.size === 0) return mismatches;
  for (const file of manifest.files) {
    const version = versionOfFilename(file.filename);
    const rec = byVersion.get(version);
    if (rec?.checksum && rec.checksum !== file.sha256) {
      mismatches.push({
        filename: file.filename,
        version,
        expected: file.sha256,
        recorded: rec.checksum,
      });
    }
  }
  return mismatches;
}

/**
 * @param {{
 *   manifest: object,
 *   ledgerRows?: object[],
 *   ledgerDecision?: object,
 *   vendorHistory?: { status: string, versions?: string[], entries?: object[] },
 *   catalog?: { status: string, tables?: object[], policies?: object[] },
 *   sqlByFilename?: Record<string, string>,
 *   expected?: object,
 *   sourceCommit?: string,
 * }} input
 */
export function reconcileRestoreState(input = {}) {
  const manifest = input.manifest;
  if (!manifest?.files) {
    return refuse("RECONCILE_MANIFEST_MISSING");
  }
  const ledgerDecision =
    input.ledgerDecision ??
    evaluateLedger(input.ledgerRows ?? [], manifest, {
      sourceCommit: input.sourceCommit ?? PINNED_SOURCE_COMMIT,
    });
  const vendorHistory = input.vendorHistory ?? {
    status: "unknown",
    versions: [],
  };
  const catalog = input.catalog ?? { status: "NOT_CHECKED", tables: [], policies: [] };
  const expected =
    input.expected ?? extractExpectedObjects(input.sqlByFilename ?? {});
  const catalogComparison = compareCatalog(expected, catalog);
  const expectedVersions = manifest.files.map((f) => versionOfFilename(f.filename));
  const vendorVersions = vendorVersionSet(vendorHistory);
  const checksumMismatches = vendorChecksumMismatches(manifest, vendorHistory);

  const common = {
    ledgerDecision,
    vendorHistory: {
      status: vendorHistory.status,
      versionCount: vendorVersions.size,
    },
    catalogComparison,
    expected: {
      tableCount: expected.tableCount ?? expected.tables?.length ?? 0,
      policyCount: expected.policyCount ?? expected.policies?.length ?? 0,
      limitations: expected.limitations,
      securityProof: false,
      existenceOnly: true,
    },
    autoRetry: false,
    retried: false,
    securityProof: false,
  };

  if (checksumMismatches.length) {
    return refuse("MANIFEST_CHECKSUM_DIFFERS_FROM_HISTORY", {
      ...common,
      checksumMismatches,
    });
  }

  if (ledgerDecision.action === "refuse" || ledgerDecision.ok === false) {
    return refuse(ledgerDecision.reason, {
      ...common,
      blocking: ledgerDecision.blocking,
      detail: ledgerDecision.detail,
    });
  }

  const vendorKnown =
    vendorHistory.status === "absent" || vendorHistory.status === "available";
  const catalogKnown = catalog.status === "observed";

  if (ledgerDecision.action === "already_complete") {
    if (!catalogKnown) {
      return refuse("CATALOG_NOT_CHECKED", {
        ...common,
        detail:
          "private ledger claims complete; catalog was not observed so completion is unproven",
      });
    }
    if (!vendorKnown) {
      return refuse("VENDOR_HISTORY_UNKNOWN", {
        ...common,
        detail:
          "private ledger claims complete; vendor schema_migrations was not observed",
      });
    }
    if (catalogComparison.missingTables.length) {
      return refuse("LEDGER_SCHEMA_ABSENT", {
        ...common,
        detail:
          "private ledger claims complete but expected schema objects are missing; refusing to ignore absence",
        missingTables: catalogComparison.missingTables.map((t) => t.key),
      });
    }
    if (catalogComparison.unexpectedTables.length) {
      return refuse("CATALOG_UNEXPECTED_OBJECTS", {
        ...common,
        unexpectedTables: catalogComparison.unexpectedTables,
        detail: "unexpected schema objects must be reconciled before claiming complete",
      });
    }
    const vendorEmpty =
      vendorHistory.status === "absent" || vendorVersions.size === 0;
    if (vendorEmpty) {
      return refuse("VENDOR_HISTORY_DISAGREE", {
        ...common,
        detail:
          "private ledger claims complete but vendor schema_migrations has no matching versions",
      });
    }
    const missingVendor = expectedVersions.filter((v) => !vendorVersions.has(v));
    const extraVendor = [...vendorVersions].filter(
      (v) => !expectedVersions.includes(v),
    );
    if (missingVendor.length || extraVendor.length) {
      return refuse("VENDOR_HISTORY_DISAGREE", {
        ...common,
        missingVendor,
        extraVendor,
        detail: "vendor schema_migrations disagrees with the private ledger / manifest",
      });
    }
    return {
      action: "already_complete",
      ok: true,
      reason: "ledger_vendor_catalog_agree",
      ...common,
      schemaExistence: true,
      securityProof: false,
      detail:
        "schema objects named in the contract exist; this is not proof that application behaviour is secure",
    };
  }

  if (ledgerDecision.action === "fresh_apply") {
    if (!catalogKnown) {
      return refuse("CATALOG_NOT_CHECKED", {
        ...common,
        detail:
          "fresh_apply is not allowed from an empty private ledger without an observed catalog",
      });
    }
    if (!vendorKnown) {
      return refuse("VENDOR_HISTORY_UNKNOWN", {
        ...common,
        detail:
          "fresh_apply is not allowed without observing vendor schema_migrations (absent or available)",
      });
    }
    const vendorHasExpected = expectedVersions.some((v) => vendorVersions.has(v));
    const vendorHasExtra = [...vendorVersions].some(
      (v) => !expectedVersions.includes(v),
    );
    if (vendorHasExpected || vendorHasExtra) {
      return refuse("VENDOR_HISTORY_DISAGREE", {
        ...common,
        detail:
          "private ledger is empty but vendor history is not; refusing to replay non-idempotent files",
      });
    }
    const expectedPresent = catalogComparison.matchingTables;
    if (expectedPresent > 0 && catalogComparison.missingTables.length > 0) {
      return refuse("PARTIAL_SCHEMA", {
        ...common,
        detail:
          "partially applied schema cannot be continued automatically; explicit reconciliation required",
      });
    }
    if (expectedPresent > 0 && catalogComparison.missingTables.length === 0) {
      return refuse("UNKNOWN_MIGRATION_STATE", {
        ...common,
        detail:
          "catalog already contains expected objects while the private ledger is empty; refusing automatic apply",
      });
    }
    if (catalogComparison.unexpectedTables.length) {
      return refuse("CATALOG_UNEXPECTED_OBJECTS", {
        ...common,
        unexpectedTables: catalogComparison.unexpectedTables,
        detail: "unexpected schema objects are reported and block fresh_apply",
      });
    }
    return {
      action: "fresh_apply",
      ok: true,
      reason: "green_field_ledger_vendor_catalog",
      ...common,
      schemaExistence: false,
      securityProof: false,
    };
  }

  return refuse("UNKNOWN_MIGRATION_STATE", {
    ...common,
    detail: "ledger state is not a known empty or complete prefix",
  });
}

export function observationsRequiredForExecute() {
  return {
    catalog: "observed public tables and policies (read-only)",
    vendorHistory: "absent or available schema_migrations versions",
    lock: "advisory lock session held for the entire restore run",
    notSufficient: [
      "private ledger SUCCEEDED rows",
      "GATE4 historical emptiness",
      "schema existence as security proof",
    ],
  };
}

export { evaluateLedger, LEDGER_STATUS };
