# SHERIVS-MIGRATION-RUNNER-INDEX-AND-OBSERVATION-COMPLETENESS-REVIEW-001

**Mission ID:** SHERIVS-MIGRATION-RUNNER-INDEX-AND-OBSERVATION-COMPLETENESS-REVIEW-001
**Mission class:** INDEPENDENT SECURITY / RELIABILITY REVIEW — OFFLINE ONLY
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-15T17:48:00Z
**Role:** Independent Principal PostgreSQL Engineer / Database Security Architect / Migration Reliability Engineer / Verification Architect

**Verdict:** **PASS WITH CONDITIONS**

This review assesses whether the index-equivalence and observation-completeness
fix at `1ffde7571853cbc436156b6bf88f81409b60ea52` closed the known
false-completion paths. It does **not** authorize a live connector, lock,
catalog observation, or any database change. Staging has **not** been
restored. SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**.

The implementation report
(`docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-INDEX-AND-OBSERVATION-COMPLETENESS-FIX-001.md`)
was an input to **contradict**, not to copy.

---

## 0. Safety record

- Review-only. Implementation modules were not modified.
- No PostgreSQL, Supabase, or pooler session was opened.
- `CATALOG_OBSERVE_SQL` was not executed.
- No SQL was applied. No migration ran. Staging was not restored.
- CLI execute was invoked only as an offline process and returned
  `LIVE_EXECUTE_NOT_ENABLED`.
- Canonical migration SQL was not modified.
- Production scripts were not modified.
- Credentials were not printed or changed.

Git fetch of SHA `1ffde75` was used only to obtain the review subject.
That is not database or staging contact.

---

## 1. Exact commit and working-tree status

| Item | Value |
|------|--------|
| Reviewed HEAD | `1ffde7571853cbc436156b6bf88f81409b60ea52` |
| Subject | `docs: record index allowlist and observation completeness fix` |
| Implementation commits | `9d0faca` (prove implied indexes / require class keys), `805ba93` (skip non-array classes / complete extra-table fixtures) |
| Working tree at review start | clean at `1ffde75` |
| Canonical pin | `d195ba861f80379b79533126653b9cee82a8e872` |
| Canonical tree | `bbd828951e166662bbe831fd74972e1a15488468` |
| Pin file count | **71** `.sql`; **0** `*.sql.proposed` |
| Transport | `#59` `20261002000014_coregrid_v2_transport_buses_rls.sql` then `#69` `20261003000041_coregrid_transport_bus_reads.sql` |
| Working-tree `.sql` | **69** (not used as the pin) |

`constants.mjs` stores the same commit, tree, and count=71.

---

## 2. Code paths inspected

| Path | File |
|------|------|
| `parseIndexShape` / `isConstraintImpliedIndex` | `scripts/staging/sherivs-restore/catalog-contract.mjs` |
| Sole production caller of implication | `compareCatalog` extra-index loop (~2474–2486) |
| `catalogClassObservationState` / `requireCompleteCatalogClass` / `requireCompleteTableClasses` | same |
| `REQUIRED_CATALOG_CLASS_KEYS` / `REQUIRED_TABLE_CLASS_KEYS` | same |
| `catalogBlocksCompletion` | same |
| `already_complete` refuse | `scripts/staging/sherivs-restore/reconcile.mjs` |
| CLI execute gate | `scripts/staging/sherivs-restore/cli.mjs` (`allowNetwork: false` hardcoded) |
| Disabled live factory | `scripts/staging/sherivs-restore/connect.mjs` |
| Disabled live lock | `scripts/staging/sherivs-restore/lock.mjs` `createLivePostgresLockSession` |
| Production target | `scripts/staging/sherivs-restore/target.mjs` |
| Pin / transport | `scripts/staging/sherivs-restore/source.mjs`, `constants.mjs` |
| Assertions | `tests/unit/sherivs-staging-migration-runner.test.ts` |

`isConstraintImpliedIndex` is not used to excuse extra columns, constraints,
triggers, grants, or buckets. `CONTRACT_ALLOWLIST.extras` has only
`constraintImpliedIndexes` with `scope: "indexes only"`.

---

## 3. Index implication — independent reproduction

Implication is allowed only when `isConstraintImpliedIndex` returns
`{ implied: true }`. That requires uniqueness proven `true`, same
`schema.table`, same **ordered simple** key columns, predicate **proven
absent**, INCLUDE **proven empty**, no expression keys, and method `btree`
when represented. Omitted uniqueness / predicate / INCLUDE / keys are
`unverified`, not defaults.

Independent probe (same modules, not the unit file) against the identity
fixture (`orgs(id PK, name UNIQUE)`, `people(id PK, org_id → orgs(id))`):

| Case | Helper | `already_complete` |
|------|--------|--------------------|
| Proven unique btree `(id)` matching PK, `predicate: null`, `include: []` | `implied: true`, `constraint_index` | **allowed** |
| `CREATE UNIQUE INDEX … USING btree (id)` (no WHERE/INCLUDE) | `implied: true` | **allowed** |
| Partial `… (id) WHERE deleted_at IS NULL` | `implied: false`, `partial` | `CATALOG_UNEXPECTED_OBJECTS` |
| `INCLUDE (name)` | `implied: false`, `include` | `CATALOG_UNEXPECTED_OBJECTS` |
| Uniqueness omitted, keys+predicate+INCLUDE present | `unverified: true`, `unique_unknown` | `CATALOG_INDEX_UNVERIFIED` |
| `columns: ["id"]` plus `WHERE true` in `definition` | `partial` | refuse (`action !== already_complete`) |
| Expression spec `((lower(id::text)))` | `expression_keys` | `CATALOG_UNEXPECTED_OBJECTS` |
| Unique `(name, id)` vs PK `(id)` / UNIQUE `(name)` | `no_matching_constraint` | `CATALOG_UNEXPECTED_OBJECTS` |
| Unique `(id)` with no predicate/INCLUDE keys | `unverified: true` | `CATALOG_INDEX_UNVERIFIED` |
| `unique: false` on PK columns | `not_unique` | `CATALOG_UNEXPECTED_OBJECTS` |
| `method: "hash"` | `access_method` | `CATALOG_UNEXPECTED_OBJECTS` |
| Table `public.ghost` | `unknown_table` | `CATALOG_UNEXPECTED_OBJECTS` |

The unit file asserts the helper outcomes and most completion reasons.
This review **also** asserted completion for column-order, non-unique, and
hash extras; those three completion refusals were not all in the named
unit case, and they refuse.

Only positively proven constraint-implied indexes are allowed. A PK on
`people(id)` does not accept a unique index on `people(name)`.

---

## 4. Observation completeness — every required class

Required top-level keys on `status: "observed"`:
`tables`, `policies`, `functions`, `functionGrants`, `triggers`,
`indexes`, `storageBuckets`.

Required nested arrays on every observed public table:
`columns`, `constraints`, `grants`, `columnGrants`.

`catalogClassObservationState` classifications independently confirmed:

| Representation | State | Completes? |
|----------------|-------|------------|
| key present, `[]` | `empty` | yes (zero objects) |
| key present, length ≥ 1 | `populated` | yes (extras compared) |
| key omitted | `missing` | no → `CATALOG_SHAPE_INCOMPLETE` |
| key `null` | `missing` | no → `CATALOG_SHAPE_INCOMPLETE` |
| non-array / `{ not: "an-array" }` / `"unknown"` | `unknown` | no → `CATALOG_SHAPE_INCOMPLETE` |
| `observationFailed: true` | compare short-circuit | no → `CATALOG_OBSERVATION_FAILED` |

Independently reproduced for omitted `indexes`, `triggers`,
`storageBuckets`, `functions`, `functionGrants`, and `policies` — including
when the expected lists are empty. Empty arrays still complete. Omitted
keys do not.

Nested table observations: deleting `people.columns`, deleting
`people.grants`, or setting `people.constraints = null` each produced
`CATALOG_SHAPE_INCOMPLETE`. Vendor-schema tables skip nested completeness;
that is not a public-table completion path.

`asObservedList` still coerces a missing class to `[]` **after**
classification. That cannot prove extras-absent: `catalogBlocksCompletion`
refuses `shapeIncomplete` first. Independently confirmed: omitted
`indexes` with empty expected indexes refuses; it does not complete.

---

## 5. Previous extras, grants, FK, policy, and missing-field paths

Independently reproduced (same identity fixture):

| Defect | Result |
|--------|--------|
| Extra public table | `CATALOG_UNEXPECTED_OBJECTS` |
| Extra public column | `CATALOG_COLUMN_MISMATCH` |
| Extra function grant | `CATALOG_FUNCTION_GRANT_MISMATCH` |
| Function grant `grantable: true` when not expected | `CATALOG_FUNCTION_GRANT_MISMATCH` |
| FK retargeted to `public.other` | `CATALOG_CONSTRAINT_MISMATCH` |
| Policy `using` key omitted | `CATALOG_SHAPE_INCOMPLETE` |
| Policy `using: null` while expected USING is present | `CATALOG_POLICY_MISMATCH` |
| Column `type` omitted | `CATALOG_SHAPE_INCOMPLETE` |

Unit assertions that remain intact (inspected, not only counted):

- `PRIMARY KEY (id) does not match PRIMARY KEY (ssn)`
- `a different CHECK expression does not match`
- `a foreign key pointing to a different table does not match`
- `omitted required observation fields cannot produce already_complete`
- `unexpected function grants and grant options refuse already_complete`
- `explicit GRANT WITH GRANT OPTION is parsed and compared; allowlist remains indexes-only`
- `constraint-implied unique indexes are the only permitted extras`

---

## 6. CLI execute, production refusal, pin, flags

| Check | Result | Evidence class |
|-------|--------|----------------|
| CLI `--mode=execute` + all confirm flags + `--allow-network` | `{ ok: false, code: "LIVE_EXECUTE_NOT_ENABLED", exitCode: 2 }` | Offline-tested (this review + unit) |
| `createLiveConnector` | still `LIVE_CONNECTOR_NOT_AUTHORIZED` before Client/connect | Repository evidence |
| Live lock session | `createLivePostgresLockSession` throws | Repository evidence |
| Production ref `nwrflbpbhyiqdptmlccm` | `TARGET_PRODUCTION_REF` | Offline-tested |
| 71-file pin SHA/order | commit/tree/count match; transport `#59` then `#69` | Repository + loader |
| `securityProof` | `false` on extract, compare, and successful `already_complete` | Offline-tested |
| `schemaEquivalence` | `false` on extract, compare, and successful `already_complete` | Offline-tested |

This review does **not** claim schema equivalence or application security.

---

## 7. Contract limitations (inspected, still true)

`CONTRACT_LIMITATIONS` still states, and the comparator still implements:

- CHECK matching is whitespace/case-normalized expression text, not
  semantic equivalence (`a > 0` vs `0 < a` is a mismatch).
- Grant compare is explicit GRANT tuples including `WITH GRANT OPTION`.
  Ownership, role membership, inherited privileges, and
  `ALTER DEFAULT PRIVILEGES` are not effective-privilege equivalence.
- Column defaults / identity / generated remain out of contract.
- Unexpected FORCE RLS when not expected is still not compared
  (`rlsForced` is checked only when the contract expects FORCE).
- Function bodies, owners, tablespaces, views, sequences, enums,
  extensions, publications remain out of contract.
- `CATALOG_OBSERVE_SQL` remains an unused plan.

---

## 8. Test result

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**108 passed / 108**, 1 file, Vitest 3.2.4. Duration 2.18s.

Log: `/opt/cursor/artifacts/sherivs-index-observation-review-vitest.log`

Independent probe: **62 / 62** named cases
(`/opt/cursor/artifacts/sherivs-index-observation-review-probe.json`).

The suite still patches `pg.Client.prototype.connect` to throw. Passing
tests are not live integration evidence.

---

## 9. Blocking and non-blocking findings

### Blocking

**None** for the named false-completion defects (partial / INCLUDE /
omitted-uniqueness indexes, and omitted/null/unknown/failed class
observations treated as empty).

### Non-blocking

| ID | Finding |
|----|---------|
| IOC-NB-1 | `missingIndexes` still has `if (!catalog.indexes) return false`. Completeness refuses first, so this is not a completion path. Residual defensive inconsistency. |
| IOC-NB-2 | Per-class `classStates.indexes = "failed"` becomes `CATALOG_SHAPE_INCOMPLETE`, not `CATALOG_OBSERVATION_FAILED`. Fail-closed either way. |
| IOC-NB-3 | Unexpected FORCE RLS when the contract does not expect FORCE is still uncompared. Documented; not one of the two named defects. |
| IOC-NB-4 | Observer SQL is still unused. A later live catalog must emit **present arrays** (including empty) or completion will refuse. |

---

## 10. Remaining limitations

The two reproduced false-complete paths now refuse. The contract is still
not live schema equivalence and not application-security proof. A later
authorized observer must populate every required class key and enough
index attributes to prove or refuse implication. Written human
authorization, a reviewed live connector, and a reviewed PostgreSQL
advisory-lock session remain outstanding before any mutating restore.

---

## 11. Confirmations

- No database or staging/production network session was contacted.
- Staging has not been restored.
- No live operation is authorized by this review.
- SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**.
- Implementation code was not modified in this mission.

---

## 12. Verdict rationale

**PASS WITH CONDITIONS**

**PASS FOR OFFLINE IMPLEMENTATION** is refused as an unqualified label
because CHECK remains textual, grants remain explicit-tuple, the observer
is unused, and unexpected FORCE RLS is still uncompared.

**BLOCKED** is refused. Partial, INCLUDE, uniqueness-omitted, hidden
WHERE, expression, column-order, and unknown-metadata indexes no longer
complete. Omitted, null, failed, unknown, and unparseable class
observations no longer complete. Nested table class keys are required.
Prior extras / grant-option / FK / policy / missing-field refusals remain.
The 71-file pin, transport order, production refusal, and
`LIVE_EXECUTE_NOT_ENABLED` remain.

Conditions before any live catalog may claim `already_complete`:

1. Written human authorization naming staging ref `dvxszhracsjwdancijdc`
   and pin `d195ba8` / `bbd82895`.
2. Independently reviewed live connector and PostgreSQL advisory-lock
   session.
3. An authorized observer that emits present arrays (including empty)
   for every required class and enough index attributes to prove or
   refuse implication.

**This review does not authorize any database connection, lock, catalog
inspection, migration, deployment, or production change.**

---

## 13. Agent report

**Implemented:** this independent review document only.

**Files Changed:**
`docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-INDEX-AND-OBSERVATION-COMPLETENESS-REVIEW-001.md`

**Architecture Impact:** none to running systems.

**Tests:** independently reproduced 62 probe cases; re-ran
`npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts` →
**108/108**; CLI execute + `--allow-network` → `LIVE_EXECUTE_NOT_ENABLED`;
production ref refused; 71-file pin and transport order re-measured.
No database tests. No apply.

**Security Validation:** production and staging non-contact; findings left
OPEN; live execute not enabled; credentials not printed.

**Known Risks:** unused observe plan; textual CHECK; explicit-tuple grants;
OPEN SHERIVS-001 / 002 / 003 if a later restore proceeds.

**Remaining Work:** written authorization; live connector + real lock
session + executing observer, each independently re-reviewed.

**Final status:** **PASS WITH CONDITIONS**
