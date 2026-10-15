# SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-REVIEW-001

**Mission ID:** SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-REVIEW-001
**Mission class:** INDEPENDENT SECURITY REVIEW — OFFLINE ONLY
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-15T04:38:00Z
**Role:** Independent Principal Database Reliability Engineer / PostgreSQL Security Architect / Supply-Chain Reviewer / Verification Architect

**Final status:** **PASS WITH CONDITIONS**

This review assesses whether the implementation reported in
`docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-001.md`
is present in code and offline tests. The implementation report was an
input to **contradict**, not to copy.

This review does **not** authorize a database connection, lock, catalog
inspection, migration, deployment, or production change. Staging has
**not** been restored. SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain
**OPEN**.

---

## 1. Scope and explicit no-network declaration

Inspected implementation: commit
`277dce5b47a98ab9095226e3c8ab9fb7822aaef9` on branch
`cursor/sherivs-staging-migration-runner-final-hardening-5537`
(“fix: harden staging restore runner against remaining review gaps”).

Hard safety rules observed by this reviewer:

- **No database was opened.** No Postgres session, pooler session, or
  Supabase Management API query ran.
- **No SQL was executed against a server.** This reviewer did not call
  `pg.Client.prototype.connect` and did not construct a live connector
  that can connect.
- **No migrations were run.** Canonical migration files were not
  modified.
- **No secrets were created, modified, deleted, or rotated.** Fixture
  URLs and the test CA PEM already present in the unit file were used
  for probes. Process environment names that look like database
  credentials were not read into a client config by this review.
- **Live execution was not enabled.** No authorized live connector was
  implemented.
- Runner code, tests, and canonical SQL were **not altered**. This
  mission creates **only this report**.

Claims are labeled:

| Label | Meaning |
|-------|---------|
| **Repository evidence** | Re-measured from Git objects, file bytes, or script source |
| **Offline-tested** | Exercised by this reviewer against the real modules or the targeted Vitest file |
| **Implementation-report claim** | Taken from the hardening artifact; not treated as proof |
| **Inference** | Reviewer conclusion from repository or offline probe evidence |
| **NOT VERIFIED (live)** | Requires a live session this mission did not open |

---

## 2. Exact reviewed commit and working-tree status

| Item | Value |
|------|--------|
| Reviewed implementation commit | `277dce5b47a98ab9095226e3c8ab9fb7822aaef9` |
| Reviewed implementation subject | `fix: harden staging restore runner against remaining review gaps` |
| Parent review commit | `5e11a828215ab53b1de4434595957b27fc06b770` (corrections review) |
| Working tree at inspection | **clean**; `git diff` vs `origin/cursor/sherivs-staging-migration-runner-final-hardening-5537` was empty |
| Preferred base | `origin/coregrid-scholar-migration` at `857d4fee1ccc9d11b3c4a34f1142ff6a0da1f7fe` |
| Local `pg` | **8.23.1** |
| This review branch | `cursor/sherivs-staging-migration-runner-final-hardening-review-ca03` |
| Files changed by this mission | this document only |

`scripts/db-apply.mjs`, `scripts/lib/pg-ssl.mjs`, and
`scripts/apply-canonical-hardening.mjs` have an **empty diff** versus
`origin/coregrid-scholar-migration`.

---

## 3. Files and code paths inspected

Every runner module, the CLI entry, the approved manifest, the targeted
unit file, and the hardening / prior-review documents:

- `scripts/staging/sherivs-restore/cli.mjs`
- `scripts/staging/sherivs-restore/runner.mjs`
- `scripts/staging/sherivs-restore/connect.mjs`
- `scripts/staging/sherivs-restore/lock.mjs`
- `scripts/staging/sherivs-restore/target.mjs`
- `scripts/staging/sherivs-restore/tls.mjs`
- `scripts/staging/sherivs-restore/source.mjs`
- `scripts/staging/sherivs-restore/catalog-contract.mjs`
- `scripts/staging/sherivs-restore/reconcile.mjs`
- `scripts/staging/sherivs-restore/ledger.mjs`
- `scripts/staging/sherivs-restore/preflight.mjs`
- `scripts/staging/sherivs-restore/redact.mjs`
- `scripts/staging/sherivs-restore/constants.mjs`
- `scripts/staging/sherivs-restore/approved-manifest.json`
- `scripts/staging/sherivs-restore/README.md`
- `tests/unit/sherivs-staging-migration-runner.test.ts`
- `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-001.md`
- `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-CORRECTIONS-REVIEW-001.md`

Traced paths:

1. CLI `main()` → `selectMode` / `assertExecuteAuthorization` /
   `LIVE_EXECUTE_NOT_ENABLED` → `runRestore({ allowNetwork: false,
   allowLiveCatalog: false })`
2. `runRestore` MANIFEST / OFFLINE / PREFLIGHT / EXECUTE
3. `createLiveConnector` (disabled factory; no `pg` import)
4. `createMockConnector` lifecycle
5. `assertTrustedLockController` / `createAdvisoryLock` /
   `createLivePostgresLockSession`
6. `resolveStagingTarget` / `assertStagingTarget`
7. `extractExpectedObjects` → `compareCatalog` →
   `catalogBlocksCompletion` → `reconcileRestoreState`
8. `applySequence` open / apply / close / lock-probe / uncertain
9. `loadFromGitCommit` / `verifyLoadedFiles` / `inspectWorkingTree`
10. `createSqlLedger` (source only; untested)

Grep of `scripts/staging/sherivs-restore/` found **no** `import` /
`require` of `pg`, `net`, `tls.connect`, or `@supabase`. The only
`new ClientCtor(` sites are inside `demonstrateDriverSslOverwrite`,
which takes an injected constructor and does not call `connect()`.
No other script under `scripts/` imports `createLiveConnector`.

---

## 4. Reported claims — independently checked

| Reported claim | Independent result |
|----------------|-------------------|
| 70/70 targeted offline tests pass | **Confirmed.** This review re-ran `npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts` → **70 passed / 70**, 1 file |
| Manifest mode reports the pinned 71-file source | **Confirmed.** `cli.mjs --mode=manifest` → count 71, commit `d195ba861f80379b79533126653b9cee82a8e872`, tree `bbd828951e166662bbe831fd74972e1a15488468` |
| Execute mode returns `LIVE_EXECUTE_NOT_ENABLED` even with all flags and `--allow-network` | **Confirmed** → `{ ok: false, code: "LIVE_EXECUTE_NOT_ENABLED", exitCode: 2 }` |
| `createLiveConnector` does not construct `pg.Client` or call `connect()`, including when `allowNetwork` is true | **Confirmed.** Factory throws `NETWORK_DISABLED` or `LIVE_CONNECTOR_NOT_AUTHORIZED` before any `pg` import. Constructor spy stayed 0 |
| Official fake lock cannot satisfy live-execution capability | **Confirmed for unmodified official objects.** **Contradicted if properties are mutated** (see FH-LOCK-1) |
| Missing / misconfigured required objects cannot produce `already_complete` | **Partially contradicted.** Missing policies, wrong policy command/role, column type/nullability, empty constraint list, missing function/trigger, and unexpandable DDL do block. **Wrong constraint spec of the same kind, and same-name function with a different signature, do not** (see FH-CONTRACT-1, FH-CONTRACT-2) |
| Static 71-file inventory (121 tables, 151 policies, 176 indexes, 32 functions, 54 triggers, 1 storage bucket, 120 RLS enabled, 11 FORCE RLS, 78 tables with grants, 0 column grants, 0 unverified) | **Confirmed** by running `extractExpectedObjects` on `git show` bytes of the pin. Additional: **21 function grants extracted and not compared** |
| No database was opened or changed | **Confirmed for this review.** Unit file patches `pg.Client.prototype.connect` to throw. This reviewer did not call `connect()` |
| SHERIVS-001 / 002 / 003 remain OPEN | **Confirmed as an honesty statement.** This review does not close them |
| Staging has been restored | **Not claimed by the implementation report.** This review also does **not** claim it |

---

## 5. Findings with file/line evidence

### A. Network isolation

**Classification:** **PASS** for the current CLI and factory.
`--allow-network` cannot override the disabled live boundary.

| Path | Evidence | Can it open PostgreSQL? |
|------|----------|-------------------------|
| CLI `main()` | `cli.mjs` 115–121 hardcodes `allowNetwork: false` and `allowLiveCatalog: false`. `--allow-network` is parsed (36–38) then discarded | No |
| CLI execute without injected connector | `cli.mjs` 93–102 returns `LIVE_EXECUTE_NOT_ENABLED` **before** `runRestore` | No |
| CLI does not import the live factory | `cli.mjs` 17–20 import `runner`, `redact`, `constants` only | No |
| Manifest / offline / preflight | `runner.mjs` 296–327 load git / run `runOfflinePreflight`. `LIVE_CATALOG_SQL` is a string plan (`preflight.mjs` 18–29, 178–188) and is not executed | No |
| `createLiveConnector({ allowNetwork: false })` | `connect.mjs` 194–196 → `NETWORK_DISABLED` | No |
| `createLiveConnector({ allowNetwork: true })` | `connect.mjs` 198–201 → `LIVE_CONNECTOR_NOT_AUTHORIZED`. No `pg` import in this file | No |
| `runRestore` with `allowNetwork` / `connector.kind === "live"` / `connector.allowNetwork` | `runner.mjs` 356–367 requires a live-capable lock, then **always** `fail(LIVE_CONNECTOR_CODE)` | No connection. A mutated official lock can pass the lock check; execute still throws `LIVE_CONNECTOR_NOT_AUTHORIZED` (offline-tested) |
| `demonstrateDriverSslOverwrite` | `connect.mjs` 161–183 constructs `Client` **without** `connect()` to document pg@8.23.1 overwrite. Not an apply path | Constructor only |
| `createMockConnector` | `connect.mjs` 41–130; `allowNetwork: false`; no `pg` | No |

There is **no** hidden CLI path that instantiates a PostgreSQL client.
The named factory remains as a disabled export. That is acceptable only
because it cannot connect. A later mission that replaces the function
body must be independently re-reviewed.

`pg.Client` still reads `process.env.PGHOST` / `PGUSER` / `PGPASSWORD`
when discrete fields are empty (`node_modules/pg/lib/connection-parameters.js`
`val()`). Harmless while this factory does not construct `Client`. It
is a **future-wiring invariant**, not a current bypass.

### B. Target and secret isolation

**Classification:** **PASS** for production refusal, positive staging
pin, and unprefixed fallback refusal.

- Production project ref `nwrflbpbhyiqdptmlccm` is refused
  (`target.mjs` 58–64, `constants.mjs` 18). Offline-tested (tests 8 and
  pin-intact).
- Staging identity is **positively pinned**, not merely “not
  production”:
  - direct host must be `db.dvxszhracsjwdancijdc.supabase.co`
    (`constants.mjs` 46, `target.mjs` 77–78);
  - pooler host must end with `.pooler.supabase.com` **and** user must
    be `postgres.dvxszhracsjwdancijdc` (`target.mjs` 80–87);
  - hostname or username must contain `dvxszhracsjwdancijdc`
    (`target.mjs` 136–142).
- Unprefixed `DATABASE_URL`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, and
  `SUPABASE_PROJECT_ID` refuse the target (`constants.mjs` 30–36,
  `target.mjs` 158–164). Offline-tested (test 9).
- Fixture hosts require `extraAllowHosts` **and** still fail
  `TARGET_FIXTURE_UNPINNED` unless the staging ref is in host or the
  pooler user matches (`target.mjs` 123–129). CLI / execute do not pass
  `extraAllowHosts` unless a test injects it.
- Port 5432 is enforced in `tls.mjs` 157–160, not in
  `assertStagingTarget`. Offline / preflight / execute evaluate TLS
  after target resolution, so a non-5432 staging URL still fails
  closed on those paths.
- Errors go through `redactText` / `redactUrl` (`tls.mjs` 33–36, 289;
  `redact.mjs` 13–37). Target parse failures do not interpolate the raw
  credentialed URL. Logger field names matching
  `password|secret|token|credential|connectionstring|database_url|ca_cert|private`
  are replaced (`redact.mjs` 48–53). A credentialed URL in a serialized
  log throws (`redact.mjs` 61–63). Offline-tested (test 22).
- Residual: redacted URLs still contain username and hostname. That is
  identity, not a password. PEM bodies are redacted when they appear in
  strings.

### C. Advisory-lock trust

**Classification:** **PASS WITH CONDITIONS** for the offline
abstraction. A real PostgreSQL advisory-lock session is **not
implemented** and is **NOT VERIFIED (live)**.

What is true in code:

- `kind: "advisory"` on an arbitrary object is refused
  (`lock.mjs` 372–376). Official controllers are branded with a
  non-enumerable symbol and recorded in a module `WeakSet`
  (`lock.mjs` 35–36, 230–238, 349–351). Spread copies fail
  `isAuthenticLockController` (offline-tested).
- `createAdvisoryLock` cannot mint `postgres-session`
  (`lock.mjs` 245–252). Issued objects have `authenticity:
  "fake-offline"` and `liveCapable: false` (`lock.mjs` 326–329).
- `createLivePostgresLockSession()` throws
  `LIVE_LOCK_SESSION_NOT_AUTHORIZED` (`lock.mjs` 342–347).
- Process-local `mutex` / `memory` → `LOCK_NOT_DISTRIBUTED`
  (`lock.mjs` 366–370).
- Live request (`allowNetwork` / live connector) calls
  `assertTrustedLockController(lock, { requireLiveCapable: true })`
  then still fails `LIVE_CONNECTOR_NOT_AUTHORIZED` (`runner.mjs`
  356–367).
- The documented SQL plan (`lock.mjs` 58–67, 69–92) is commentary
  only. `lock.mjs` never imports `pg`.

**FH-LOCK-1 (condition, not a current execute bypass).** Official lock
objects are **not frozen**. `liveCapable` and `authenticity` are
ordinary writable properties. Independent probe:

```
official.liveCapable = true
official.authenticity = "postgres-session"
assertTrustedLockController(official, { requireLiveCapable: true })
→ passes
```

A future live gate that treats `requireLiveCapable: true` as proof that
a PostgreSQL session holds `pg_try_advisory_lock(0x53485256,
0x53544147)` would be satisfied by a mutated fake. **Required before
any live execution:** a controller whose live capability is an
unforgeable factory brand (frozen fields plus WeakSet), backed by a
dedicated `pg` session that this process actually opened, independently
reviewed. A fake/offline controller must remain unable to satisfy that
gate even after property assignment.

Independently: the same mutated official lock plus `allowNetwork: true`
still failed `LIVE_CONNECTOR_NOT_AUTHORIZED`. Current execute cannot
use the mutation to open a database.

Probe remains mandatory on authentic controllers (`lock.mjs` 381–383,
`runner.mjs` 113–115). Connection loss records uncertain outcome with
`retried: false` / `autoRetry: false`. Process-local registry exclusion
is offline-tested; two-**process** exclusion against PostgreSQL is
**NOT VERIFIED (live)**.

### D. Schema contract

**Classification:** **PASS WITH CONDITIONS**. The previous C-POLICY gap
(missing policies did not refuse `already_complete`) is **closed in
code**. The hardening report’s broader claim that misconfigured
required objects cannot produce `already_complete` is **not fully
true**.

`reconcileRestoreState` still refuses ledger-only completion
(`reconcile.mjs` 150–156 `CATALOG_NOT_CHECKED`).
`catalogBlocksCompletion` now includes missing policies, policy
mismatches, column/constraint/grant/RLS/function/trigger/index/storage
mismatches, unexpected objects, incomplete observation shape, and
required `NOT_VERIFIED` objects (`catalog-contract.mjs` 1079–1101).
`securityProof` and `schemaEquivalence` remain `false` on every
success and refusal path (`reconcile.mjs` 34, 122–124, 217–220).

Unknown / unexpandable `DO` + `EXECUTE CREATE` is marked
`verification: "NOT_VERIFIED"` and blocks completion
(`catalog-contract.mjs` 434–441, 1081). Offline-tested.

Independent static inventory from the pinned 71 files (no database):

| Object class | Count |
|--------------|-------|
| Tables | 121 |
| Policies | 151 |
| Indexes | 176 |
| Functions | 32 |
| Triggers | 54 |
| Storage buckets | 1 |
| Tables with RLS enabled | 120 |
| Tables with FORCE RLS | 11 |
| Tables with table grants | 78 |
| Column grants | 0 |
| Function grants | **21** (extracted; **not compared**) |
| Unverified required objects | 0 from recognized patterns |

This is static SQL derivation. It is not proof that staging contains
these objects.

**FH-CONTRACT-1 — constraint comparison is kind-only.**
`catalog-contract.mjs` 939–943:

```
const found = gotKinds.some(
  (g) => g === needle || g.startsWith(`${cons.kind}:`),
);
```

Any observed constraint of the same kind (any `PRIMARY KEY`, any
`CHECK`) satisfies the expected constraint. Independent probe: expected
`PRIMARY KEY (id)` vs observed `PRIMARY KEY (ssn)` →
`constraintMismatches: []`, `catalogBlocksCompletion` → `null`,
`reconcileRestoreState` → `action: "already_complete"`. A second probe
with `CHECK (name <> '')` vs `CHECK (false)` also completed. Tests only
cover an **empty** constraint list, which does block.

**FH-CONTRACT-2 — function identity is a name prefix.**
`catalog-contract.mjs` 1014–1018 treats a function as present if any
observed key `startsWith(`${schema}.${name}`)`. Independent probe:
expected `touch_people(a integer) SECURITY DEFINER` vs observed
`touch_people(text) SECURITY DEFINER` → `already_complete`. A
security-mode mismatch still blocks (`CATALOG_FUNCTION_SECURITY_MISMATCH`).

**FH-CONTRACT-3 — extracted but not compared.**
`functionGrants` are parsed (`catalog-contract.mjs` 670–685, 753, 778)
and are **absent** from `comparedObjectClasses` and
`catalogBlocksCompletion`. Policy `permissive` is parsed (291–330) and
never compared. Index uniqueness / column spec, trigger timing/events
beyond the name key, column defaults, owners, and storage ACLs are not
compared.

**FH-CONTRACT-4 — observe SQL cannot populate the contract.**
`CATALOG_OBSERVE_SQL` (`catalog-contract.mjs` 65–94) is a **plan** and
was not executed. It selects public tables, columns (type/nullability),
policies (name/command/USING/WITH CHECK — **not roles**), and vendor
versions. It has **no** statements for constraints, indexes, functions,
triggers, grants, RLS enabled/forced, or storage buckets. A future
live catalog that only runs this SQL would be `CATALOG_SHAPE_INCOMPLETE`
against the richer contract — fail-closed if used as-is, but it is not
a complete observer.

Catalog attributes **not represented** in the contract (non-exhaustive):
views, materialized views, sequences, enums, extensions, publications,
owners, tablespace, inheritance, identity/generated columns, collation,
column defaults, `ALTER COLUMN TYPE` / `SET NOT NULL` after CREATE,
`GRANT … ON ALL TABLES IN SCHEMA`, default privileges, function bodies,
trigger WHEN / ENABLE status, storage bucket ACLs, `pg_get_expr`
canonical form. Dollar-quoted function bodies are intentionally not
scanned (`catalog-contract.mjs` 26–28, 743).

Do **not** claim complete schema equivalence or application-security
proof. The code itself sets `schemaEquivalence: false` and
`securityProof: false`.

### E. Failure and recovery

**Classification:** **PASS WITH CONDITIONS** for the mock lifecycle.
Live `pg.Client.end()` is **NOT VERIFIED**.

- `opened` is recorded before `onOpen`; `closed` is recorded after
  success, `onOpen` failure, and apply failure (`connect.mjs` 65–110).
- If work fails and `onClose` also fails, the original error is thrown
  with `closeError` attached (`connect.mjs` 112–117). Offline-tested
  (test “cleanup errors preserve the original migration error”).
- If work succeeds and close fails: `CONNECTION_CLOSE_FAILED`
  (`connect.mjs` 119–126). `applySequence` maps that to
  `TX_OUTCOME.UNKNOWN` via `recordUncertain`, `retried: false` /
  `autoRetry: false`, and does not continue (`runner.mjs` 202–241).
  **Present in code; not covered by the 70-test file.** This reviewer
  independently drove the mock path: result
  `{ ok: false, retried: false, autoRetry: false, failed.code: "TX_OUTCOME_UNKNOWN" }`.
- Lock-probe loss records uncertain outcome and stops
  (`runner.mjs` 113–149). Offline-tested.
- There is no automatic retry after uncertain apply. Second execute
  sees `LEDGER_FAILED` / `LEDGER_AMBIGUOUS` and does not re-run SQL
  (tests 20 and lock-loss).
- `createSqlLedger` (`ledger.mjs` 298–413) INSERT/UPDATE paths remain
  **untested**. Memory ledger is tested.
- If `ledger.recordFailed` itself throws after an apply failure, the
  original apply error is not wrapped (untested).
- `finally { await lock.release?.() }` (`runner.mjs` 467–469): official
  `release()` swallows session errors and returns `{ ok: false }`
  (`lock.mjs` 311–323). A throwing `release` on a future live lock
  would discard the try-block result. Not a current CLI path.

Mock resources are closed. A real socket was never opened, so live
resource closure is **NOT VERIFIED (live)**.

### F. Migration source integrity

**Classification:** **PASS**. This review did **not** substitute the
69-file working tree for the pinned canonical source.

Independently re-measured:

| Item | Measured value |
|------|----------------|
| Authoritative commit | `d195ba861f80379b79533126653b9cee82a8e872` |
| `d195ba8:database/supabase/migrations` | `bbd828951e166662bbe831fd74972e1a15488468` |
| File count at pin | **71** `.sql`; **0** `*.sql.proposed` |
| Manifest SHA-256 vs `git show` | **0 mismatches** (71/71 filename, order, digest, `byteLength`) |
| Transport pair | `#59` `20261002000014_coregrid_v2_transport_buses_rls.sql` then `#69` `20261003000041_coregrid_transport_bus_reads.sql` |
| Working tree at this checkout | **69** `.sql` files; missing from pin: `20261008000050_coregrid_organization_memberships.sql`, `20261008000060_organization_onboarding.sql` |
| `resolvePinnedSource` default | `loadFromGitCommit` (`source.mjs` 240–246). Unmatched working tree is not a silent source (`source.mjs` 248–251 `SOURCE_UNAVAILABLE`) |

`constants.mjs` 10–15 and `approved-manifest.json` 3–6 store the same
commit, tree, and count=71. `verifyLoadedFiles` refuses
`*.sql.proposed` (`source.mjs` 119–124).

**Prior condition A1 unchanged:** `defaultGit` (`source.mjs` 61–72)
inherits `GIT_DIR` / replace-refs. Per-file SHA-256 still binds
content. Not a substitute of the 69-file tree for the pin.

### G. Test quality

The unit file imports the **real** implementation modules (constants,
source, target, tls, ledger, lock, reconcile, catalog-contract,
connect, preflight, runner, cli). Execute paths inject
`createMockConnector`, `createMemoryLedger`, and
`createAdvisoryLock` / `createFakeAdvisorySession`. They are not a
second helper reimplementation of pinning or reconcile.

`beforeAll` replaces `pg.Client.prototype.connect` with a throw
(test file 218–223). Tests do not contact production
(`nwrflbpbhyiqdptmlccm`) or staging (`dvxszhracsjwdancijdc`). This
review did not run live integration tests.

| Topic | Present? | Notes |
|-------|----------|-------|
| CLI execute disabled with every flag + `--allow-network` | **Yes** | Tests 23, last test, plus this review’s CLI probe |
| Live factory does not construct Client | **Yes** | Constructor spy stayed 0, including `allowNetwork: true` |
| Fake `{ kind: "advisory", liveCapable: true }` refused | **Yes** | WeakSet / brand |
| Official fake cannot satisfy `requireLiveCapable` | **Yes for unmodified objects** | Mutation of official properties is **untested** and succeeds |
| Missing policy / wrong command or role | **Yes** | Closes prior C-POLICY |
| Column type/nullability mismatch | **Yes** | |
| Empty constraint list | **Yes** | Does **not** catch wrong spec of the same kind |
| Sensitive-column grant mismatch | **Yes** | |
| Missing function or trigger | **Yes** | Does **not** catch same-name / different-signature |
| Unexpandable DO/EXECUTE | **Yes** | `CATALOG_REQUIREMENTS_UNVERIFIED` |
| `already_complete` success path | **Weak** | Mini fixture is `CREATE TABLE a();` name-only. No rich-contract positive match test |
| Connection cleanup after open / apply failure | **Yes** | `closed[]` equals `opened[]` |
| Close failure after successful apply | **No in suite** | Code path independently confirmed by this review |
| `createSqlLedger` | **No** | Same gap as prior reviews |
| Tests contact a database | **No** | |

Passing 70 tests is **not** live database safety and is **not** proof
of untested behavior.

### H. Execution boundary

Live execution remains disabled. This process performed **no** catalog
query, **no** advisory lock against PostgreSQL, and **no** mutation.

Prerequisites that remain before any **separately authorized**
live-read or mutating operation:

1. Written human authorization naming staging ref
   `dvxszhracsjwdancijdc`, Git pin `d195ba8` / tree `bbd82895`,
   OPTION A, this runner, and acceptance of OPEN SHERIVS-001 / 002 /
   003.
2. A later live-connector implementation that uses
   `buildPinnedClientConfig`, never passes `connectionString`, does not
   treat `--allow-network` as sufficient, and is independently
   re-reviewed.
3. A reviewed PostgreSQL advisory-lock session (`postgres-session`,
   `liveCapable` unforgeable) that actually holds
   `pg_try_advisory_lock(0x53485256, 0x53544147)` on a dedicated
   backend for the whole attempt. Fake/offline controllers, including
   mutated official objects, must not satisfy that gate.
4. Fresh read-only staging catalog under that lock, using an observer
   that actually populates every class `catalogBlocksCompletion`
   requires. `CATALOG_OBSERVE_SQL` as written is insufficient.
   GATE4 remains historical.
5. Constraint / function comparison tightened, or an explicit documented
   decision that kind-only / name-prefix matching is accepted (it is
   not accepted by this review as “misconfiguration cannot complete”).
6. Post-restore catalog. Restore is not self-certifying.
7. Default recovery after partial / ambiguous / lock-loss remains
   **recreate staging**.

---

## 6. Tests inspected and independently reproduced

Command (this review):

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**Result:** 1 file, **70 passed / 70**, ~2.1s. Log:
`/opt/cursor/artifacts/sherivs-final-hardening-review-vitest.log`.

Additional offline probes (fixture URLs only; no `pg` import; no
`connect()`):

- `git rev-parse d195ba8:database/supabase/migrations` =
  `bbd828951e166662bbe831fd74972e1a15488468`
- 71/71 SHA-256 match; 0 `*.sql.proposed`; transport indices 58 then 68
- working tree count 69, not used as the pin
- `extractExpectedObjects` inventory as in §5.D
- constraint wrong-spec → `already_complete` (FH-CONTRACT-1)
- function same-name different-args → `already_complete` (FH-CONTRACT-2)
- policy USING flip → `CATALOG_POLICY_MISMATCH`
- policy name-only → `CATALOG_SHAPE_INCOMPLETE`
- official lock mutation satisfies `requireLiveCapable`
- mutated lock + `allowNetwork: true` still
  `LIVE_CONNECTOR_NOT_AUTHORIZED`
- close-after-success → `TX_OUTCOME_UNKNOWN`, `retried: false`
- CLI manifest 71-file pin; CLI execute + `--allow-network` →
  `LIVE_EXECUTE_NOT_ENABLED`

Log: `/opt/cursor/artifacts/sherivs-final-hardening-review-probes.log`.

---

## 7. Blocking and non-blocking findings

| ID | Topic | Class | Blocks live execute today? |
|----|-------|-------|----------------------------|
| FH-NET-1 | Live factory cannot construct Client or `connect()`, including `allowNetwork: true` | **PASS** | No — this is the boundary |
| FH-CLI-1 | CLI execute disabled; `--allow-network` discarded | **PASS** | No |
| FH-TGT-1 | Production ref `nwrflbpbhyiqdptmlccm` refused; staging ref positively pinned; unprefixed URLs refused | **PASS** | No |
| FH-LOCK-1 | Official fake lock `liveCapable` / `authenticity` are mutable | **PASS WITH CONDITIONS** | No today (`LIVE_CONNECTOR_NOT_AUTHORIZED` still fires). **Would block authorizing a live lock gate that trusts these fields** |
| FH-CONTRACT-1 | Constraint compare accepts any same-kind spec | **PASS WITH CONDITIONS** | No today (default catalog is `NOT_CHECKED`). **Would block treating contract match as “misconfiguration cannot complete”** |
| FH-CONTRACT-2 | Function compare accepts same-name different signature | **PASS WITH CONDITIONS** | Same as FH-CONTRACT-1 |
| FH-CONTRACT-3 | `functionGrants` and policy `permissive` not compared | **PASS WITH CONDITIONS** | No |
| FH-CONTRACT-4 | `CATALOG_OBSERVE_SQL` cannot populate the contract | **PASS WITH CONDITIONS** | No today (unused). Must be completed before live catalog |
| C-POLICY (prior) | Missing policies did not refuse `already_complete` | **Closed in code** | n/a |
| R-TLS-1 (prior) | URL `sslmode` overwrite of pinned `ssl` | **Still addressed in constructor policy**; handshake **NOT VERIFIED (live)** | No |
| A1 (prior) | `defaultGit` inherits `GIT_DIR` | **Unchanged condition** | No |
| FH-SQLLEDGER | `createSqlLedger` untested | **Condition** | No |
| BLOCKER-catalog | Fresh staging catalog | **Still open** | Yes for any live read |
| BLOCKER-authz | Written human authorization | **Still open** | Yes for any live execute |
| SHERIVS-001/002/003 | Application RLS findings | **OPEN** — this review does not close them | n/a |

**Blocking findings that would justify BLOCKED:** none in the offline
implementation. No execution path reviewed here can instantiate a
PostgreSQL client or target production.

---

## 8. Remaining gaps and unverified claims

Unverified by this mission (require a later authorized session or a
code change this mission was not allowed to make):

- TLS handshake, hostname match, and CA correspondence to the staging
  server certificate
- A real `pg_try_advisory_lock` session, two-process exclusion, and
  lock hold across 71 apply connections
- Live catalog emptiness, extensions, unexpected objects, live policy
  expressions, live grants, live function security, live storage ACLs
- `pg.Client.end()` after a real `connect()` failure
- Staging schema restoration (not performed; not claimed)
- Application security of RLS predicates (SHERIVS-001 / 002 / 003)

The implementation report’s status
**“A. FINAL OFFLINE HARDENING COMPLETE”** is accepted only as: the
named prior code gaps (live factory `connect()`, stub lock trust,
missing-policy completion, cleanup error replacement) are addressed
**for unmodified official objects and for the tested mismatch classes**.
It is **not** accepted as proof that every misconfigured required
object is unable to produce `already_complete`.

---

## 9. Verdict

**PASS WITH CONDITIONS**

Status **PASS FOR OFFLINE IMPLEMENTATION** is refused because two
contract comparison defects can emit `already_complete` for
misconfigured constraints and function signatures, official lock
capability fields are mutable, and the published observe-SQL plan
cannot populate the contract the runner now requires.

Status **BLOCKED** is refused because the live-execution boundary holds:
the CLI cannot construct a client, `createLiveConnector` cannot
`connect()` even when `allowNetwork` is true, production is refused,
the 71-file pin is intact, missing policies now block completion, and
fake `kind: "advisory"` stubs cannot run execute.

---

## 10. Authorization non-statement

**This verdict does not authorize any database connection, lock,
catalog inspection, migration, deployment, or production change.**

It does not authorize injecting a live connector, enabling CLI
execute, setting `allowNetwork` for a live operation, opening staging
or production, applying the 71 files, or closing SHERIVS-001,
SHERIVS-002, or SHERIVS-003. Staging has not been restored.

---

## 11. Version-target classification

**ACTIVE-V1 ONLY.** This review inspects the V1 Scholar 71-file restore
runner final hardening. It does not implement V2 device/IoT or V3
Reality Intelligence.

---

## 12. Agent report

**Implemented:** independent offline review of the staging restore
runner final hardening (this document only).

**Files Changed:**
`docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-REVIEW-001.md`

**Architecture Impact:** none to running systems. No runner, policy,
migration, or secret was modified.

**Tests:** independently recomputed 71 SHA-256 values; Git tree / count
/ order / transport pair; working-tree 69-file trap; contract probes
showing wrong-spec constraints and same-name functions can complete;
official lock mutation probe; close-after-success no-retry probe;
`npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts`
→ **70/70**; CLI manifest 71-file pin; CLI execute with all flags →
`LIVE_EXECUTE_NOT_ENABLED`. No database tests. No apply.

**Security Validation:** production and staging non-contact; findings
left OPEN where live proof is required; credentials not printed; live
execute not enabled; SHERIVS-001 / 002 / 003 not marked resolved.

**Known Risks:** kind-only constraint match; name-prefix function
match; mutable official lock capability fields; incomplete observe-SQL
plan; untested `createSqlLedger`; inherited Git env; stale staging
catalog; OPEN RLS findings if a later restore proceeds.

**Remaining Work:** written authorization; live connector + real lock
session + complete catalog observer, each independently re-reviewed;
tighten or explicitly accept contract comparison limits; then a
separate mutating mission.

**Final status:** **PASS WITH CONDITIONS**
