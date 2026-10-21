# SHERIVS-STAGING-MIGRATION-RUNNER-CONTRACT-AND-TRUST-REVIEW-001

**Mission ID:** SHERIVS-STAGING-MIGRATION-RUNNER-CONTRACT-AND-TRUST-REVIEW-001
**Mission class:** INDEPENDENT SECURITY REVIEW — OFFLINE ONLY
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-15T04:55:00Z
**Role:** Independent Principal PostgreSQL Engineer / Database Security Architect / Migration Reliability Engineer / Verification Architect

**Final status:** **PASS WITH CONDITIONS**

This review assesses whether the implementation reported in
`docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-CONTRACT-AND-TRUST-FIX-001.md`
is present in code and offline tests, and whether any known
false-complete path remains.

The implementation report was an input to **contradict**, not to copy.
Passing offline tests are not treated as proof of their own claims.

This review does **not** authorize a database connection, lock, catalog
inspection, migration, deployment, or production change. Staging has
**not** been restored. SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain
**OPEN**. No live operation is authorized.

---

## 1. Scope and explicit no-network declaration

Inspected implementation: commit
`d7ae9a53bb56e5791a823615432717114dafcb26`
(“fix: tighten restore contract comparison and lock trust”) plus its
report commit `fe9df6db9a80e2f76097802e76e6d431532b17a6`.

Hard safety rules observed by this reviewer:

- **No database was opened.** No Postgres session, pooler session, or
  Supabase Management API query ran.
- **No SQL was executed against a server.** `CATALOG_OBSERVE_SQL` was
  read as text only. This reviewer did not call
  `pg.Client.prototype.connect` and did not construct a live connector
  that can connect.
- **No migrations were run.** Canonical migration files were not
  modified.
- **No secrets were created, modified, deleted, or rotated.** Fixture
  URLs and the unit-file test CA PEM were used for probes. Process
  environment names that look like database credentials were not read
  into a client config by this review.
- **Live execution was not enabled.** No live connector or live
  advisory-lock session was implemented or invoked.
- Runner code, tests, and canonical SQL were **not altered**. This
  mission creates **only this report**.

Claims are labeled:

| Label | Meaning |
|-------|---------|
| **Repository evidence** | Re-measured from Git objects, file bytes, or script source |
| **Offline-tested** | Exercised by this reviewer against the real modules or the targeted Vitest file |
| **Implementation-report claim** | Taken from the fix artifact; not treated as proof |
| **Inference** | Reviewer conclusion from repository or offline probe evidence |
| **NOT VERIFIED (live)** | Requires a live session this mission did not open |

---

## 2. Exact reviewed commit and working-tree status

| Item | Value |
|------|--------|
| Reviewed implementation commit | `d7ae9a53bb56e5791a823615432717114dafcb26` |
| Reviewed implementation subject | `fix: tighten restore contract comparison and lock trust` |
| Reviewed report commit / HEAD at inspection | `fe9df6db9a80e2f76097802e76e6d431532b17a6` |
| Parent independent review | `7fb6e22d95b8c17c93536283b80988184d64da72` |
| Working tree at inspection | **clean** (this review adds only this document) |
| This review branch | `cursor/sherivs-staging-migration-runner-contract-and-trust-review-ca03` |
| Local `pg` | imported only by the unit file; `connect()` patched to throw |
| Canonical pin | commit `d195ba861f80379b79533126653b9cee82a8e872` / tree `bbd828951e166662bbe831fd74972e1a15488468` / **71** files |

`scripts/db-apply.mjs`, `scripts/lib/pg-ssl.mjs`, and canonical
`database/supabase/migrations/*.sql` were not modified by this review
or by the inspected fix.

The working tree still contains **69** `.sql` files and is missing
`20261008000050_coregrid_organization_memberships.sql` and
`20261008000060_organization_onboarding.sql`. The restore source loader
uses `git show` of the pin, not the 69-file working tree.

---

## 3. Files and functions inspected

Every restore module, the CLI, the approved manifest, the targeted unit
file, the fix report, and the prior independent review:

- `scripts/staging/sherivs-restore/catalog-contract.mjs`
- `scripts/staging/sherivs-restore/lock.mjs`
- `scripts/staging/sherivs-restore/cli.mjs`
- `scripts/staging/sherivs-restore/runner.mjs`
- `scripts/staging/sherivs-restore/connect.mjs`
- `scripts/staging/sherivs-restore/reconcile.mjs`
- `scripts/staging/sherivs-restore/source.mjs`
- `scripts/staging/sherivs-restore/ledger.mjs`
- `scripts/staging/sherivs-restore/preflight.mjs`
- `scripts/staging/sherivs-restore/target.mjs`
- `scripts/staging/sherivs-restore/tls.mjs`
- `scripts/staging/sherivs-restore/constants.mjs`
- `scripts/staging/sherivs-restore/approved-manifest.json`
- `scripts/staging/sherivs-restore/README.md`
- `tests/unit/sherivs-staging-migration-runner.test.ts`
- `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-CONTRACT-AND-TRUST-FIX-001.md`
- `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-REVIEW-001.md`

Functions and symbols traced:

1. `normalizeConstraint`, `constraintsEquivalent`, `parseFunctionArgs`,
   `functionIdentityKey`, `normalizeFunction`, `extractExpectedObjects`,
   `compareCatalog`, `catalogBlocksCompletion`,
   `observedCatalogFromExpected`, `CATALOG_OBSERVE_SQL`
2. `brandLock`, `markLiveCapable`, `createAdvisoryLock`,
   `createLivePostgresLockSession`, `isAuthenticLockController`,
   `isLiveCapableLockController`, `assertTrustedLockController`
3. CLI `main` / `parseArgs` → `LIVE_EXECUTE_NOT_ENABLED` →
   `runRestore({ allowNetwork: false, allowLiveCatalog: false })`
4. `runRestore` live request → `requireLiveCapable` →
   `LIVE_CONNECTOR_NOT_AUTHORIZED`
5. `createLiveConnector` (disabled; no `pg` import)
6. `reconcileRestoreState` `already_complete` path
7. `loadFromGitCommit` / `inspectWorkingTree` / `verifyTransportPair`
8. Unit assertions for the former false-complete cases, lock
   adversarial cases, observe-SQL text, and CLI execute

Grep of `scripts/staging/sherivs-restore/` found **no** `import` /
`require` of `pg`, `net`, `tls.connect`, or `@supabase`. The only
callers of `assertTrustedLockController` are `runner.mjs` and the unit
file. No other script under `scripts/` imports `createLiveConnector`.
There is **no** observe-SQL row mapper.

---

## 4. Reported claims — independently checked

| Reported claim | Independent result |
|----------------|-------------------|
| 85/85 targeted offline tests pass | **Confirmed.** This review re-ran `npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts` → **85 passed / 85**, 1 file |
| Former kind-only PK / CHECK / FK / signature defects no longer `already_complete` | **Confirmed** by independent probes against the real modules (section 6) |
| Function identity is `schema.name(inputTypes)` | **Confirmed.** Name-prefix matching is gone (`catalog-contract.mjs` 587–591, 1659–1665) |
| Official lock `liveCapable` / `authenticity` are non-writable; live proof is WeakSet membership | **Confirmed.** Assignment throws; `LIVE_CAPABLE_LOCKS` is never written (`lock.mjs` 45, 255–267, 273–278, 396–401) |
| Function grants and policy permissiveness are compared | **Confirmed for missing expected grants and restrictive-vs-permissive.** **Contradicted for unexpected extra function grants** (section 8) |
| `CATALOG_OBSERVE_SQL` represents the required contract classes | **Confirmed as unused SQL text.** There is no parser from result rows to the catalog contract. **Not executed** |
| Implicit-PK referenced columns are compared only when both sides are explicit; unknown representations fail closed | **Partially contradicted.** The skip is present and documented. Implicit-PK is **not** marked `unverified` and **can** produce `already_complete` when observed columns are explicit and wrong (CTR-FK-1) |
| No database was opened or changed | **Confirmed for this review.** Unit file patches `pg.Client.prototype.connect` to throw |
| SHERIVS-001 / 002 / 003 remain OPEN | **Confirmed as an honesty statement.** This review does not close them |
| Staging has been restored | **Not claimed** by the fix report. This review also does **not** claim it |

---

## 5. Findings with file and line evidence

### A. Former false-complete defects — closed in this code

**Classification:** **PASS** for the cases named in the prior review
and restated in this mission’s section A, when both sides carry
complete structured fields.

`constraintsEquivalent` (`catalog-contract.mjs` 494–542) now compares:

- kind and qualified table
- constraint name when both sides name the constraint
- CHECK: `normalizeExpr` text (`catalog-contract.mjs` 275–276, 506–512)
- PRIMARY KEY / UNIQUE: ordered columns (`308–310`, `514–520`)
- FOREIGN KEY: source columns, referenced schema/table, ON DELETE /
  UPDATE, deferrable / initiallyDeferred
- FOREIGN KEY referenced columns **only if both**
  `referencedColumnsMode === "explicit"` (`531–535`)
- unsupported kinds → `unverified: true` (`360–368`)

Kind-only `startsWith` matching is gone. Function lookup uses
`functionIdentityKey` only (`1659–1665`). Unexpected public functions
block (`1796–1802`).

### B. CTR-FK-1 — implicit-PK foreign keys do not fail closed

**Classification:** **BLOCKING for an unqualified offline pass.**
**Condition** for this verdict because the pinned 71-file contract
currently contains **0** implicit-PK foreign keys.

Mission requirement: if effective referenced columns cannot be derived
from available contract data, the result must be fail-closed
`NOT_VERIFIED`.

Actual behavior (`catalog-contract.mjs` 453–454, 466–467, 481–488,
531–535, 490):

- `REFERENCES table` without a column list sets
  `referencedColumnsMode = "implicit-pk"`, `referencedColumns = null`,
  `unverified = false`.
- `constraintsEquivalent` compares referenced columns only when **both**
  sides are `"explicit"`. Mixed or implicit/implicit pairs skip that
  field and can return `{ match: true, unverified: false }`.
- The implementation report documents this as deliberate
  (`CONTRACT_LIMITATIONS` line 32; fix report §9). Documentation is
  not fail-closed behavior.

Independent probe (real `constraintsEquivalent` +
`reconcileRestoreState`):

```
expected: FOREIGN KEY (user_id) REFERENCES people          # implicit-pk
observed: FOREIGN KEY (user_id) REFERENCES people (ssn)    # explicit
→ match=true, unverified=false
→ already_complete / ledger_vendor_catalog_agree
```

The same skip occurs for expected explicit `people(id)` versus observed
`implicit-pk`. Both-explicit `id` versus `ssn` **does** mismatch.

`CATALOG_OBSERVE_SQL.constraints` selects `confkey` names
(`catalog-contract.mjs` 111–114). A future mapper that populated
`referencedColumns` would make the live-observed side explicit. Against
an implicit expected side, columns would still not be compared.

Pin measurement (local `git show` of
`d195ba861f80379b79533126653b9cee82a8e872`, not the 69-file working
tree): **168** foreign keys, all `referencedColumnsMode = "explicit"`,
**0** implicit-pk. The current Scholar pin therefore does not exercise
this hole. Any later SQL that uses `REFERENCES table` without columns
would.

The unit file has **no** implicit-PK mixed-mode assertion.

### C. CTR-LOSSY-1 — omitted observed fields skip comparison

**Classification:** **BLOCKING for an unqualified offline pass** when
an injected or mapped catalog omits a field. Not a current live bypass
because no observer runs.

`compareCatalog` compares several attributes only when the observed
value is present:

| Field | Gate | Lines |
|-------|------|-------|
| Column type | `if (got.type && …)` | 1527–1535 |
| Column nullability | `typeof got.nullable === "boolean"` | 1536–1544 |
| Function return type | `if (exp.returns && got.returns && …)` | 1684–1686 |
| Function volatility | both sides truthy | 1687–1693 |
| Function `search_path` | both sides truthy; missing observed → incomplete | 1695–1705 |
| Policy command | `if (got.command && …)` | 1637–1639 |
| Policy USING | `if (got.using != null && …)` | 1643–1645 |
| Policy WITH CHECK | `if (got.withCheck != null && …)` | 1646–1648 |
| FORCE RLS | mismatch only if `forced === false` | 1594–1596 |

Independent probes produced `already_complete` when the observed
catalog omitted function `returns`, policy `USING`, policy `command`,
or column `type`, while every other required class was populated.

`normalizeFunction` defaults omitted security to `INVOKER` and omitted
volatility to `VOLATILE` (`634–641`). An expected `SECURITY DEFINER`
versus an observed object with no security field therefore mismatches.
Return type has no such default; omission is silent.

A future mapper that passes SQL `NULL` through as JavaScript `null`
for `pg_get_expr(p.polqual, …)` would skip USING comparison. That
mapper does not exist yet.

### D. CTR-GRANT-1 — unexpected function grants are not refused

**Classification:** **Condition.** Missing expected grants refuse
(`1709–1718`, `1792`). Extra observed grants do not. Independent
probe: adding `GRANT EXECUTE … TO anon` left `already_complete`.

Unexpected tables, policies, and functions **do** refuse
(`1796–1802`). Unexpected indexes, triggers, table grants, column
grants, and extra columns/constraints on a matched table do not.

### E. Lock trust — former FH-LOCK-1 is closed

**Classification:** **PASS** for public minting / mutation / copy.
**Condition** for the documented in-process limitation.

| Attack | Result | Evidence |
|--------|--------|----------|
| Ordinary `{ kind: "advisory", liveCapable: true }` | `LOCK_CONTROLLER_UNTRUSTED` | `lock.mjs` 423–427; offline-tested |
| Assign `official.liveCapable = true` | throws; field stays `false`; `isLiveCapableLockController` false | `241–247`, `264`; offline-tested |
| Assign `authenticity` | throws; stays `fake-offline` | same |
| Object spread / `Object.assign` copy | loses WeakSet + brand | `388–389`, `396–401`; offline-tested |
| `createAdvisoryLock` | brands `fake-offline` only; never adds to `LIVE_CAPABLE_LOCKS` | `284–375` |
| `createAdvisoryLock({ authenticity: "postgres-session" })` | `LIVE_LOCK_SESSION_NOT_AUTHORIZED` | `287–291` |
| `createLivePostgresLockSession()` | throws; does not brand | `381–385` |
| `markLiveCapable()` | throws; unused | `273–278` |
| Offline official lock + `allowNetwork: true` + fixture CA | `LOCK_LIVE_CAPABILITY_UNSATISFIED` then no connect | `runner.mjs` 361–367; offline-tested |

`LIVE_CAPABLE_LOCKS` has **no writer** in this tree. Live capability
cannot be minted by property mutation, spreading, public factories, or
test doubles.

**In-process limitation (honest):** a later **edit of `lock.mjs`**
could call `LIVE_CAPABLE_LOCKS.add`. That is a change-control event,
not a runtime override. This review does not treat the current WeakSet
as a cross-process or cryptographic capability.

`LOCK_SQL` remains a commentary plan. `lock.mjs` never imports `pg`.
A real `pg_try_advisory_lock` session is **NOT VERIFIED (live)** and
is not implemented.

### F. CLI and live-execution refusal

**Classification:** **PASS** for current execute paths.

- CLI parses `--allow-network` (`cli.mjs` 36–38) then **discards** it
  (`120–121` hardcode `allowNetwork: false`, `allowLiveCatalog: false`).
- Execute without an injected connector returns
  `LIVE_EXECUTE_NOT_ENABLED` **before** `runRestore` (`93–102`).
- CLI does not import `createLiveConnector`.
- `createLiveConnector()` → `NETWORK_DISABLED`;
  `createLiveConnector({ allowNetwork: true })` →
  `LIVE_CONNECTOR_NOT_AUTHORIZED` (`connect.mjs` 194–201). No `pg`
  import.
- `runRestore` live request still fails
  `LIVE_CONNECTOR_NOT_AUTHORIZED` after the unsatisfiable live-lock
  check (`runner.mjs` 356–367).
- Independent CLI probe with every confirmation flag plus
  `--allow-network` → `{ ok: false, code: "LIVE_EXECUTE_NOT_ENABLED" }`.

No alternative execution path bypasses `LIVE_EXECUTE_NOT_ENABLED` from
the CLI. Injected-connector execute is a test harness, not a network
client.

### G. Production and secret isolation

Unchanged and still refused: production ref `nwrflbpbhyiqdptmlccm`,
positive staging pin `dvxszhracsjwdancijdc`, unprefixed `DATABASE_URL`
/ `SUPABASE_*`. Existing unit tests 8 and 9 still pass. This review
did not re-open those modules beyond confirming the constants and that
the fix did not edit them.

---

## 6. Reproduced defects and assertions

Independent probes imported the **real** modules. Fixture URLs only.
No `pg.Client.connect`. Log:
`/opt/cursor/artifacts/sherivs-contract-trust-review-probes.log`.

### 6.1 Former defects — none produced `already_complete`

| Case | Result |
|------|--------|
| Expected PRIMARY KEY `(id)`, observed PRIMARY KEY `(ssn)` | `CATALOG_CONSTRAINT_MISMATCH` |
| Different CHECK (`false` vs `name <> ''`) | `CATALOG_CONSTRAINT_MISMATCH` |
| Foreign key pointing at a different table | `CATALOG_CONSTRAINT_MISMATCH` |
| Significant column order `PRIMARY KEY (a, b)` vs `(b, a)` | `CATALOG_CONSTRAINT_MISMATCH` |
| Missing required constraint list | `CATALOG_CONSTRAINT_MISMATCH` |
| Unexpected / unknown `EXCLUDE` | `CATALOG_CONSTRAINT_UNVERIFIED` |
| Same function name, different input signature | `CATALOG_FUNCTION_MISSING` |
| Different return type (`integer` → `text`) | `CATALOG_FUNCTION_MISMATCH` |
| Different security (`DEFINER` → `INVOKER`) | `CATALOG_FUNCTION_SECURITY_MISMATCH` |
| Missing expected function grants | `CATALOG_FUNCTION_GRANT_MISMATCH` |
| Expected RESTRICTIVE vs observed PERMISSIVE | `CATALOG_POLICY_MISMATCH` |

Unit file assertions for these cases (`tests/unit/sherivs-staging-migration-runner.test.ts`
1638–1818) match the probe results. They use
`observedCatalogFromExpected` plus structured field mutation, not
mocks of `compareCatalog`.

### 6.2 Remaining `already_complete` paths (not in the unit file)

| Case | Result |
|------|--------|
| Implicit-PK expected vs explicit `REFERENCES people(ssn)` | **`already_complete`** |
| Observed function omits `returns` | **`already_complete`** |
| Unexpected extra function grant | **`already_complete`** |
| Observed policy omits `USING` | **`already_complete`** |
| Observed policy omits `command` | **`already_complete`** |
| Observed column omits `type` | **`already_complete`** |

### 6.3 CHECK textual versus semantic

`CHECK (a > 0)` versus `CHECK (0 < a)` → `match=false`.
Whitespace/case-normalized `CHECK (name <> '')` versus
`CHECK (  NAME  <>  '' )` → `match=true`.

This is **textual comparison**, not semantic equivalence. The
implementation does not claim semantic equivalence
(`CONTRACT_LIMITATIONS` line 31). This review does not either.

---

## 7. Test command and exact result

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**Result:** 1 file, **85 passed / 85**, ~1.35s (Vitest 3.2.4).

Log: `/opt/cursor/artifacts/sherivs-contract-trust-review-vitest.log`

The suite:

- patches `pg.Client.prototype.connect` to throw
  `NETWORK_DISABLED: offline tests must not open a database session`
  (`beforeAll`, lines 226–229);
- uses fixture staging URLs and an in-repo test CA PEM;
- calls `loadFromGitCommit()` (local git objects of the pin);
- does not import a live connector that can connect;
- does not execute `CATALOG_OBSERVE_SQL`.

This review confirms the tests do **not** contact PostgreSQL or
Supabase. A passing suite is **not** live integration evidence.

Test-quality notes:

- New identity tests exercise the real comparator and
  `reconcileRestoreState`. That is the correct seam.
- Observe-SQL coverage is substring presence on the plan text. That is
  appropriate because the SQL is not executed.
- Gaps: no implicit-PK mixed-mode case; no omitted-field already_complete
  cases; no unexpected-function-grant case. Those gaps allowed CTR-FK-1,
  CTR-LOSSY-1, and CTR-GRANT-1 to land without a red test.

---

## 8. Contract coverage matrix

Measured from `extractExpectedObjects` on the **pinned** 71 files
(`loadFromGitCommit` of `d195ba861f80379b79533126653b9cee82a8e872`):
121 tables, 151 policies, 32 functions, 21 function grants, 0
unverified required objects, 168 explicit foreign keys, 0 implicit-pk
foreign keys.

| Contract class | Expected source | Observe-SQL source (unused) | Compared? | False-complete risk |
|----------------|-----------------|-----------------------------|-----------|---------------------|
| Tables | `CREATE TABLE` | `pg_class` relkind `r` in `public` | presence + unexpected public tables | Low if class observed |
| Columns (name) | `CREATE TABLE` body | `pg_attribute` | missing name mismatches | Extra observed columns ignored |
| Column type | parsed type | `format_type` | only if `got.type` present | **Omission → skip (CTR-LOSSY-1)** |
| Column nullability | `NOT NULL` / PK | `attnotnull` | only if boolean present | Omission → skip |
| Column defaults | not extracted | not selected | no | INTENTIONALLY_EXCLUDED |
| PRIMARY KEY / UNIQUE | ordered columns | `conkey` + kind | ordered list | Closed for present fields |
| CHECK | normalized text | `pg_get_constraintdef` / expr | textual | Semantic equivalents mismatch; different text refuses |
| FOREIGN KEY table / src cols / actions / deferrability | SQL spec | `confrelid`, `confdeltype`, `condeferrable` | yes | Closed when present |
| FOREIGN KEY referenced columns | explicit list or `<implicit-pk>` | `confkey` | **only both explicit** | **CTR-FK-1** |
| Unsupported constraint kinds | — | `contype` else branch | unverified → block | Closed |
| Indexes | `CREATE INDEX` name | `pg_index` + `pg_get_indexdef` | **name presence only** | Definition / extra indexes not compared |
| Functions identity | schema+name+input types | `pg_get_function_identity_arguments` | exact key | Closed (former name-prefix hole closed) |
| Function return type | `RETURNS` / `returns` | `pg_get_function_result` | both present | **Omission → skip** |
| Function security | `SECURITY DEFINER` / field | `prosecdef` | defaults omitted to INVOKER | Closed for DEFINER vs omitted |
| Function volatility | header / field | `provolatile` | both present; omit defaults VOLATILE | Mostly fail-closed |
| Function `search_path` | `SET search_path` / config | `proconfig` | mismatch or incomplete | Closed when expected |
| Function body | not scanned | not selected | no | INTENTIONALLY_EXCLUDED |
| Function grants | `GRANT … ON FUNCTION` | `proacl` | expected ⊆ observed | **Unexpected extras ignored** |
| Triggers | name+table | `pg_trigger` timing/events/fn | **presence only** | Timing/events/function not compared |
| RLS enabled | `ENABLE ROW LEVEL SECURITY` | `relrowsecurity` | expected true vs observed false | Omitted class → incomplete |
| FORCE RLS | `FORCE ROW LEVEL SECURITY` | `relforcerowsecurity` | only `forced === false` | Omitted boolean on a partial row can skip |
| Policies name/table | `CREATE POLICY` | `pg_policy` | presence + unexpected | Closed |
| Policy permissive | `AS PERMISSIVE\|RESTRICTIVE` | `polpermissive` | yes; omitted observed + expected restrictive mismatches | Closed for the named defect |
| Policy command / roles | `FOR` / `TO` | `polcmd` / `polroles` | command only if truthy | **Omitted command → skip** |
| Policy USING / WITH CHECK | expressions | `pg_get_expr` | only if observed non-null | **NULL/omit → skip** |
| Table grants | `GRANT` on tables | `relacl` | expected ⊆ observed | Extra grants ignored |
| Column grants | `GRANT` on columns | `attacl` | expected ⊆ observed | Pin extracts 0 |
| Storage buckets | recognized inserts | `storage.buckets` | id/name presence | Plan only |
| Vendor history | n/a (ledger/manifest versions) | `supabase_migrations.schema_migrations` | required for `already_complete` | Not a schema-object compare |

`securityProof` and `schemaEquivalence` remain `false` on every
`compareCatalog` / `reconcileRestoreState` success path
(`1764–1766`, `reconcile.mjs` 220–223).

---

## 9. Catalog observer plan (not executed)

`CATALOG_OBSERVE_SQL` (`catalog-contract.mjs` 77–224) is a frozen
object of SELECT strings plus
`note: "… this process does not execute it"`.

There is **no** function that runs these statements, and **no**
function that maps result rows onto the catalog object
`compareCatalog` consumes. `REQUIRED_OBSERVED_CLASSES` (226–239) is a
label list, not an executor.

### 9.1 Represented classes

| Class | SQL key | Contract fields it can populate |
|-------|---------|----------------------------------|
| Tables + RLS bits | `tables` | schema, name, `relrowsecurity`, `relforcerowsecurity` |
| Columns | `columns` | name, `format_type`, nullability |
| Constraints | `constraints` | kind, name, `conkey`, `confkey`, referenced table, actions, deferrability, `pg_get_constraintdef` |
| Indexes | `indexes` | name, unique, `pg_get_indexdef` |
| Functions | `functions` | identity args, returns, `prosecdef`, language, volatility, `proconfig` |
| Triggers | `triggers` | name, timing, events, function |
| Policies | `policies` | `polpermissive`, command, roles, USING, WITH CHECK |
| Table / column / function grants | `tableGrants` / `columnGrants` / `functionGrants` | ACL explode |
| Storage | `storageBuckets` | `storage.buckets` metadata |
| Vendor versions | `vendorHistory` | `schema_migrations.version` |

This matches the classes the static contract compares, **if** a later
authorized mapper fills every field `compareCatalog` actually reads.
Substring tests in the unit file confirm the plan text contains
`pg_constraint`, identity args, `polpermissive`, `polroles`, ACLs,
`relrowsecurity`, and `storage.buckets`.

### 9.2 Omitted object classification

| Object | Classification | Rationale |
|--------|----------------|-----------|
| Table/column/function owners | INTENTIONALLY_EXCLUDED_WITH_RATIONALE | Documented in `CONTRACT_LIMITATIONS` / `CATALOG_OBSERVE_LIMITATIONS` |
| Views | NOT_APPLICABLE | 0 `CREATE VIEW` in the pinned 71 files (local text scan) |
| Sequences | NOT_APPLICABLE | 0 `CREATE SEQUENCE` in the pin |
| Enums / `CREATE TYPE` | NOT_APPLICABLE | 0 in the pin |
| Extensions | NOT_APPLICABLE | 0 `CREATE EXTENSION` in the pin; vendor schemas already ignored |
| Publications | NOT_APPLICABLE | 0 `CREATE PUBLICATION` in the pin |
| Default privileges | INTENTIONALLY_EXCLUDED_WITH_RATIONALE | Not parsed. The one pin hit is a **comment** in `20261003000018_coregrid_v1_idempotency_privilege_revoke.sql` |
| Function bodies | INTENTIONALLY_EXCLUDED_WITH_RATIONALE | Dollar-quoted bodies are not scanned for DDL |
| Column defaults / identity / generated / collations / tablespace / inheritance | INTENTIONALLY_EXCLUDED_WITH_RATIONALE | Documented observe limitations |
| Observe-SQL → catalog mapper | **UNKNOWN** | Required before a live catalog can be compared. Absence currently blocks live `already_complete` via `CATALOG_NOT_CHECKED` |
| Live emptiness / object match | **UNKNOWN / NOT VERIFIED (live)** | Blocks a definitive completion result, correctly |

UNKNOWN required live evidence must block a definitive completion
result. In this tree it does: catalog `status !== "observed"` →
`CATALOG_NOT_CHECKED` (`reconcile.mjs` 150–156). That is acceptable
only while no mapper silently invents an observed catalog.

---

## 10. Explicit comparison limitations

1. CHECK match is whitespace/case-normalized text, not proven
   semantic equivalence.
2. Implicit-PK foreign keys do not resolve referenced columns from the
   referenced table’s primary key and do not fail closed (CTR-FK-1).
3. Several observed fields are compared only when present (CTR-LOSSY-1).
4. Unexpected function grants, extra columns, extra constraints, extra
   indexes, and extra triggers do not refuse `already_complete`.
5. Indexes and triggers are presence-compared, not definition-compared,
   even though the observe plan selects definitions / timing / events.
6. `pg_get_expr` / `format_type` spelling is normalized
   (`timestamptz`, `varchar`) and may still differ from live catalog
   text after a future observer.
7. `securityProof` / `schemaEquivalence` are never true. A contract
   match is not application RLS proof and not live schema equivalence.
8. Dollar-quoted function bodies are not scanned for DDL.
9. Lock trust is in-process WeakSet membership.
10. `CATALOG_OBSERVE_SQL` is unread by any executor.

---

## 11. Blocking and non-blocking findings

### Blocking for `PASS FOR OFFLINE IMPLEMENTATION`

1. **CTR-FK-1.** Implicit-PK / mixed-mode foreign keys can
   `already_complete` without establishing effective referenced
   columns. Required fail-closed `NOT_VERIFIED` is absent.
2. **CTR-LOSSY-1.** Incomplete observed rows can
   `already_complete` by omitting return type, USING, command, or
   column type.
3. Observe SQL has no mapper and was not executed. A definitive
   catalog completion result is **UNKNOWN** and must remain blocked.

These prevent an unqualified offline-implementation pass. They do not
currently enable CLI execute or a live catalog claim.

### Non-blocking / residual conditions

1. **CTR-GRANT-1.** Unexpected function grants are ignored.
2. Index/trigger definition not compared.
3. In-process lock WeakSet (change-control, not runtime forgery).
4. Working tree is 69 files; pin remains 71 via git.
5. Live TLS handshake / CA correspondence: **NOT VERIFIED (live)**.
6. Real `pg_try_advisory_lock` session: not implemented.
7. `pg.Client.end()` after a real connect: **NOT VERIFIED (live)**.
8. Prior `defaultGit` `GIT_DIR` inheritance condition is unchanged.
9. SHERIVS-001 / 002 / 003 remain **OPEN**.
10. Written human authorization is still required before any live work.

---

## 12. Migration source integrity

Local git objects only (no network fetch required; pin commit is
present in this repository):

| Check | Result |
|-------|--------|
| `git rev-parse d195ba861f80379b79533126653b9cee82a8e872:database/supabase/migrations` | `bbd828951e166662bbe831fd74972e1a15488468` |
| Pin `.sql` count excluding `.sql.proposed` | **71** |
| `.sql.proposed` inside the pin tree | **0** |
| `loadFromGitCommit()` | `ok=true`, count **71** |
| Transport pair order | `#59` `20261002000014_coregrid_v2_transport_buses_rls.sql` then `#69` `20261003000041_coregrid_transport_bus_reads.sql` |
| Working-tree `.sql` count | **69** (`matchesPin=false`) |
| Working-tree used as restore source | **No.** `resolvePinnedSource` / `loadFromGitCommit` use the pin |

The 69-file working tree was **not** substituted for the canonical pin.

---

## 13. Live execution and production-refusal verification

| Probe | Result |
|-------|--------|
| CLI execute + confirmations + `--allow-network` | `LIVE_EXECUTE_NOT_ENABLED` |
| `createLiveConnector()` | `NETWORK_DISABLED` |
| `createLiveConnector({ allowNetwork: true })` | `LIVE_CONNECTOR_NOT_AUTHORIZED` |
| `createLivePostgresLockSession()` | `LIVE_LOCK_SESSION_NOT_AUTHORIZED` |
| Official fake lock `requireLiveCapable` | `LOCK_LIVE_CAPABILITY_UNSATISFIED` |
| `runRestore({ allowNetwork: true })` + official fake + fixture CA | `LOCK_LIVE_CAPABILITY_UNSATISFIED` |
| Production project ref | still `nwrflbpbhyiqdptmlccm`; unit tests still refuse it |

**No live operation is authorized.**

---

## 14. Confirmation that no network or database was contacted

- This process did not call `connect()`, `pg.Client.end()`, or any
  Supabase API.
- Independent probes used fixture URLs only and imported restore
  modules that do not construct `pg.Client`.
- Unit `beforeAll` replaces `pg.Client.prototype.connect` with a throw.
- `CATALOG_OBSERVE_SQL` was inspected as a string plan.
- Canonical SQL was not applied.
- Pin inventory used local `git ls-tree` / `git show` / `git rev-parse`.

---

## 15. Confirmation that staging has not been restored

No catalog was read from staging. No migration was applied. The
staging project `dvxszhracsjwdancijdc` was used only as a **string
constant** and fixture hostname. The environment has not been mutated
to enable live execute.

---

## 16. Authorization non-statement

**This report does not authorize any database connection, lock, catalog
inspection, migration, deployment, or production change.**

It does not enable CLI execute, inject a live connector, mint a
PostgreSQL advisory lock, execute `CATALOG_OBSERVE_SQL`, or close
SHERIVS-001 / 002 / 003.

---

## 17. Verdict

**PASS WITH CONDITIONS**

**PASS FOR OFFLINE IMPLEMENTATION** is refused. Known false-complete
paths remain: implicit-PK / mixed-mode foreign keys (CTR-FK-1) and
omitted observed fields (CTR-LOSSY-1). The mission required
fail-closed `NOT_VERIFIED` when effective referenced columns cannot be
derived. The implementation documents a skip instead. An unqualified
pass is therefore unavailable.

**BLOCKED** is refused. The former named defects from
`SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-REVIEW-001` are
closed in this tree and independently reproduced as refusals: wrong
PRIMARY KEY columns, different CHECK text, FK to a different table,
significant column order, missing/unknown constraints, same-name
different-signature functions, different return type and security when
those fields are present, missing function grants, and PERMISSIVE
versus RESTRICTIVE. Lock live capability is no longer a writable
public field. The CLI still cannot connect, including with
`--allow-network`. The 71-file pin, transport order, and exclusion of
`.sql.proposed` remain intact. Live execute and production targeting
remain refused.

Conditions that must be closed before any live catalog may claim
`already_complete`:

1. Implicit-PK (and any FK whose effective referenced columns cannot
   be derived) must fail closed `NOT_VERIFIED` / block completion.
2. Observed rows that omit compared fields must be
   `CATALOG_SHAPE_INCOMPLETE`, not silent acceptance.
3. A separately authorized observer must map every required
   `CATALOG_OBSERVE_SQL` column onto the contract without dropping
   USING / WITH CHECK / `confkey` / return type.
4. Written human authorization, a reviewed live connector, and a
   reviewed PostgreSQL advisory-lock session remain prerequisites.
   None of those exist in this tree.

**Final status:** **PASS WITH CONDITIONS**

---

## 18. Agent report

**Implemented:** this independent review document only. No runner,
test, or SQL changes.

**Files Changed:**
`docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-CONTRACT-AND-TRUST-REVIEW-001.md`

**Architecture Impact:** none to running systems. No live path added
or enabled.

**Tests:** `npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts`
→ **85/85**. Independent probes reproduced the former defects as
refusals and the remaining implicit-PK / omitted-field
`already_complete` paths. No database tests.

**Security Validation:** production refused; live execute disabled;
credentials not printed; SHERIVS-001 / 002 / 003 not marked resolved;
staging not restored.

**Known Risks:** CTR-FK-1, CTR-LOSSY-1, CTR-GRANT-1; unused observe
plan; in-process lock trust; OPEN application RLS findings if a later
restore proceeds.

**Remaining Work:** fail-closed implicit-PK and omitted-field handling;
authorized live connector + lock + observer; post-restore catalog;
written authorization.

**Final status:** **PASS WITH CONDITIONS**
