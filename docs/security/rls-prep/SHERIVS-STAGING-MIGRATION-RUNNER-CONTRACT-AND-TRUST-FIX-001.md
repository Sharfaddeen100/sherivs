# SHERIVS-STAGING-MIGRATION-RUNNER-CONTRACT-AND-TRUST-FIX-001

**Mission ID:** SHERIVS-STAGING-MIGRATION-RUNNER-CONTRACT-AND-TRUST-FIX-001
**Mission class:** OFFLINE CONTRACT AND TRUST HARDENING
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-15T04:49:00Z
**Role:** Principal PostgreSQL Engineer / Migration Reliability Architect / Application Security Engineer / Verification Engineer

**Final status:** **PASS WITH CONDITIONS**

This mission corrects the verified conditions from
`SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-REVIEW-001`. It does
**not** authorize a live connector, a live lock session, catalog
observation, or any database change. Staging has **not** been restored.
SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**.

---

## 1. Exact commit and working-tree status

| Item | Value |
|------|--------|
| This mission commit | `d7ae9a53bb56e5791a823615432717114dafcb26` |
| Subject | `fix: tighten restore contract comparison and lock trust` |
| Parent | `7fb6e22d95b8c17c93536283b80988184d64da72` (independent review) |
| Implementation reviewed | `277dce5b47a98ab9095226e3c8ab9fb7822aaef9` |
| Working tree after this commit | clean except this report (added in a follow-up commit) |
| Local `pg` | 8.23.1 (imported only by constructor-overwrite tests; `connect()` patched to throw) |
| Canonical pin | commit `d195ba861f80379b79533126653b9cee82a8e872` / tree `bbd828951e166662bbe831fd74972e1a15488468` / **71** files |

`scripts/db-apply.mjs`, `scripts/lib/pg-ssl.mjs`, and canonical
`database/supabase/migrations/*.sql` were not modified.

---

## 2. Files changed

- `scripts/staging/sherivs-restore/catalog-contract.mjs`
- `scripts/staging/sherivs-restore/lock.mjs`
- `scripts/staging/sherivs-restore/reconcile.mjs`
- `scripts/staging/sherivs-restore/cli.mjs`
- `scripts/staging/sherivs-restore/README.md`
- `tests/unit/sherivs-staging-migration-runner.test.ts`
- `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-CONTRACT-AND-TRUST-FIX-001.md`

---

## 3. Findings fixed and findings still open

### Fixed (offline code + tests)

| Review finding | Fix |
|----------------|-----|
| Constraint compare accepted any same-kind spec (`PRIMARY KEY (ssn)` vs `(id)`) | `normalizeConstraint` + `constraintsEquivalent` compare kind, table, ordered columns, referenced schema/table/columns, ON DELETE/UPDATE, deferrability, and normalized CHECK text. Kind-only `startsWith` is gone. |
| CHECK expressions not compared | CHECK identity is `CHECK:schema.table:<normalized expr>`. Different expressions refuse `already_complete`. |
| Same-name different-signature functions matched | Function identity is `schema.name(inputTypes…)`. Name-prefix matching is gone. Return type, security, volatility, and `search_path` (when present) are compared. Unexpected public functions block. |
| Official lock `liveCapable` / `authenticity` writable | Those fields are non-writable. Live proof is `LIVE_CAPABLE_LOCKS` WeakSet membership plus a non-enumerable capability symbol. No public factory adds to the WeakSet. `createLivePostgresLockSession` still throws and never brands a controller. |
| `CATALOG_OBSERVE_SQL` could not populate the contract | Plan expanded: tables+RLS bits, columns, constraints (including `conkey`/`confkey`/actions), indexes, functions (identity args, security, volatility, config), triggers, policies (`polpermissive`, roles, USING, WITH CHECK), table/column/function grants, storage buckets. **Not executed.** |
| Function grants and policy permissiveness not compared | `functionGrants` are compared; missing grants → `CATALOG_FUNCTION_GRANT_MISMATCH`. Policy `permissive` is compared; restrictive vs default permissive → `CATALOG_POLICY_MISMATCH`. |
| Close-after-success and `createSqlLedger` untested | Dedicated tests added. |

### Still open (not this mission)

| Item | Status |
|------|--------|
| Live TLS handshake / CA correspondence | **NOT VERIFIED (live)** |
| Real `pg_try_advisory_lock` session | **Not implemented**; factory fail-closed |
| Live catalog emptiness / live object match | **NOT VERIFIED (live)**; observe SQL is a plan |
| `pg.Client.end()` after a real connect | **NOT VERIFIED (live)** |
| `defaultGit` inherits `GIT_DIR` | Prior condition A1 unchanged |
| SHERIVS-001 / 002 / 003 | **OPEN** |
| Staging restore | **Not performed** |
| Written human authorization | Still required before any live work |

---

## 4. Tests added and their assertions

All in `tests/unit/sherivs-staging-migration-runner.test.ts`, using the
real modules and fixture URLs only.

| Test | Assertions |
|------|------------|
| `PRIMARY KEY (id) does not match PRIMARY KEY (ssn)` | `already_complete` refused; `CATALOG_CONSTRAINT_MISMATCH` |
| `a different CHECK expression does not match` | `CATALOG_CONSTRAINT_MISMATCH` |
| `a foreign key pointing to a different table does not match` | `CATALOG_CONSTRAINT_MISMATCH` |
| `constraint column order differences are detected` | `PRIMARY KEY (a, b)` vs `(b, a)` → `CATALOG_CONSTRAINT_MISMATCH` |
| `a missing required constraint cannot produce already_complete` | empty constraint list → `CATALOG_CONSTRAINT_MISMATCH` |
| `unknown constraint representations fail closed` | observed `EXCLUDE` → `CATALOG_CONSTRAINT_UNVERIFIED` |
| `same-name functions with different signatures do not match` | integer+text expected vs integer+uuid observed → missing or unexpected |
| `changed function argument type, return type, and security block already_complete` | arg change → missing/unexpected; return `text` → `CATALOG_FUNCTION_MISMATCH`; security INVOKER → `CATALOG_FUNCTION_SECURITY_MISMATCH` |
| `unexpected function definitions block already_complete` | extra public function → `CATALOG_UNEXPECTED_OBJECTS` |
| `function grants are compared and mismatch fails closed` | empty `functionGrants` → `CATALOG_FUNCTION_GRANT_MISMATCH` |
| `policy permissive versus restrictive mode is compared` | expected RESTRICTIVE vs observed permissive → `CATALOG_POLICY_MISMATCH` |
| `catalog observe plan represents the required contract classes` | SQL text includes `pg_constraint`, identity args, `polpermissive`, `polroles`, ACLs, `relrowsecurity`, `storage.buckets`; note says it is not executed |
| `forged, mutated, copied, and injected lock controllers cannot satisfy live capability` | assignment to `liveCapable`/`authenticity` throws; fields stay false; spread/forged objects untrusted; live factory throws; `allowNetwork` + official fake → `LOCK_LIVE_CAPABILITY_UNSATISFIED` |
| `close-after-success is an uncertain outcome with no automatic retry` | `TX_OUTCOME_UNKNOWN`, `retried: false`; second execute blocked by ledger; `closed[]` equals `opened[]` |
| `createSqlLedger bootstrap, success, and failure stay on the mock connector` | bootstrap/insert/update queries recorded; insert failure preserves `original-sql-ledger-error`; connections closed |

Prior tests remain: missing policies, column mismatch, lock stubs, CLI
`LIVE_EXECUTE_NOT_ENABLED`, production refusal, 71-file pin.

---

## 5. Test command and exact result

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**Result:** 1 file, **85 passed / 85**, ~2.5s.

Log: `/opt/cursor/artifacts/sherivs-contract-trust-fix-vitest.log`

Independent post-fix probes (no `pg` import, fixture URLs only):

- Pin extract: 71 files, unverified **0**, 21 function grants now compared
- `PRIMARY KEY (ssn)` vs `(id)` → `CATALOG_CONSTRAINT_MISMATCH` (was `already_complete`)
- `CHECK (false)` vs `CHECK (name <> '')` → `CATALOG_CONSTRAINT_MISMATCH` (was `already_complete`)
- `touch_people(text)` vs expected `(integer)` → `CATALOG_FUNCTION_MISSING` (was `already_complete`)
- Official lock assignment fails; `isLiveCapableLockController` is false
- CLI execute + `--allow-network` → `LIVE_EXECUTE_NOT_ENABLED`
- `createLiveConnector({ allowNetwork: true })` → `LIVE_CONNECTOR_NOT_AUTHORIZED`

Log: `/opt/cursor/artifacts/sherivs-contract-trust-fix-probes.log`

---

## 6. Evidence that no database or network was contacted

- This process did not call `connect()`, `pg.Client.end()`, or any
  Supabase API.
- Unit `beforeAll` replaces `pg.Client.prototype.connect` with a throw.
- New tests use `createMockConnector` / injected fixture env only.
- `CATALOG_OBSERVE_SQL` is a string plan; no executor was added.
- `createLiveConnector` still throws before importing `pg`.
- `createLivePostgresLockSession` still throws and does not brand a lock.
- CLI execute still returns `LIVE_EXECUTE_NOT_ENABLED` before `runRestore`.
- Canonical SQL was not applied.

A passing suite is **not** live integration evidence.

---

## 7. Confirmation that live execution remains disabled

- CLI hardcodes `allowNetwork: false` and `allowLiveCatalog: false`.
- Execute without an injected connector → `LIVE_EXECUTE_NOT_ENABLED`.
- `runRestore` live request still `fail(LIVE_CONNECTOR_NOT_AUTHORIZED)`
  after a live-capable lock check that no official object can pass.
- `LIVE_CAPABLE_LOCKS` has no writer in this mission (`markLiveCapable`
  throws if ever called).

---

## 8. Confirmation that production remains refused

`PRODUCTION_PROJECT_REF` is still `nwrflbpbhyiqdptmlccm`.
`assertStagingTarget` still throws `TARGET_PRODUCTION_REF`. Staging
identity is still positively pinned to `dvxszhracsjwdancijdc`.
Unprefixed `DATABASE_URL` / `SUPABASE_*` are still refused. Existing
tests 8 and 9 still pass.

---

## 9. Remaining comparison limitations

These are **deliberate** and fail-closed where the representation is
unknown:

- CHECK comparison is whitespace/case-normalized expression text, **not**
  proven semantic equivalence (`a > 0` vs `0 < a` mismatches).
- `REFERENCES table` without a column list is `implicit-pk`. Referenced
  columns are compared only when **both** sides are explicit. A different
  referenced table still mismatches.
- `pg_get_expr` / `format_type` spelling is normalized (`timestamptz`,
  `varchar`) and may still differ from a future live catalog until an
  observer maps types.
- Function bodies, owners, tablespace, views, sequences, enums,
  extensions, publications, default privileges, column defaults,
  identity/generated columns, collations, and trigger WHEN / ENABLE
  status are **not** in the contract.
- Dollar-quoted function bodies are not scanned for DDL.
- `CATALOG_OBSERVE_SQL` is not executed. A future observer must populate
  every required class or `already_complete` is refused
  (`CATALOG_SHAPE_INCOMPLETE` / `CATALOG_REQUIREMENTS_UNVERIFIED`).
- Lock trust is in-process. A later **edit of `lock.mjs`** could add to
  `LIVE_CAPABLE_LOCKS`. Property assignment, object literals, copies, and
  the public live-lock factory cannot.
- `securityProof` and `schemaEquivalence` remain `false` on every path.

Unknown or unparseable constraint/function representations are marked
`NOT_VERIFIED` and block `already_complete`.

---

## 10. Staging has not been restored

No catalog was read. No migration was applied. The 69-file working tree
was not used as the pin. `.sql.proposed` files remain excluded.
Transport `#59` `20261002000014_coregrid_v2_transport_buses_rls.sql`
still precedes `#69` `20261003000041_coregrid_transport_bus_reads.sql`.

---

## 11. Authorization non-statement

**This report does not authorize any database connection, lock, catalog
inspection, migration, deployment, or production change.**

It does not enable CLI execute, inject a live connector, mint a
PostgreSQL advisory lock, or close SHERIVS-001 / 002 / 003.

---

## 12. Verdict

**PASS WITH CONDITIONS**

Status **PASS FOR OFFLINE IMPLEMENTATION** is refused because the catalog
observer is a read-only SQL **plan** (required: live connectivity is
forbidden here), CHECK matching is textual not semantic, implicit-PK
foreign-key columns are not resolved, and several catalog attributes
remain outside the contract. Those limits are documented and fail-closed
when unknown.

Status **BLOCKED** is refused because the named review defects are
closed in code and offline tests: kind-only constraint matching is gone,
function identity is signature-based, lock capability is not a writable
field, function grants and policy mode are compared, observe SQL covers
the represented classes, and the new failure-path tests pass. Live
execute and production targeting remain refused.

---

## 13. Agent report

**Implemented:** offline contract identity comparison, lock WeakSet
capability, expanded unused observe-SQL plan, regression and
failure-path tests, this report.

**Files Changed:** listed in §2.

**Architecture Impact:** none to running systems. No live path added.

**Tests:** `npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts`
→ **85/85**. Independent probes confirm the former false-complete cases
now refuse. No database tests.

**Security Validation:** production refused; live execute disabled;
credentials not printed; SHERIVS-001 / 002 / 003 not marked resolved.

**Known Risks:** textual CHECK compare; implicit-PK FK columns; observe
SQL unused until a separately authorized catalog mission; in-process
lock trust; OPEN application RLS findings if a later restore proceeds.

**Remaining Work:** written authorization; independently reviewed live
connector + real lock session + observer that actually runs the expanded
SQL; post-restore catalog.

**Final status:** **PASS WITH CONDITIONS**
