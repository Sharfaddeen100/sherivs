# SHERIVS-MIGRATION-RUNNER-OBSERVATION-COMPLETENESS-REVIEW-001

**Mission ID:** SHERIVS-MIGRATION-RUNNER-OBSERVATION-COMPLETENESS-REVIEW-001
**Mission class:** INDEPENDENT SECURITY REVIEW — OFFLINE ONLY
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-15T08:06:00Z
**Role:** Independent Principal PostgreSQL Engineer / Database Security Architect / Migration Reliability Engineer / Verification Architect

**Final status:** **PASS WITH CONDITIONS**

This review assesses whether the implementation reported in
`docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-OBSERVATION-COMPLETENESS-FIX-001.md`
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
`458ff11ef0468e191a7adc3ed233561737c5167a`
(“fix: fail closed on incomplete catalog observations”) plus report
commit `c75420dc55277604cd5f6bcdf3beeccb6a19eae0`.

This reviewer:

- did not open PostgreSQL, a pooler session, or a Supabase API;
- did not execute `CATALOG_OBSERVE_SQL`;
- did not apply migrations or restore staging;
- used fixture URLs only;
- did not alter runner, tests, or canonical SQL.

| Label | Meaning |
|-------|---------|
| **Repository evidence** | Git objects, file bytes, or script source |
| **Offline-tested** | Exercised against the real modules or the targeted Vitest file |
| **Implementation-report claim** | Taken from the fix artifact; not treated as proof |
| **NOT VERIFIED (live)** | Requires a live session this mission did not open |

---

## 2. Exact commit and working-tree status

| Item | Value |
|------|--------|
| Reviewed implementation | `458ff11ef0468e191a7adc3ed233561737c5167a` |
| Reviewed report / HEAD at inspection | `c75420dc55277604cd5f6bcdf3beeccb6a19eae0` |
| Parent independent review | `5c4352e22de5859dbfa0ead8a423a05920941ae4` |
| Working tree | **clean** (this review adds only this document) |
| This review branch | `cursor/sherivs-migration-runner-observation-completeness-review-ca03` |
| Canonical pin | `d195ba861f80379b79533126653b9cee82a8e872` / tree `bbd828951e166662bbe831fd74972e1a15488468` / **71** files |

The working tree still has **69** `.sql` files. Restore source is
`loadFromGitCommit()` of the pin, not the working tree.

---

## 3. Files and code paths reviewed

- `scripts/staging/sherivs-restore/catalog-contract.mjs`
  (`normalizeConstraint`, `constraintsEquivalent`,
  `resolveForeignKeyReferencedColumns`, `primaryKeyColumnsOf`,
  `observationState`, `compareCatalog`, `catalogBlocksCompletion`,
  `functionGrantKey`, `grantKey`, `observedCatalogFromExpected`,
  `mapObservedRowsToCatalog`, `CATALOG_OBSERVE_SQL`,
  `OBSERVE_SQL_FIELD_MAP`)
- `scripts/staging/sherivs-restore/reconcile.mjs` (`already_complete`)
- `scripts/staging/sherivs-restore/lock.mjs`
- `scripts/staging/sherivs-restore/cli.mjs`
- `scripts/staging/sherivs-restore/connect.mjs`
- `scripts/staging/sherivs-restore/runner.mjs`
- `scripts/staging/sherivs-restore/target.mjs`
- `scripts/staging/sherivs-restore/source.mjs`
- `scripts/staging/sherivs-restore/constants.mjs`
- `tests/unit/sherivs-staging-migration-runner.test.ts`
- both cited reports

---

## 4. Reported claims — independently checked

| Reported claim | Independent result |
|----------------|-------------------|
| 95/95 targeted tests pass | **Confirmed.** Re-ran Vitest → **95 passed / 95** |
| Implicit-PK vs matching explicit PK can complete; wrong key refuses | **Confirmed** |
| Missing referenced PK → `CATALOG_CONSTRAINT_UNVERIFIED` | **Confirmed** by unit assertion and `resolveForeignKeyReferencedColumns` |
| Omitted type / returns / USING / command → `CATALOG_SHAPE_INCOMPLETE` | **Confirmed** |
| Explicit `using: null` vs expected expression → `CATALOG_POLICY_MISMATCH` | **Confirmed** |
| Unexpected function grants / grantable refuse | **Confirmed** (`CATALOG_FUNCTION_GRANT_MISMATCH`) |
| Extra columns ignored | **Confirmed, and it still produces `already_complete`** (OCR-COL-1) |
| Table grant options compared | **Contradicted.** `grantKey` omits `grantable`; extra WITH GRANT OPTION on a table grant still `already_complete` (OCR-GRANT-1) |
| Live execute disabled | **Confirmed** |
| SHERIVS-001 / 002 / 003 remain OPEN | **Confirmed as honesty.** This review does not close them |

---

## 5. Section A — reproduced former defects

Independent probes imported the real modules. Fixture URLs only.
Log: `/opt/cursor/artifacts/sherivs-observation-completeness-review-probes.log`.

| Case | Result | `already_complete` |
|------|--------|--------------------|
| Implicit-PK resolved to `people(id)` vs observed explicit `(id)` | `already_complete` (correct resolution) | yes, intended |
| Implicit-PK vs observed explicit `(ssn)` | `CATALOG_CONSTRAINT_MISMATCH` | **no** |
| Omit column `type` | `CATALOG_SHAPE_INCOMPLETE` | **no** |
| Omit function `returns` | `CATALOG_SHAPE_INCOMPLETE` | **no** |
| Unexpected function grant to `anon` | `CATALOG_FUNCTION_GRANT_MISMATCH` | **no** |
| Missing expected function grant | `CATALOG_FUNCTION_GRANT_MISMATCH` | **no** |
| Omit policy `using` key | `CATALOG_SHAPE_INCOMPLETE` | **no** |
| Explicit `using: null` vs expected expression | `CATALOG_POLICY_MISMATCH` | **no** |
| Omit policy `command` | `CATALOG_SHAPE_INCOMPLETE` | **no** |
| Expected RESTRICTIVE vs observed PERMISSIVE | `CATALOG_POLICY_MISMATCH` | **no** |

`observationState` independently: omitted → `missing`; `null` with
`allowAbsent` → `absent`; `""` → `unknown`; expression → `present`.

The six review defects from
`SHERIVS-STAGING-MIGRATION-RUNNER-CONTRACT-AND-TRUST-REVIEW-001` **no
longer** produce `already_complete` when the catalog is otherwise
complete.

---

## 6. Section B — table and column contract

### Extra columns (OCR-COL-1)

**Classification:** **not required and compared; not explicitly
permitted by contract; not a documented allow-list. Silently accepted.**

Code path: `compareCatalog` iterates **expected** columns only
(`catalog-contract.mjs` 1737–1771). There is no reverse walk of
`observed.columns`. `catalogBlocksCompletion` has no unexpected-column
reason (2075–2107).

Reproducible fixture (real modules, identity contract):

```
catalog = observedCatalogFromExpected(expected)
catalog.tables[people].columns.push({ name: "ssn", type: "text", nullable: true })
reconcileRestoreState(...)
→ action=already_complete reason=ledger_vendor_catalog_agree
```

A sensitive extra column (`ssn`) does not invalidate completion. The
mission rule “an unexpected column that is not explicitly permitted
must not be silently accepted as complete” is **not** met.

The fix report listed this as a residual. Documentation of a hole is
not a contract permission.

### Other extra objects

| Object | Compared extra? | Probe |
|--------|-----------------|-------|
| Extra public table | yes → `CATALOG_UNEXPECTED_OBJECTS` | refused |
| Extra policy | yes → `CATALOG_UNEXPECTED_OBJECTS` | refused |
| Extra function | yes → `CATALOG_UNEXPECTED_OBJECTS` | refused |
| Extra UNIQUE / CHECK on a matched table | **no** (expected-only match, unused observed leftover) | **`already_complete`** |
| Extra index | **no** (name presence of expected only, 2026–2029) | **`already_complete`** |
| Extra trigger | **no** (expected-only, 2005–2025) | **`already_complete`** |
| Extra storage bucket | **no** (expected-only, 2031–2035) | **`already_complete`** |
| Extra function grant | yes | refused |
| Extra table grant tuple | yes, both ways (1834–1848) | refused when the privilege/role differs |

Vendor-schema tables/policies/functions are ignored
(`VENDOR_SCHEMAS`, 1712–1714). That is an explicit allow for
`auth` / `storage` / …, not for extra `public` columns.

---

## 7. Section C — privilege-contract coverage

`functionGrantKey` (`875–879`) includes function identity, roles,
privileges, and `grantable`. `grantKey` for tables/columns (`1078–1079`)
is `table::roles::privileges::columns` and **omits grantable**.

| Privilege class | What the contract establishes | Initial restore required? |
|-----------------|-------------------------------|---------------------------|
| Table privileges (explicit GRANT from pin SQL) | Tuple presence both ways | **Yes** — those GRANTs |
| Column privileges | Same, both ways | **Yes** where the pin GRANTs columns |
| Function EXECUTE | Tuple presence both ways, including unexpected grantees | **Yes** |
| Function WITH GRANT OPTION | Compared (`grantable` in key). Extra grantable refuses | **Yes** to refuse unexpected grant options |
| Table/column WITH GRANT OPTION | **Not compared** (OCR-GRANT-1) | Should refuse; currently does not |
| PUBLIC as an explicit grantee | Compared if the SQL said `TO public` | Only if present in pin SQL |
| PUBLIC / owner defaults from `acldefault` | Not in expected SQL; a future live ACL dump would fail closed as unexpected | Outside current expected contract; fail-closed if dumped |
| Object ownership | Not represented | Outside |
| Role membership / inherited privileges | Not represented | Outside — not effective-privilege equivalence |
| `ALTER DEFAULT PRIVILEGES` | Not parsed (comment-only in pin) | Outside |

**This review does not claim effective-privilege equivalence.** The
comparator establishes that listed explicit GRANT tuples match the
observed list, except table/column grant options.

OCR-GRANT-1 fixture: expected `GRANT SELECT ON public.people TO
authenticated`; observed same tuple with `grantable: true` →
`already_complete`. Observe SQL **does** project `is_grantable`, but
`grantKey` drops it.

---

## 8. Section D — CHECK constraints

CHECK identity is `normalizeExpr` (whitespace/case) compared as
strings (`709–715`). Independent probes:

- `CHECK (a > 0)` vs `CHECK (0 < a)` → `match=false` (fail closed)
- `CHECK (name <> '')` vs `CHECK (  NAME  <>  '' )` → `match=true`
- Missing expression → `unverified: true` → blocks completion

**Not semantic equivalence.** False negatives: semantically equal
rewrites (`a > 0` vs `0 < a`, `name IS NOT NULL` vs
`NOT name IS NULL`). False positives: none found for different
normalized text. Unsupported / unparseable CHECK remains unverified.

---

## 9. Section E — observer projection-to-contract

`CATALOG_OBSERVE_SQL` is unused plan text. `note` still says this
process does not execute it. `OBSERVE_SQL_FIELD_MAP` and
`mapObservedRowsToCatalog` are offline fixtures only.

| Comparator field | SQL projection | Mapper behavior | Gap |
|------------------|----------------|-----------------|-----|
| Table / RLS bits | `relrowsecurity`, `relforcerowsecurity` | `rlsEnabled` / `rlsForced` | If SQL key omitted, mapper sets `null` (key present) → `observationState` missing for required RLS. Fail closed if expected RLS |
| Columns type/nullability | `format_type`, `attnotnull` | copies fields | Omitted type → incomplete after compare |
| Constraint columns / confkey / actions | `conkey`, `confkey`, `confdeltype`, … | explicit if `referenced_columns` key present | Empty `confkey` array is treated as explicit `[]`, not implicit-PK |
| Implicit-PK | not a SQL column; resolved from PK | requires referenced table PK in same bag | Fail closed if PK missing |
| Function identity / returns / security / volatility | identity args, `prosecdef`, `provolatile` | copies | `search_path` only if `searchPath`/`config` mapped; `proconfig` array not parsed to `searchPath` automatically |
| Function grants | `proacl` + `acldefault('f')` + `grantable` | one row → one tuple | Defaulting missing privilege to `EXECUTE` (`2320`) can invent a grant |
| Policy USING / WITH CHECK | `pg_get_expr` (nullable) | preserves `with_check: null` as key+null | Omitting both `using` and `polqual` sets `using: undefined` (key present) → missing. Distinct from SQL NULL |
| Table/column grants + grantable | `relacl`/`attacl` + `is_grantable` | stores `grantable` | **Comparator `grantKey` ignores it** |
| Triggers | timing/events/function | copies | Extra triggers ignored by compare |
| Indexes | name + definition | raw passthrough | Definition unused; extras ignored |
| Storage | `storage.buckets` | passthrough | Extra buckets ignored; class not in mapper `requireClass` |
| Vendor history | `schema_migrations` | stored, not used by `compareCatalog` | Reconcile uses a separate `vendorHistory` input |

Required distinctions NULL vs missing are implemented for policies when
the mapper/catalog keeps the key. The unused SQL **can** populate the
required fields if a later mapper does not drop keys. It **cannot**
alone prevent extra-column / extra-constraint completion, because
`compareCatalog` never asks for that evidence.

No live observer exists. Live catalog completeness remains
**NOT VERIFIED (live)** and is blocked today by `CATALOG_NOT_CHECKED`
when status is not `observed`.

---

## 10. Section F — lock and execution boundaries

| Probe | Result |
|-------|--------|
| CLI execute + confirmations + `--allow-network` | `LIVE_EXECUTE_NOT_ENABLED` |
| CLI hardcodes `allowNetwork: false` | `cli.mjs` 120–121 |
| `createLiveConnector({ allowNetwork: true })` | `LIVE_CONNECTOR_NOT_AUTHORIZED` |
| `createLivePostgresLockSession()` | `LIVE_LOCK_SESSION_NOT_AUTHORIZED` |
| Official `liveCapable = true` | throws; `isLiveCapableLockController` false |
| Forged `{ kind: "advisory", liveCapable: true }` | `LOCK_CONTROLLER_UNTRUSTED` |
| Production URL `db.nwrflbpbhyiqdptmlccm.supabase.co` | `TARGET_PRODUCTION_REF` |

In-process limitation: a later edit of `lock.mjs` could populate
`LIVE_CAPABLE_LOCKS`. Property assignment and copies cannot.

---

## 11. Section G — tests and source integrity

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**95 passed / 95.** Log:
`/opt/cursor/artifacts/sherivs-observation-completeness-review-vitest.log`.

`beforeAll` still throws on `pg.Client.prototype.connect`. Tests use
fixture URLs and `loadFromGitCommit()`. They do not contact PostgreSQL
or Supabase.

Unit file covers the six former defects, implicit-PK suite, omitted
fields, unexpected function grants, and observe-map NULL preservation.
It does **not** assert extra columns, extra constraints, extra indexes,
extra triggers, extra storage, or table grant options. Those holes
therefore had no red test.

Pin (local git objects only):

| Check | Result |
|-------|--------|
| Tree of `d195ba861f80379b79533126653b9cee82a8e872:database/supabase/migrations` | `bbd828951e166662bbe831fd74972e1a15488468` |
| `.sql` excluding `.sql.proposed` | **71** |
| `.sql.proposed` in pin | **0** |
| Transport order | `#59` then `#69` |
| `loadFromGitCommit()` | `ok=true`, count 71 |
| Working tree | 69 files; not used |

---

## 12. Table/column completeness matrix

| Item | Expected missing | Expected mismatch | Unexpected extra |
|------|------------------|-------------------|------------------|
| Table | `LEDGER_SCHEMA_ABSENT` | n/a | `CATALOG_UNEXPECTED_OBJECTS` |
| Column name | `CATALOG_COLUMN_MISMATCH` | n/a | **ignored → already_complete** |
| Column type | `CATALOG_SHAPE_INCOMPLETE` | `CATALOG_COLUMN_MISMATCH` | n/a if extra column ignored |
| Column nullability | `CATALOG_SHAPE_INCOMPLETE` | `CATALOG_COLUMN_MISMATCH` | n/a |
| Constraint | mismatch / unverified | mismatch | **ignored** |
| Index | `CATALOG_INDEX_MISSING` if class present | name only | **ignored** |
| Trigger | `CATALOG_TRIGGER_MISSING` / `MISMATCH` | timing/events/function | **ignored** |

---

## 13. Remaining limitations

1. Extra `public` columns, constraints, indexes, triggers, and storage
   objects can `already_complete` (OCR-COL-1 and siblings).
2. Table/column `grantable` is projected but not compared (OCR-GRANT-1).
3. CHECK is textual, not semantic.
4. Privilege contract is explicit tuples, not inherited/effective
   privileges or ownership.
5. `CATALOG_OBSERVE_SQL` is not executed. Mapper is offline-only.
6. Mapper default `privilege: "EXECUTE"` can invent a function grant
   from a malformed row.
7. Lock trust is in-process WeakSet membership.
8. `securityProof` / `schemaEquivalence` remain false.

---

## 14. Blocking and non-blocking findings

### Blocking for `PASS FOR OFFLINE IMPLEMENTATION`

1. **OCR-COL-1.** Unexpected columns on a matched table are silently
   accepted. The review rule that unpermitted extra columns must not
   complete is not satisfied. A sensitive `ssn` column fixture
   completed.
2. **OCR-EXTRA-1.** Extra constraints, indexes, triggers, and storage
   buckets likewise complete.
3. **OCR-GRANT-1.** Table/column WITH GRANT OPTION is not compared.

These are remaining false-complete paths. They do not enable CLI
execute.

### Non-blocking / residual

1. CHECK textual comparison (fail closed on different text).
2. Unused observe plan; live catalog **NOT VERIFIED (live)**.
3. Effective privilege / ownership / role membership outside contract.
4. In-process lock WeakSet.
5. Working tree 69 vs pin 71 (loader uses pin).
6. SHERIVS-001 / 002 / 003 **OPEN**.
7. Written authorization still required before any live work.

---

## 15. No-network, staging, and authorization statements

**No database or network was contacted.** No `connect()`, no Supabase
API, no SQL execution, no catalog session.

**Staging has not been restored.** No migration was applied.

**No live operation is authorized.** This review does not enable CLI
execute, a live connector, a live lock, or production access.

---

## 16. Verdict

**PASS WITH CONDITIONS**

**PASS FOR OFFLINE IMPLEMENTATION** is refused. The six named
false-complete defects from the prior review are closed in this tree
and independently reproduced as refusals, but unexpected columns,
constraints, indexes, triggers, storage objects, and table grant
options can still produce `already_complete`. An unqualified offline
pass is unavailable.

**BLOCKED** is refused. Implicit-PK resolution fail-closes when the
effective key cannot be derived; omitted required observation fields
are incomplete; unexpected function grants and policy permissiveness
refuse; live execute and production targeting remain refused; the
71-file pin and transport order are intact.

Conditions before any live catalog may claim `already_complete`:

1. Unexpected columns (and the other extra-object classes above) must
   refuse completion unless an explicit, reviewed allow-list exists.
2. Table/column grant options must be compared or marked unverified.
3. Written authorization plus a reviewed live connector, lock session,
   and executing observer that preserves NULL vs missing.

**Final status:** **PASS WITH CONDITIONS**

---

## 17. Agent report

**Implemented:** this independent review document only.

**Files Changed:**
`docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-OBSERVATION-COMPLETENESS-REVIEW-001.md`

**Architecture Impact:** none.

**Tests:** Vitest **95/95**. Independent probes as above. No database
tests.

**Security Validation:** production refused; live execute disabled;
SHERIVS-001 / 002 / 003 not marked resolved; staging not restored.

**Known Risks:** OCR-COL-1, OCR-EXTRA-1, OCR-GRANT-1; unused observe
plan; OPEN application RLS findings if a later restore proceeds.

**Remaining Work:** fail-closed extra-object and table-grant-option
compare; authorized live connector + lock + observer.

**Final status:** **PASS WITH CONDITIONS**
