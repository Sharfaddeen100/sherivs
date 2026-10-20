import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import {
  PINNED_MIGRATION_COUNT,
  PINNED_SOURCE_COMMIT,
  PINNED_SOURCE_TREE,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
  TRANSPORT_FIRST,
  TRANSPORT_SECOND,
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
} from "../../scripts/staging/sherivs-restore/constants.mjs";
import {
  loadApprovedManifest,
  loadFromDirectory,
  loadFromGitCommit,
  inspectWorkingTree,
  verifyLoadedFiles,
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
} from "../../scripts/staging/sherivs-restore/source.mjs";
import {
  assertStagingTarget,
  collectForbiddenFallbacks,
  resolveStagingTarget,
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
} from "../../scripts/staging/sherivs-restore/target.mjs";
import {
  buildPinnedClientConfig,
  inspectTlsPosture,
  parseDiscreteConnection,
  strictTlsConfig,
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
} from "../../scripts/staging/sherivs-restore/tls.mjs";
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
import { createLogger, redactText, redactUrl } from "../../scripts/staging/sherivs-restore/redact.mjs";
import {
  LEDGER_STATUS,
  createMemoryLedger,
  createSqlLedger,
  evaluateLedger,
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
} from "../../scripts/staging/sherivs-restore/ledger.mjs";
import {
  createLiveConnector,
  createMockConnector,
  demonstrateDriverSslOverwrite,
  inspectConstructedClientSsl,
  liveConnectorPlan,
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
} from "../../scripts/staging/sherivs-restore/connect.mjs";
import {
  assertTrustedLockController,
  createAdvisoryLock,
  createFakeAdvisorySession,
  createLivePostgresLockSession,
  createLockRegistry,
  isAuthenticLockController,
  isLiveCapableLockController,
  transitionLock,
  LOCK_AUTHENTICITY,
  LOCK_STATES,
  advisoryLockPlan,
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
} from "../../scripts/staging/sherivs-restore/lock.mjs";
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
import { reconcileRestoreState } from "../../scripts/staging/sherivs-restore/reconcile.mjs";
import {
  CATALOG_CLASS_STATES,
  CATALOG_OBSERVE_SQL,
  CONTRACT_ALLOWLIST,
  OBSERVE_SQL_FIELD_MAP,
  catalogBlocksCompletion,
  catalogClassObservationState,
  compareCatalog,
  constraintsEquivalent,
  emptyObservedCatalogClasses,
  extractExpectedObjects,
  functionIdentityKey,
  grantKey,
  isConstraintImpliedIndex,
  mapObservedRowsToCatalog,
  normalizeConstraint,
  observedCatalogFromExpected,
  observationState,
  parseIndexShape,
  resolveForeignKeyReferencedColumns,
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
} from "../../scripts/staging/sherivs-restore/catalog-contract.mjs";
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
import { catalogNotAssumedFromPriorReport, runOfflinePreflight } from "../../scripts/staging/sherivs-restore/preflight.mjs";
import {
  assertExecuteAuthorization,
  runRestore,
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
} from "../../scripts/staging/sherivs-restore/runner.mjs";
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
import { help, main as cliMain } from "../../scripts/staging/sherivs-restore/cli.mjs";

const CA_PEM = `-----BEGIN CERTIFICATE-----
MIIDNTCCAh2gAwIBAgIUMCCBaiUc4B42kZIGKlbl+0cX1dkwDQYJKoZIhvcNAQEL
BQAwKjEoMCYGA1UEAwwfU2hlcml2cyBTdGFnaW5nIFJlc3RvcmUgVGVzdCBDQTAe
Fw0yNjEwMTQyMDQ2NDFaFw0zNjEwMTEyMDQ2NDFaMCoxKDAmBgNVBAMMH1NoZXJp
dnMgU3RhZ2luZyBSZXN0b3JlIFRlc3QgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IB
DwAwggEKAoIBAQC9V+PpifhPLoaRudFVLXiq0ZDhF0Jn4fZPIx6Vo/n3aYuiZNst
A4abGTFkT1vhaCeMoQX+c01DUcZ/RK3bjzNeVfXq+WXjxV2p4axAiporzMK2OwZm
T7aB2N397fRZpEwOk7PzUzjEPGE2RXWlM6NzSn32J2Vqt4lqlXD+WEQcEPxN9l25
yz73ofLbQMcdx1beAMdLr4x9fBxY4JyfQFXQ9RTvKnRlsfnu6kFf3FQsmA9DmBVe
T7ihUBFMmZJ0IWvnwMhZstjTxI55FDwENdz2iht176lElVROsh0rpBcWFvZQID1G
HbVycqDcIyRssHtY85aebzaddo9fdxSXLFitAgMBAAGjUzBRMB0GA1UdDgQWBBTp
uovQF1M0S8lHTeDzg+a8/Qwr0jAfBgNVHSMEGDAWgBTpuovQF1M0S8lHTeDzg+a8
/Qwr0jAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCY/uiEGKE8
1MknbVlNNKJZzkR3lKp8/gvWXYSjCXl9fPfDovkzp6qqzKIFzmUsz4HM+w1iYa5g
hY+t3n1to16E9EWVd+9oB5ySRPsI4hXFVJmOdCdiqAotgy6vM+sXBAXpqJBEmXv2
RFwnwx5nbJI5od1s8w55nxXiDK2/3YUvsb+4vjvyWwfSbgMwvGFNs1reLdFNawHI
rys7AYJLVRI9FaHxqPN7mIrnEouVoVPRmCpNC3ddDQkIw91Ga7zGWTVLZGDoiEsw
eexdUtdehTGJtVexIvxkovHB3hIQLy48sg/Wu+hUXYD+2x9mo/tgJ0yQ86ETYoAK
KycRmXbx7DwR
-----END CERTIFICATE-----
`;
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

function completeEmptyCatalog() {
  return {
    status: "observed" as const,
    ...emptyObservedCatalogClasses(),
  };
}

function observedPublicTable(name: string, extra: Record<string, unknown> = {}) {
  return {
    schema: "public",
    name,
    columns: [],
    constraints: [],
    grants: [],
    columnGrants: [],
    ...extra,
  };
}

function provenImpliedIndex(name: string, table: string, columns: string[]) {
  return {
    name,
    table,
    unique: true,
    columns,
    predicate: null,
    include: [],
    method: "btree",
  };
}

function greenFieldObservations() {
  return {
    catalog: completeEmptyCatalog(),
    vendorHistory: { status: "absent" as const, versions: [] as string[] },
  };
}

function advisoryHarness() {
  const registry = createLockRegistry();
  const session = createFakeAdvisorySession(registry);
  const lock = createAdvisoryLock({ session, owner: "test-runner" });
  return { registry, session, lock };
}

function executeHarness(overrides: Record<string, unknown> = {}) {
  const { registry, session, lock } = advisoryHarness();
  return {
    ...executeFlags,
    ...greenFieldObservations(),
    lock,
    registry,
    session,
    allowNetwork: false,
    skipOfflinePreflight: true,
    ...overrides,
  };
}

function richSchemaSql() {
  return `
CREATE TABLE public.people (
  id uuid PRIMARY KEY,
  ssn text NOT NULL,
  name text
);
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE POLICY people_self ON public.people
  FOR SELECT
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
GRANT SELECT ON TABLE public.people TO authenticated;
GRANT SELECT (ssn) ON TABLE public.people TO authenticated;
CREATE FUNCTION public.touch_people() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN NEW; END; $$;
CREATE TRIGGER people_touch BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.touch_people();
CREATE INDEX people_name_idx ON public.people (name);
`.trim();
}

function richManifest() {
  const sql = richSchemaSql();
  return {
    manifestId: "test-rich-contract",
    sourceCommit: PINNED_SOURCE_COMMIT,
    sourceTree: PINNED_SOURCE_TREE,
    count: 1,
    files: [{ seq: 1, filename: "20260101000000_people.sql", sha256: digest(sql) }],
    sqlByFilename: { "20260101000000_people.sql": sql },
  };
}

function completeLedger(manifest: { files: { filename: string; sha256: string }[]; manifestId: string }) {
  return manifest.files.map((f) => ({
    filename: f.filename,
    status: LEDGER_STATUS.SUCCEEDED,
    completed_at: new Date().toISOString(),
    content_checksum: f.sha256,
    source_commit: PINNED_SOURCE_COMMIT,
    manifest_id: manifest.manifestId,
  }));
}

describe("SHERIVS staging-only migration runner (offline)", () => {
  let approved: ReturnType<typeof loadApprovedManifest>;
  let gitLoaded: Awaited<ReturnType<typeof loadFromGitCommit>>;
  const originalConnect = pg.Client.prototype.connect;

  beforeAll(() => {
    pg.Client.prototype.connect = function offlineConnectGuard() {
      throw new Error("NETWORK_DISABLED: offline tests must not open a database session");
    };
    approved = loadApprovedManifest();
    gitLoaded = loadFromGitCommit();
  });

  afterAll(() => {
    pg.Client.prototype.connect = originalConnect;
  });

  afterEach(() => {
    delete process.env.COREGRID_DB_INSECURE_TLS;
    delete process.env.PGSSLMODE;
    delete process.env.PGSSLROOTCERT;
    delete process.env.PGSSLCERT;
    delete process.env.PGSSLKEY;
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
    const loaded = gitLoaded.loaded.map((f: any, i: any) =>
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
    const matching = approved.files.map((f: any) => ({
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
    const wrongCommit = matching.map((r: any, i: any) =>
      i === 0 ? { ...r, source_commit: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" } : r,
    );
    expect(evaluateLedger(wrongCommit, approved).reason).toBe("LEDGER_SOURCE_MISMATCH");
  });

  it("19. failure stops execution immediately", async () => {
    const mini = miniManifest();
    const connector = createMockConnector({
      onQuery: ({ label, sql }: any) => {
        if (label.startsWith("apply:") && String(sql).includes("CREATE TABLE b")) {
          throw new Error("boom-on-b");
        }
        return { rows: [], rowCount: 0 };
      },
    });
    const result = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger: createMemoryLedger(),
      ...executeHarness(),
    });
    expect(result.ok).toBe(false);
    expect(result.stopped).toBe(true);
    expect(result.failed.filename).toBe(TRANSPORT_FIRST);
    expect(result.applied).toHaveLength(1);
    const applyLabels = connector.opened.filter((o: any) => o.label.startsWith("apply:"));
    expect(applyLabels.map((o: any) => o.label)).toEqual([
      "apply:20260101000000_a.sql",
      `apply:${TRANSPORT_FIRST}`,
    ]);
    expect(connector.closed).toEqual(connector.opened.map((o: any) => o.id));
  });

  it("20. a migration is never automatically retried after uncertain outcome", async () => {
    const mini = miniManifest();
    let applyB = 0;
    const connector = createMockConnector({
      onQuery: ({ label, sql }: any) => {
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
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger,
      ...executeHarness(),
    });
    expect(first.ok).toBe(false);
    expect(applyB).toBe(1);
    const second = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger,
      ...executeHarness(),
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
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger: createMemoryLedger(),
      ...executeHarness(),
    });
    expect(result.ok).toBe(true);
    const applyOpens = connector.opened.filter((o: any) => o.label.startsWith("apply:"));
    expect(applyOpens).toHaveLength(3);
    expect(new Set(applyOpens.map((o: any) => o.id)).size).toBe(3);
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

  it("TLS URL sslmode=no-verify is refused before Client construction", () => {
    const env = stagingEnv();
    const url = `${STAGING_POOLER_URL}?sslmode=no-verify`;
    expect(() => strictTlsConfig(url, env)).toThrow(/TLS_NO_VERIFY_FORBIDDEN/);
    const posture = inspectTlsPosture(url, env);
    expect(posture.ok).toBe(false);
    expect(posture.code).toBe("TLS_NO_VERIFY_FORBIDDEN");
    expect(JSON.stringify(posture)).not.toContain("fixture-not-a-secret");
  });

  it("TLS URL sslmode=disable is refused", () => {
    expect(() =>
      strictTlsConfig(`${STAGING_POOLER_URL}?sslmode=disable`, stagingEnv()),
    ).toThrow(/TLS_DISABLED_FORBIDDEN/);
  });

  it("conflicting URL sslmode cannot downgrade pinned Client ssl", () => {
    const env = stagingEnv();
    const requireUrl = `${STAGING_POOLER_URL}?sslmode=require`;
    expect(() => strictTlsConfig(requireUrl, env)).toThrow(/TLS_SSLMODE_REFUSED/);
    const verifyCaUrl = `${STAGING_POOLER_URL}?sslmode=verify-ca`;
    expect(() => parseDiscreteConnection(verifyCaUrl)).toThrow(/TLS_SSLMODE_REFUSED/);

    const pinned = buildPinnedClientConfig(STAGING_POOLER_URL, env);
    expect(pinned.config).not.toHaveProperty("connectionString");
    expect(pinned.config.ssl.rejectUnauthorized).toBe(true);
    expect(pinned.config.ssl.ca).toContain("BEGIN CERTIFICATE");

    const inspected = inspectConstructedClientSsl(STAGING_POOLER_URL, env);
    expect(inspected.hasConnectionString).toBe(false);
    expect(inspected.rejectUnauthorized).toBe(true);
    expect(inspected.caPresent).toBe(true);
    expect(inspected.sslIsFalse).toBe(false);

    const driver = demonstrateDriverSslOverwrite(
      `${STAGING_POOLER_URL}?sslmode=no-verify`,
      { rejectUnauthorized: true, ca: CA_PEM },
      pg.Client,
    );
    expect(driver.naiveSsl).toEqual({ rejectUnauthorized: false });
    expect(driver.pinnedSsl.rejectUnauthorized).toBe(true);
    expect(driver.naiveOverwrote).toBe(true);
  });

  it("missing or invalid CA configuration fails closed", () => {
    expect(() =>
      strictTlsConfig(STAGING_POOLER_URL, { STAGING_DATABASE_URL: STAGING_POOLER_URL }),
    ).toThrow(/TLS_CA_REQUIRED/);
    expect(() =>
      strictTlsConfig(
        STAGING_POOLER_URL,
        stagingEnv({ COREGRID_DB_CA_CERT: "-----BEGIN CERTIFICATE-----\nnot-a-cert\n-----END CERTIFICATE-----" }),
      ),
    ).toThrow(/TLS_CA_INVALID/);
    expect(() =>
      strictTlsConfig(
        STAGING_POOLER_URL,
        stagingEnv({
          COREGRID_DB_CA_CERT: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC\n-----END PRIVATE KEY-----",
        }),
      ),
    ).toThrow(/TLS_CA_NOT_CERTIFICATE/);
  });

  it("unexpected URL parameters and PGSSLMODE fail closed without leaking secrets", () => {
    const hostOverride = `${STAGING_POOLER_URL}?host=db.${PRODUCTION_PROJECT_REF}.supabase.co`;
    expect(() => parseDiscreteConnection(hostOverride)).toThrow(/TLS_URL_PARAM_REFUSED/);
    expect(() => parseDiscreteConnection(`${STAGING_POOLER_URL}?hostaddr=1.2.3.4`)).toThrow(
      /TLS_URL_PARAM_REFUSED/,
    );
    expect(() => parseDiscreteConnection(`${STAGING_POOLER_URL}?ssl=no-verify`)).toThrow(
      /TLS_NO_VERIFY_FORBIDDEN|TLS_URL_PARAM_REFUSED/,
    );
    try {
      parseDiscreteConnection(`${STAGING_POOLER_URL}?hostaddr=1.2.3.4`);
    } catch (err) {
      expect(String(err)).not.toContain("fixture-not-a-secret");
    }
    const env = stagingEnv({ PGSSLMODE: "disable" });
    expect(() => strictTlsConfig(STAGING_POOLER_URL, env)).toThrow(/TLS_PG_ENV_REFUSED/);
  });

  it("sslmode=verify-full is the only accepted explicit mode", () => {
    const cfg = strictTlsConfig(`${STAGING_POOLER_URL}?sslmode=verify-full`, stagingEnv());
    expect(cfg.ok).toBe(true);
    expect(cfg.rejectUnauthorized).toBe(true);
    expect(cfg.sslmode).toBe("verify-full");
  });

  it("lock state machine records acquire, hold, release, and loss", () => {
    const unlocked = { status: LOCK_STATES.UNLOCKED, owner: null };
    const held = transitionLock(unlocked, { type: "acquire_ok", owner: "a" });
    expect(held).toMatchObject({ status: LOCK_STATES.HELD, owner: "a", ok: true });
    expect(transitionLock(held, { type: "acquire_ok", owner: "b" }).code).toBe("LOCK_HELD");
    expect(transitionLock(held, { type: "connection_lost" }).code).toBe("LOCK_CONNECTION_LOST");
    expect(transitionLock(held, { type: "release_ok" }).status).toBe(LOCK_STATES.RELEASED);
    expect(advisoryLockPlan().scope).toBe("entire_restore_run");
    expect(advisoryLockPlan().whyNotProcessLocal).toMatch(/two runner processes/);
  });

  it("two concurrent runner attempts cannot both acquire the advisory lock", async () => {
    const mini = miniManifest();
    const registry = createLockRegistry();
    const lockA = createAdvisoryLock({
      session: createFakeAdvisorySession(registry),
      owner: "a",
    });
    const lockB = createAdvisoryLock({
      session: createFakeAdvisorySession(registry),
      owner: "b",
    });
    await lockA.acquire();
    const blocked = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector: createMockConnector(),
      ledger: createMemoryLedger(),
      ...executeHarness({ lock: lockB }),
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe("LOCK_ACQUIRE_FAILED");
    expect(blocked.retried).toBe(false);
    expect(blocked.autoRetry).toBe(false);
    await lockA.release();
    const allowed = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector: createMockConnector(),
      ledger: createMemoryLedger(),
      ...executeHarness({ lock: lockB }),
    });
    expect(allowed.ok).toBe(true);
  });

  it("lock acquisition failure blocks execution", async () => {
    const mini = miniManifest();
    const registry = createLockRegistry();
    const holder = createAdvisoryLock({
      session: createFakeAdvisorySession(registry),
      owner: "holder",
    });
    await holder.acquire();
    const blocked = createAdvisoryLock({
      session: createFakeAdvisorySession(registry),
      owner: "blocked",
    });
    const result = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector: createMockConnector(),
      ledger: createMemoryLedger(),
      ...executeHarness({ lock: blocked }),
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("LOCK_ACQUIRE_FAILED");
    expect(result.retried).toBe(false);
    await holder.release();
  });

  it("process-local mutex is refused as the restore lock", async () => {
    const mini = miniManifest();
    await expect(
      runRestore({
        mode: "execute",
        env: stagingEnv(),
        manifest: mini,
        sqlByFilename: mini.sqlByFilename,
        connector: createMockConnector(),
        ledger: createMemoryLedger(),
        ...executeHarness({ lock: { kind: "mutex", acquire: async () => ({ ok: true }) } }),
      }),
    ).rejects.toThrow(/LOCK_NOT_DISTRIBUTED/);
  });

  it("lock release and connection-loss stop apply without automatic retry", async () => {
    const mini = miniManifest();
    const registry = createLockRegistry();
    const session = createFakeAdvisorySession(registry);
    const lock = createAdvisoryLock({ session, owner: "lossy" });
    let applyCreates = 0;
    const connector = createMockConnector({
      onQuery: ({ label, sql }: any) => {
        if (label.startsWith("apply:") && String(sql) === "COMMIT") {
          applyCreates += 1;
          if (applyCreates === 1) session.simulateConnectionLoss();
        }
        return { rows: [], rowCount: 0 };
      },
    });
    const ledger = createMemoryLedger();
    const first = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger,
      ...executeHarness({ lock, catalog: { status: "observed", tables: [], policies: [] } }),
    });
    expect(first.ok).toBe(false);
    expect(first.failed.code).toBe("LOCK_CONNECTION_LOST");
    expect(first.retried).toBe(false);
    expect(first.applied).toHaveLength(1);

    const secondSession = createFakeAdvisorySession(registry);
    const secondLock = createAdvisoryLock({ session: secondSession, owner: "lossy-2" });
    const second = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger,
      ...executeHarness({ lock: secondLock }),
    });
    expect(second.ok).toBe(false);
    expect(second.retried).toBe(false);
    expect(second.autoRetry).toBe(false);
    expect(["LEDGER_AMBIGUOUS", "LEDGER_INCOMPLETE", "LEDGER_PARTIAL_PREFIX"]).toContain(
      second.decision.reason,
    );
    const applyLabels = connector.opened.filter((o: any) => o.label.startsWith("apply:"));
    expect(applyLabels).toHaveLength(1);
  });

  it("private ledger complete is not restore completion without catalog", () => {
    const mini = miniManifest();
    const rows = mini.files.map((f) => ({
      filename: f.filename,
      status: LEDGER_STATUS.SUCCEEDED,
      completed_at: new Date().toISOString(),
      content_checksum: f.sha256,
      source_commit: PINNED_SOURCE_COMMIT,
      manifest_id: mini.manifestId,
    }));
    const ledgerOnly = evaluateLedger(rows, mini);
    expect(ledgerOnly.action).toBe("already_complete");
    const decision = reconcileRestoreState({
      manifest: mini,
      ledgerRows: rows,
      sqlByFilename: mini.sqlByFilename,
      vendorHistory: { status: "available", versions: mini.files.map((f) => f.filename.slice(0, 14)) },
      catalog: { status: "NOT_CHECKED", tables: [], policies: [] },
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_NOT_CHECKED");
  });

  it("private ledger says complete but schema is absent", () => {
    const mini = miniManifest();
    const rows = mini.files.map((f) => ({
      filename: f.filename,
      status: LEDGER_STATUS.SUCCEEDED,
      completed_at: new Date().toISOString(),
      content_checksum: f.sha256,
      source_commit: PINNED_SOURCE_COMMIT,
      manifest_id: mini.manifestId,
    }));
    const decision = reconcileRestoreState({
      manifest: mini,
      ledgerRows: rows,
      sqlByFilename: mini.sqlByFilename,
      vendorHistory: {
        status: "available",
        versions: mini.files.map((f) => f.filename.slice(0, 14)),
      },
      catalog: completeEmptyCatalog(),
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("LEDGER_SCHEMA_ABSENT");
    expect(decision.autoRetry).toBe(false);
    expect(decision.securityProof).toBe(false);
  });

  it("Supabase migration history disagrees with the private ledger", () => {
    const mini = miniManifest();
    const empty = reconcileRestoreState({
      manifest: mini,
      ledgerRows: [],
      sqlByFilename: mini.sqlByFilename,
      vendorHistory: {
        status: "available",
        versions: [mini.files[0].filename.slice(0, 14)],
      },
      catalog: completeEmptyCatalog(),
    });
    expect(empty.ok).toBe(false);
    expect(empty.reason).toBe("VENDOR_HISTORY_DISAGREE");

    const rows = mini.files.map((f) => ({
      filename: f.filename,
      status: LEDGER_STATUS.SUCCEEDED,
      completed_at: new Date().toISOString(),
      content_checksum: f.sha256,
      source_commit: PINNED_SOURCE_COMMIT,
      manifest_id: mini.manifestId,
    }));
    const expected = extractExpectedObjects(mini.sqlByFilename);
    const completeCatalog = {
      ...completeEmptyCatalog(),
      tables: expected.tables.map((t: { schema: string; name: string }) => observedPublicTable(t.name, { schema: t.schema })),
      policies: [],
    };
    const mismatch = reconcileRestoreState({
      manifest: mini,
      ledgerRows: rows,
      sqlByFilename: mini.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: ["19990101000000"] },
      catalog: completeCatalog,
    });
    expect(mismatch.ok).toBe(false);
    expect(mismatch.reason).toBe("VENDOR_HISTORY_DISAGREE");
  });

  it("manifest checksum differs from recorded vendor history", () => {
    const mini = miniManifest();
    const decision = reconcileRestoreState({
      manifest: mini,
      ledgerRows: [],
      sqlByFilename: mini.sqlByFilename,
      vendorHistory: {
        status: "available",
        versions: [mini.files[0].filename.slice(0, 14)],
        entries: [
          {
            version: mini.files[0].filename.slice(0, 14),
            checksum: "0".repeat(64),
          },
        ],
      },
      catalog: { status: "observed", tables: [], policies: [] },
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("MANIFEST_CHECKSUM_DIFFERS_FROM_HISTORY");
  });

  it("partially applied migration blocks continuation", () => {
    const mini = miniManifest();
    const expected = extractExpectedObjects(mini.sqlByFilename);
    const decision = reconcileRestoreState({
      manifest: mini,
      ledgerRows: [],
      sqlByFilename: mini.sqlByFilename,
      expected,
      vendorHistory: { status: "absent", versions: [] },
      catalog: {
        status: "observed",
        tables: [{ schema: expected.tables[0].schema, name: expected.tables[0].name }],
        policies: [],
      },
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("PARTIAL_SCHEMA");
    expect(decision.autoRetry).toBe(false);
  });

  it("unknown migration state blocks continuation", () => {
    const mini = miniManifest();
    const expected = extractExpectedObjects(mini.sqlByFilename);
    const decision = reconcileRestoreState({
      manifest: mini,
      ledgerRows: [],
      sqlByFilename: mini.sqlByFilename,
      expected,
      vendorHistory: { status: "absent", versions: [] },
      catalog: {
        status: "observed",
        tables: expected.tables.map((t: any) => ({ schema: t.schema, name: t.name })),
        policies: [],
      },
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("UNKNOWN_MIGRATION_STATE");
    expect(decision.autoRetry).toBe(false);
  });

  it("execute does not treat ledger-only already_complete as success", async () => {
    const mini = miniManifest();
    const rows = mini.files.map((f) => ({
      filename: f.filename,
      status: LEDGER_STATUS.SUCCEEDED,
      completed_at: new Date().toISOString(),
      content_checksum: f.sha256,
      source_commit: PINNED_SOURCE_COMMIT,
      manifest_id: mini.manifestId,
    }));
    const result = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector: createMockConnector(),
      ledger: createMemoryLedger(rows),
      ...executeHarness(),
    });
    expect(result.ok).toBe(false);
    expect(result.alreadyComplete).not.toBe(true);
    expect(result.decision.reason).toBe("LEDGER_SCHEMA_ABSENT");
    expect(result.retried).toBe(false);
  });

  it("unexpected catalog objects are reported and block fresh_apply", () => {
    const mini = miniManifest();
    const decision = reconcileRestoreState({
      manifest: mini,
      ledgerRows: [],
      sqlByFilename: mini.sqlByFilename,
      vendorHistory: { status: "absent", versions: [] },
      catalog: {
        status: "observed",
        tables: [{ schema: "public", name: "surprise_table" }],
        policies: [],
      },
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_UNEXPECTED_OBJECTS");
    expect(decision.unexpectedTables).toEqual([
      expect.objectContaining({ name: "surprise_table" }),
    ]);
  });

  it("already_complete requires ledger, vendor history, and catalog agreement", () => {
    const mini = miniManifest();
    const expected = extractExpectedObjects(mini.sqlByFilename);
    expect(expected.securityProof).toBe(false);
    const rows = mini.files.map((f) => ({
      filename: f.filename,
      status: LEDGER_STATUS.SUCCEEDED,
      completed_at: new Date().toISOString(),
      content_checksum: f.sha256,
      source_commit: PINNED_SOURCE_COMMIT,
      manifest_id: mini.manifestId,
    }));
    const decision = reconcileRestoreState({
      manifest: mini,
      ledgerRows: rows,
      sqlByFilename: mini.sqlByFilename,
      expected,
      vendorHistory: {
        status: "available",
        versions: mini.files.map((f) => f.filename.slice(0, 14)),
      },
      catalog: {
        ...completeEmptyCatalog(),
        tables: expected.tables.map((t: { schema: string; name: string }) =>
          observedPublicTable(t.name, { schema: t.schema }),
        ),
        policies: expected.policies.map((p: { name: string; table: string }) => ({ name: p.name, table: p.table })),
      },
    });
    expect(decision.action).toBe("already_complete");
    expect(decision.schemaExistence).toBe(true);
    expect(decision.securityProof).toBe(false);
  });

  it("pinned 71-file source, transport order, and production refusal remain intact", () => {
    expect(approved.count).toBe(71);
    expect(approved.sourceCommit).toBe(PINNED_SOURCE_COMMIT);
    expect(approved.sourceTree).toBe(PINNED_SOURCE_TREE);
    expect(approved.files[58].filename).toBe(TRANSPORT_FIRST);
    expect(approved.files[68].filename).toBe(TRANSPORT_SECOND);
    expect(gitLoaded.count).toBe(71);
    expect(() => assertStagingTarget(PRODUCTION_URL)).toThrow(/TARGET_PRODUCTION_REF/);
    const sqlByFilename = Object.fromEntries(
      gitLoaded.loaded.map((f: any) => [f.filename, f.bytes.toString("utf8")]),
    );
    const expected = extractExpectedObjects(sqlByFilename);
    expect(expected.tableCount).toBeGreaterThan(50);
    expect(expected.nonIdempotentCreateTable).toBeGreaterThan(0);
    expect(expected.existenceOnly).toBe(false);
    expect(expected.schemaEquivalence).toBe(false);
    expect(expected.securityProof).toBe(false);
    expect(expected.comparedObjectClasses).toEqual(
      expect.arrayContaining(["tables", "columns", "policies", "functions", "triggers", "grants"]),
    );
  });

  it("offline test mode cannot open a database connection", async () => {
    expect(createMockConnector().allowNetwork).toBe(false);
    expect(() =>
      createLiveConnector({
        allowNetwork: false,
        connectionString: STAGING_POOLER_URL,
        env: stagingEnv(),
      }),
    ).toThrow(/NETWORK_DISABLED/);
    expect(() =>
      createLiveConnector({
        allowNetwork: true,
        connectionString: STAGING_POOLER_URL,
        env: stagingEnv(),
      }),
    ).toThrow(/LIVE_CONNECTOR_NOT_AUTHORIZED/);
    expect(liveConnectorPlan().constructsClient).toBe(false);
    expect(liveConnectorPlan().callsConnect).toBe(false);
    const cfg = buildPinnedClientConfig(STAGING_POOLER_URL, stagingEnv());
    expect(cfg.config).not.toHaveProperty("connectionString");
  });

  it("a fake advisory lock cannot satisfy the live-execution capability", async () => {
    const stub = {
      kind: "advisory",
      authenticity: LOCK_AUTHENTICITY.POSTGRES_SESSION,
      liveCapable: true,
      async acquire() {
        return { ok: true };
      },
      async probe() {
        return { ok: true };
      },
      async release() {
        return { ok: true };
      },
    };
    expect(isAuthenticLockController(stub)).toBe(false);
    expect(() => assertTrustedLockController(stub)).toThrow(/LOCK_CONTROLLER_UNTRUSTED/);
    expect(() => createLivePostgresLockSession()).toThrow(/LIVE_LOCK_SESSION_NOT_AUTHORIZED/);
    expect(() =>
      createAdvisoryLock({
        session: createFakeAdvisorySession(createLockRegistry()),
        authenticity: LOCK_AUTHENTICITY.POSTGRES_SESSION,
      }),
    ).toThrow(/LIVE_LOCK_SESSION_NOT_AUTHORIZED/);

    const official = createAdvisoryLock({
      session: createFakeAdvisorySession(createLockRegistry()),
      owner: "offline",
    });
    expect(official.authenticity).toBe(LOCK_AUTHENTICITY.FAKE_OFFLINE);
    expect(official.liveCapable).toBe(false);
    expect(() => assertTrustedLockController(official, { requireLiveCapable: true })).toThrow(
      /LOCK_LIVE_CAPABILITY_UNSATISFIED/,
    );

    const mini = miniManifest();
    await expect(
      runRestore({
        mode: "execute",
        env: stagingEnv(),
        manifest: mini,
        sqlByFilename: mini.sqlByFilename,
        connector: createMockConnector(),
        ledger: createMemoryLedger(),
        ...executeHarness({ lock: stub }),
      }),
    ).rejects.toThrow(/LOCK_CONTROLLER_UNTRUSTED/);

    await expect(
      runRestore({
        mode: "execute",
        env: stagingEnv(),
        manifest: mini,
        sqlByFilename: mini.sqlByFilename,
        connector: { ...createMockConnector(), allowNetwork: true, kind: "live" },
        ledger: createMemoryLedger(),
        ...executeHarness({ lock: official, allowNetwork: true }),
      }),
    ).rejects.toThrow(/LOCK_LIVE_CAPABILITY_UNSATISFIED/);
  });

  it("malformed, missing, and disconnected lock controllers are refused", async () => {
    const mini = miniManifest();
    await expect(
      runRestore({
        mode: "execute",
        env: stagingEnv(),
        manifest: mini,
        sqlByFilename: mini.sqlByFilename,
        connector: createMockConnector(),
        ledger: createMemoryLedger(),
        ...executeHarness({ lock: undefined }),
      }),
    ).rejects.toThrow(/LOCK_REQUIRED/);

    await expect(
      runRestore({
        mode: "execute",
        env: stagingEnv(),
        manifest: mini,
        sqlByFilename: mini.sqlByFilename,
        connector: createMockConnector(),
        ledger: createMemoryLedger(),
        ...executeHarness({ lock: { kind: "advisory" } }),
      }),
    ).rejects.toThrow(/LOCK_CONTROLLER_UNTRUSTED/);

    const copy = { ...createAdvisoryLock({ session: createFakeAdvisorySession(createLockRegistry()) }) };
    expect(isAuthenticLockController(copy)).toBe(false);

    const registry = createLockRegistry();
    const session = createFakeAdvisorySession(registry);
    const lock = createAdvisoryLock({ session, owner: "disc" });
    await lock.acquire();
    session.simulateConnectionLoss();
    await expect(lock.probe()).rejects.toThrow(/LOCK_CONNECTION_LOST/);
  });

  it("manifest, offline, and preflight modes never construct a live client", async () => {
    const Original = pg.Client;
    let constructed = 0;
    const Spy = function SpyClient(this: unknown, ...args: unknown[]) {
      constructed += 1;
      return new Original(...(args as []));
    } as unknown as typeof pg.Client;
    Spy.prototype = Original.prototype;
    Object.setPrototypeOf(Spy, Original);
    pg.Client = Spy;
    try {
      const manifest = await cliMain(["--mode=manifest"], { env: {} });
      expect(manifest.ok).toBe(true);
      const offline = await cliMain(["--mode=offline"], { env: stagingEnv() });
      expect(offline.ok).toBe(true);
      const preflight = await cliMain(["--mode=preflight"], { env: stagingEnv() });
      expect(preflight.ok).toBe(true);
      const execute = await cliMain(
        [
          "--mode=execute",
          `--confirm-staging-ref=${STAGING_PROJECT_REF}`,
          `--confirm-source-commit=${PINNED_SOURCE_COMMIT}`,
          "--i-authorize-staging-restore",
          "--allow-network",
        ],
        { env: stagingEnv() },
      );
      expect(execute.ok).toBe(false);
      expect(execute.code).toBe("LIVE_EXECUTE_NOT_ENABLED");
      expect(constructed).toBe(0);
      expect(() =>
        createLiveConnector({
          allowNetwork: true,
          connectionString: STAGING_POOLER_URL,
          env: stagingEnv(),
        }),
      ).toThrow(/LIVE_CONNECTOR_NOT_AUTHORIZED/);
      expect(constructed).toBe(0);
    } finally {
      pg.Client = Original;
    }
  });

  it("missing required policy blocks already_complete", () => {
    const rich = richManifest();
    const expected = extractExpectedObjects(rich.sqlByFilename);
    expect(expected.policyCount).toBe(1);
    const catalog = observedCatalogFromExpected(expected);
    catalog.policies = [];
    const decision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_POLICY_MISSING");
    expect(decision.securityProof).toBe(false);
  });

  it("incorrect policy command or role blocks already_complete", () => {
    const rich = richManifest();
    const expected = extractExpectedObjects(rich.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    catalog.policies = catalog.policies.map((p: any) => ({ ...p, command: "ALL", roles: ["public"] }));
    const decision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_POLICY_MISMATCH");
  });

  it("required constraint or column mismatch blocks already_complete", () => {
    const rich = richManifest();
    const expected = extractExpectedObjects(rich.sqlByFilename);
    expect(expected.tables[0].columns.map((c: { name: string }) => c.name)).toEqual(
      expect.arrayContaining(["id", "ssn", "name"]),
    );
    const catalog = observedCatalogFromExpected(expected);
    catalog.tables[0].columns = catalog.tables[0].columns.map((c: { name: string; type: string }) =>
      c.name === "ssn" ? { ...c, type: "integer", nullable: true } : c,
    );
    const columnDecision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog,
    });
    expect(columnDecision.ok).toBe(false);
    expect(columnDecision.reason).toBe("CATALOG_COLUMN_MISMATCH");

    const catalog2 = observedCatalogFromExpected(expected);
    catalog2.tables[0].constraints = [];
    const constraintDecision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog: catalog2,
    });
    expect(constraintDecision.ok).toBe(false);
    expect(constraintDecision.reason).toBe("CATALOG_CONSTRAINT_MISMATCH");
  });

  it("sensitive-column grant mismatch blocks already_complete", () => {
    const rich = richManifest();
    const expected = extractExpectedObjects(rich.sqlByFilename);
    expect(expected.tables[0].columnGrants.length).toBeGreaterThan(0);
    const catalog = observedCatalogFromExpected(expected);
    catalog.tables[0].columnGrants = [];
    const decision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_COLUMN_GRANT_MISMATCH");
  });

  it("missing function or trigger blocks already_complete where required", () => {
    const rich = richManifest();
    const expected = extractExpectedObjects(rich.sqlByFilename);
    expect(expected.functionCount).toBe(1);
    expect(expected.triggerCount).toBe(1);
    const noFn = observedCatalogFromExpected(expected);
    noFn.functions = [];
    const fnDecision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog: noFn,
    });
    expect(fnDecision.ok).toBe(false);
    expect(fnDecision.reason).toBe("CATALOG_FUNCTION_MISSING");

    const noTrig = observedCatalogFromExpected(expected);
    noTrig.triggers = [];
    const trigDecision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog: noTrig,
    });
    expect(trigDecision.ok).toBe(false);
    expect(trigDecision.reason).toBe("CATALOG_TRIGGER_MISSING");
  });

  it("unexpected schema state blocks already_complete", () => {
    const rich = richManifest();
    const expected = extractExpectedObjects(rich.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    catalog.tables.push(observedPublicTable("surprise_table"));
    const decision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_UNEXPECTED_OBJECTS");
  });

  it("unknown catalog requirements block completion", () => {
    const sql = `
DO $$ BEGIN
  EXECUTE 'CREATE TABLE ' || chr(97);
END $$;
`;
    const manifest = {
      manifestId: "test-unverified",
      sourceCommit: PINNED_SOURCE_COMMIT,
      sourceTree: PINNED_SOURCE_TREE,
      count: 1,
      files: [{ seq: 1, filename: "20260101000000_dyn.sql", sha256: digest(sql) }],
      sqlByFilename: { "20260101000000_dyn.sql": sql },
    };
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    expect(expected.unverifiedCount).toBeGreaterThan(0);
    const decision = reconcileRestoreState({
      manifest,
      ledgerRows: completeLedger(manifest),
      sqlByFilename: manifest.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: ["20260101000000"] },
      catalog: { status: "observed", tables: [], policies: [], functions: [], triggers: [], indexes: [] },
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_REQUIREMENTS_UNVERIFIED");
  });

  it("connection cleanup after connection failure", async () => {
    const mini = miniManifest();
    const connector = createMockConnector({
      onOpen: ({ label }: any) => {
        if (label.includes(TRANSPORT_FIRST)) {
          throw Object.assign(new Error("connect-failed"), { code: "CONNECT_FAILED" });
        }
      },
    });
    const result = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger: createMemoryLedger(),
      ...executeHarness(),
    });
    expect(result.ok).toBe(false);
    expect(result.failed.error).toMatch(/connect-failed/);
    expect(connector.closed).toEqual(connector.opened.map((o: any) => o.id));
    expect(connector.closed.length).toBeGreaterThan(0);
  });

  it("connection cleanup after migration failure", async () => {
    const mini = miniManifest();
    const connector = createMockConnector({
      onQuery: ({ sql }: any) => {
        if (String(sql).includes("CREATE TABLE b")) {
          throw Object.assign(new Error("apply-failed-b"), { code: "APPLY_FAILED" });
        }
        return { rows: [], rowCount: 0 };
      },
    });
    const result = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger: createMemoryLedger(),
      ...executeHarness(),
    });
    expect(result.ok).toBe(false);
    expect(result.failed.error).toMatch(/apply-failed-b/);
    expect(connector.closed).toEqual(connector.opened.map((o: any) => o.id));
  });

  it("cleanup errors preserve the original migration error", async () => {
    const mini = miniManifest();
    const connector = createMockConnector({
      onQuery: ({ sql }: any) => {
        if (String(sql).includes("CREATE TABLE a")) {
          throw Object.assign(new Error("original-apply-error"), { code: "APPLY_FAILED" });
        }
        return { rows: [], rowCount: 0 };
      },
      onClose: () => {
        throw new Error("close-also-failed");
      },
    });
    const result = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger: createMemoryLedger(),
      ...executeHarness(),
    });
    expect(result.ok).toBe(false);
    expect(result.failed.error).toMatch(/original-apply-error/);
    expect(result.failed.error).not.toMatch(/close-also-failed/);
    expect(result.failed.closeError).toMatch(/close-also-failed/);
    expect(connector.closed).toEqual(connector.opened.map((o: any) => o.id));
    expect(result.retried).toBe(false);
    expect(result.autoRetry).toBe(false);
  });

  it("execute mode still returns LIVE_EXECUTE_NOT_ENABLED with every confirmation flag", async () => {
    const cli = await cliMain(
      [
        "--mode=execute",
        `--confirm-staging-ref=${STAGING_PROJECT_REF}`,
        `--confirm-source-commit=${PINNED_SOURCE_COMMIT}`,
        "--i-authorize-staging-restore",
        "--allow-network",
      ],
      { env: stagingEnv() },
    );
    expect(cli.ok).toBe(false);
    expect(cli.code).toBe("LIVE_EXECUTE_NOT_ENABLED");
    expect(cli.exitCode).toBe(2);
  });

  function identitySql() {
    return `
CREATE TABLE public.orgs (id uuid PRIMARY KEY, name text UNIQUE);
CREATE TABLE public.people (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.orgs (id) ON DELETE CASCADE,
  name text CHECK (name <> '')
);
CREATE FUNCTION public.touch_people(a integer) RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1; $$;
CREATE FUNCTION public.touch_people(a text) RETURNS text LANGUAGE sql SECURITY INVOKER AS $$ SELECT a; $$;
GRANT EXECUTE ON FUNCTION public.touch_people(integer) TO authenticated;
CREATE POLICY people_self ON public.people AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (id = auth.uid());
`.trim();
  }

  function identityManifest() {
    const sql = identitySql();
    return {
      manifestId: "test-identity-contract",
      sourceCommit: PINNED_SOURCE_COMMIT,
      sourceTree: PINNED_SOURCE_TREE,
      count: 1,
      files: [{ seq: 1, filename: "20260101000000_identity.sql", sha256: digest(sql) }],
      sqlByFilename: { "20260101000000_identity.sql": sql },
    };
  }

  function completeDecision(
    manifest: Omit<ReturnType<typeof identityManifest>, "sqlByFilename"> & { sqlByFilename: Record<string, string> },
    catalog: Record<string, unknown>) {
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    return {
      expected,
      decision: reconcileRestoreState({
        manifest,
        ledgerRows: completeLedger(manifest),
        sqlByFilename: manifest.sqlByFilename,
        expected,
        vendorHistory: { status: "available", versions: manifest.files.map((f) => f.filename.slice(0, 14)) },
        catalog,
      }),
    };
  }

  it("PRIMARY KEY (id) does not match PRIMARY KEY (ssn)", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    const people = catalog.tables.find((t: { name: string }) => t.name === "people");
    people.constraints = people.constraints.map((c: { kind: string }) =>
      c.kind === "PRIMARY KEY" ? { ...c, columns: ["ssn"], spec: "(ssn)" } : c,
    );
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_CONSTRAINT_MISMATCH");
  });

  it("a different CHECK expression does not match", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    const people = catalog.tables.find((t: { name: string }) => t.name === "people");
    people.constraints = people.constraints.map((c: { kind: string }) =>
      c.kind === "CHECK" ? { ...c, checkExpression: "false", spec: "CHECK (false)" } : c,
    );
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_CONSTRAINT_MISMATCH");
  });

  it("a foreign key pointing to a different table does not match", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    const people = catalog.tables.find((t: { name: string }) => t.name === "people");
    people.constraints = people.constraints.map((c: { kind: string }) =>
      c.kind === "FOREIGN KEY"
        ? { ...c, referencedTable: "other", referencedSchema: "public", spec: "(org_id) REFERENCES public.other (id)" }
        : c,
    );
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_CONSTRAINT_MISMATCH");
  });

  it("constraint column order differences are detected", () => {
    const sql = "CREATE TABLE public.pair (a int, b int, PRIMARY KEY (a, b));";
    const manifest = {
      manifestId: "test-pk-order",
      sourceCommit: PINNED_SOURCE_COMMIT,
      sourceTree: PINNED_SOURCE_TREE,
      count: 1,
      files: [{ seq: 1, filename: "20260101000000_pair.sql", sha256: digest(sql) }],
      sqlByFilename: { "20260101000000_pair.sql": sql },
    };
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    catalog.tables[0].constraints = catalog.tables[0].constraints.map((c: { kind: string }) =>
      c.kind === "PRIMARY KEY" ? { ...c, columns: ["b", "a"], spec: "(b, a)" } : c,
    );
    const decision = reconcileRestoreState({
      manifest,
      ledgerRows: completeLedger(manifest),
      sqlByFilename: manifest.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: ["20260101000000"] },
      catalog,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_CONSTRAINT_MISMATCH");
  });

  it("a missing required constraint cannot produce already_complete", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    catalog.tables.find((t: { name: string }) => t.name === "people").constraints = [];
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_CONSTRAINT_MISMATCH");
  });

  it("unknown constraint representations fail closed", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    const people = catalog.tables.find((t: { name: string }) => t.name === "people");
    people.constraints = people.constraints.map((c: { kind: string }) =>
      c.kind === "CHECK" ? { kind: "EXCLUDE", spec: "USING gist (name WITH &&)", table: "public.people" } : c,
    );
    const comparison = compareCatalog(expected, catalog);
    expect(catalogBlocksCompletion(comparison)).toBe("CATALOG_CONSTRAINT_UNVERIFIED");
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_CONSTRAINT_UNVERIFIED");
  });

  it("same-name functions with different signatures do not match", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    expect(expected.functionCount).toBe(2);
    expect(expected.functions.map((f: { key: string }) => f.key)).toEqual(
      expect.arrayContaining(["public.touch_people(integer)", "public.touch_people(text)"]),
    );
    const catalog = observedCatalogFromExpected(expected);
    catalog.functions = catalog.functions.filter((f: { inputTypes: string[] }) =>
      (f.inputTypes ?? []).includes("integer"),
    );
    catalog.functions.push({
      schema: "public",
      name: "touch_people",
      args: "(uuid)",
      inputTypes: ["uuid"],
      security: "DEFINER",
      returns: "integer",
      volatility: "VOLATILE",
    });
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.ok).toBe(false);
    expect(["CATALOG_FUNCTION_MISSING", "CATALOG_UNEXPECTED_OBJECTS"]).toContain(decision.reason);
  });

  it("changed function argument type, return type, and security block already_complete", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    catalog.functions = catalog.functions.map((f: { key: string; inputTypes: string[] }) =>
      functionIdentityKey(f) === "public.touch_people(integer)"
        ? { ...f, inputTypes: ["text"], args: "(text)", key: "public.touch_people(text)" }
        : f,
    );
    expect(completeDecision(manifest, catalog).decision.reason).toMatch(
      /CATALOG_FUNCTION_MISSING|CATALOG_UNEXPECTED_OBJECTS/,
    );

    const catalogReturn = observedCatalogFromExpected(expected);
    catalogReturn.functions = catalogReturn.functions.map((f: { key: string }) =>
      functionIdentityKey(f) === "public.touch_people(integer)" ? { ...f, returns: "text" } : f,
    );
    expect(completeDecision(manifest, catalogReturn).decision.reason).toBe("CATALOG_FUNCTION_MISMATCH");

    const catalogSec = observedCatalogFromExpected(expected);
    catalogSec.functions = catalogSec.functions.map((f: { key: string }) =>
      functionIdentityKey(f) === "public.touch_people(integer)" ? { ...f, security: "INVOKER" } : f,
    );
    expect(completeDecision(manifest, catalogSec).decision.reason).toBe("CATALOG_FUNCTION_SECURITY_MISMATCH");
  });

  it("unexpected function definitions block already_complete", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    catalog.functions.push({
      schema: "public",
      name: "surprise_fn",
      args: "()",
      inputTypes: [],
      security: "INVOKER",
      returns: "void",
    });
    expect(completeDecision(manifest, catalog).decision.ok).toBe(false);
    expect(completeDecision(manifest, catalog).decision.reason).toBe("CATALOG_UNEXPECTED_OBJECTS");
  });

  it("function grants are compared and mismatch fails closed", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    expect(expected.functionGrants.length).toBeGreaterThan(0);
    const catalog = observedCatalogFromExpected(expected);
    catalog.functionGrants = [];
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_FUNCTION_GRANT_MISMATCH");
  });

  it("policy permissive versus restrictive mode is compared", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    expect(expected.policies[0].permissive).toBe(false);
    const catalog = observedCatalogFromExpected(expected);
    catalog.policies = catalog.policies.map((p: { permissive: boolean }) => ({ ...p, permissive: true }));
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_POLICY_MISMATCH");
  });

  it("catalog observe plan represents the required contract classes", () => {
    expect(CATALOG_OBSERVE_SQL.constraints).toMatch(/pg_constraint/);
    expect(CATALOG_OBSERVE_SQL.functions).toMatch(/pg_get_function_identity_arguments/);
    expect(CATALOG_OBSERVE_SQL.policies).toMatch(/polpermissive/);
    expect(CATALOG_OBSERVE_SQL.policies).toMatch(/polroles/);
    expect(CATALOG_OBSERVE_SQL.functionGrants).toMatch(/proacl/);
    expect(CATALOG_OBSERVE_SQL.functionGrants).toMatch(/acldefault\('f'/);
    expect(CATALOG_OBSERVE_SQL.functionGrants).toMatch(/grantable/);
    expect(OBSERVE_SQL_FIELD_MAP.policies.sql).toEqual(
      expect.arrayContaining(["permissive", "command", "roles", "using", "with_check"]),
    );
    expect(OBSERVE_SQL_FIELD_MAP.constraints.sql).toEqual(
      expect.arrayContaining(["referenced_columns", "columns", "kind"]),
    );
    expect(CATALOG_OBSERVE_SQL.columnGrants).toMatch(/attacl/);
    expect(CATALOG_OBSERVE_SQL.tableGrants).toMatch(/relacl/);
    expect(CATALOG_OBSERVE_SQL.indexes).toMatch(/pg_index/);
    expect(CATALOG_OBSERVE_SQL.triggers).toMatch(/pg_trigger/);
    expect(CATALOG_OBSERVE_SQL.tables).toMatch(/relrowsecurity/);
    expect(CATALOG_OBSERVE_SQL.storageBuckets).toMatch(/storage\.buckets/);
    expect(CATALOG_OBSERVE_SQL.note).toMatch(/does not execute/);
  });

  it("forged, mutated, copied, and injected lock controllers cannot satisfy live capability", async () => {
    const official = createAdvisoryLock({
      session: createFakeAdvisorySession(createLockRegistry()),
      owner: "offline",
    });
    expect(official.liveCapable).toBe(false);
    expect(isLiveCapableLockController(official)).toBe(false);
    expect(() => {
      official.liveCapable = true;
    }).toThrow();
    expect(() => {
      official.authenticity = LOCK_AUTHENTICITY.POSTGRES_SESSION;
    }).toThrow();
    expect(official.liveCapable).toBe(false);
    expect(() => assertTrustedLockController(official, { requireLiveCapable: true })).toThrow(
      /LOCK_LIVE_CAPABILITY_UNSATISFIED/,
    );

    const assigned = Object.assign({}, official, {
      liveCapable: true,
      authenticity: LOCK_AUTHENTICITY.POSTGRES_SESSION,
    });
    expect(isAuthenticLockController(assigned)).toBe(false);
    expect(() => assertTrustedLockController(assigned, { requireLiveCapable: true })).toThrow(
      /LOCK_CONTROLLER_UNTRUSTED/,
    );

    const forged = {
      kind: "advisory",
      authenticity: LOCK_AUTHENTICITY.POSTGRES_SESSION,
      liveCapable: true,
      acquire: async () => ({ ok: true }),
      probe: async () => ({ ok: true }),
      release: async () => ({ ok: true }),
    };
    expect(() => assertTrustedLockController(forged, { requireLiveCapable: true })).toThrow(
      /LOCK_CONTROLLER_UNTRUSTED/,
    );
    expect(() => createLivePostgresLockSession()).toThrow(/LIVE_LOCK_SESSION_NOT_AUTHORIZED/);
    expect(isLiveCapableLockController(official)).toBe(false);

    const mini = miniManifest();
    await expect(
      runRestore({
        mode: "execute",
        env: stagingEnv(),
        manifest: mini,
        sqlByFilename: mini.sqlByFilename,
        connector: { ...createMockConnector(), allowNetwork: true, kind: "live" },
        ledger: createMemoryLedger(),
        ...executeHarness({ lock: official, allowNetwork: true }),
      }),
    ).rejects.toThrow(/LOCK_LIVE_CAPABILITY_UNSATISFIED/);
  });

  it("close-after-success is an uncertain outcome with no automatic retry", async () => {
    const mini = miniManifest();
    const connector = createMockConnector({
      onClose: ({ label }: any) => {
        if (label.includes("20260101000000_a.sql")) throw new Error("close-after-commit");
      },
    });
    const ledger = createMemoryLedger();
    const first = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger,
      ...executeHarness(),
    });
    expect(first.ok).toBe(false);
    expect(first.failed.code).toBe("TX_OUTCOME_UNKNOWN");
    expect(first.failed.phase).toBe("apply-close");
    expect(first.retried).toBe(false);
    expect(first.autoRetry).toBe(false);
    expect(connector.closed).toEqual(connector.opened.map((o: any) => o.id));

    const second = await runRestore({
      mode: "execute",
      env: stagingEnv(),
      manifest: mini,
      sqlByFilename: mini.sqlByFilename,
      connector,
      ledger,
      ...executeHarness(),
    });
    expect(second.ok).toBe(false);
    expect(second.retried).toBe(false);
    expect(second.autoRetry).toBe(false);
    expect(["LEDGER_AMBIGUOUS", "LEDGER_INCOMPLETE", "LEDGER_PARTIAL_PREFIX"]).toContain(
      second.decision.reason,
    );
  });

  it("createSqlLedger bootstrap, success, and failure stay on the mock connector", async () => {
    const connector = createMockConnector();
    const ledger = createSqlLedger(connector);
    await ledger.bootstrap();
    expect(connector.opened.some((o: any) => o.label === "ledger-bootstrap")).toBe(true);
    expect(connector.queries.some((q: { sql: string }) => /sherivs_staging_ledger/.test(q.sql))).toBe(true);
    expect(connector.closed).toEqual(connector.opened.map((o: any) => o.id));

    await ledger.recordStarted({
      seq: 1,
      filename: "20260101000000_a.sql",
      content_checksum: "a".repeat(64),
      source_commit: PINNED_SOURCE_COMMIT,
      manifest_id: "sql-ledger",
      attempt_id: "attempt-1",
    });
    expect(connector.queries.some((q: { sql: string }) => /INSERT INTO/.test(q.sql))).toBe(true);

    await connector.withConnection("apply", async (client: any) => {
      await ledger.markSucceededInTransaction(client, "20260101000000_a.sql", "attempt-1");
    });
    expect(connector.queries.some((q: { sql: string }) => /SET status/.test(q.sql) || /SUCCEEDED|succeeded/.test(q.sql))).toBe(
      true,
    );

    const failing = createMockConnector({
      onQuery: ({ sql }: any) => {
        if (String(sql).includes("INSERT INTO")) {
          throw Object.assign(new Error("original-sql-ledger-error"), { code: "LEDGER_WRITE_FAILED" });
        }
        return { rows: [{ id: "row-1" }], rowCount: 1 };
      },
      onClose: () => {
        throw new Error("close-also-failed");
      },
    });
    const failingLedger = createSqlLedger(failing);
    await expect(
      failingLedger.recordStarted({
        seq: 1,
        filename: "20260101000000_a.sql",
        content_checksum: "a".repeat(64),
        source_commit: PINNED_SOURCE_COMMIT,
        manifest_id: "sql-ledger",
        attempt_id: "attempt-2",
      }),
    ).rejects.toMatchObject({ message: expect.stringMatching(/original-sql-ledger-error/) });
    expect(failing.closed).toEqual(failing.opened.map((o: any) => o.id));
  });

  it("implicit-PK matching explicit referenced primary key can complete", () => {
    const sql = `
CREATE TABLE public.people (id uuid PRIMARY KEY, ssn text UNIQUE);
CREATE TABLE public.orders (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.people
);
`.trim();
    const manifest = {
      manifestId: "review-implicit-match",
      sourceCommit: PINNED_SOURCE_COMMIT,
      sourceTree: PINNED_SOURCE_TREE,
      count: 1,
      files: [{ seq: 1, filename: "20260101000000_implicit.sql", sha256: digest(sql) }],
      sqlByFilename: { "20260101000000_implicit.sql": sql },
    };
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const fk = expected.tables.find((t: { name: string }) => t.name === "orders").constraints.find(
      (c: { kind: string }) => c.kind === "FOREIGN KEY",
    );
    expect(fk.referencedColumnsMode).toBe("implicit-pk");
    const catalog = observedCatalogFromExpected(expected);
    catalog.tables.find((t: { name: string }) => t.name === "orders").constraints = catalog.tables
      .find((t: { name: string }) => t.name === "orders")
      .constraints.map((c: { kind: string }) =>
        c.kind === "FOREIGN KEY"
          ? {
              kind: "FOREIGN KEY",
              table: "public.orders",
              columns: ["user_id"],
              referencedSchema: "public",
              referencedTable: "people",
              referencedColumns: ["id"],
              referencedColumnsMode: "explicit",
              onDelete: "NO ACTION",
              onUpdate: "NO ACTION",
              deferrable: false,
              initiallyDeferred: false,
            }
          : c,
      );
    const decision = reconcileRestoreState({
      manifest,
      ledgerRows: completeLedger(manifest),
      sqlByFilename: manifest.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: ["20260101000000"] },
      catalog,
    });
    expect(decision.action).toBe("already_complete");
    expect(decision.schemaEquivalence).toBe(false);
  });

  it("implicit-PK versus observed explicit wrong key refuses already_complete", () => {
    const sql = `
CREATE TABLE public.people (id uuid PRIMARY KEY, ssn text UNIQUE);
CREATE TABLE public.orders (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.people
);
`.trim();
    const manifest = {
      manifestId: "review-implicit-wrong",
      sourceCommit: PINNED_SOURCE_COMMIT,
      sourceTree: PINNED_SOURCE_TREE,
      count: 1,
      files: [{ seq: 1, filename: "20260101000000_implicit.sql", sha256: digest(sql) }],
      sqlByFilename: { "20260101000000_implicit.sql": sql },
    };
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    catalog.tables.find((t: { name: string }) => t.name === "orders").constraints = catalog.tables
      .find((t: { name: string }) => t.name === "orders")
      .constraints.map((c: { kind: string }) =>
        c.kind === "FOREIGN KEY"
          ? {
              kind: "FOREIGN KEY",
              table: "public.orders",
              columns: ["user_id"],
              referencedSchema: "public",
              referencedTable: "people",
              referencedColumns: ["ssn"],
              referencedColumnsMode: "explicit",
              onDelete: "NO ACTION",
              onUpdate: "NO ACTION",
              deferrable: false,
              initiallyDeferred: false,
            }
          : c,
      );
    const decision = reconcileRestoreState({
      manifest,
      ledgerRows: completeLedger(manifest),
      sqlByFilename: manifest.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: ["20260101000000"] },
      catalog,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_CONSTRAINT_MISMATCH");
  });

  it("missing referenced primary-key information fails closed as NOT_VERIFIED", () => {
    const sql = `
CREATE TABLE public.orders (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.people
);
`.trim();
    const manifest = {
      manifestId: "review-implicit-missing-pk",
      sourceCommit: PINNED_SOURCE_COMMIT,
      sourceTree: PINNED_SOURCE_TREE,
      count: 1,
      files: [{ seq: 1, filename: "20260101000000_implicit.sql", sha256: digest(sql) }],
      sqlByFilename: { "20260101000000_implicit.sql": sql },
    };
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    expect(
      resolveForeignKeyReferencedColumns(
        expected.tables[0].constraints.find((c: { kind: string }) => c.kind === "FOREIGN KEY"),
        expected.tables,
      ).unverified,
    ).toBe(true);
    const catalog = observedCatalogFromExpected(expected);
    const decision = reconcileRestoreState({
      manifest,
      ledgerRows: completeLedger(manifest),
      sqlByFilename: manifest.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: ["20260101000000"] },
      catalog,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_CONSTRAINT_UNVERIFIED");
  });

  it("composite implicit-PK order is compared against the referenced primary key", () => {
    const sql = `
CREATE TABLE public.people (a int, b int, PRIMARY KEY (a, b));
CREATE TABLE public.orders (
  a int,
  b int,
  FOREIGN KEY (a, b) REFERENCES public.people
);
`.trim();
    const expected = extractExpectedObjects({ "20260101000000_composite.sql": sql });
    const fk = expected.tables.find((t: { name: string }) => t.name === "orders").constraints.find(
      (c: { kind: string }) => c.kind === "FOREIGN KEY",
    );
    const match = constraintsEquivalent(
      fk,
      {
        kind: "FOREIGN KEY",
        table: "public.orders",
        columns: ["a", "b"],
        referencedSchema: "public",
        referencedTable: "people",
        referencedColumns: ["a", "b"],
        referencedColumnsMode: "explicit",
        onDelete: "NO ACTION",
        onUpdate: "NO ACTION",
      },
      "public.orders",
      { expectedTables: expected.tables, observedTables: expected.tables },
    );
    expect(match.match).toBe(true);
    const swapped = constraintsEquivalent(
      fk,
      {
        kind: "FOREIGN KEY",
        table: "public.orders",
        columns: ["a", "b"],
        referencedSchema: "public",
        referencedTable: "people",
        referencedColumns: ["b", "a"],
        referencedColumnsMode: "explicit",
        onDelete: "NO ACTION",
        onUpdate: "NO ACTION",
      },
      "public.orders",
      { expectedTables: expected.tables, observedTables: expected.tables },
    );
    expect(swapped.match).toBe(false);
    expect(swapped.unverified).toBe(false);
    expect(swapped.field).toBe("referencedColumns");
  });

  it("implicit-PK referenced schema or relation mismatch refuses already_complete", () => {
    const sql = `
CREATE TABLE public.people (id uuid PRIMARY KEY);
CREATE TABLE other.people (id uuid PRIMARY KEY);
CREATE TABLE public.orders (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.people
);
`.trim();
    const manifest = {
      manifestId: "review-implicit-schema",
      sourceCommit: PINNED_SOURCE_COMMIT,
      sourceTree: PINNED_SOURCE_TREE,
      count: 1,
      files: [{ seq: 1, filename: "20260101000000_implicit.sql", sha256: digest(sql) }],
      sqlByFilename: { "20260101000000_implicit.sql": sql },
    };
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    catalog.tables.find((t: { name: string }) => t.name === "orders").constraints = catalog.tables
      .find((t: { name: string }) => t.name === "orders")
      .constraints.map((c: { kind: string }) =>
        c.kind === "FOREIGN KEY"
          ? { ...c, referencedSchema: "other", referencedTable: "people", spec: "(user_id) REFERENCES other.people (id)" }
          : c,
      );
    const decision = reconcileRestoreState({
      manifest,
      ledgerRows: completeLedger(manifest),
      sqlByFilename: manifest.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: ["20260101000000"] },
      catalog,
    });
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe("CATALOG_CONSTRAINT_MISMATCH");
  });

  it("unknown foreign-key representation fails closed", () => {
    const unknown = normalizeConstraint(
      { kind: "FOREIGN KEY", spec: "REFERENCES", table: "public.orders" },
      "public.orders",
    );
    expect(unknown.unverified).toBe(true);
    const result = constraintsEquivalent(
      { kind: "FOREIGN KEY", spec: "(user_id) REFERENCES people", table: "public.orders" },
      { kind: "FOREIGN KEY", spec: "not-a-constraint", table: "public.orders" },
      "public.orders",
      { expectedTables: [], observedTables: [] },
    );
    expect(result.match).toBe(false);
    expect(result.unverified).toBe(true);
  });

  it("omitted required observation fields cannot produce already_complete", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);

    const omitType = observedCatalogFromExpected(expected);
    omitType.tables.find((t: { name: string }) => t.name === "people").columns = omitType.tables
      .find((t: { name: string }) => t.name === "people")
      .columns.map((c: { name: string }) => (c.name === "id" ? { name: "id", nullable: false } : c));
    expect(completeDecision(manifest, omitType).decision.reason).toBe("CATALOG_SHAPE_INCOMPLETE");

    const omitReturns = observedCatalogFromExpected(expected);
    omitReturns.functions = omitReturns.functions.map((f: { name: string; inputTypes?: string[] }) => {
      if (functionIdentityKey(f) !== "public.touch_people(integer)") return f;
      const { returns: _returns, ...rest } = f as { returns?: string };
      return rest;
    });
    expect(completeDecision(manifest, omitReturns).decision.reason).toBe("CATALOG_SHAPE_INCOMPLETE");

    const omitUsing = observedCatalogFromExpected(expected);
    omitUsing.policies = omitUsing.policies.map((p: Record<string, unknown>) => {
      const { using: _using, ...rest } = p;
      return rest;
    });
    expect(completeDecision(manifest, omitUsing).decision.reason).toBe("CATALOG_SHAPE_INCOMPLETE");

    const omitCommand = observedCatalogFromExpected(expected);
    omitCommand.policies = omitCommand.policies.map((p: Record<string, unknown>) => {
      const { command: _command, ...rest } = p;
      return rest;
    });
    expect(completeDecision(manifest, omitCommand).decision.reason).toBe("CATALOG_SHAPE_INCOMPLETE");

    const explicitNullUsing = observedCatalogFromExpected(expected);
    explicitNullUsing.policies = explicitNullUsing.policies.map((p: Record<string, unknown>) => ({
      ...p,
      using: null,
    }));
    expect(completeDecision(manifest, explicitNullUsing).decision.reason).toBe("CATALOG_POLICY_MISMATCH");
  });

  it("unexpected function grants and grant options refuse already_complete", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const extra = observedCatalogFromExpected(expected);
    extra.functionGrants = [
      ...extra.functionGrants,
      { function: "public.touch_people", args: "(integer)", roles: ["anon"], privileges: ["EXECUTE"] },
    ];
    expect(completeDecision(manifest, extra).decision.reason).toBe("CATALOG_FUNCTION_GRANT_MISMATCH");

    const grantable = observedCatalogFromExpected(expected);
    grantable.functionGrants = grantable.functionGrants.map((g: Record<string, unknown>) => ({
      ...g,
      grantable: true,
    }));
    expect(completeDecision(manifest, grantable).decision.reason).toBe("CATALOG_FUNCTION_GRANT_MISMATCH");
  });

  it("observationState distinguishes omitted, absent, empty, and present values", () => {
    expect(observationState({}, "using", { allowAbsent: true }).state).toBe("missing");
    expect(observationState({ using: null }, "using", { allowAbsent: true }).state).toBe("absent");
    expect(observationState({ using: "" }, "using", { allowAbsent: true }).state).toBe("unknown");
    expect(observationState({ using: "id = auth.uid()" }, "using", { allowAbsent: true }).state).toBe("present");
    expect(observationState({ type: null }, "type").state).toBe("missing");
  });

  it("mapObservedRowsToCatalog marks incomplete observe bags and preserves SQL NULL expressions", () => {
    const incomplete = mapObservedRowsToCatalog({ tables: [] });
    expect(incomplete.shapeIncomplete).toEqual(
      expect.arrayContaining(["columns", "constraints", "functions", "policies", "functionGrants"]),
    );
    const complete = mapObservedRowsToCatalog({
      tables: [{ schema: "public", name: "people", rls_enabled: true, rls_forced: false }],
      columns: [{ schema: "public", table: "people", name: "id", type: "uuid", nullable: false }],
      constraints: [
        {
          schema: "public",
          table: "people",
          name: "people_pkey",
          kind: "PRIMARY KEY",
          definition: "PRIMARY KEY (id)",
          columns: ["id"],
        },
      ],
      functions: [],
      policies: [
        {
          schema: "public",
          table: "people",
          name: "people_self",
          permissive: false,
          command: "SELECT",
          roles: ["authenticated"],
          using: "id = auth.uid()",
          with_check: null,
        },
      ],
      functionGrants: [],
      triggers: [],
      indexes: [],
      tableGrants: [],
      columnGrants: [],
      storageBuckets: [],
      vendorHistory: [],
    });
    expect(complete.shapeIncomplete).toEqual([]);
    expect(complete.policies[0].using).toBe("id = auth.uid()");
    expect(Object.prototype.hasOwnProperty.call(complete.policies[0], "withCheck")).toBe(true);
    expect(complete.policies[0].withCheck).toBeNull();
    expect(complete.tables[0].rlsEnabled).toBe(true);
    expect(complete.tables[0].rlsForced).toBe(false);
  });

  it("extra ssn column on an otherwise matched table refuses already_complete", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    expect(completeDecision(manifest, catalog).decision.action).toBe("already_complete");
    const people = catalog.tables.find((t: { name: string }) => t.name === "people");
    people.columns.push({ name: "ssn", type: "text", nullable: true });
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.ok).toBe(false);
    expect(decision.action).not.toBe("already_complete");
    expect(decision.reason).toBe("CATALOG_COLUMN_MISMATCH");
    const comparison = compareCatalog(expected, catalog);
    expect(comparison.columnMismatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "public.people", column: "ssn", reason: "unexpected", sensitive: true }),
      ]),
    );
  });

  it("missing, renamed, mistyped, and unexpected sensitive columns refuse already_complete", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);

    const missing = observedCatalogFromExpected(expected);
    missing.tables.find((t: { name: string }) => t.name === "people").columns = missing.tables
      .find((t: { name: string }) => t.name === "people")
      .columns.filter((c: { name: string }) => c.name !== "name");
    expect(completeDecision(manifest, missing).decision.reason).toBe("CATALOG_COLUMN_MISMATCH");

    const renamed = observedCatalogFromExpected(expected);
    renamed.tables.find((t: { name: string }) => t.name === "people").columns = renamed.tables
      .find((t: { name: string }) => t.name === "people")
      .columns.map((c: { name: string }) => (c.name === "name" ? { ...c, name: "full_name" } : c));
    const renamedDecision = completeDecision(manifest, renamed).decision;
    expect(renamedDecision.reason).toBe("CATALOG_COLUMN_MISMATCH");
    expect(compareCatalog(expected, renamed).columnMismatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ column: "name", reason: "missing" }),
        expect.objectContaining({ column: "full_name", reason: "unexpected" }),
      ]),
    );

    const mistyped = observedCatalogFromExpected(expected);
    mistyped.tables.find((t: { name: string }) => t.name === "people").columns = mistyped.tables
      .find((t: { name: string }) => t.name === "people")
      .columns.map((c: { name: string }) => (c.name === "name" ? { ...c, type: "integer" } : c));
    expect(completeDecision(manifest, mistyped).decision.reason).toBe("CATALOG_COLUMN_MISMATCH");

    const secret = observedCatalogFromExpected(expected);
    secret.tables.find((t: { name: string }) => t.name === "people").columns.push({
      name: "refresh_token",
      type: "text",
      nullable: true,
    });
    expect(completeDecision(manifest, secret).decision.reason).toBe("CATALOG_COLUMN_MISMATCH");
    expect(compareCatalog(expected, secret).columnMismatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ column: "refresh_token", reason: "unexpected", sensitive: true }),
      ]),
    );
  });

  it("extra UNIQUE constraint, index, and trigger refuse already_complete", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);

    const extraUnique = observedCatalogFromExpected(expected);
    extraUnique.tables.find((t: { name: string }) => t.name === "people").constraints.push({
      kind: "UNIQUE",
      spec: "(name)",
      columns: ["name"],
      table: "public.people",
    });
    expect(completeDecision(manifest, extraUnique).decision.reason).toBe("CATALOG_CONSTRAINT_MISMATCH");
    expect(compareCatalog(expected, extraUnique).constraintMismatches).toEqual(
      expect.arrayContaining([expect.objectContaining({ reason: "unexpected", kind: "UNIQUE" })]),
    );

    const extraIndex = observedCatalogFromExpected(expected);
    extraIndex.indexes = [
      ...(extraIndex.indexes ?? []),
      { name: "people_name_idx", table: "public.people", unique: false, columns: ["name"] },
    ];
    expect(completeDecision(manifest, extraIndex).decision.reason).toBe("CATALOG_UNEXPECTED_OBJECTS");
    expect(compareCatalog(expected, extraIndex).unexpectedIndexes).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "people_name_idx" })]),
    );

    const extraTrigger = observedCatalogFromExpected(expected);
    extraTrigger.triggers = [
      ...(extraTrigger.triggers ?? []),
      {
        name: "people_audit",
        table: "public.people",
        timing: "AFTER",
        events: "INSERT",
        function: "public.touch_people",
      },
    ];
    expect(completeDecision(manifest, extraTrigger).decision.reason).toBe("CATALOG_UNEXPECTED_OBJECTS");
    expect(compareCatalog(expected, extraTrigger).unexpectedTriggers).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "people_audit" })]),
    );
  });

  it("same-name index or trigger with a mismatched definition refuses already_complete", () => {
    const rich = richManifest();
    const expected = extractExpectedObjects(rich.sqlByFilename);
    expect(expected.indexes.some((i: { name: string }) => i.name === "people_name_idx")).toBe(true);
    expect(expected.triggers.length).toBe(1);

    const indexMismatch = observedCatalogFromExpected(expected);
    indexMismatch.indexes = indexMismatch.indexes.map((i: { name: string }) =>
      i.name === "people_name_idx" ? { ...i, columns: ["ssn"], spec: "(ssn)" } : i,
    );
    const indexDecision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog: indexMismatch,
    });
    expect(indexDecision.reason).toBe("CATALOG_INDEX_MISMATCH");

    const triggerMismatch = observedCatalogFromExpected(expected);
    triggerMismatch.triggers = triggerMismatch.triggers.map((t: { name: string }) => ({
      ...t,
      timing: "AFTER",
      events: "INSERT",
    }));
    const triggerDecision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog: triggerMismatch,
    });
    expect(triggerDecision.reason).toBe("CATALOG_TRIGGER_MISMATCH");
  });

  it("extra storage bucket refuses already_complete", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalog = observedCatalogFromExpected(expected);
    expect(catalog.storageBuckets).toEqual([]);
    catalog.storageBuckets = [{ id: "private-docs", name: "private-docs" }];
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.ok).toBe(false);
    expect(decision.action).not.toBe("already_complete");
    expect(decision.reason).toBe("CATALOG_STORAGE_MISMATCH");
    expect(compareCatalog(expected, catalog).unexpectedStorage).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "private-docs" })]),
    );
  });

  it("missing expected storage bucket and omitted storage observations refuse already_complete", () => {
    const sql = `${identitySql()}\nINSERT INTO storage.buckets (id, name) VALUES ('avatars', 'avatars');`;
    const manifest = {
      manifestId: "test-storage-contract",
      sourceCommit: PINNED_SOURCE_COMMIT,
      sourceTree: PINNED_SOURCE_TREE,
      count: 1,
      files: [{ seq: 1, filename: "20260101000000_storage.sql", sha256: digest(sql) }],
      sqlByFilename: { "20260101000000_storage.sql": sql },
    };
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    expect(expected.storageBuckets.map((b: { id?: string; name?: string }) => b.id || b.name)).toContain("avatars");

    const missing = observedCatalogFromExpected(expected);
    missing.storageBuckets = [];
    expect(completeDecision(manifest, missing).decision.reason).toBe("CATALOG_STORAGE_MISMATCH");

    const omitted = observedCatalogFromExpected(expected);
    delete omitted.storageBuckets;
    expect(completeDecision(manifest, omitted).decision.reason).toBe("CATALOG_SHAPE_INCOMPLETE");
  });

  it("table and column WITH GRANT OPTION is represented and unexpected options refuse", () => {
    const rich = richManifest();
    const expected = extractExpectedObjects(rich.sqlByFilename);
    expect(expected.tables[0].grants.length).toBeGreaterThan(0);
    expect(grantKey({ ...expected.tables[0].grants[0], table: "public.people" })).toMatch(/::$/);
    expect(grantKey({ ...expected.tables[0].grants[0], table: "public.people", grantable: true })).toMatch(
      /::grantable$/,
    );

    const grantable = observedCatalogFromExpected(expected);
    grantable.tables[0].grants = grantable.tables[0].grants.map((g: Record<string, unknown>) => ({
      ...g,
      grantable: true,
    }));
    const grantableDecision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog: grantable,
    });
    expect(grantableDecision.ok).toBe(false);
    expect(grantableDecision.action).not.toBe("already_complete");
    expect(grantableDecision.reason).toBe("CATALOG_GRANT_MISMATCH");

    const columnGrantable = observedCatalogFromExpected(expected);
    columnGrantable.tables[0].columnGrants = columnGrantable.tables[0].columnGrants.map(
      (g: Record<string, unknown>) => ({ ...g, grantable: true }),
    );
    const columnDecision = reconcileRestoreState({
      manifest: rich,
      ledgerRows: completeLedger(rich),
      sqlByFilename: rich.sqlByFilename,
      expected,
      vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
      catalog: columnGrantable,
    });
    expect(columnDecision.reason).toBe("CATALOG_COLUMN_GRANT_MISMATCH");
  });

  it("missing, unexpected, PUBLIC, and incomplete table or column grants refuse already_complete", () => {
    const rich = richManifest();
    const expected = extractExpectedObjects(rich.sqlByFilename);

    const missing = observedCatalogFromExpected(expected);
    missing.tables[0].grants = [];
    expect(
      reconcileRestoreState({
        manifest: rich,
        ledgerRows: completeLedger(rich),
        sqlByFilename: rich.sqlByFilename,
        expected,
        vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
        catalog: missing,
      }).reason,
    ).toBe("CATALOG_GRANT_MISMATCH");

    const unexpectedGrantee = observedCatalogFromExpected(expected);
    unexpectedGrantee.tables[0].grants = [
      ...unexpectedGrantee.tables[0].grants,
      { table: "public.people", roles: ["anon"], privileges: ["SELECT"], columns: [] },
    ];
    expect(
      reconcileRestoreState({
        manifest: rich,
        ledgerRows: completeLedger(rich),
        sqlByFilename: rich.sqlByFilename,
        expected,
        vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
        catalog: unexpectedGrantee,
      }).reason,
    ).toBe("CATALOG_GRANT_MISMATCH");

    const publicGrant = observedCatalogFromExpected(expected);
    publicGrant.tables[0].grants = [
      ...publicGrant.tables[0].grants,
      { table: "public.people", roles: ["public"], privileges: ["SELECT"], columns: [] },
    ];
    expect(
      reconcileRestoreState({
        manifest: rich,
        ledgerRows: completeLedger(rich),
        sqlByFilename: rich.sqlByFilename,
        expected,
        vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
        catalog: publicGrant,
      }).reason,
    ).toBe("CATALOG_GRANT_MISMATCH");

    const incomplete = observedCatalogFromExpected(expected);
    incomplete.tables[0].grants = [{ table: "public.people", roles: ["authenticated"], privileges: [] }];
    expect(
      reconcileRestoreState({
        manifest: rich,
        ledgerRows: completeLedger(rich),
        sqlByFilename: rich.sqlByFilename,
        expected,
        vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
        catalog: incomplete,
      }).reason,
    ).toBe("CATALOG_SHAPE_INCOMPLETE");

    const missingColumn = observedCatalogFromExpected(expected);
    missingColumn.tables[0].columnGrants = [];
    expect(
      reconcileRestoreState({
        manifest: rich,
        ledgerRows: completeLedger(rich),
        sqlByFilename: rich.sqlByFilename,
        expected,
        vendorHistory: { status: "available", versions: rich.files.map((f) => f.filename.slice(0, 14)) },
        catalog: missingColumn,
      }).reason,
    ).toBe("CATALOG_COLUMN_GRANT_MISMATCH");
  });

  it("explicit GRANT WITH GRANT OPTION is parsed and compared; allowlist remains indexes-only", () => {
    const sql = `
CREATE TABLE public.people (id uuid PRIMARY KEY, ssn text NOT NULL);
GRANT SELECT ON TABLE public.people TO authenticated WITH GRANT OPTION;
GRANT SELECT (ssn) ON TABLE public.people TO authenticated WITH GRANT OPTION;
`.trim();
    const expected = extractExpectedObjects({ "20260101000000_grant_option.sql": sql });
    expect(expected.tables[0].grants[0].grantable).toBe(true);
    expect(expected.tables[0].columnGrants[0].grantable).toBe(true);
    const catalog = observedCatalogFromExpected(expected);
    const comparison = compareCatalog(expected, catalog);
    expect(catalogBlocksCompletion(comparison)).toBeNull();

    const droppedOption = observedCatalogFromExpected(expected);
    droppedOption.tables[0].grants = droppedOption.tables[0].grants.map((g: Record<string, unknown>) => ({
      ...g,
      grantable: false,
    }));
    expect(catalogBlocksCompletion(compareCatalog(expected, droppedOption))).toBe("CATALOG_GRANT_MISMATCH");

    expect(Object.keys(CONTRACT_ALLOWLIST.extras)).toEqual(["constraintImpliedIndexes"]);
    expect(CONTRACT_ALLOWLIST.extras.constraintImpliedIndexes.permitted).toBe(true);
    expect(CONTRACT_ALLOWLIST.extras.constraintImpliedIndexes.scope).toBe("indexes only");
    expect(CONTRACT_ALLOWLIST.extras).not.toHaveProperty("columns");
    expect(CONTRACT_ALLOWLIST.extras).not.toHaveProperty("constraints");
    expect(CONTRACT_ALLOWLIST.extras).not.toHaveProperty("triggers");
    expect(CONTRACT_ALLOWLIST.extras).not.toHaveProperty("storageBuckets");
    expect(CONTRACT_ALLOWLIST.extras).not.toHaveProperty("grants");
  });

  it("constraint-implied unique indexes are the only permitted extras", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const implied = [
      provenImpliedIndex("orgs_pkey", "public.orgs", ["id"]),
      provenImpliedIndex("orgs_name_key", "public.orgs", ["name"]),
      provenImpliedIndex("people_pkey", "public.people", ["id"]),
    ];
    for (const index of implied) {
      expect(isConstraintImpliedIndex(index, expected.tables).implied).toBe(true);
    }
    expect(
      isConstraintImpliedIndex(
        { name: "people_name_idx", table: "public.people", unique: false, columns: ["name"], predicate: null, include: [] },
        expected.tables,
      ).implied,
    ).toBe(false);
    expect(
      isConstraintImpliedIndex(
        {
          name: "people_name_uidx",
          table: "public.people",
          unique: true,
          columns: ["name"],
          predicate: null,
          include: [],
        },
        expected.tables,
      ).implied,
    ).toBe(false);

    const catalog = observedCatalogFromExpected(expected);
    catalog.indexes = [...(catalog.indexes ?? []), ...implied];
    const { decision } = completeDecision(manifest, catalog);
    expect(decision.action).toBe("already_complete");
    expect(compareCatalog(expected, catalog).unexpectedIndexes).toEqual([]);
    expect(compareCatalog(expected, catalog).unverifiedIndexes).toEqual([]);

    catalog.indexes.push({ name: "people_name_idx", table: "public.people", unique: false, columns: ["name"] });
    expect(completeDecision(manifest, catalog).decision.action).not.toBe("already_complete");
    expect(completeDecision(manifest, catalog).decision.reason).toBe("CATALOG_UNEXPECTED_OBJECTS");
  });

  it("unparseable leftover constraint and omitted grantable-bearing observe classes refuse", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const unverified = observedCatalogFromExpected(expected);
    unverified.tables.find((t: { name: string }) => t.name === "people").constraints.push({
      kind: "UNIQUE",
      spec: "not-a-constraint",
      table: "public.people",
    });
    expect(completeDecision(manifest, unverified).decision.reason).toBe("CATALOG_CONSTRAINT_UNVERIFIED");

    const mapper = mapObservedRowsToCatalog({ tables: [] });
    expect(mapper.shapeIncomplete).toEqual(
      expect.arrayContaining(["storageBuckets", "tableGrants", "columnGrants", "indexes", "triggers"]),
    );
  });

  it("constraint-implied index allowlist requires proven uniqueness, keys, predicate, and INCLUDE", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    const catalogOf = (index: Record<string, unknown>) => {
      const catalog = observedCatalogFromExpected(expected);
      catalog.indexes = [...(catalog.indexes ?? []), index];
      return catalog;
    };

    const genuine = provenImpliedIndex("people_pkey", "public.people", ["id"]);
    expect(isConstraintImpliedIndex(genuine, expected.tables).implied).toBe(true);
    expect(completeDecision(manifest, catalogOf(genuine)).decision.action).toBe("already_complete");

    const fromDefinition = {
      name: "orgs_pkey",
      table: "public.orgs",
      definition: "CREATE UNIQUE INDEX orgs_pkey ON public.orgs USING btree (id)",
    };
    expect(isConstraintImpliedIndex(fromDefinition, expected.tables).implied).toBe(true);
    expect(parseIndexShape(fromDefinition).predicate).toBeNull();
    expect(parseIndexShape(fromDefinition).include).toEqual([]);

    const partial = {
      name: "people_id_alive",
      table: "public.people",
      unique: true,
      columns: ["id"],
      definition: "CREATE UNIQUE INDEX people_id_alive ON public.people (id) WHERE deleted_at IS NULL",
    };
    expect(isConstraintImpliedIndex(partial, expected.tables)).toMatchObject({ implied: false, reason: "partial" });
    expect(completeDecision(manifest, catalogOf(partial)).decision.reason).toBe("CATALOG_UNEXPECTED_OBJECTS");

    const includeIdx = {
      name: "people_id_inc",
      table: "public.people",
      unique: true,
      definition: "CREATE UNIQUE INDEX people_id_inc ON public.people (id) INCLUDE (name)",
    };
    expect(isConstraintImpliedIndex(includeIdx, expected.tables)).toMatchObject({ implied: false, reason: "include" });
    expect(completeDecision(manifest, catalogOf(includeIdx)).decision.reason).toBe("CATALOG_UNEXPECTED_OBJECTS");

    const uniqueOmitted = { name: "people_id_maybe", table: "public.people", columns: ["id"], predicate: null, include: [] };
    expect(isConstraintImpliedIndex(uniqueOmitted, expected.tables)).toMatchObject({
      unverified: true,
      reason: "unique_unknown",
    });
    expect(completeDecision(manifest, catalogOf(uniqueOmitted)).decision.reason).toBe("CATALOG_INDEX_UNVERIFIED");

    const expressionIdx = {
      name: "people_lower_id",
      table: "public.people",
      unique: true,
      spec: "((lower(id::text)))",
      predicate: null,
      include: [],
    };
    expect(isConstraintImpliedIndex(expressionIdx, expected.tables)).toMatchObject({
      implied: false,
      reason: "expression_keys",
    });
    expect(completeDecision(manifest, catalogOf(expressionIdx)).decision.reason).toBe("CATALOG_UNEXPECTED_OBJECTS");

    const order = {
      name: "orgs_name_id",
      table: "public.orgs",
      unique: true,
      columns: ["name", "id"],
      predicate: null,
      include: [],
    };
    expect(isConstraintImpliedIndex(order, expected.tables)).toMatchObject({
      implied: false,
      reason: "no_matching_constraint",
    });

    const wrongTable = {
      name: "ghost_pkey",
      table: "public.ghost",
      unique: true,
      columns: ["id"],
      predicate: null,
      include: [],
    };
    expect(isConstraintImpliedIndex(wrongTable, expected.tables)).toMatchObject({
      implied: false,
      reason: "unknown_table",
    });
    expect(completeDecision(manifest, catalogOf(wrongTable)).decision.reason).toBe("CATALOG_UNEXPECTED_OBJECTS");

    const unknownMeta = { name: "people_id_unproven", table: "public.people", unique: true, columns: ["id"] };
    expect(isConstraintImpliedIndex(unknownMeta, expected.tables).unverified).toBe(true);
    expect(completeDecision(manifest, catalogOf(unknownMeta)).decision.reason).toBe("CATALOG_INDEX_UNVERIFIED");

    const columnsHideWhere = {
      name: "people_id_hidden_where",
      table: "public.people",
      unique: true,
      columns: ["id"],
      definition: "CREATE UNIQUE INDEX people_id_hidden_where ON public.people (id) WHERE true",
    };
    expect(isConstraintImpliedIndex(columnsHideWhere, expected.tables)).toMatchObject({
      implied: false,
      reason: "partial",
    });
    expect(completeDecision(manifest, catalogOf(columnsHideWhere)).decision.action).not.toBe("already_complete");
  });

  it("omitted object-class keys are missing observations, not empty sets", () => {
    const manifest = identityManifest();
    const expected = extractExpectedObjects(manifest.sqlByFilename);
    expect(expected.indexes).toEqual([]);
    expect(expected.triggers).toEqual([]);
    expect(expected.storageBuckets).toEqual([]);

    const completeEmpty = observedCatalogFromExpected(expected);
    expect(catalogClassObservationState(completeEmpty, "indexes").state).toBe(CATALOG_CLASS_STATES.EMPTY);
    expect(completeDecision(manifest, completeEmpty).decision.action).toBe("already_complete");

    for (const key of ["indexes", "triggers", "storageBuckets", "functions", "functionGrants", "policies"] as const) {
      const omitted = observedCatalogFromExpected(expected);
      delete omitted[key];
      expect(catalogClassObservationState(omitted, key).state).toBe(CATALOG_CLASS_STATES.MISSING);
      expect(completeDecision(manifest, omitted).decision.action).not.toBe("already_complete");
      expect(completeDecision(manifest, omitted).decision.reason).toBe("CATALOG_SHAPE_INCOMPLETE");
    }

    const nestedMissing = observedCatalogFromExpected(expected);
    const people = nestedMissing.tables.find((t: { name: string }) => t.name === "people");
    delete people.columns;
    expect(completeDecision(manifest, nestedMissing).decision.reason).toBe("CATALOG_SHAPE_INCOMPLETE");

    const sql = `${identitySql()}\nINSERT INTO storage.buckets (id, name) VALUES ('avatars', 'avatars');`;
    const storageManifest = {
      manifestId: "probe-storage-class",
      sourceCommit: PINNED_SOURCE_COMMIT,
      sourceTree: PINNED_SOURCE_TREE,
      count: 1,
      files: [{ seq: 1, filename: "20260101000000_storage.sql", sha256: digest(sql) }],
      sqlByFilename: { "20260101000000_storage.sql": sql },
    };
    const storageExpected = extractExpectedObjects(storageManifest.sqlByFilename);
    const omittedWhenExpected = observedCatalogFromExpected(storageExpected);
    delete omittedWhenExpected.storageBuckets;
    expect(completeDecision(storageManifest, omittedWhenExpected).decision.reason).toBe("CATALOG_SHAPE_INCOMPLETE");

    const failed = observedCatalogFromExpected(expected);
    failed.observationFailed = true;
    expect(completeDecision(manifest, failed).decision.reason).toBe("CATALOG_OBSERVATION_FAILED");

    const unknown = observedCatalogFromExpected(expected);
    unknown.indexes = { not: "an-array" };
    expect(catalogClassObservationState(unknown, "indexes").state).toBe(CATALOG_CLASS_STATES.UNKNOWN);
    expect(completeDecision(manifest, unknown).decision.reason).toBe("CATALOG_SHAPE_INCOMPLETE");

    const partial = observedCatalogFromExpected(expected);
    delete partial.triggers;
    expect(completeDecision(manifest, partial).decision.reason).toBe("CATALOG_SHAPE_INCOMPLETE");
  });
});
