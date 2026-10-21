# SHERIVS-MIGRATION-RUNNER-OBSERVATION-COMPLETENESS-FIX-001

**Mission ID:** SHERIVS-MIGRATION-RUNNER-OBSERVATION-COMPLETENESS-FIX-001
**Mission class:** OFFLINE IMPLEMENTATION — OBSERVATION COMPLETENESS
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-15T07:53:00Z
**Role:** Principal PostgreSQL Security Engineer / Database Migration Reliability Architect / Verification Engineer

**Final status:** **PASS WITH CONDITIONS**

This mission closes the independently reproduced false-completion paths
from `SHERIVS-STAGING-MIGRATION-RUNNER-CONTRACT-AND-TRUST-REVIEW-001`.
It does **not** authorize a live connector, a live lock session, catalog
observation against a database, or any database change. Staging has
**not** been restored. SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain
**OPEN**.

---

## 1. Exact commit and working-tree status

| Item | Value |
|------|--------|
| This mission implementation commit | `458ff11ef0468e191a7adc3ed233561737c5167a` |
| Subject | `fix: fail closed on incomplete catalog observations` |
| Parent | `5c4352e22de5859dbfa0ead8a423a05920941ae4` (independent review) |
| Working tree after implementation | clean except this report |
| Canonical pin | commit `d195ba861f80379b79533126653b9cee82a8e872` / tree `bbd828951e166662bbe831fd74972e1a15488468` / **71** files |
| Transport pair | `#59` `20261002000014_coregrid_v2_transport_buses_rls.sql` then `#69` `20261003000041_coregrid_transport_bus_reads.sql` |
| `.sql.proposed` in pin | **0** |
| Working-tree `.sql` count | **69** (not used as the pin) |

`scripts/db-apply.mjs`, `scripts/lib/pg-ssl.mjs`, and canonical
`database/supabase/migrations/*.sql` were not modified.

---

## 2. Files changed

- `scripts/staging/sherivs-restore/catalog-contract.mjs`
- `scripts/staging/sherivs-restore/README.md`
- `tests/unit/sherivs-staging-migration-runner.test.ts`
- `docs/security/rls-prep/SHERIVS-MIGRATION-RUNNER-OBSERVATION-COMPLETENESS-FIX-001.md`

---

## 3. Previously reproduced defects and new regression assertions

| Review defect | New behavior | Regression assertion |
|---------------|--------------|----------------------|
| Implicit-PK expected vs explicit `people(ssn)` → `already_complete` | Resolved expected columns from `people` PRIMARY KEY `(id)` and compared to observed `(ssn)` | `implicit-PK versus observed explicit wrong key refuses already_complete` → `CATALOG_CONSTRAINT_MISMATCH` |
| Observed function omits `returns` → `already_complete` | Missing `returns` is `CATALOG_SHAPE_INCOMPLETE` | `omitted required observation fields…` |
| Unexpected extra function grant → `already_complete` | Bidirectional grant compare | `unexpected function grants and grant options refuse already_complete` → `CATALOG_FUNCTION_GRANT_MISMATCH` |
| Observed policy omits `USING` key → `already_complete` | Omitted key is incomplete; SQL `null` is legally absent | `omitted required observation fields…` → `CATALOG_SHAPE_INCOMPLETE`; explicit `using: null` vs expected expression → `CATALOG_POLICY_MISMATCH` |
| Observed policy omits `command` → `already_complete` | Missing command is incomplete | same test |
| Observed column omits `type` → `already_complete` | Missing type is incomplete | same test |

Additional implicit-PK cases required by this mission:

| Case | Assertion |
|------|-----------|
| Implicit-PK vs explicit matching PK `(id)` | `already_complete` (correct resolution, not a false complete) |
| Missing referenced PRIMARY KEY | `CATALOG_CONSTRAINT_UNVERIFIED` |
| Composite PK `(a,b)` vs observed `(b,a)` | mismatch on `referencedColumns` |
| Referenced schema/relation mismatch | `CATALOG_CONSTRAINT_MISMATCH` |
| Unknown / unparseable FK | `unverified: true` |

No unresolved effective-column case returns `already_complete`.

---

## 4. Test command and exact result

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**Result:** 1 file, **95 passed / 95**, ~2.2s (Vitest 3.2.4).

Log: `/opt/cursor/artifacts/sherivs-observation-completeness-vitest.log`

The suite still patches `pg.Client.prototype.connect` to throw. A
passing suite is **not** live integration evidence.

---

## 5. How the comparator now works

### Implicit-PK foreign keys

`resolveForeignKeyReferencedColumns` / `primaryKeyColumnsOf`:

- Explicit `REFERENCES table (cols)` uses those columns in order.
- Implicit `REFERENCES table` uses the referenced relation’s PRIMARY
  KEY columns from the same expected or observed table list.
- Missing table, missing PK, unparseable PK, or unknown mode →
  `{ unverified: true }` → `CATALOG_CONSTRAINT_UNVERIFIED`.
- Resolved columns are compared with order. Implicit vs matching
  explicit PK completes; implicit vs wrong explicit key mismatches.

### Required observation fields

`observationState` distinguishes:

| State | Meaning | Example |
|-------|---------|---------|
| `present` | Key present with a value | `type: "uuid"` |
| `absent` | Key present, SQL NULL (legal) | `using: null` on a SELECT-only policy that truly has no USING |
| `missing` | Key omitted or `undefined` | `{}` or `{ type: null }` for a required scalar |
| `unknown` | Present empty string where a value is required | `using: ""` |

Required missing/unknown fields append `shapeIncomplete` and block
`already_complete` via `CATALOG_SHAPE_INCOMPLETE`.

Covered at minimum: column type and nullability; function return type,
security, volatility; policy command, roles, permissiveness, USING,
WITH CHECK; constraint parse/identity; table/column/function grants;
RLS enabled and FORCE RLS; trigger timing, events, and function.

### Function grants

Expected and observed grant tuples are compared **both ways**.
`functionGrantKey` includes function identity, roles, privileges, and
`grantable`. Missing expected grants, extra grantees, and unexpected
WITH GRANT OPTION all return `CATALOG_FUNCTION_GRANT_MISMATCH`.

**Scope (not effective privilege equivalence):** the contract compares
explicit `GRANT` tuples extracted from pinned SQL against the observed
grant list. Inherited privileges, OWNER defaults, PUBLIC defaults from
`acldefault`, and `ALTER DEFAULT PRIVILEGES` are **not** modeled as
equivalent. A future live observer that dumps every ACL, including
owner defaults, will fail closed on unexpected tuples until the
observer scopes the list or the contract is extended. That is
intentional.

Table and column grants are also compared both ways on the same
explicit-tuple scope.

### Policy USING / WITH CHECK

An omitted `using` / `withCheck` key is incomplete. An explicit `null`
is legally absent and mismatches an expected expression. An empty
string is `unknown`, not absent.

### Catalog observer contract

`CATALOG_OBSERVE_SQL` remains an unused plan. This process does **not**
execute it. `OBSERVE_SQL_FIELD_MAP` and `mapObservedRowsToCatalog`
map projected columns onto comparator fields for offline fixtures.

Function-grant SQL now projects `grantable` and uses
`COALESCE(p.proacl, acldefault('f', p.proowner))` so a future mapper
can see default EXECUTE when `proacl` is null. That still is not
`ALTER DEFAULT PRIVILEGES` equivalence.

---

## 6. Observation-contract completeness matrix

| Comparator field | Observe-SQL projection | Offline fixture | Live |
|------------------|------------------------|-----------------|------|
| Table schema/name | `tables.schema`, `tables.name` | mapped | NOT VERIFIED (live) |
| RLS enabled / FORCE | `rls_enabled`, `rls_forced` | mapped; missing key incomplete | NOT VERIFIED (live) |
| Column name/type/nullability | `columns.*` | mapped; omitted type incomplete | NOT VERIFIED (live) |
| Constraint kind/columns/actions | `constraints.*` including `conkey`/`confkey` | mapped | NOT VERIFIED (live) |
| Implicit-PK referenced columns | `confkey` plus referenced table PK | resolved or NOT_VERIFIED | NOT VERIFIED (live) |
| Index name | `indexes.name` | presence | definition not compared |
| Function identity/returns/security/volatility | `identity_args`, `returns`, `prosecdef`, `provolatile` | omitted returns/security incomplete | NOT VERIFIED (live) |
| Function grants + grantable | `functionGrants.*` + `acldefault` | bidirectional | NOT VERIFIED (live) |
| Trigger timing/events/function | `triggers.*` | missing field incomplete | NOT VERIFIED (live) |
| Policy command/roles/permissive/USING/WITH CHECK | `polcmd`, `polroles`, `polpermissive`, `pg_get_expr` | NULL vs omitted distinct | NOT VERIFIED (live) |
| Table/column grants + grantable | `relacl`/`attacl` + `is_grantable` | bidirectional explicit tuples | NOT VERIFIED (live) |
| Storage buckets | `storage.buckets` | presence | NOT VERIFIED (live) |
| Vendor history | `schema_migrations.version` | required for complete | NOT VERIFIED (live) |

No missing **required** projection was found for the comparator fields
above. The unused plan can populate them if a later authorized mapper
preserves keys (including SQL NULL). Live operation stays disabled.

---

## 7. Remaining unsupported or unrepresented fields

- CHECK match remains textual, not semantic.
- Index **definition** is selected by the plan but compared by name only.
- Extra columns on a matched table are still ignored (not one of the
  reproduced false-complete paths; documented residual).
- Function bodies, owners, tablespaces, views, sequences, enums,
  extensions, publications, column defaults, identity/generated
  columns, collations, inheritance, trigger WHEN/ENABLE.
- Inherited / OWNER / PUBLIC-default / `ALTER DEFAULT PRIVILEGES`
  effective privilege sets.
- `CATALOG_OBSERVE_SQL` is not executed. `mapObservedRowsToCatalog` is
  an offline fixture mapper only.
- Lock trust remains in-process WeakSet membership. No live lock
  session. No live connector.

`securityProof` and `schemaEquivalence` remain `false` on every
completion path.

---

## 8. Confirmation that no database or network was contacted

- This process did not call `connect()`, `pg.Client.end()`, or any
  Supabase API.
- Unit `beforeAll` replaces `pg.Client.prototype.connect` with a throw.
- `CATALOG_OBSERVE_SQL` is still a string plan. No executor was added.
- `createLiveConnector` and `createLivePostgresLockSession` still throw.
- CLI execute still returns `LIVE_EXECUTE_NOT_ENABLED`.
- Canonical SQL was not applied. Pin inventory used local git objects.

---

## 9. Confirmation that live execution remains disabled

- CLI hardcodes `allowNetwork: false` and `allowLiveCatalog: false`.
- Execute without an injected connector → `LIVE_EXECUTE_NOT_ENABLED`.
- `createLiveConnector({ allowNetwork: true })` →
  `LIVE_CONNECTOR_NOT_AUTHORIZED`.
- `LIVE_CAPABLE_LOCKS` still has no writer.

---

## 10. Confirmation that staging has not been restored

No catalog was read. No migration was applied. The 69-file working
tree was not used as the pin.

---

## 11. Confirmation that SHERIVS-001 / 002 / 003 remain OPEN

This mission does not mark those findings resolved. A contract match
is not application RLS proof.

---

## 12. Authorization non-statement

**This report does not authorize any database connection, lock, catalog
inspection, migration, deployment, or production change.**

---

## 13. Verdict

**PASS WITH CONDITIONS**

**PASS FOR OFFLINE IMPLEMENTATION** is refused. The six reproduced
false-complete paths now refuse, but the observer is still an unused
plan, grant compare is explicit tuples rather than effective
privileges, CHECK remains textual, and extra columns on a matched
table are still ignored. Those are documented residuals, not live
authorization.

**BLOCKED** is refused. Implicit-PK resolution fail-closes when the
effective key cannot be derived; omitted required observation fields
are incomplete; unexpected function grants refuse; policy NULL versus
omitted keys are distinct; the 71-file pin and transport order are
intact; live execute remains disabled.

Conditions that remain before any live catalog may claim
`already_complete`:

1. Written human authorization.
2. Independently reviewed live connector and PostgreSQL advisory-lock
   session (neither is implemented).
3. An authorized observer that executes the plan and maps every
   required field without dropping keys or collapsing NULL into
   omitted.
4. Explicit decision on whether live ACL dumps include owner/PUBLIC
   defaults (today that would fail closed as unexpected grants).

**Final status:** **PASS WITH CONDITIONS**

---

## 14. Agent report

**Implemented:** implicit-PK FK resolution; observation-state machine;
bidirectional grants; policy NULL vs omitted; unused observe-SQL field
map and offline row mapper; regression tests; this report.

**Files Changed:** listed in §2.

**Architecture Impact:** none to running systems. No live path added.

**Tests:** `npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts`
→ **95/95**. No database tests.

**Security Validation:** production refused; live execute disabled;
SHERIVS-001 / 002 / 003 not marked resolved; staging not restored.

**Known Risks:** unused observe plan; explicit-tuple grant scope;
textual CHECK; extra columns ignored; in-process lock trust; OPEN
application RLS findings if a later restore proceeds.

**Remaining Work:** written authorization; live connector + lock +
executing observer; post-restore catalog.

**Final status:** **PASS WITH CONDITIONS**
