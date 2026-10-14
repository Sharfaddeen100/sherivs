import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  PINNED_MIGRATION_COUNT,
  PINNED_SOURCE_COMMIT,
  PINNED_SOURCE_TREE,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
  TRANSPORT_FIRST,
  TRANSPORT_SECOND,
} from "../../scripts/staging/sherivs-restore/constants.mjs";
import {
  loadApprovedManifest,
  loadFromDirectory,
  loadFromGitCommit,
  inspectWorkingTree,
  verifyLoadedFiles,
} from "../../scripts/staging/sherivs-restore/source.mjs";
import {
  assertStagingTarget,
  collectForbiddenFallbacks,
  resolveStagingTarget,
} from "../../scripts/staging/sherivs-restore/target.mjs";
import { inspectTlsPosture, strictTlsConfig } from "../../scripts/staging/sherivs-restore/tls.mjs";
import { createLogger, redactText, redactUrl } from "../../scripts/staging/sherivs-restore/redact.mjs";
import {
  LEDGER_STATUS,
  createMemoryLedger,
  evaluateLedger,
} from "../../scripts/staging/sherivs-restore/ledger.mjs";
import { createLiveConnector, createMockConnector } from "../../scripts/staging/sherivs-restore/connect.mjs";
import { catalogNotAssumedFromPriorReport, runOfflinePreflight } from "../../scripts/staging/sherivs-restore/preflight.mjs";
import {
  assertExecuteAuthorization,
  runRestore,
} from "../../scripts/staging/sherivs-restore/runner.mjs";
import { help, main as cliMain } from "../../scripts/staging/sherivs-restore/cli.mjs";

const CA_PEM = "-----BEGIN CERTIFICATE-----\nMIITestStagingRestore\n-----END CERTIFICATE-----\n";
const STAGING_POOLER_URL =
  "postgresql://postgres.dvxszhracsjwdancijdc:fixture-not-a-secret@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";
const STAGING_DIRECT_URL =
  "postgresql://postgres:fixture-not-a-secret@db.dvxszhracsjwdancijdc.supabase.co:5432/postgres";
const PRODUCTION_URL = `postgresql://postgres:fixture-not-a-secret@db.${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`;

function stagingEnv(overrides: Record<string, string | undefined> = {}) {
  const env: Record<string, string> = {
    STAGING_DATABASE_URL: STAGING_POOLER_URL,
    COREGRID_DB_CA_CERT: CA_PEM,
  };
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
  return env;
}

function digest(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

function miniManifest() {
  const a = "CREATE TABLE a();";
  const b = "CREATE TABLE b();";
  const c = "CREATE TABLE c();";
  return {
    manifestId: "test-mini-transport",
    sourceCommit: PINNED_SOURCE_COMMIT,
    sourceTree: PINNED_SOURCE_TREE,
    count: 3,
    files: [
      { seq: 1, filename: "20260101000000_a.sql", sha256: digest(a) },
      { seq: 2, filename: TRANSPORT_FIRST, sha256: digest(b) },
      { seq: 3, filename: TRANSPORT_SECOND, sha256: digest(c) },
    ],
    sqlByFilename: {
      "20260101000000_a.sql": a,
      [TRANSPORT_FIRST]: b,
      [TRANSPORT_SECOND]: c,
    },
  };
}

const executeFlags = {
  confirmStagingRef: STAGING_PROJECT_REF,
  confirmSourceCommit: PINNED_SOURCE_COMMIT,
  iAuthorizeStagingRestore: true,
};

describe("SHERIVS staging-only migration runner (offline)", () => {
  let approved: ReturnType<typeof loadApprovedManifest>;
  let gitLoaded: Awaited<ReturnType<typeof loadFromGitCommit>>;

  beforeAll(() => {
    approved = loadApprovedManifest();
    gitLoaded = loadFromGitCommit();
  });

  afterEach(() => {
    delete process.env.COREGRID_DB_INSECURE_TLS;
  });

  it("1. correct 71-file manifest passes", () => {
    expect(approved.count).toBe(PINNED_MIGRATION_COUNT);
    expect(approved.sourceCommit).toBe(PINNED_SOURCE_COMMIT);
    expect(approved.sourceTree).toBe(PINNED_SOURCE_TREE);
    expect(gitLoaded.ok).toBe(true);
    expect(gitLoaded.count).toBe(71);
    expect(gitLoaded.files[0].filename).toBe(approved.files[0].filename);
    expect(gitLoaded.files[70].filename).toBe(approved.files[70].filename);
  });

  it("2. missing migration fails", () => {
    const loaded = gitLoaded.loaded.slice(0, 70);
    expect(() => verifyLoadedFiles(loaded, approved)).toThrow(/MISSING_MIGRATION/);
  });

  it("3. additional migration fails", () => {
    const loaded = [
      ...gitLoaded.loaded,
      { filename: "20261231000000_extra.sql", bytes: Buffer.from("SELECT 1;") },
    ];
    expect(() => verifyLoadedFiles(loaded, approved)).toThrow(/ADDITIONAL_MIGRATION/);
  });

  it("4. modified checksum fails", () => {
    const loaded = gitLoaded.loaded.map((f, i) =>
      i === 0 ? { ...f, bytes: Buffer.concat([f.bytes, Buffer.from("\n--tamper")]) } : f,
    );
    expect(() => verifyLoadedFiles(loaded, approved)).toThrow(/CHECKSUM_MISMATCH/);
  });

  it("5. wrong source commit fails", () => {
    expect(() =>
      loadFromGitCommit("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
    ).toThrow(/WRONG_SOURCE_COMMIT/);
  });

  it("6. wrong Git tree fails", () => {
    const gitFn = (args: string[]) => {
      if (args[0] === "rev-parse") {
        return Buffer.from("ffffffffffffffffffffffffffffffffffffffff\n");
      }
      throw new Error(`unexpected git ${args.join(" ")}`);
    };
    expect(() => loadFromGitCommit(PINNED_SOURCE_COMMIT, gitFn, approved)).toThrow(
      /WRONG_GIT_TREE/,
    );
  });

  it("7. wrong project ref fails", () => {
    expect(() =>
      assertStagingTarget(
        "postgresql://postgres:x@db.abcdefghijabcdefghijab.supabase.co:5432/postgres",
      ),
    ).toThrow(/TARGET_HOST_NOT_ALLOWLISTED|TARGET_STAGING_REF_MISSING/);
  });

  it("8. production project ref fails", () => {
    expect(() => assertStagingTarget(PRODUCTION_URL)).toThrow(/TARGET_PRODUCTION_REF/);
  });

  it("9. unprefixed DATABASE_URL cannot become the target", () => {
    const env = stagingEnv({ DATABASE_URL: PRODUCTION_URL });
    expect(collectForbiddenFallbacks(env)).toContain("DATABASE_URL");
    expect(() => resolveStagingTarget(env)).toThrow(/TARGET_UNPREFIXED_PRESENT/);
    const withoutStaging = {
      DATABASE_URL: STAGING_POOLER_URL,
      COREGRID_DB_CA_CERT: CA_PEM,
    };
    expect(() => resolveStagingTarget(withoutStaging)).toThrow(/TARGET_UNPREFIXED_PRESENT|TARGET_MISSING/);
  });

  it("10. missing staging credentials fail closed", () => {
    expect(() => resolveStagingTarget({ COREGRID_DB_CA_CERT: CA_PEM })).toThrow(
      /TARGET_MISSING/,
    );
  });

  it("11. insecure TLS fails", () => {
    expect(() =>
      strictTlsConfig(STAGING_POOLER_URL, stagingEnv({ COREGRID_DB_INSECURE_TLS: "1" })),
    ).toThrow(/TLS_INSECURE_FORBIDDEN/);
  });

  it("12. missing TLS certificate fails where required", () => {
    expect(() =>
      strictTlsConfig(STAGING_POOLER_URL, { STAGING_DATABASE_URL: STAGING_POOLER_URL }),
    ).toThrow(/TLS_CA_REQUIRED/);
  });

  it("13. transport migrations must both exist and be ordered correctly", () => {
    expect(approved.files[58].filename).toBe(TRANSPORT_FIRST);
    expect(approved.files[68].filename).toBe(TRANSPORT_SECOND);
    expect(approved.transportPair.firstSeq).toBe(59);
    expect(approved.transportPair.secondSeq).toBe(69);
    const swapped = [...gitLoaded.loaded];
    const i = swapped.findIndex((f) => f.filename === TRANSPORT_FIRST);
    const j = swapped.findIndex((f) => f.filename === TRANSPORT_SECOND);
    [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
    expect(() => verifyLoadedFiles(swapped, approved)).toThrow(
      /MIGRATION_REORDERED|TRANSPORT_PAIR_ORDER/,
    );
  });

  it("14. proposed remediation files are excluded", () => {
    const dir = mkdtempSync(join(tmpdir(), "sherivs-restore-"));
    writeFileSync(join(dir, "20261015000010_sherivs_authz_helpers_active.sql.proposed"), "SELECT 1;");
    expect(() => loadFromDirectory(dir, approved)).toThrow(/PROPOSED_SQL_EXCLUDED|MISSING_MIGRATION/);
    const withProposed = [
      ...gitLoaded.loaded,
      {
        filename: "20261015000010_sherivs_authz_helpers_active.sql.proposed",
        bytes: Buffer.from("SELECT 1;"),
      },
    ];
    expect(() => verifyLoadedFiles(withProposed, approved)).toThrow(/PROPOSED_SQL_EXCLUDED/);
  });

  it("15. an incomplete migration record blocks continuation", () => {
    const decision = evaluateLedger(
      [
        {
          filename: approved.files[0].filename,
          status: LEDGER_STATUS.STARTED,
          completed_at: null,
          content_checksum: approved.files[0].sha256,
          source_commit: PINNED_SOURCE_COMMIT,
          manifest_id: approved.manifestId,
        },
      ],
      approved,
    );
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("LEDGER_INCOMPLETE");
  });

  it("16. a failed migration record blocks continuation", () => {
    const decision = evaluateLedger(
      [
        {
          filename: approved.files[0].filename,
          status: LEDGER_STATUS.FAILED,
          completed_at: new Date().toISOString(),
          content_checksum: approved.files[0].sha256,
          source_commit: PINNED_SOURCE_COMMIT,
          manifest_id: approved.manifestId,
        },
      ],
      approved,
    );
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("LEDGER_FAILED");
  });

  it("17. a checksum mismatch in prior history blocks continuation", () => {
    const decision = evaluateLedger(
      [
        {
          filename: approved.files[0].filename,
          status: LEDGER_STATUS.SUCCEEDED,
          completed_at: new Date().toISOString(),
          content_checksum: "0".repeat(64),
          source_commit: PINNED_SOURCE_COMMIT,
          manifest_id: approved.manifestId,
        },
      ],
      approved,
    );
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("LEDGER_CHECKSUM_MISMATCH");
  });

  it("18. a successful migration record must match its checksum and source", () => {
    const matching = approved.files.map((f) => ({
      filename: f.filename,
      status: LEDGER_STATUS.SUCCEEDED,
      completed_at: new Date().toISOString(),
      content_checksum: f.sha256,
      source_commit: PINNED_SOURCE_COMMIT,
      manifest_id: approved.manifestId,
    }));
    expect(evaluateLedger(matching, approved)).toMatchObject({
      action: "already_complete",
      ok: true,
    });
    const wrongCommit = matching.map((r, i) =>
      i === 0 ? { ...r, source_commit: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" } : r,
    );
    expect(evaluateLedger(wrongCommit, approved).reason).toBe("LEDGER_SOURCE_MISMATCH");
  });

  it("19. failure stops execution immediately", async () => {
    const mini = miniManifest();
    const connector = createMockConnector({
      onQuery: ({ label, sql }) => {
        if (label.startsWith("apply:") && String(sql).includes("CREATE TABLE b")) {
          throw new Error("boom-on-b");
        }
        return { rows: [], rowCount: 0 };
      },
    });
    const result = await runRestore({
      mode: "execute",
      ...executeFlags,
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      skipOfflinePreflight: true,
      connector,
      ledger: createMemoryLedger(),
      allowNetwork: false,
    });
    expect(result.ok).toBe(false);
    expect(result.stopped).toBe(true);
    expect(result.failed.filename).toBe(TRANSPORT_FIRST);
    expect(result.applied).toHaveLength(1);
    const applyLabels = connector.opened.filter((o) => o.label.startsWith("apply:"));
    expect(applyLabels.map((o) => o.label)).toEqual([
      "apply:20260101000000_a.sql",
      `apply:${TRANSPORT_FIRST}`,
    ]);
  });

  it("20. a migration is never automatically retried after uncertain outcome", async () => {
    const mini = miniManifest();
    let applyB = 0;
    const connector = createMockConnector({
      onQuery: ({ label, sql }) => {
        if (label.startsWith("apply:") && String(sql).includes("CREATE TABLE b")) {
          applyB += 1;
          throw new Error("uncertain");
        }
        return { rows: [], rowCount: 0 };
      },
    });
    const ledger = createMemoryLedger();
    const first = await runRestore({
      mode: "execute",
      ...executeFlags,
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      skipOfflinePreflight: true,
      connector,
      ledger,
      allowNetwork: false,
    });
    expect(first.ok).toBe(false);
    expect(applyB).toBe(1);
    const second = await runRestore({
      mode: "execute",
      ...executeFlags,
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      skipOfflinePreflight: true,
      connector,
      ledger,
      allowNetwork: false,
    });
    expect(second.ok).toBe(false);
    expect(second.retried).toBe(false);
    expect(second.decision.reason).toBe("LEDGER_FAILED");
    expect(applyB).toBe(1);
  });

  it("21. connection isolation is enforced between migration files", async () => {
    const mini = miniManifest();
    const connector = createMockConnector();
    const result = await runRestore({
      mode: "execute",
      ...executeFlags,
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      skipOfflinePreflight: true,
      connector,
      ledger: createMemoryLedger(),
      allowNetwork: false,
    });
    expect(result.ok).toBe(true);
    const applyOpens = connector.opened.filter((o) => o.label.startsWith("apply:"));
    expect(applyOpens).toHaveLength(3);
    expect(new Set(applyOpens.map((o) => o.id)).size).toBe(3);
    const applyEvents = connector.events.filter((e: { label: string }) =>
      e.label.startsWith("apply:"),
    );
    expect(applyEvents.map((e: { type: string }) => e.type)).toEqual([
      "open",
      "close",
      "open",
      "close",
      "open",
      "close",
    ]);
  });

  it("22. logs redact secrets", () => {
    const logger = createLogger({ log() {}, error() {} });
    logger.info("probe", {
      connectionString: STAGING_POOLER_URL,
      password: "fixture-not-a-secret",
      detail: `failed ${STAGING_POOLER_URL}`,
    });
    const serialized = JSON.stringify(logger.lines());
    expect(serialized).not.toContain("fixture-not-a-secret");
    expect(redactUrl(STAGING_POOLER_URL)).toContain("***");
    expect(redactText(STAGING_POOLER_URL)).not.toContain("fixture-not-a-secret");
  });

  it("23. execution requires explicit target and commit confirmation", async () => {
    expect(() => assertExecuteAuthorization({})).toThrow(/EXECUTE_AUTHORIZATION_MISSING/);
    expect(() =>
      assertExecuteAuthorization({
        iAuthorizeStagingRestore: true,
        confirmStagingRef: PRODUCTION_PROJECT_REF,
        confirmSourceCommit: PINNED_SOURCE_COMMIT,
      }),
    ).toThrow(/EXECUTE_CONFIRM_REF/);
    expect(() =>
      assertExecuteAuthorization({
        iAuthorizeStagingRestore: true,
        confirmStagingRef: STAGING_PROJECT_REF,
        confirmSourceCommit: "0".repeat(40),
      }),
    ).toThrow(/EXECUTE_CONFIRM_COMMIT/);
    const cli = await cliMain(
      [
        "--mode=execute",
        `--confirm-staging-ref=${STAGING_PROJECT_REF}`,
        `--confirm-source-commit=${PINNED_SOURCE_COMMIT}`,
        "--i-authorize-staging-restore",
      ],
      { env: stagingEnv() },
    );
    expect(cli.ok).toBe(false);
    expect(cli.code).toBe("LIVE_EXECUTE_NOT_ENABLED");
  });

  it("24. tests cannot accidentally connect to a real database", () => {
    expect(createMockConnector().allowNetwork).toBe(false);
    expect(() =>
      createLiveConnector({
        allowNetwork: false,
        connectionString: STAGING_POOLER_URL,
        env: stagingEnv(),
      }),
    ).toThrow(/NETWORK_DISABLED/);
    expect(help()).toContain("Does not use DATABASE_URL");
  });

  it("sslmode=disable is refused", () => {
    const posture = inspectTlsPosture(`${STAGING_POOLER_URL}?sslmode=disable`, stagingEnv());
    expect(posture.ok).toBe(false);
    expect(posture.code).toBe("TLS_DISABLED_FORBIDDEN");
  });

  it("direct staging host is allowlisted and pooler requires pinned user", () => {
    expect(assertStagingTarget(STAGING_DIRECT_URL).kind).toBe("direct");
    expect(assertStagingTarget(STAGING_POOLER_URL).kind).toBe("pooler");
    expect(() =>
      assertStagingTarget(
        "postgresql://postgres:x@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
      ),
    ).toThrow(/TARGET_POOLER_USER_MISMATCH/);
  });

  it("disagreeing staging URLs fail closed", () => {
    expect(() =>
      resolveStagingTarget(
        stagingEnv({
          SHERIVS_RLS_STAGING_URL: STAGING_DIRECT_URL,
        }),
      ),
    ).toThrow(/TARGET_URLS_DISAGREE/);
  });

  it("offline preflight does not claim historical emptiness", async () => {
    const preflight = runOfflinePreflight({
      env: stagingEnv(),
      gitFn: undefined,
    });
    const catalog = preflight.checks.find((c: { name: string }) => c.name === "catalog");
    expect(catalog.emptiness).toBe("UNKNOWN");
    expect(catalogNotAssumedFromPriorReport().catalog).toBe("NOT_CHECKED");
    expect(preflight.liveCatalog).toBe(false);
  });

  it("working tree mismatch is documented and not used as the pin", () => {
    const working = inspectWorkingTree();
    expect(working.count).not.toBe(71);
    expect(working.missingFromPin).toEqual(
      expect.arrayContaining([
        "20261008000050_coregrid_organization_memberships.sql",
        "20261008000060_organization_onboarding.sql",
      ]),
    );
    expect(gitLoaded.count).toBe(71);
  });

  it("migration #23 session GUC is isolated by per-file connections", () => {
    const file23 = approved.files[22];
    expect(file23.seq).toBe(23);
    const loaded = gitLoaded.loaded[22].bytes.toString("utf8");
    expect(loaded).toMatch(/SET statement_timeout = '0'/);
    expect(approved.sessionGucMigrations[0].filename).toBe(file23.filename);
  });

  it("partial success prefix is not auto-resumed", () => {
    const mini = miniManifest();
    const rows = [
      {
        filename: mini.files[0].filename,
        status: LEDGER_STATUS.SUCCEEDED,
        completed_at: new Date().toISOString(),
        content_checksum: mini.files[0].sha256,
        source_commit: PINNED_SOURCE_COMMIT,
        manifest_id: mini.manifestId,
      },
    ];
    const decision = evaluateLedger(rows, mini);
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("LEDGER_PARTIAL_PREFIX");
  });

  it("CLI manifest mode verifies source without a database URL", async () => {
    const result = await cliMain(["--mode=manifest"], { env: {} });
    expect(result.ok).toBe(true);
    expect(result.source.count).toBe(71);
  });

  it("reordered transport pair in a directory fails", () => {
    const mini = miniManifest();
    expect(mini.files[1].filename).toBe(TRANSPORT_FIRST);
    const loaded = [
      { filename: TRANSPORT_SECOND, bytes: Buffer.from(mini.sqlByFilename[TRANSPORT_SECOND]) },
      { filename: TRANSPORT_FIRST, bytes: Buffer.from(mini.sqlByFilename[TRANSPORT_FIRST]) },
    ];
    expect(() => verifyLoadedFiles(loaded, { ...mini, count: 2, files: mini.files.slice(1) })).toThrow(
      /TRANSPORT_PAIR_ORDER|MIGRATION_REORDERED/,
    );
  });

  it("overlapping connections are refused by the mock connector", async () => {
    const connector = createMockConnector();
    await expect(
      connector.withConnection("a", async () => connector.withConnection("b", async () => null)),
    ).rejects.toThrow(/CONNECTION_ISOLATION_VIOLATION/);
  });
});
