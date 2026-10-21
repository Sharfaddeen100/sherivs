# SHERIVS-MIGRATION-RUNNER-UNEXPECTED-OBJECTS-REVIEW-001

**Mission ID:** SHERIVS-MIGRATION-RUNNER-UNEXPECTED-OBJECTS-REVIEW-001
**Mission class:** INDEPENDENT SECURITY REVIEW — OFFLINE ONLY
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-15T15:50:00Z
**Role:** Independent Principal PostgreSQL Engineer / Database Security Architect / Migration Reliability Engineer / Verification Architect

**Final status:** **PASS WITH CONDITIONS**

This review assesses whether the implementation reported in
`docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-UNEXPECTED-OBJECTS-FIX-001.md`
is present in code and offline tests, and whether any known
false-completion path remains.

The implementation report was an input to **contradict**, not to copy.
Passing tests are not treated as proof of their own claims.

This review does **not** authorize a database connection, lock, catalog
inspection, migration, deployment, or production change. Staging has
**not** been restored. SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain
**OPEN**. No live operation is authorized. Runner code was **not**
modified.

---

## 1. Scope and no-network declaration

Inspected implementation: commit
`454b61c0f6805fee3a14b9acea4ce6c237f66419`
(“docs: record unexpected-objects fix for restore runner”), which
includes:

- `e62d93f8f2e6ba21638f3017fd6a0d3c22e77fc8` (comparison and tests)
- `c125c4e339883b0e8972fe06444b00b5e809b3dc` (fixture cloning)

This reviewer:

- did not open PostgreSQL, a pooler session, or a Supabase API;
- did not execute `CATALOG_OBSERVE_SQL`;
- did not apply migrations or restore staging;
- used fixture URLs and in-process module imports only;
- did not alter runner, tests, or canonical SQL.

| Label | Meaning |
|-------|---------|
| **Repository evidence** | Git objects, file bytes, or script source |
| **Offline-tested** | Exercised against the real modules or the targeted Vitest file |
| **Implementation-report claim** | Taken from the fix artifact; not treated as proof |
| **NOT VERIFIED (live)** | Requires a live session this mission did not open |

---

## 2. Exact reviewed commit and working-tree status

| Item | Value |
|------|--------|
| Reviewed HEAD | `454b61c0f6805fee3a14b9acea4ce6c237f66419` |
| Implementation | `e62d93f8f2e6ba21638f3017fd6a0d3c22e77fc8` |
| Fixture-copy follow-up | `c125c4e339883b0e8972fe06444b00b5e809b3dc` |
| Working tree at inspection | **clean** (this review adds only this document) |
| This review branch | `cursor/sherivs-migration-runner-unexpected-objects-review-ca03` |
| Canonical pin | `d195ba861f80379b79533126653b9cee82a8e872` / tree `bbd828951e166662bbe831fd74972e1a15488468` / **71** files |

The working tree still has **69** `.sql` files. Restore source is
`loadFromGitCommit()` of the pin, not the working tree.

---

## 3. Files and functions inspected

- `scripts/staging/sherivs-restore/catalog-contract.mjs`
  (`CONTRACT_ALLOWLIST`, `isConstraintImpliedIndex`, `parseIndexColumns`,
  `grantKey`, `parseGrantTargets`, `compareCatalog`,
  `catalogBlocksCompletion`, `requireObserved`,
  `observedCatalogFromExpected`, `mapObservedRowsToCatalog`,
  `CATALOG_OBSERVE_SQL`)
- `scripts/staging/sherivs-restore/reconcile.mjs`
- `scripts/staging/sherivs-restore/cli.mjs`
- `scripts/staging/sherivs-restore/connect.mjs`
- `scripts/staging/sherivs-restore/lock.mjs`
- `scripts/staging/sherivs-restore/runner.mjs`
- `scripts/staging/sherivs-restore/target.mjs`
- `scripts/staging/sherivs-restore/constants.mjs`
- `scripts/staging/sherivs-restore/README.md`
- `tests/unit/sherivs-staging-migration-runner.test.ts`
- the cited implementation report

Independent probes imported those modules. Log:
`/opt/cursor/artifacts/sherivs-unexpected-objects-review-probes.json`
and
`/opt/cursor/artifacts/sherivs-unexpected-objects-review-probes-2.json`.

---

## 4. Reported claims — independently checked

| Reported claim | Independent result |
|----------------|-------------------|
| 106/106 targeted tests pass | **Confirmed.** Re-ran Vitest → **106 passed / 106** |
| Extra `ssn` refuses | **Confirmed** (`CATALOG_COLUMN_MISMATCH`, `sensitive: true`) |
| Extra UNIQUE refuses | **Confirmed** (`CATALOG_CONSTRAINT_MISMATCH`) |
| Extra non-unique index refuses | **Confirmed** (`CATALOG_UNEXPECTED_OBJECTS`) |
| Extra trigger refuses | **Confirmed** |
| Extra storage bucket refuses | **Confirmed** (`CATALOG_STORAGE_MISMATCH`) |
| Extra table / column `grantable` refuses | **Confirmed** |
| Allowlist is uniquely constraint-implied unique/PK indexes | **Contradicted in part.** Same-table ordered columns with `unique !== false` are treated as implied even when the definition is a partial index, an `INCLUDE` index, or uniqueness was omitted (UOR-ALLOW-1..4) |
| Omitted empty expected class keys cannot prove absence | **Confirmed, and it still produces `already_complete`** (UOR-OMIT-1) |
| Live execute disabled | **Confirmed** |
| SHERIVS-001 / 002 / 003 remain OPEN | **Confirmed as honesty.** This review does not close them |

---

## 5. Independently reproduced cases (A–J)

Identity and rich fixtures were rebuilt in the probe, not copied from
the unit file’s pass/fail. Baseline identity catalog →
`already_complete` / `ledger_vendor_catalog_agree`.

| ID | Case | Result | `already_complete` |
|----|------|--------|--------------------|
| A | Extra `ssn` on matched `people` | `CATALOG_COLUMN_MISMATCH` (`unexpected`, `sensitive: true`) | **no** |
| B | Extra UNIQUE `(name)` | `CATALOG_CONSTRAINT_MISMATCH` (`unexpected`) | **no** |
| C | Extra non-unique `people_name_idx` | `CATALOG_UNEXPECTED_OBJECTS` | **no** |
| D | Extra trigger `people_audit` | `CATALOG_UNEXPECTED_OBJECTS` | **no** |
| E | Extra bucket `private-docs` | `CATALOG_STORAGE_MISMATCH` | **no** |
| F | Table grant `grantable: true` | `CATALOG_GRANT_MISMATCH` | **no** |
| G | Column grant `grantable: true` | `CATALOG_COLUMN_GRANT_MISMATCH` | **no** |
| H | Missing policy / function / trigger / index / expected bucket | matching `CATALOG_*_MISSING` or `CATALOG_STORAGE_MISMATCH` | **no** |
| I | Same-name index columns `(ssn)` vs `(name)`; trigger AFTER INSERT vs BEFORE UPDATE | `CATALOG_INDEX_MISMATCH` / `CATALOG_TRIGGER_MISMATCH` | **no** |
| J | Omit column `type`; omit `storageBuckets` when a bucket is expected | `CATALOG_SHAPE_INCOMPLETE` | **no** |
| J-omit | Omit `indexes` / `triggers` / `storageBuckets` when expected lists are empty | `already_complete` | **yes** (UOR-OMIT-1) |

The six review defects named in the implementation report **no longer**
produce `already_complete` when the catalog class arrays are present.

---

## 6. Test command and exact result

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**Result:** 1 file, **106 passed / 106**, ~6.07s (Vitest 3.2.4).

Log: `/opt/cursor/artifacts/sherivs-unexpected-objects-review-vitest.log`

`beforeAll` still throws on `pg.Client.prototype.connect`. Tests use
fixture URLs and `loadFromGitCommit()`. They do not contact PostgreSQL
or Supabase. A passing suite is **not** live integration evidence.

Assertions for A–G were read in
`tests/unit/sherivs-staging-migration-runner.test.ts` (extra ssn,
UNIQUE/index/trigger, storage, grantable). They check `decision.reason`
and mismatch objects, not only `ok: false`. They do **not** assert
partial indexes, `INCLUDE`, omitted `unique`, or omitted empty class
keys.

---

## 7. Index-allowlist verification

`CONTRACT_ALLOWLIST.extras` has a single key
`constraintImpliedIndexes` (`catalog-contract.mjs` 74–84). Scope is
documented as indexes only.

`isConstraintImpliedIndex` (479–493):

1. `unique === false` → not implied.
2. Parse columns from `columns[]` if non-empty, else first `(...)` in
   `spec` / `definition` (`parseIndexColumns`, 461–471).
3. Require a table record and a PK/UNIQUE with `sameOrderedList`
   columns.
4. Return **true** (permit) otherwise. There is no unverified return.

`unexpectedIndexes` (2171–2175) drops any extra that this function
accepts. `catalogBlocksCompletion` then has nothing to refuse.

| Probe | Implied? | Completion |
|-------|----------|------------|
| Unique index `people(id)` matching PK | true | `already_complete` (intended) |
| Unique index `orgs(name)` matching UNIQUE | true | `already_complete` (intended) |
| Unique `people(name)` (no UNIQUE on people) | false | refuse |
| Unique `(name, id)` vs orgs UNIQUE `(name)` | false | refuse |
| Non-unique `people(id)` | false | refuse |
| Unique `public.ghost(id)` (unknown table) | false | refuse |
| **`unique` omitted, columns `people(id)`** | **true** | **`already_complete`** |
| **`CREATE UNIQUE INDEX ... (id) WHERE deleted_at IS NULL`** | **true** | **`already_complete`** |
| **spec `(id) WHERE deleted_at IS NULL`** | **true** | **`already_complete`** |
| **`(id) INCLUDE (name)`** | **true** | **`already_complete`** |
| Expression `((lower(id::text)))` | false | refuse |
| **`columns: ["id"]` plus expression/WHERE definition** | **true** | **`already_complete`** |

A first-parenthesis parse of `pg_get_indexdef` (the unused observe
SQL already projects `definition`, lines 154–162) still yields
`["id"]` for a partial unique index on the PK. The contract **cannot**
tell a constraint-implied btree from a partial or covering unique
index, and it **permits** rather than marking unverified.

That violates the review rule: if implication cannot be determined,
the result must be unverified, not `already_complete`.

---

## 8. Object-class completeness verification

`compareCatalog` (1741+) only marks a class incomplete when the
**expected** list is non-empty and the observed value is `null`
(1759–1776). `requireObserved` (1736–1738) is used for **tables only**.

Empty expected + omitted observed key:

```
unexpectedIndexes = (catalog.indexes ?? []).filter(...)
unexpectedTriggers = (catalog.triggers ?? []).filter(...)
unexpectedStorage = (catalog.storageBuckets ?? []).filter(...)
```

Omitted is coerced to `[]`. Probe **J-omit**: identity SQL has zero
expected indexes, triggers, and buckets; deleting those catalog keys
yielded `shapeIncomplete: []` and **`already_complete`**.

Distinctions required by this mission:

| State | How represented | Compared as |
|-------|-----------------|-------------|
| Observed class with zero objects | `indexes: []` (present) | empty set |
| Observed class containing objects | non-empty array | extras compared |
| Class not observed | key omitted / `null` | **same as empty** if expected is empty |
| Observation failed | `status !== "observed"` | `CATALOG_NOT_CHECKED` |
| Unparseable leftover constraint | leftover → `unverified` | `CATALOG_CONSTRAINT_UNVERIFIED` |
| Unparseable extra index | no columns, `unique !== false` | not implied → unexpected refuse (fail closed, not unverified) |

`mapObservedRowsToCatalog` does `requireClass` indexes, triggers, and
`storageBuckets` (2348–2353). That mapper is unused in live execute.
`compareCatalog` itself does **not** reject incomplete observations of
empty expected classes before comparison.

When a bucket **is** expected, omitting `storageBuckets` is
`CATALOG_SHAPE_INCOMPLETE` (probe J). The hole is the empty-expected
case.

---

## 9. Contract limitation matrix

| Item | Classification | Effect on the completion guarantee |
|------|----------------|-------------------------------------|
| Extra public column name | **REQUIRED_AND_COMPARED** | Extra `ssn` refuses |
| Column type / nullability | **REQUIRED_AND_COMPARED** | Omitted → incomplete; mismatch refuses |
| Column defaults | **EXPLICITLY_OUT_OF_SCOPE_WITH_RATIONALE** | Not in contract (`CONTRACT_LIMITATIONS`). Extra `default` on an existing column still `already_complete` (probe) |
| Identity / generated | **EXPLICITLY_OUT_OF_SCOPE_WITH_RATIONALE** | Same probe; extra identity/generated flags on an existing column complete |
| Extra UNIQUE / CHECK | **REQUIRED_AND_COMPARED** | Leftover constraints refuse |
| CHECK matching | **REQUIRED_AND_COMPARED** as **textual** `normalizeExpr`, not semantic | `name <> ''` vs `'' <> name` would mismatch. **Do not claim semantic CHECK equivalence.** |
| Indexes (expected name) | **REQUIRED_AND_COMPARED** for table / unique / ordered columns | Predicate, method, opclass, INCLUDE not compared |
| Extra indexes | **UNKNOWN_OR_INCOMPLETE** | Non-unique extras refuse; partial/INCLUDE/unique-omitted PK-column extras complete via allowlist |
| Triggers | **REQUIRED_AND_COMPARED** for name / timing / events / function | Extra names refuse; WHEN / ENABLE not compared |
| Functions identity / returns / security / volatility | **REQUIRED_AND_COMPARED** | Prior tests still pass |
| Function bodies | **EXPLICITLY_OUT_OF_SCOPE_WITH_RATIONALE** | Dollar-quoted bodies are not scanned |
| Function grants + grantable | **REQUIRED_AND_COMPARED** as explicit tuples | Extra grantee / grantable refuse |
| Table / column grants + grantable | **REQUIRED_AND_COMPARED** as explicit tuples | Extra option / grantee / PUBLIC tuple refuse |
| Object ownership | **EXPLICITLY_OUT_OF_SCOPE_WITH_RATIONALE** | Not represented |
| Role membership / inherited privileges | **EXPLICITLY_OUT_OF_SCOPE_WITH_RATIONALE** | **Not effective-privilege equivalence** |
| PUBLIC as explicit grantee | **REQUIRED_AND_COMPARED** | Unexpected `TO public` refuses |
| PUBLIC / owner `acldefault` | **EXPLICITLY_OUT_OF_SCOPE_WITH_RATIONALE** | A future unscoped ACL dump would fail closed as unexpected |
| `ALTER DEFAULT PRIVILEGES` | **EXPLICITLY_OUT_OF_SCOPE_WITH_RATIONALE** | Not parsed |
| RLS enabled / FORCE when expected | **REQUIRED_AND_COMPARED** | Missing bits incomplete; expected true vs observed false mismatches |
| Unexpected FORCE RLS when not expected | **UNKNOWN_OR_INCOMPLETE** | Probe completed (`already_complete`) |
| Policy command / roles / permissive / USING / WITH CHECK | **REQUIRED_AND_COMPARED** | NULL vs omitted remains distinct |
| Storage bucket id/name | **REQUIRED_AND_COMPARED** when the class is present | Extra / missing refuse; public / mime / size not compared |
| Views, sequences, enums, extensions, publications | **EXPLICITLY_OUT_OF_SCOPE_WITH_RATIONALE** | Listed in limitations |

The runner’s stated guarantee is a **static SQL expected-object
contract**, with `securityProof` and `schemaEquivalence` remaining
`false`. Textual CHECK and explicit GRANT tuples do **not** prevent
that narrower guarantee. Allowlist acceptance of non-implied unique
indexes **does** prevent the unexpected-object guarantee this mission
asked for.

---

## 10. Blocking and non-blocking findings

### Blocking for `PASS FOR OFFLINE IMPLEMENTATION`

1. **UOR-ALLOW-1.** A partial unique index on PK/UNIQUE columns is
   treated as constraint-implied and yields `already_complete`.
   Code: `parseIndexColumns` 461–471; `isConstraintImpliedIndex`
   479–493; `unexpectedIndexes` 2171–2175.
2. **UOR-ALLOW-2.** Omitted `unique` plus matching columns is implied
   (`unique === false` is the only uniqueness reject). Incomplete
   uniqueness observation completes.
3. **UOR-ALLOW-3.** `INCLUDE` unique indexes on PK columns complete.
4. **UOR-ALLOW-4.** A populated `columns[]` ignores `definition` /
   `WHERE`, so an expression or partial index can be allowed if the
   observer also sends the PK column list.
5. **UOR-OMIT-1.** Omitted `indexes` / `triggers` / `storageBuckets`
   keys are interpreted as empty sets when expected lists are empty,
   so missing observation cannot prove absence of extras.
   Code: `compareCatalog` 1759–1776 and `?? []` at 2120 / 2171 / 2184.

These are remaining false-complete paths. They do not enable CLI
execute.

### Non-blocking / residual

1. CHECK is textual, not semantic (fail closed on different text).
2. Grant compare is explicit tuples, not ownership / inheritance /
   default privileges.
3. Column defaults / identity / generated on an **existing** expected
   column are out of contract and still complete.
4. Unexpected FORCE RLS when not expected is not compared.
5. `CATALOG_OBSERVE_SQL` unused; live catalog **NOT VERIFIED (live)**.
6. In-process lock WeakSet; no public `LIVE_CAPABLE_LOCKS.add`.
7. Working tree 69 vs pin 71 (loader uses pin).
8. SHERIVS-001 / 002 / 003 **OPEN**.

---

## 11. Live execution safety verification

| Probe | Result |
|-------|--------|
| CLI execute + confirmations + `--allow-network` | `LIVE_EXECUTE_NOT_ENABLED` (independent `cli.main` call and unit tests 23 / execute-mode) |
| CLI hardcodes `allowNetwork: false` / `allowLiveCatalog: false` | `cli.mjs` 120–121 after parse of `--allow-network` |
| `createLiveConnector({ allowNetwork: true })` | `LIVE_CONNECTOR_NOT_AUTHORIZED` |
| `createLivePostgresLockSession()` | `LIVE_LOCK_SESSION_NOT_AUTHORIZED` |
| Assign `liveCapable = true` on official lock | throws (frozen); `isLiveCapableLockController` false |
| Spread-forged `{ kind: "advisory", liveCapable: true }` | `isLiveCapableLockController` false |
| Production ref `nwrflbpbhyiqdptmlccm` | `TARGET_PRODUCTION_REF` (unit test 8; `constants.mjs` 18; `target.mjs` 58–64) |
| `LIVE_CAPABLE_LOCKS.add` | **no writer** in `lock.mjs` (only `.has` at 399) |

`runner.mjs` 356–403 still fails live connector / `allowNetwork` /
`kind === "live"` even if a caller injects them. This review did not
contact either database.

---

## 12. Canonical migration source verification

Local git objects only:

| Check | Result |
|-------|--------|
| `git rev-parse d195ba861f80379b79533126653b9cee82a8e872:database/supabase/migrations` | `bbd828951e166662bbe831fd74972e1a15488468` |
| `.sql` excluding `.sql.proposed` | **71** |
| `.sql.proposed` in pin | **0** |
| Transport filenames in pin | `20261002000014_coregrid_v2_transport_buses_rls.sql` then `20261003000041_coregrid_transport_bus_reads.sql` |
| Approved manifest order | unit tests: `files[58] === TRANSPORT_FIRST`, `files[68] === TRANSPORT_SECOND` (**passed**) |
| `loadFromGitCommit()` | unit test 1 / pinned-71-file test **passed**, count 71 |
| Working tree | 69 files; not used |

Canonical SQL was not modified. `.sql.proposed` files are not in the
pin.

---

## 13. Explicit confirmation that no database or network was contacted

No `connect()`, no `pg.Client.end()`, no Supabase API, no SQL
execution, no catalog session. Probes imported local `.mjs` modules.
Vitest kept the connect guard. Pin inventory used local git objects.

---

## 14. Explicit confirmation that staging has not been restored

No migration was applied. Staging project `dvxszhracsjwdancijdc` was
not contacted. The 69-file working tree was not used as the pin.

---

## 15. Explicit confirmation that no live operation is authorized

**This review does not authorize any database connection, lock, catalog
inspection, migration, deployment, or production change.** CLI execute
remains `LIVE_EXECUTE_NOT_ENABLED`. SHERIVS-001 / 002 / 003 remain
**OPEN**.

---

## 16. Verdict

**PASS WITH CONDITIONS**

**PASS FOR OFFLINE IMPLEMENTATION** is refused. Cases A–G from the
prior unexpected-object review now refuse when class arrays are
present, but a known false-complete path remains: the index allowlist
accepts unique indexes it cannot prove are constraint-implied
(partial, INCLUDE, uniqueness omitted), and omitted empty expected
class keys are treated as empty observations.

**BLOCKED** is refused. Extra columns, UNIQUE constraints, non-unique
indexes, triggers, storage buckets, and table/column grant options
refuse; missing expected objects and same-name definition mismatches
refuse; live execute and production targeting remain refused; the
71-file pin and transport order are intact.

Conditions before any live catalog may claim `already_complete`:

1. Constraint-implied index permission must require uniqueness
   **present and true**, and must refuse or mark unverified when
   predicate / INCLUDE / expression cannot be shown absent.
2. `compareCatalog` must treat omitted object-class keys as incomplete
   even when the expected list is empty (empty array ≠ missing key).
3. Written authorization plus a reviewed live connector, lock session,
   and executing observer that preserves those distinctions.

**Final status:** **PASS WITH CONDITIONS**

---

## 17. Agent report

**Implemented:** this independent review document only.

**Files Changed:**
`docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-UNEXPECTED-OBJECTS-REVIEW-001.md`

**Architecture Impact:** none.

**Tests:** Vitest **106/106**. Independent probes as above. No database
tests.

**Security Validation:** production refused; live execute disabled;
SHERIVS-001 / 002 / 003 not marked resolved; staging not restored.

**Known Risks:** allowlist false-completes (UOR-ALLOW-1..4); omitted
empty class keys (UOR-OMIT-1); unused observe plan; explicit-tuple
grants; textual CHECK; OPEN application RLS findings.

**Remaining Work:** close allowlist and omitted-class holes; then
written authorization + live connector/lock/observer. No live
operation is authorized by this review.

**Final status:** **PASS WITH CONDITIONS**
