# SHERIVS-STAGING-MIGRATION-RUNNER-CORRECTIONS-REVIEW-001

**Mission ID:** SHERIVS-STAGING-MIGRATION-RUNNER-CORRECTIONS-REVIEW-001
**Mission class:** INDEPENDENT SECURITY REVIEW — OFFLINE ONLY
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-14T21:10:00Z
**Role:** Independent Principal Database Security Engineer / PostgreSQL Migration Architect / Production Change-Control Reviewer

**Final status:** **A. PASS FOR OFFLINE IMPLEMENTATION — LIVE CONNECTOR STILL NOT AUTHORIZED**

This review assesses whether the four named findings from
`SHERIVS-STAGING-MIGRATION-RUNNER-REVIEW-001` (R-TLS-1, R-HIST-1,
R-HIST-2, R-HIST-3) were adequately addressed **in code and offline
tests**. It does **not** authorize a live connector, a live lock
session, catalog observation, or any database change.

The correction report
(`docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-CORRECTIONS-001.md`)
was an input to **contradict**, not to copy.

---

## 0. Reviewer independence and non-contact

Inspected implementation: branch
`cursor/sherivs-staging-migration-runner-corrections-5537` at
`7a618ed5cd5225d3bebc8529e720481df4ffd7f3` (on PR #22
`5cfb9eba8d7583a45cad972921c6c8f1ba08d189`).

Hard safety rules observed:

- **No database was opened.** No Postgres session, pooler session, or
  Supabase Management API query ran.
- **No SQL was executed against a server.** `pg.Client` was constructed
  in-process for TLS option-precedence proof and **`connect()` was not
  called**.
- Canonical migrations, runner code, tests, environment variables, and
  secrets were not modified.
- Production (`nwrflbpbhyiqdptmlccm`) and staging (`dvxszhracsjwdancijdc`)
  were unchanged.
- Credentials were not printed.
- This mission creates **only this report**.

Claims are labeled:

| Label | Meaning |
|-------|---------|
| **Repository evidence** | Re-measured from Git objects, file bytes, or script source |
| **Driver evidence** | `pg@8.23.1` constructor inspected **without** a socket |
| **Offline-tested** | Exercised by the targeted Vitest file against real modules |
| **Correction-report claim** | Taken from the corrections artifact; not treated as proof |
| **Inference** | Reviewer conclusion from repository or driver evidence |
| **NOT VERIFIED** | Requires a live session this mission did not open |

---

## 1. Reported claims — independently checked

| Reported claim | Independent result |
|----------------|-------------------|
| 56/56 targeted offline tests pass | **Confirmed.** This review re-ran `npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts` → **56 passed / 56**, 1 file |
| Manifest mode reports the pinned 71-file source | **Confirmed.** `cli.mjs --mode=manifest` → count 71, commit `d195ba861f80379b79533126653b9cee82a8e872`, tree `bbd828951e166662bbe831fd74972e1a15488468` |
| Execute mode returns `LIVE_EXECUTE_NOT_ENABLED` | **Confirmed**, including with all three confirmation flags **and** `--allow-network` → `{ ok: false, code: "LIVE_EXECUTE_NOT_ENABLED", exitCode: 2 }` |
| “No live PostgreSQL connector exists” | **Contradicted as a literal claim.** `createLiveConnector` remains in `connect.mjs` lines 119–162 and still calls `client.connect()` when `allowNetwork: true`. The **CLI does not construct it.** `--allow-network` is parsed then ignored (`cli.mjs` line 117 hardcodes `allowNetwork: false`) |
| No database was opened or changed | **Confirmed for this review.** Unit file patches `pg.Client.prototype.connect` to throw. This reviewer did not call `connect()` |

---

## 2. Independently re-measured source pin

| Item | Measured value |
|------|----------------|
| Authoritative commit | `d195ba861f80379b79533126653b9cee82a8e872` |
| `d195ba8:database/supabase/migrations` | `bbd828951e166662bbe831fd74972e1a15488468` |
| File count at pin | **71** `.sql`; **0** `*.sql.proposed` |
| Manifest SHA-256 vs `git show` | **0 mismatches** (71/71 filename, order, digest, `byteLength`) |
| Transport pair | `#59` `20261002000014_coregrid_v2_transport_buses_rls.sql` then `#69` `20261003000041_coregrid_transport_bus_reads.sql` |
| Working tree at this checkout | **69** `.sql` files (not the pin) |
| Local `pg` | **8.23.1** |
| `scripts/db-apply.mjs` / `scripts/lib/pg-ssl.mjs` vs `origin/coregrid-scholar-migration` | **empty diff** |

`constants.mjs` lines 10–15 and `approved-manifest.json` lines 3–6 store the
same commit, tree, and count=71.

---

## 3. Review A — TLS

### 3.1 R-TLS-1 original defect is closed in the live constructor path

**Classification:** **PASS WITH CONDITIONS** (constructor / fail-closed
policy); live handshake **NOT VERIFIED**

**File evidence**

- `pg@8.23.1` `node_modules/pg/lib/connection-parameters.js` lines 59–61
  still does `Object.assign({}, config, parse(connectionString))`.
  Driver evidence (no socket):
  `new Client({ connectionString: url+"?sslmode=no-verify", ssl: { rejectUnauthorized: true, ca } })`
  → `connectionParameters.ssl === { rejectUnauthorized: false }`.
- `buildPinnedClientConfig` (`tls.mjs` lines 240–268) returns discrete
  `host` / `port` / `user` / `password` / `database` / `ssl` and does
  **not** include `connectionString`.
- `createLiveConnector` (`connect.mjs` lines 129–145) constructs
  `new Client(config)` from that object and refuses if
  `"connectionString" in config`.
- Independent constructor proof of the **pinned** object (no `connect()`):
  `rejectUnauthorized === true`, CA present, `host` taken from the URL
  hostname, `port === 5432`, no `connectionString` key.

`sslmode=disable` → `TLS_DISABLED_FORBIDDEN` (`tls.mjs` 142–145, 181–188).
`sslmode=no-verify` → `TLS_NO_VERIFY_FORBIDDEN` (146–148, 191–195).
`sslmode=require` / `verify-ca` / other → `TLS_SSLMODE_REFUSED` (149–154).
Omitted or `verify-full` only (`constants.mjs` 56–67).
`?host=` / `?hostaddr=` / unknown keys → `TLS_URL_PARAM_REFUSED` (127–139).
Query identity cannot override URL *components* (comment lines 115–117;
host is `url.hostname`, not a query `host`).

CA: `crypto.X509Certificate` parse (`tls.mjs` 69–102). Missing →
`TLS_CA_REQUIRED`. Unparseable PEM → `TLS_CA_INVALID`. Private key →
`TLS_CA_NOT_CERTIFICATE`. `x509.ca === false` → `TLS_CA_NOT_CA`.
`ssl` is frozen with `rejectUnauthorized: true`, `minVersion: "TLSv1.2"`,
and `ca` (216–220). `checkServerIdentity` is **not** overridden, so Node’s
default hostname check remains if a handshake ever occurs.

`SHERIVS_DB_INSECURE_TLS=1` refused (206–210). Libpq SSL env names
`PGSSLMODE`, `PGSSLROOTCERT`, `PGSSLCERT`, `PGSSLKEY`, `PGSSLNEGOTIATION`
refused in the **runner env bag** (39–48, `constants.mjs` 68–74).

Errors go through `redactText` (`tls.mjs` 33–36, 289). Target/URL parse
failures do not interpolate the raw credentialed URL.

Does not call `scripts/lib/pg-ssl.mjs`.

**Offline tests that hit real modules:** sslmode disable/no-verify;
conflicting URL modes; missing/invalid/private-key CA; unexpected
parameters and `PGSSLMODE`; driver overwrite vs discrete fields
(`demonstrateDriverSslOverwrite` uses `pg.Client`); secret non-leak.

### 3.2 Conditions and what is not a live handshake

| Topic | Class | Why |
|-------|-------|-----|
| Pinned CA matches the staging server certificate / name | **NOT VERIFIED** | No TLS handshake |
| `inspectConstructedClientSsl` comment claims it “Constructs Client” (`connect.mjs` 65–68) | **PASS WITH CONDITIONS** | Function only inspects `buildPinnedClientConfig`; it never calls `new Client`. Precedence is still proven by `demonstrateDriverSslOverwrite` and by this review’s constructor probe |
| `pg.Client` still reads `process.env.PGHOST` / `PGUSER` / `PGPASSWORD` when a discrete field is empty (`connection-parameters.js` `val()`) | **PASS WITH CONDITIONS** | Runner always supplies hostname/port/database from the URL; execute also ran `resolveStagingTarget` first. Empty-host + `PGHOST` is not a CLI path. A future caller of `createLiveConnector` without the runner’s target check could still hit env fallbacks |
| Runner refuses `PGSSLMODE` on the **passed-in** `env` object; `pg` reads **`process.env`** | **PASS WITH CONDITIONS** | Harmless while `ssl` is a defined object (driver then ignores `PGSSLMODE`). A later constructor that omitted `ssl` would not |
| Live `createLiveConnector({ allowNetwork: true })` | **PASS** as gated; **not removed** | Still present. CLI cannot reach `connect()` |

**No alternate runner path reintroduces `connectionString` into `pg.Client`.**
Grep of `scripts/staging/sherivs-restore/`: the only `new Client({ connectionString })` is inside `demonstrateDriverSslOverwrite`, which exists to document the unsafe merge and is not an apply path.

R-TLS-1 as originally stated (URL `sslmode` overwrites pinned `ssl` on the
live constructor) is **addressed in code**. It is **not** live-proven.

---

## 4. Review B — Advisory lock

### 4.1 What the code actually does

**Classification:** **PASS WITH CONDITIONS** for the offline lock
*abstraction*; live PostgreSQL advisory lock **NOT VERIFIED** and **not
implemented as a connector**.

R-HIST-1 originally: unique key `(attempt_id, filename)` allowed two
runners to `fresh_apply` the same file. That gap is addressed **as a
required gate plus a fake-session protocol**, which is what the
corrections mission was allowed to build (no database session).

**File evidence**

- Execute refuses a missing lock (`runner.mjs` 305–310), refuses
  `kind === "mutex"|"memory"` (312–317), refuses any other kind (318–320),
  then `await lock.acquire()` **before** bootstrap / reconcile / apply
  (322–334). Acquire failure returns `ok: false`, `retried: false`,
  `autoRetry: false` and does not enter `applySequence`.
- Documented live SQL (`lock.mjs` 54–63, 65–82): session
  `pg_try_advisory_lock($1,$2)` on keys `0x53485256` / `0x53544147`,
  probe via `pg_locks` for this backend, `pg_advisory_unlock`. Scope:
  entire restore attempt. Lifetime: dedicated lock session, not the
  apply session. Transaction-level locks are correctly rejected in the
  commentary as unable to span 71 apply connections.
- `createFakeAdvisorySession` + `createAdvisoryLock` implement that SQL
  against an in-memory registry. Two controllers sharing a registry
  cannot both observe `acquired: true` (`lock.mjs` 180–191). Offline
  test “two concurrent runner attempts cannot both acquire the advisory
  lock” drives **`runRestore`**, not a parallel helper.
- Per-file apply still uses `connector.withConnection('apply:…')`
  (`runner.mjs` 165). The fake lock session never receives migration SQL
  (`LOCK_SQL_UNEXPECTED` for unknown SQL, `lock.mjs` 206).
- Probe before each file (`runner.mjs` 110–148). Probe/session loss
  records `ambiguous` via `recordUncertain`, sets `retried: false` /
  `autoRetry: false`, and stops. Tested: “lock release and
  connection-loss stop apply without automatic retry” → second execute
  blocked with `LEDGER_AMBIGUOUS`.
- Release in `finally` after acquire (`runner.mjs` 414–416). Fake
  unlock clears the registry holder (`lock.mjs` 193–196, 277–289).
  Session death also clears the holder (212–215) — the analogue of
  PostgreSQL releasing a session advisory lock on backend exit.
- Defense in depth (offline only until bootstrap runs live): unique
  index `sherivs_staging_ledger_filename_inflight` on `filename` where
  status is `started` or `succeeded` (`ledger.mjs` 59–61). Memory ledger
  refuses a second STARTED/SUCCEEDED for the same filename
  (`ledger.mjs` `LEDGER_FILENAME_INFLIGHT`).

Interrupted attempts: STARTED without completion still maps to
`LEDGER_INCOMPLETE`; FAILED to `LEDGER_FAILED`; AMBIGUOUS to
`LEDGER_AMBIGUOUS`. None auto-retry (`evaluateLedger` + test 20).

### 4.2 What is not established

| Claim | Class | Evidence |
|-------|-------|----------|
| A PostgreSQL advisory lock is acquired on staging | **NOT VERIFIED** | `lock.mjs` never imports `pg` and never opens a socket. There is **no** live lock-session factory |
| Dedicated lock connection remains alive for the whole 71-file run against PostgreSQL | **NOT VERIFIED** | True of the fake session object only |
| “The runner cannot proceed merely because a local mock says the lock was acquired” | **PASS WITH CONDITIONS** | Execute accepts **any** object with `kind: "advisory"` and a resolving `acquire()`. Tests inject `createFakeAdvisorySession`. A future live process that injected `{ kind: "advisory", acquire: async () => ({ ok: true }) }` would satisfy the gate **without talking to PostgreSQL**. That is inherent to the required testable abstraction. It is a **live-wiring invariant**, not a CLI bypass: the CLI never reaches acquire |
| Probe during apply | **PASS WITH CONDITIONS** | `applySequence` probes only `if (typeof lock.probe === "function")` (`runner.mjs` 111–113). A stub without `probe` skips mid-run loss detection. `createAdvisoryLock` always has `probe` |
| Lock loss *during* a file’s SQL (after probe, before COMMIT) | **NOT VERIFIED** / coverage gap | Probe is per-file, not per-statement. Documented TOCTOU; unique inflight index is the intended backstop once live bootstrap exists |
| Concurrent two-**process** exclusion on a real database | **NOT VERIFIED** | Registry is in-process |

R-HIST-1 is **adequately addressed for offline implementation**. It is
**not** a live lock. Authorizing a live connector without a real lock
session that holds `pg_try_advisory_lock` for the whole attempt would
re-open the finding.

---

## 5. Review C — Migration reconciliation

### 5.1 Private ledger is no longer sole completion authority

**Classification:** **PASS WITH CONDITIONS**

Execute no longer returns success from `evaluateLedger` alone
(`runner.mjs` 362–392). It always calls `reconcileRestoreState`. Default
catalog is `{ status: "NOT_CHECKED" }` and default vendor history is
`{ status: "unknown" }` (354–355), both of which **refuse** execute
(`CATALOG_NOT_CHECKED` / `VENDOR_HISTORY_UNKNOWN`, `reconcile.mjs`
144–157, 207–220).

Independent offline checks (real `reconcile.mjs`, not a parallel copy):

| Case | Result |
|------|--------|
| Ledger all-succeeded, catalog `NOT_CHECKED` | `CATALOG_NOT_CHECKED` (`ok: false`) |
| Ledger all-succeeded, catalog observed empty | `LEDGER_SCHEMA_ABSENT` |
| Empty ledger + vendor versions present | `VENDOR_HISTORY_DISAGREE` |
| Vendor `entries[].checksum` ≠ manifest SHA-256 | `MANIFEST_CHECKSUM_DIFFERS_FROM_HISTORY` (checked **before** ledger success, `reconcile.mjs` 125–130) |
| Empty ledger + some expected tables | `PARTIAL_SCHEMA` |
| Empty ledger + all expected tables | `UNKNOWN_MIGRATION_STATE` |
| Empty ledger + unexpected public table | `CATALOG_UNEXPECTED_OBJECTS` |
| Ledger `evaluateLedger` already_complete | still a **ledger-only** action (`ledger.mjs` 154–160); runner must not (and does not) treat it as restore success. Test: “execute does not treat ledger-only already_complete as success” |

`refuse()` always sets `ok: false`, `autoRetry: false` (`reconcile.mjs`
27–36). Runner logs `reconcile_blocks_execute` and returns `ok: false`.
That is not a warning downgrade.

Non-idempotent replay: `fresh_apply` is allowed only when catalog is
observed, vendor is absent/empty of expected versions, expected tables
are **all missing**, and no unexpected public tables exist
(`reconcile.mjs` 207–262). Partial/unknown catalog blocks. Test 20:
failed file is not retried (`applyB` stays 1; `retried: false`).

`securityProof` is hardcoded `false` on success and refusal. Comments in
`catalog-contract.mjs` lines 1–26 state existence ≠ RLS/application
correctness and that SHERIVS-001/002/003 remain OPEN.

### 5.2 Object-level verification — incomplete (honestly limited, one gap)

**What is actually compared** when `catalog.status === "observed"`:

- Public table **names** derived from static `CREATE TABLE`
- Policy **names** on tables derived from static `CREATE POLICY`
  (`catalog-contract.mjs` 28–32, 100–157, 159–212)
- Vendor `schema_migrations.version` strings (and optional checksums if
  a caller supplies `entries[].checksum`)

**Explicitly not compared** (stated in `CONTRACT_LIMITATIONS` and
accurate):

- columns, constraints, indexes, functions, triggers, grants
- policy `USING` / `WITH CHECK` expressions
- RLS enabled-bit vs policy body
- dynamic SQL / `DO` / `EXECUTE` names

`CATALOG_OBSERVE_SQL` (`catalog-contract.mjs` 64–83) is a **plan**. This
process does not run it. Preflight still records `catalog: NOT_CHECKED`
(`preflight.mjs` 31–36, 143–157). LIVE_CATALOG_SQL is similarly unused.

**Gap (not a silent warning, but an incomplete gate):**
`compareCatalog` computes `missingPolicies`, but `reconcileRestoreState`
**never refuses on `missingPolicies`**. Independent probe: ledger +
vendor + table `public.a` present, expected policy `p_a` absent →
`missingPoliciesCount === 1`, **`action === "already_complete"`,
`ok: true`**. Tables-absent still blocks. Policies-absent does not.

That does **not** restore the original R-HIST-2 (ledger-only completion).
It **does** mean “schema complete” is table-name existence, not policy
existence, and not configuration correctness.

No test covers “catalog objects present but incorrectly configured”
(wrong columns, missing grants, inverted policy). That coverage is
**absent** and could not be honest without a live catalog plus a much
richer contract.

R-HIST-2 and R-HIST-3 are **adequately addressed as ledger-cannot-stand-alone
and green-field-cannot-be-assumed**. Object-level completeness remains
narrow by design.

---

## 6. Review D — Execution gate

**Classification:** **PASS**

| Requirement | Evidence | Class |
|-------------|----------|-------|
| Manifest cannot open a database | `runRestore` MANIFEST path only loads git/injected files (`runner.mjs` 249–259). CLI test without `DATABASE_URL` | **PASS** |
| Offline/preflight cannot open a database | `runOfflinePreflight` parses env URLs and TLS; `LIVE_CATALOG_SQL` is not executed. `--allow-live-catalog` without `allowLiveConnector` → `LIVE_CATALOG_NOT_ENABLED` (`cli.mjs` 103–109). `allowLiveCatalog` is hardcoded `false` in `main` (118) | **PASS** |
| Execute remains disabled on the CLI | No connector → `LIVE_EXECUTE_NOT_ENABLED` **after** authorization flags (`cli.mjs` 84–100). Independently: all three flags plus `--allow-network` still `LIVE_EXECUTE_NOT_ENABLED` | **PASS** |
| Staging ref and source commit must match exactly | `assertExecuteAuthorization` (`runner.mjs` 39–59); production ref → `EXECUTE_CONFIRM_REF`; wrong commit → `EXECUTE_CONFIRM_COMMIT`; missing flag → `EXECUTE_AUTHORIZATION_MISSING`. Test 23 | **PASS** |
| Hidden live-connection path in the CLI | `allowNetwork: false` hardcoded (117). `--allow-network` parsed (34–36) and discarded. `createLiveConnector` is not imported by `cli.mjs` | **PASS** |
| Hidden live-connection path in the library | `createLiveConnector` **exists** and will `connect()` if a **later process** passes `allowNetwork: true` | **PASS WITH CONDITIONS** — not a CLI bypass; still the opt-in that must be re-reviewed before use |

This review did not enable execution.

---

## 7. Review E — Source pin and regressions

**Classification:** **PASS** (git subprocess env remains a prior condition)

| Requirement | Result |
|-------------|--------|
| Exact commit + tree still pinned | **PASS** (`constants.mjs` 10–15; manifest; independent `git rev-parse`) |
| 71 files and checksums | **PASS** (0 digest mismatches) |
| 69-file working tree cannot be the pin | **PASS** (`resolvePinnedSource` uses git or explicit dir; `SOURCE_UNAVAILABLE` otherwise; working-tree test) |
| Transport pair present and ordered | **PASS** (seq 59 then 69; tests 13 / reordered-pair) |
| `*.sql.proposed` excluded | **PASS** (`verifyLoadedFiles` `PROPOSED_SQL_EXCLUDED`; test 14) |
| Production ref rejected | **PASS** (`TARGET_PRODUCTION_REF`; tests 8 and pin-intact) |
| Unprefixed `DATABASE_URL` / `SUPABASE_URL` cannot be the target | **PASS** (`TARGET_UNPREFIXED_PRESENT`; test 9) |
| Production-default apply scripts unchanged | **PASS** (empty diff vs `origin/coregrid-scholar-migration` for `scripts/db-apply.mjs`, `scripts/lib/pg-ssl.mjs`, `scripts/apply-canonical-hardening.mjs`) |

Prior review condition **A1 (Git env not sanitized)** is **unchanged**:
`defaultGit` (`source.mjs` 61–72) still inherits `GIT_DIR` / replace-refs.
Per-file SHA-256 still binds content. Not one of the four named blockers.
Still **PASS WITH CONDITIONS**.

---

## 8. Review F — Tests

Command (this review):

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**Result:** 1 file, **56 passed / 56**, ~0.9s. No database integration
tests. `pg.Client.prototype.connect` is replaced in `beforeAll` with a
throw. Test “offline test mode cannot open a database connection” also
constructs `createLiveConnector({ allowNetwork: true })` and expects
`connect()` to throw the patch message.

The file **imports the real implementation modules** (`constants`,
`source`, `target`, `tls`, `ledger`, `lock`, `reconcile`,
`catalog-contract`, `connect`, `preflight`, `runner`, `cli`). Execute
paths inject `createMockConnector`, `createMemoryLedger`, and
`createFakeAdvisorySession`. They are not a second helper reimplementation
of pinning or reconcile.

### 8.1 Requested coverage

| Topic | Present? | Notes |
|-------|----------|-------|
| Lock loss during execution | **Yes** | Loss after first COMMIT; second probe fails; no retry |
| Two concurrent runner attempts | **Yes** | Shared registry; second `runRestore` gets `LOCK_ACQUIRE_FAILED`; after release, second can proceed |
| TLS option precedence | **Yes** | Driver overwrite proof + pinned config without `connectionString`. `inspectConstructedClientSsl` itself does not construct `Client` |
| Ledger/vendor/catalog disagreement | **Yes** | Multiple reconcile tests plus execute-path `LEDGER_SCHEMA_ABSENT` |
| Catalog objects present but incorrectly configured | **No** | Missing coverage. Contract cannot see columns/RLS expressions |
| Connection cleanup after migration failure | **Partial** | Mock `finally` always closes (`connect.mjs` 54–60). Test 19 asserts **opened** labels and stop, not `closed.length`. Isolation test asserts open/close alternation on the success path |
| Execution disabled with all flags supplied | **Yes** | Test 23 + this review’s CLI probe including `--allow-network` |

`createSqlLedger` INSERT/UPDATE paths remain **untested** (same as the
prior review). Memory ledger and `evaluateLedger` are tested.

Passing 56 tests is **not** live database safety.

---

## 9. Findings table (corrections vs original blockers)

| ID | Topic | Class | DB needed? |
|----|-------|-------|------------|
| R-TLS-1 | URL `sslmode` cannot overwrite pinned `ssl` on `pg.Client` | **PASS WITH CONDITIONS** (handshake **NOT VERIFIED**) | No for overwrite; Yes for handshake |
| R-HIST-1 | Concurrent apply exclusion | **PASS WITH CONDITIONS** (live lock session **not built**) | Yes for real `pg_try_advisory_lock` |
| R-HIST-2 | Ledger-only `already_complete` | **PASS WITH CONDITIONS** (tables required; **policies not gated**) | Yes to observe live divergence |
| R-HIST-3 | Empty ledger ≠ green field | **PASS** as code/tests; live vendor-table **shape** **NOT VERIFIED** | Yes |
| C-POLICY | `missingPolicies` computed but does not refuse | **PASS WITH CONDITIONS** (incomplete object-level gate) | No to see the gap |
| C-SHAPE | Columns/constraints/functions/triggers/grants/policy expressions | **NOT VERIFIED** / not claimed | Yes, and a richer contract |
| D-CLI | Execute disabled | **PASS** | No |
| E-PIN | 71-file pin, transport, production refusal | **PASS** | No |
| Prior BLOCKER-2 | Fresh staging catalog | **Still open** (`NOT_CHECKED`) | Yes (read-only) |
| Prior BLOCKER-5 | Written human authorization | **Still open** | No (process) |
| SHERIVS-001/002/003 | RLS findings | **OPEN** — this review does not close them | n/a |

None of the four original named findings is still a **BLOCKER** in the
offline implementation. None of them is live-proven.

---

## 10. Remaining approvals (unchanged by this review)

A PASS here is **not** permission to inject a live connector.

Still required before any mutating restore:

1. Written human authorization naming staging ref `dvxszhracsjwdancijdc`,
   Git pin `d195ba8` / tree `bbd82895`, OPTION A, this runner, and
   acceptance of OPEN SHERIVS-001 / 002 / 003.
2. A later live-connector implementation that:
   - uses `buildPinnedClientConfig` and **never** passes `connectionString`;
   - opens a **dedicated** session, holds `pg_try_advisory_lock` for the
     whole attempt, probes it, and does not substitute a fake `kind:
     "advisory"` stub;
   - observes vendor `schema_migrations` and the public catalog **under
     that lock**;
   - is independently re-reviewed.
3. Fresh read-only staging catalog (emptiness, extensions, unexpected
   objects). GATE4 remains historical.
4. Post-restore catalog. Restore is not self-certifying.

Default recovery after partial, ambiguous, or lock-loss outcomes remains
**recreate staging**. Non-idempotent files must not be retried.

---

## 11. Version-target classification

**ACTIVE-V1 ONLY.** This review inspects the V1 Scholar 71-file restore
runner corrections. It does not implement V2 device/IoT or V3 Reality
Intelligence.

---

## 12. Explicit confirmation

- Authoritative source pin re-verified: commit `d195ba8`, tree
  `bbd82895`, **71** files, SHA-256 match, lexicographic order, transport
  `#59` then `#69`, no `*.sql.proposed`.
- Working tree remains a **69-file** trap; the runner does not use it as
  the pin.
- Production-default apply scripts were not changed.
- No database was opened. No SQL was executed against a server.
- No migration was applied. Staging was not restored.
- SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**.
- CLI live execute remains `LIVE_EXECUTE_NOT_ENABLED` even with every
  confirmation flag and `--allow-network`.
- `createLiveConnector` still exists behind `allowNetwork`; the CLI does
  not call it.
- This review is **not** authorization to connect, lock, catalog, or apply.

---

## 13. Agent report

**Implemented:** independent offline review of the staging restore
runner corrections (this document only).

**Files changed:** `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-CORRECTIONS-REVIEW-001.md`

**Architecture impact:** none to running systems.

**Tests:** independently recomputed 71 SHA-256 values; Git tree/count/order;
`pg@8.23.1` constructor overwrite vs pinned discrete config (no socket);
reconcile probe showing missing policies do not block `already_complete`;
`npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts` →
**56/56**; CLI manifest 71-file pin; CLI execute with all flags →
`LIVE_EXECUTE_NOT_ENABLED`. No database tests. No apply.

**Security validation:** production and staging non-contact; findings left
OPEN where live proof is required; credentials not printed; live execute
not enabled.

**Known risks:** injectable advisory stub; probe method optional;
`missingPolicies` not a refuse reason; `createLiveConnector` still present;
stale staging catalog; OPEN RLS findings if a later restore proceeds.

**Remaining work:** written authorization; live connector + real lock
session + read-only catalog, each independently re-reviewed; then a
separate mutating mission.

**Final status:** **A. PASS FOR OFFLINE IMPLEMENTATION — LIVE CONNECTOR STILL NOT AUTHORIZED**

Status **B** is refused because the four original code blockers are
addressed in the offline design and tests; remaining items are live
wiring, catalog observation, and documented contract limits—not a
reopening of R-TLS-1 / R-HIST-1 / R-HIST-2 / R-HIST-3 as unfixed defects.
Status **C** is refused because source pinning, TLS fail-closed policy,
lock gate, reconcile refusals, and the CLI execute gate are real.
