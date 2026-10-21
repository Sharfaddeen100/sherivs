# SHERIVS-MIGRATION-RUNNER-UNEXPECTED-OBJECTS-FIX-001

**Mission ID:** SHERIVS-MIGRATION-RUNNER-UNEXPECTED-OBJECTS-FIX-001
**Mission class:** OFFLINE IMPLEMENTATION — UNEXPECTED OBJECTS AND GRANT OPTIONS
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-15T08:16:00Z
**Role:** Principal PostgreSQL Engineer / Database Security Architect / Migration Reliability Architect / Verification Engineer

**Final status:** **PASS WITH CONDITIONS**

This mission closes the independently reproduced false-completion paths
from `SHERIVS-MIGRATION-RUNNER-OBSERVATION-COMPLETENESS-REVIEW-001`
(OCR-COL-1, OCR-EXTRA-1, OCR-GRANT-1). It does **not** authorize a live
connector, a live lock session, catalog observation against a database,
or any database change. Staging has **not** been restored.
SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**.

No unqualified pass is issued. Live catalog completeness remains
**NOT VERIFIED (live)**.

---

## 1. Exact commit and working-tree status

| Item | Value |
|------|--------|
| Implementation commit | `e62d93f8f2e6ba21638f3017fd6a0d3c22e77fc8` |
| Subject | `fix: refuse unexpected catalog objects and grant options` |
| Fixture-copy follow-up | `c125c4e339883b0e8972fe06444b00b5e809b3dc` |
| Subject | `fix: copy observed catalog fixtures so extras cannot alias expected` |
| Parent | `efff0a8ee7617d9ada6a6f763e9087bdc04d07ea` (observation-completeness review) |
| Working tree after implementation | clean except this report |
| Canonical pin | commit `d195ba861f80379b79533126653b9cee82a8e872` / tree `bbd828951e166662bbe831fd74972e1a15488468` / **71** files |
| Transport pair | `#59` `20261002000014_coregrid_v2_transport_buses_rls.sql` then `#69` `20261003000041_coregrid_transport_bus_reads.sql` |
| `.sql.proposed` in pin | **0** |
| Working-tree `.sql` count | **69** (not used as the pin) |

Pin inventory used local git objects only:

```
git rev-parse d195ba861f80379b79533126653b9cee82a8e872:database/supabase/migrations
→ bbd828951e166662bbe831fd74972e1a15488468
```

`scripts/db-apply.mjs`, `scripts/lib/pg-ssl.mjs`, and canonical
`database/supabase/migrations/*.sql` were not modified.

---

## 2. Files changed

- `scripts/staging/sherivs-restore/catalog-contract.mjs`
- `scripts/staging/sherivs-restore/README.md`
- `tests/unit/sherivs-staging-migration-runner.test.ts`
- `docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-UNEXPECTED-OBJECTS-FIX-001.md`

---

## 3. Reproduced defects and regression assertions

Independent review fixtures from
`SHERIVS-MIGRATION-RUNNER-OBSERVATION-COMPLETENESS-REVIEW-001` are now
red tests that refuse `already_complete`. Assertions were inspected by
name and expected reason, not by pass count alone.

| Review defect | New behavior | Regression assertion | Reason |
|---------------|--------------|----------------------|--------|
| Extra `ssn` on a matched `people` table → `already_complete` (OCR-COL-1) | Observed columns are walked; unexpected names refuse | `extra ssn column on an otherwise matched table refuses already_complete` | `CATALOG_COLUMN_MISMATCH` (`reason: "unexpected"`, `sensitive: true`) |
| Extra UNIQUE on a matched table → `already_complete` (OCR-EXTRA-1) | Unused observed constraints refuse | `extra UNIQUE constraint, index, and trigger refuse already_complete` | `CATALOG_CONSTRAINT_MISMATCH` (`reason: "unexpected"`) |
| Extra index → `already_complete` | Unexpected indexes refuse unless constraint-implied | same test | `CATALOG_UNEXPECTED_OBJECTS` |
| Extra trigger → `already_complete` | Unexpected triggers refuse | same test | `CATALOG_UNEXPECTED_OBJECTS` |
| Extra storage bucket → `already_complete` | Observed buckets compared to the expected set | `extra storage bucket refuses already_complete` | `CATALOG_STORAGE_MISMATCH` |
| Table `WITH GRANT OPTION` ignored by `grantKey` (OCR-GRANT-1) | `grantKey` includes `grantable` | `table and column WITH GRANT OPTION is represented and unexpected options refuse` | `CATALOG_GRANT_MISMATCH` / `CATALOG_COLUMN_GRANT_MISMATCH` |

Additional required cases:

| Case | Assertion | Reason |
|------|-----------|--------|
| Missing / renamed / mistyped / extra `refresh_token` column | `missing, renamed, mistyped, and unexpected sensitive columns refuse already_complete` | `CATALOG_COLUMN_MISMATCH` |
| Same-name index columns or trigger timing/events differ | `same-name index or trigger with a mismatched definition refuses already_complete` | `CATALOG_INDEX_MISMATCH` / `CATALOG_TRIGGER_MISMATCH` |
| Missing expected bucket; omitted `storageBuckets` key when expected | `missing expected storage bucket and omitted storage observations refuse already_complete` | `CATALOG_STORAGE_MISMATCH` / `CATALOG_SHAPE_INCOMPLETE` |
| Missing table grant; extra `anon`; extra `PUBLIC`; incomplete privileges | `missing, unexpected, PUBLIC, and incomplete table or column grants refuse already_complete` | `CATALOG_GRANT_MISMATCH` / `CATALOG_SHAPE_INCOMPLETE` / `CATALOG_COLUMN_GRANT_MISMATCH` |
| SQL `WITH GRANT OPTION` parsed into expected; dropped option refuses | `explicit GRANT WITH GRANT OPTION is parsed and compared; allowlist remains indexes-only` | match, then `CATALOG_GRANT_MISMATCH` |
| Constraint-implied PK/UNIQUE indexes permitted; extra non-implied index refuses | `constraint-implied unique indexes are the only permitted extras` | `already_complete`, then `CATALOG_UNEXPECTED_OBJECTS` |
| Unparseable leftover constraint | `unparseable leftover constraint and omitted grantable-bearing observe classes refuse` | `CATALOG_CONSTRAINT_UNVERIFIED` |

Previously implemented protections still pass in the same file:
implicit-PK resolution, omitted observation fields, function identity
and grants, policy NULL vs omitted, lock capability, production
refusal, and `LIVE_EXECUTE_NOT_ENABLED`.

---

## 4. Test command and exact result

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**Result:** 1 file, **106 passed / 106**, ~1.96s (Vitest 3.2.4).

Log: `/opt/cursor/artifacts/sherivs-unexpected-objects-vitest.log`

The suite still patches `pg.Client.prototype.connect` to throw
`NETWORK_DISABLED`. A passing suite is **not** live integration
evidence.

---

## 5. How the comparator now works

### Bidirectional object reconciliation

`compareCatalog` compares expected and observed sets in both
directions for every supported class:

| Class | Missing expected | Unexpected extra |
|-------|------------------|------------------|
| Tables | `LEDGER_SCHEMA_ABSENT` | `CATALOG_UNEXPECTED_OBJECTS` (vendor schemas excluded) |
| Columns | `CATALOG_COLUMN_MISMATCH` (`missing`) | `CATALOG_COLUMN_MISMATCH` (`unexpected`; sensitive-name hint) |
| Constraints | `mismatch` / `unverified` | leftover observed → `unexpected` or `unverified` |
| Indexes | `CATALOG_INDEX_MISSING` | `CATALOG_UNEXPECTED_OBJECTS` unless allowlisted |
| Functions | `CATALOG_FUNCTION_MISSING` | `CATALOG_UNEXPECTED_OBJECTS` |
| Triggers | `CATALOG_TRIGGER_MISSING` | `CATALOG_UNEXPECTED_OBJECTS` |
| Policies | `CATALOG_POLICY_MISSING` | `CATALOG_UNEXPECTED_OBJECTS` |
| Table grants | `CATALOG_GRANT_MISMATCH` | `CATALOG_GRANT_MISMATCH` |
| Column grants | `CATALOG_COLUMN_GRANT_MISMATCH` | `CATALOG_COLUMN_GRANT_MISMATCH` |
| Function grants | `CATALOG_FUNCTION_GRANT_MISMATCH` | `CATALOG_FUNCTION_GRANT_MISMATCH` |
| Storage buckets | `CATALOG_STORAGE_MISMATCH` | `CATALOG_STORAGE_MISMATCH` |

Same-name indexes compare ordered columns, `unique`, and table.
Same-name triggers compare timing, events, and function. Unknown or
unparseable leftover constraints are `unverified` and refuse.

`observedCatalogFromExpected` now clones nested arrays so a fixture
cannot alias expected constraints, grants, indexes, or buckets.

### Column reconciliation

Expected columns still require name, type, and nullability. Observed
names that are not expected refuse. Sensitive extras (`ssn`,
`refresh_token`, and the other `SENSITIVE_COLUMN_HINTS`) set
`sensitive: true` on the mismatch; they are not a separate permission
path. Column defaults, identity, and generated attributes remain
outside the contract unless a later expected object carries them.

### Storage objects

Required storage objects are `INSERT INTO storage.buckets (...)`
rows parsed from pinned SQL (`id` or `name`). There is **no** storage
allowlist. Missing expected buckets, omitted `storageBuckets` when
buckets are expected, and unexpected buckets refuse. The offline
mapper now `requireClass("storageBuckets")`. This process does not
connect to Supabase or inspect live storage.

### Table and column grant options

`grantKey` is now
`table::roles::privileges::columns::grantable`.
`WITH GRANT OPTION` in pinned SQL is parsed (`parseGrantTargets`) and
stored on expected grants. Observed `grantable: true` that is not
expected refuses. Missing roles/privileges are
`CATALOG_SHAPE_INCOMPLETE`. `PUBLIC` is an ordinary grantee: it
matches only when the pinned SQL granted `TO PUBLIC`, and an
unexpected `PUBLIC` tuple refuses.

---

## 6. Object-category completeness matrix

| Item | Expected missing | Expected mismatch | Unexpected extra |
|------|------------------|-------------------|------------------|
| Table | `LEDGER_SCHEMA_ABSENT` | n/a | `CATALOG_UNEXPECTED_OBJECTS` |
| Column name | `CATALOG_COLUMN_MISMATCH` | n/a | `CATALOG_COLUMN_MISMATCH` |
| Column type / nullability | `CATALOG_SHAPE_INCOMPLETE` if omitted | `CATALOG_COLUMN_MISMATCH` | n/a (extra name already refuses) |
| Constraint | mismatch / unverified | mismatch | `CATALOG_CONSTRAINT_MISMATCH` / `UNVERIFIED` |
| Index | `CATALOG_INDEX_MISSING` if class present | columns / unique / table | `CATALOG_UNEXPECTED_OBJECTS` unless implied |
| Trigger | `CATALOG_TRIGGER_MISSING` / field incomplete | timing / events / function | `CATALOG_UNEXPECTED_OBJECTS` |
| Function | `CATALOG_FUNCTION_MISSING` | identity / returns / security | `CATALOG_UNEXPECTED_OBJECTS` |
| Policy | `CATALOG_POLICY_MISSING` | command / roles / expressions / permissive | `CATALOG_UNEXPECTED_OBJECTS` |
| Table grant | `CATALOG_GRANT_MISMATCH` | privilege / role / grantable | `CATALOG_GRANT_MISMATCH` |
| Column grant | `CATALOG_COLUMN_GRANT_MISMATCH` | privilege / role / column / grantable | `CATALOG_COLUMN_GRANT_MISMATCH` |
| Function grant | `CATALOG_FUNCTION_GRANT_MISMATCH` | including grantable | `CATALOG_FUNCTION_GRANT_MISMATCH` |
| Storage bucket | `CATALOG_STORAGE_MISMATCH` | n/a (identity is id/name) | `CATALOG_STORAGE_MISMATCH` |

---

## 7. Explicitly permitted extras and rationale

`CONTRACT_ALLOWLIST.extras` has **one** entry:

| Extra | Permitted | Scope | Rationale |
|-------|-----------|-------|-----------|
| `constraintImpliedIndexes` | yes | **indexes only** | PostgreSQL materializes PRIMARY KEY and UNIQUE as unique indexes. An observed unique index on the same table and ordered columns as an already-compared PK/UNIQUE constraint is implied, not an independent extra. |

Not permitted by this allowlist: extra columns, constraints, triggers,
storage buckets, grants, or non-unique / differently-columned indexes.
`unique === false` never qualifies. Vendor schemas (`VENDOR_SCHEMAS`)
remain the existing exclusion for vendor tables/policies/functions,
not a public-object wildcard.

---

## 8. Remaining unsupported contract fields

- CHECK match remains textual (`normalizeExpr`), not semantic.
- Column defaults, identity, generated, collation, and storage
  parameters are not compared unless a later expected object carries
  them.
- Function bodies, owners, tablespaces, views, sequences, enums,
  extensions, publications, inheritance, trigger WHEN / ENABLE.
- Index method, operator class, predicate, and tablespace are not
  compared; structural compare is table + unique + ordered columns.
- Storage object compare is bucket id/name presence, not every
  `storage.objects` / policy row.
- When expected index/trigger/storage lists are empty, a hand-built
  observed catalog that **omits** those class keys cannot prove
  absence. Official `observedCatalogFromExpected` and
  `mapObservedRowsToCatalog` include the keys. Missing expected
  buckets still refuse.
- `CATALOG_OBSERVE_SQL` is still an unused plan. The mapper is
  offline-only.

`securityProof` and `schemaEquivalence` remain `false` on every
completion path.

---

## 9. Privilege-comparison limitations

**This report does not claim effective-privilege equivalence.**

The comparator establishes that explicit `GRANT` tuples extracted from
pinned SQL match the observed grant list, including `WITH GRANT
OPTION` / `grantable`, for table, column, and function grants.

It does **not** establish equivalence of:

- object ownership
- role membership or inherited privileges
- `GRANT role TO role`
- owner default ACLs
- `PUBLIC` defaults from `acldefault` unless those tuples are present
  in the observed list (and then they must also be in the expected
  SQL, or they refuse)
- `ALTER DEFAULT PRIVILEGES`
- `GRANT OPTION` exercised through a different grantee
- superuser / bypassrls / row-security exceptions

A future live ACL dump that includes owner or PUBLIC defaults will
fail closed as unexpected grants until the observer scopes the list
or the contract is extended. That is intentional.

---

## 10. Confirmation that no database or network was contacted

- This process did not call `connect()`, `pg.Client.end()`, or any
  Supabase API.
- Unit `beforeAll` replaces `pg.Client.prototype.connect` with a throw.
- `CATALOG_OBSERVE_SQL` is still a string plan. No executor was added.
- `createLiveConnector` and `createLivePostgresLockSession` still throw.
- CLI execute still returns `LIVE_EXECUTE_NOT_ENABLED`.
- Canonical SQL was not applied. Pin inventory used local git objects.
- No PostgreSQL, pooler, or storage API was opened.

---

## 11. Confirmation that live execution remains disabled

- CLI hardcodes `allowNetwork: false` and `allowLiveCatalog: false`.
- Execute without an injected connector → `LIVE_EXECUTE_NOT_ENABLED`.
- `createLiveConnector({ allowNetwork: true })` →
  `LIVE_CONNECTOR_NOT_AUTHORIZED`.
- `LIVE_CAPABLE_LOCKS` still has no writer.
- Tests still assert production ref `nwrflbpbhyiqdptmlccm` is refused.

---

## 12. Confirmation that production remains refused

`8. production project ref fails` and
`pinned 71-file source, transport order, and production refusal remain
intact` both passed. Production URL
`db.nwrflbpbhyiqdptmlccm.supabase.co` remains `TARGET_PRODUCTION_REF`.

---

## 13. Confirmation that staging has not been restored

No catalog was read. No migration was applied. The 69-file working
tree was not used as the pin. Staging project `dvxszhracsjwdancijdc`
was not contacted.

---

## 14. Confirmation that SHERIVS-001 / 002 / 003 remain OPEN

This mission does not mark those findings resolved. A contract match,
including refusal of unexpected extras, is not application RLS proof
and is not a live schema fingerprint.

---

## 15. Authorization non-statement

**This report does not authorize any database connection, lock, catalog
inspection, migration, deployment, or production change.**

---

## 16. Verdict

**PASS WITH CONDITIONS**

**PASS FOR OFFLINE IMPLEMENTATION** is refused as an unqualified
label. The six reproduced false-complete paths now refuse, and the
allowlist is indexes-only, but the observer is still an unused plan,
grant compare is explicit tuples rather than effective privileges,
CHECK remains textual, and a hand-built observed catalog that omits
empty expected classes cannot prove absence of extras.

**BLOCKED** is refused. Extra columns, UNIQUE constraints, indexes,
triggers, storage buckets, and table/column grant options now refuse
`already_complete`. Prior implicit-PK, observation-completeness,
function, policy, lock, production, and live-execute protections
remain. The 71-file pin and transport order are intact.

Conditions that remain before any live catalog may claim
`already_complete`:

1. Written human authorization.
2. Independently reviewed live connector and PostgreSQL advisory-lock
   session (neither is implemented).
3. An authorized observer that executes the plan and maps every
   required class, including storage buckets, without dropping keys.
4. Explicit decision on whether live ACL dumps include owner/PUBLIC
   defaults (today that would fail closed as unexpected grants).

**Final status:** **PASS WITH CONDITIONS**

---

## 17. Agent report

**Implemented:** bidirectional extra-object compare for columns,
constraints, indexes, triggers, and storage; `grantKey` includes
`WITH GRANT OPTION`; SQL grant-option parse; narrow
`CONTRACT_ALLOWLIST.constraintImpliedIndexes`; mapper requires
`storageBuckets`; fixture cloning; regression tests; this report.

**Files Changed:** listed in §2.

**Architecture Impact:** none to running systems. No live path added.

**Tests:** `npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts`
→ **106/106**. No database tests.

**Security Validation:** production refused; live execute disabled;
SHERIVS-001 / 002 / 003 not marked resolved; staging not restored.

**Known Risks:** unused observe plan; explicit-tuple grant scope;
textual CHECK; omitted empty-expected class keys on hand-built
catalogs; in-process lock trust; OPEN application RLS findings if a
later restore proceeds.

**Remaining Work:** written authorization; live connector + lock +
executing observer; post-restore catalog.

**Final status:** **PASS WITH CONDITIONS**
