# SHERIVS-MIGRATION-RUNNER-INDEX-AND-OBSERVATION-COMPLETENESS-FIX-001

**Mission ID:** SHERIVS-MIGRATION-RUNNER-INDEX-AND-OBSERVATION-COMPLETENESS-FIX-001
**Mission class:** OFFLINE IMPLEMENTATION — INDEX ALLOWLIST AND CLASS OBSERVATION
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-15T17:24:00Z
**Role:** Principal PostgreSQL Engineer / Database Security Architect / Migration Reliability Architect / Verification Engineer

**Final status:** **PASS WITH CONDITIONS**

This mission closes the two independently reproduced false-completion
paths from
`SHERIVS-MIGRATION-RUNNER-UNEXPECTED-OBJECTS-REVIEW-001`
(UOR-ALLOW-1..4 and UOR-OMIT-1). It does **not** authorize a live
connector, lock, catalog observation, or any database change. Staging
has **not** been restored. SHERIVS-001, SHERIVS-002, and SHERIVS-003
remain **OPEN**.

---

## 1. Exact commit and working-tree status

| Item | Value |
|------|--------|
| Implementation HEAD (pre-report) | `805ba9380157ec5ec43ead4ae8d2eb8d20b01087` |
| Implementation | `9d0faca716931f69555f602249737059b5cb0c06` (`fix: prove constraint-implied indexes and require catalog class keys`) |
| Follow-up | `805ba9380157ec5ec43ead4ae8d2eb8d20b01087` (`fix: skip non-array catalog classes and complete extra-table fixtures`) |
| Parent | `7ef9f11466c9bfa76b8b15d7cc5fdb32c6ce04fa` (unexpected-objects review) |
| Reviewed implementation | `454b61c0f6805fee3a14b9acea4ce6c237f66419` |
| Canonical pin | `d195ba861f80379b79533126653b9cee82a8e872` / tree `bbd828951e166662bbe831fd74972e1a15488468` / **71** files |
| Transport pair | `#59` `20261002000014_coregrid_v2_transport_buses_rls.sql` then `#69` `20261003000041_coregrid_transport_bus_reads.sql` |
| `.sql.proposed` in pin | **0** |
| Working-tree `.sql` count | **69** (not used as the pin) |

Canonical SQL was not modified.

---

## 2. Files changed

- `scripts/staging/sherivs-restore/catalog-contract.mjs`
- `scripts/staging/sherivs-restore/README.md`
- `tests/unit/sherivs-staging-migration-runner.test.ts`
- `docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-INDEX-AND-OBSERVATION-COMPLETENESS-FIX-001.md`

---

## 3. Before / after for both defects

| Review defect | Before | After |
|---------------|--------|-------|
| Partial unique index on PK columns | `already_complete` | `CATALOG_UNEXPECTED_OBJECTS` (`reason: "partial"`) |
| `INCLUDE` unique index on PK columns | `already_complete` | `CATALOG_UNEXPECTED_OBJECTS` (`reason: "include"`) |
| Uniqueness omitted, PK columns | `already_complete` | `CATALOG_INDEX_UNVERIFIED` (`unique_unknown`) |
| `columns[]` plus `WHERE` in definition | `already_complete` | `CATALOG_UNEXPECTED_OBJECTS` (`partial`; definition is parsed) |
| Unproven unique+columns without predicate/INCLUDE keys | `already_complete` | `CATALOG_INDEX_UNVERIFIED` |
| Genuine PK/UNIQUE btree index with proven attributes | `already_complete` | `already_complete` (intended) |
| Missing `indexes`/`triggers`/`storageBuckets` when expected lists are empty | `already_complete` | `CATALOG_SHAPE_INCOMPLETE` |
| Explicit empty arrays for those classes | `already_complete` | `already_complete` (complete empty observation) |
| `observationFailed: true` | not modeled | `CATALOG_OBSERVATION_FAILED` |
| Non-array class value | could throw / coerce | `CATALOG_SHAPE_INCOMPLETE` (`unknown`) |

---

## 4. Regression assertions

| Requirement | Test | Reason |
|-------------|------|--------|
| Genuine implied index permitted | `constraint-implied index allowlist requires proven uniqueness, keys, predicate, and INCLUDE` | `already_complete` |
| Partial index rejected | same | `CATALOG_UNEXPECTED_OBJECTS` |
| INCLUDE rejected | same | `CATALOG_UNEXPECTED_OBJECTS` |
| Missing uniqueness rejected | same | `CATALOG_INDEX_UNVERIFIED` |
| Expression keys not mistaken for columns | same | `CATALOG_UNEXPECTED_OBJECTS` |
| Column-order mismatch | same | `no_matching_constraint` |
| Wrong table | same | `CATALOG_UNEXPECTED_OBJECTS` |
| Unknown metadata fails closed | same | `CATALOG_INDEX_UNVERIFIED` |
| PK on table does not accept a different unique index | same / existing extras test | `no_matching_constraint` / unexpected |
| Missing class keys when expected empty | `omitted object-class keys are missing observations, not empty sets` | `CATALOG_SHAPE_INCOMPLETE` |
| Missing class keys when expected nonempty | same (storage bucket SQL) | `CATALOG_SHAPE_INCOMPLETE` |
| Explicit empty arrays | same | `already_complete` |
| Observation failure | same | `CATALOG_OBSERVATION_FAILED` |
| Unknown class value | same | `CATALOG_SHAPE_INCOMPLETE` |
| Partial observation (triggers omitted) | same | `CATALOG_SHAPE_INCOMPLETE` |

Prior extras, grants, implicit-PK, omitted fields, policies, functions,
locks, production refusal, and `LIVE_EXECUTE_NOT_ENABLED` tests remain.

---

## 5. Test command and exact result

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**Result:** 1 file, **108 passed / 108**, Duration 2.09s (Vitest 3.2.4).

Log: `/opt/cursor/artifacts/sherivs-index-and-observation-completeness-vitest.log`

The suite still patches `pg.Client.prototype.connect` to throw. Passing
tests are **not** live integration evidence.

---

## 6. Index allowlist equivalence rules

An extra observed index is implied by a PRIMARY KEY or UNIQUE
constraint only when `isConstraintImpliedIndex` returns
`{ implied: true }`. That requires **all** of:

1. Uniqueness **proven** `true` (`unique` / `indisunique` boolean, or
   `CREATE UNIQUE INDEX` text). Omitted uniqueness is `unique_unknown`
   → unverified.
2. Same `schema.table` as the constraint.
3. Same ordered **simple** key columns (identifiers only).
4. Predicate **proven absent** (`predicate`/`where` key present and
   null/empty, or a definition/spec with no `WHERE`). A present
   `WHERE` is `partial` → unexpected, not implied.
5. INCLUDE **proven empty** (structured `include: []`, or definition
   without `INCLUDE`). Non-empty INCLUDE is unexpected.
6. No expression keys (`lower(id)` and similar).
7. Access method `btree` when represented. `CREATE INDEX` without
   `USING` is parsed as btree (PostgreSQL CREATE INDEX default).
   Omitted method is allowed only with the other proofs.

`columns[]` does **not** hide a `WHERE` / `INCLUDE` / expression in
`definition`. Equivalence that cannot be established returns
`{ unverified: true }` → `CATALOG_INDEX_UNVERIFIED`. Proven
non-equivalent extras return `CATALOG_UNEXPECTED_OBJECTS`.

---

## 7. Object-class observation-completeness model

`catalogClassObservationState` distinguishes:

| State | Representation | Completes? |
|-------|----------------|------------|
| `empty` | key present, array length 0 | yes, as zero objects |
| `populated` | key present, array length ≥ 1 | yes, extras compared |
| `missing` | key omitted or `null` | no → `CATALOG_SHAPE_INCOMPLETE` |
| `failed` | `observationFailed` / status `failed` / class `failed` | no → `CATALOG_OBSERVATION_FAILED` or incomplete |
| `unknown` | non-array / `"unknown"` | no → `CATALOG_SHAPE_INCOMPLETE` |

Required top-level keys on every `status: "observed"` catalog:
`tables`, `policies`, `functions`, `functionGrants`, `triggers`,
`indexes`, `storageBuckets`.

Required nested arrays on every observed public table: `columns`,
`constraints`, `grants`, `columnGrants`.

Missing keys are **not** defaulted to `[]` for completeness. Iteration
uses `asObservedList` only after the class has been classified, so a
missing key cannot prove absence of extras.

`observedCatalogFromExpected` and `mapObservedRowsToCatalog` emit
present arrays (including empty). Hand-built catalogs used for
`already_complete` must do the same.

---

## 8. Remaining contract limitations

- CHECK matching remains textual, not semantic.
- Grant compare remains explicit SQL tuples, not ownership, role
  membership, inherited privileges, or `ALTER DEFAULT PRIVILEGES`.
- Column defaults / identity / generated on an existing expected
  column remain out of contract.
- Unexpected FORCE RLS when not expected is still not compared.
- Function bodies, owners, tablespaces, views, sequences, enums,
  extensions, publications remain out of contract.
- `CATALOG_OBSERVE_SQL` is still an unused plan.
- Index method/opclass/tablespace beyond the implication proofs above
  are not a general index-equality theory.

`securityProof` and `schemaEquivalence` remain `false`.

---

## 9. Evidence that no network or database was contacted

- No `connect()`, `pg.Client.end()`, or Supabase API.
- Unit `beforeAll` throws on `pg.Client.prototype.connect`.
- `CATALOG_OBSERVE_SQL` is not executed.
- Pin inventory used local git objects.

---

## 10. Confirmation that live execution remains disabled

CLI execute still returns `LIVE_EXECUTE_NOT_ENABLED` (including with
`--allow-network`). `createLiveConnector` remains
`LIVE_CONNECTOR_NOT_AUTHORIZED`. Live lock sessions remain
unimplemented.

---

## 11. Confirmation that production remains refused

`8. production project ref fails` and the pinned-71-file test passed.
Ref `nwrflbpbhyiqdptmlccm` remains `TARGET_PRODUCTION_REF`.

---

## 12. Confirmation that staging has not been restored

No catalog was read. No migration was applied. The 69-file working
tree was not used as the pin.

---

## 13. Confirmation that SHERIVS-001 / 002 / 003 remain OPEN

This mission does not mark those findings resolved.

---

## 14. Authorization non-statement

**This report does not authorize any database connection, lock, catalog
inspection, migration, deployment, or production change.**

---

## 15. Verdict

**PASS WITH CONDITIONS**

The two reproduced false-complete paths now refuse. **PASS FOR OFFLINE
IMPLEMENTATION** is refused as an unqualified label because the
observer is still an unused plan, grant compare is not effective
privilege equivalence, and CHECK remains textual.

**BLOCKED** is refused. Partial/INCLUDE/uniqueness-omitted indexes no
longer complete; omitted empty class keys no longer complete; prior
safeguards and the 71-file pin remain.

Conditions before any live catalog may claim `already_complete`:

1. Written human authorization.
2. Independently reviewed live connector and PostgreSQL advisory-lock
   session.
3. An authorized observer that emits present arrays (including empty)
   for every required class and enough index attributes to prove or
   refuse implication.

**Final status:** **PASS WITH CONDITIONS**

---

## 16. Agent report

**Implemented:** proven constraint-implied index contract;
catalog class observation states; regressions; this report.

**Files Changed:** listed in §2.

**Architecture Impact:** none to running systems. No live path added.

**Tests:** `npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts`
→ **108/108**.

**Security Validation:** production refused; live execute disabled;
SHERIVS-001 / 002 / 003 not marked resolved; staging not restored.

**Known Risks:** unused observe plan; explicit-tuple grants; textual
CHECK; OPEN application RLS findings.

**Remaining Work:** written authorization; live connector + lock +
executing observer.

**Final status:** **PASS WITH CONDITIONS**
