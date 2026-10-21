# SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-001

**Mission ID:** SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-001
**Mission class:** OFFLINE RUNNER HARDENING AND TESTING
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-14T21:43:00Z
**Role:** Principal PostgreSQL Security Engineer / Migration Infrastructure Architect

**Final status:** **A. FINAL OFFLINE HARDENING COMPLETE**

This mission closes the remaining **code-level** gaps named in
`SHERIVS-STAGING-MIGRATION-RUNNER-CORRECTIONS-REVIEW-001`. It does **not**
authorize a live connector, a live lock session, catalog observation, or
any database change. Staging has **not** been restored.

---

## 0. Safety record

Hard safety rules observed:

- No database was opened. No Postgres session, pooler session, or
  Supabase Management API query ran.
- No SQL was executed against a server.
- CLI execute remains `LIVE_EXECUTE_NOT_ENABLED`.
- `createLiveConnector` does not construct `pg.Client` and does not call
  `connect()`, including when `allowNetwork` is true.
- Canonical migration files were not modified.
- Production scripts (`scripts/db-apply.mjs`, `scripts/lib/pg-ssl.mjs`)
  were not modified.
- Credentials and environment variables were not changed or printed.
- SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**.
- This process does not claim that staging has been restored.

Authoritative pin (unchanged):

| Item | Value |
|------|--------|
| Commit | `d195ba861f80379b79533126653b9cee82a8e872` |
| Tree | `bbd828951e166662bbe831fd74972e1a15488468` |
| Count | 71 |
| Production ref | `nwrflbpbhyiqdptmlccm` |
| Staging ref | `dvxszhracsjwdancijdc` |

---

## 1. Claim labels

| Label | Meaning |
|-------|---------|
| **Implemented behavior** | Present in runner modules after this mission |
| **Offline-tested** | Exercised by `tests/unit/sherivs-staging-migration-runner.test.ts` |
| **Static review** | Derived from Git objects / SQL text without a database |
| **NOT VERIFIED (live)** | Requires a future authorized staging session |
| **Remaining blocker** | Must be completed before any mutating restore |

---

## 2. Correction A — live connector isolation

### Implemented behavior

- `createLiveConnector` throws before importing `pg`, constructing
  `Client`, or calling `connect()`.
  - `allowNetwork: false` → `NETWORK_DISABLED`
  - `allowNetwork: true` → `LIVE_CONNECTOR_NOT_AUTHORIZED`
- CLI `main()` still hardcodes `allowNetwork: false` and, in execute
  mode without an injected connector, returns `LIVE_EXECUTE_NOT_ENABLED`
  even when `--allow-network` and all three confirmation flags are set.
- CLI does not import `createLiveConnector`.
- Manifest, offline, and preflight modes never construct a connector.
- `demonstrateDriverSslOverwrite` remains constructor-only (no
  `connect()`) to document the pg@8.23.1 `connectionString` overwrite.
- A live PostgreSQL advisory-lock session was **not** implemented.

### Offline-tested

- CLI manifest / offline / preflight / execute+`--allow-network` do not
  construct `pg.Client` (construction counter stayed 0).
- `createLiveConnector({ allowNetwork: true })` throws
  `LIVE_EXECUTE_NOT_ENABLED`-class `LIVE_CONNECTOR_NOT_AUTHORIZED` without
  reaching `connect()`.
- Execute with every confirmation flag still returns
  `LIVE_EXECUTE_NOT_ENABLED`.

### Static review

The previous review correctly contradicted “no live connector exists.”
That factory still exists as a **disabled** named export so a later
approved mission can replace it without scavenger-hunting callers. It is
no longer an accidental execution path.

### NOT VERIFIED (live)

Pinned TLS handshake, hostname match, and CA correspondence to the
staging server certificate.

---

## 3. Correction B — advisory lock trust

### Implemented behavior

- `kind: "advisory"` on an arbitrary object is **not** accepted.
- Official controllers are branded with a non-enumerable symbol and
  recorded in a module `WeakSet`. Copies and stubs fail
  `LOCK_CONTROLLER_UNTRUSTED`.
- `createAdvisoryLock` issues `authenticity: "fake-offline"`,
  `liveCapable: false`. It cannot mint `postgres-session`.
- `createLivePostgresLockSession()` throws
  `LIVE_LOCK_SESSION_NOT_AUTHORIZED`.
- Execute with `allowNetwork`, `connector.allowNetwork`, or
  `connector.kind === "live"` requires `requireLiveCapable: true`, which
  a fake-offline lock cannot satisfy (`LOCK_LIVE_CAPABILITY_UNSATISFIED`),
  then refuses `LIVE_CONNECTOR_NOT_AUTHORIZED`.
- Process-local `mutex` / `memory` kinds remain `LOCK_NOT_DISTRIBUTED`.
- Probe remains mandatory on authentic controllers. Connection loss still
  records uncertain outcome with `retried: false` / `autoRetry: false`.

### Offline-tested

- Fake `{ kind: "advisory", authenticity: "postgres-session", liveCapable: true }`
  cannot pass `assertTrustedLockController` and cannot run execute.
- Official fake lock cannot satisfy live-execution capability.
- Missing lock → `LOCK_REQUIRED`.
- Malformed stub → `LOCK_CONTROLLER_UNTRUSTED`.
- Spread copy of an official lock is untrusted.
- Disconnected fake session → `LOCK_CONNECTION_LOST`.
- Two official controllers sharing a registry still cannot both acquire.

### Static review

The live SQL plan (`pg_try_advisory_lock(0x53485256, 0x53544147)` on a
dedicated session) is unchanged and still documentation only.

### NOT VERIFIED (live)

A real PostgreSQL session advisory lock against staging.

---

## 4. Correction C — complete schema reconciliation

### Implemented behavior

`extractExpectedObjects` now builds a sequential expected-object contract
from pinned SQL (filename order):

- tables and columns (type, nullability)
- primary / foreign / unique / check constraints (static CREATE/ALTER)
- indexes
- functions (name, args, language, `SECURITY DEFINER` / `INVOKER`)
- triggers
- RLS enabled / forced
- policies: name, command, roles, USING, WITH CHECK
- table-level GRANT / REVOKE
- column-level GRANT / REVOKE
- `INSERT INTO storage.buckets` rows where parseable
- recognized `DO` + `FOREACH ARRAY` + `EXECUTE format` expansions

`compareCatalog` / `catalogBlocksCompletion` refuse `already_complete` on:

| Reason | When |
|--------|------|
| `CATALOG_POLICY_MISSING` | required policy absent |
| `CATALOG_POLICY_MISMATCH` | command / role / expression mismatch |
| `CATALOG_COLUMN_MISMATCH` | type or nullability mismatch |
| `CATALOG_CONSTRAINT_MISMATCH` | required constraint absent |
| `CATALOG_GRANT_MISMATCH` | table grant absent |
| `CATALOG_COLUMN_GRANT_MISMATCH` | sensitive/column grant absent |
| `CATALOG_FUNCTION_MISSING` | required function absent |
| `CATALOG_FUNCTION_SECURITY_MISMATCH` | DEFINER/INVOKER mismatch |
| `CATALOG_TRIGGER_MISSING` | required trigger absent |
| `CATALOG_INDEX_MISSING` | required index absent when indexes were observed |
| `CATALOG_RLS_MISMATCH` | enabled/forced mismatch |
| `CATALOG_STORAGE_MISMATCH` | expected storage bucket absent |
| `CATALOG_UNEXPECTED_OBJECTS` | extra public tables or policies |
| `CATALOG_SHAPE_INCOMPLETE` | required class not present on the observation |
| `CATALOG_REQUIREMENTS_UNVERIFIED` | required object marked NOT VERIFIED |
| `LEDGER_SCHEMA_ABSENT` | required table missing |

`securityProof` remains `false`. `schemaEquivalence` remains `false`.
`existenceOnly` is `false` (the contract is richer than names) **but this
is not a claim of live schema equivalence**.

Dynamic `EXECUTE 'CREATE …'` that cannot be expanded is marked
`verification: "NOT_VERIFIED"` and blocks completion.

### Offline-tested

Fixture SQL covering people / policy / grants / function / trigger /
index:

- missing policy blocks completion
- wrong policy command or role blocks completion
- column type/nullability mismatch blocks completion
- constraint mismatch blocks completion
- sensitive-column grant mismatch blocks completion
- missing function blocks completion
- missing trigger blocks completion
- unexpected table blocks completion
- unexpandable DO/EXECUTE CREATE blocks with
  `CATALOG_REQUIREMENTS_UNVERIFIED`
- source pin, transport order, and production-target refusal remain intact

### Static review (71-file pin, no database)

Measured from `git show` of commit `d195ba8` through the extractor
(not a live catalog):

| Object class | Extracted count | Notes |
|--------------|-----------------|-------|
| Tables | 121 | CREATE TABLE statements were 125; later files replace / skip duplicates |
| Policies | 151 | Includes recognized DO-foreach expansions; DROP POLICY is subtracted |
| Indexes | 176 | |
| Functions | 32 unique identities | 56 `CREATE FUNCTION` statements include replacements |
| Triggers | 54 | |
| Storage buckets | 1 | Static `INSERT INTO storage.buckets` |
| Tables with RLS enabled | 120 | |
| Tables with FORCE RLS | 11 | |
| Tables with table grants | 78 | |
| Column grants in the pin | 0 | Column-grant compare is implemented; pin has none |
| Unverified required objects | 0 from recognized patterns | Unrecognized dynamic CREATE still blocks in tests |

This inventory is **static SQL derivation**. It is not proof that staging
contains these objects.

### Honest limits (do not over-claim)

- Parser does not execute SQL and does not call `pg_get_expr`.
- Function bodies, dollar-quoted comments, and some ALTER shapes may
  diverge from PostgreSQL’s catalog canonical form.
- Type names are normalized (`timestamptz`, `varchar`) and may not equal
  `format_type()` output until a live observer maps them.
- Application security (RLS predicate correctness, tenant isolation,
  SHERIVS-001/002/003) is **not** proven by a contract match.

### NOT VERIFIED (live)

Fresh staging catalog: emptiness, extensions, unexpected objects, live
policy expressions, live grants, live function security, live storage
ACLs. GATE4 remains historical.

---

## 5. Correction D — failure cleanup

### Implemented behavior

Mock / apply connection lifecycle:

- `opened` is recorded before `onOpen`.
- `closed` is recorded after success, after `onOpen` failure, and after
  apply failure.
- If work fails and `onClose` also fails, the original error is thrown
  with `closeError` attached (`cause` set if empty). The close error does
  not replace the apply error.
- If work succeeds and close fails: `CONNECTION_CLOSE_FAILED`. The runner
  records `TX_OUTCOME.UNKNOWN` via `recordUncertain`, sets
  `retried: false` / `autoRetry: false`, and does not continue.
- Uncertain lock-probe outcomes still refuse continuation with no
  automatic retry.

### Offline-tested

- Connection failure (`onOpen` throw): every opened id is in `closed[]`;
  original `connect-failed` identity preserved.
- Migration failure: `closed[]` matches `opened[]`; original apply error
  preserved.
- Close failure after apply failure: result error is
  `original-apply-error`; `closeError` is `close-also-failed`; no retry.

### NOT VERIFIED (live)

`pg.Client.end()` after a real `connect()` failure or mid-handshake abort.

---

## 6. Correction E — tests

Command:

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

Result: **70 passed / 70**, 1 file. No database integration tests.

Log: `/opt/cursor/artifacts/sherivs-final-hardening-vitest.log`

---

## 7. Remaining blockers (unchanged class: live / process)

These were outstanding before this mission and remain outstanding. They
are **not** named code gaps in the offline runner.

1. **Written human authorization** naming staging ref
   `dvxszhracsjwdancijdc`, Git pin `d195ba8` / tree `bbd82895`, OPTION A,
   this runner, and acceptance of OPEN SHERIVS-001 / 002 / 003.
2. **Separately approved live-connector mission** that uses
   `buildPinnedClientConfig`, never passes `connectionString`, and is
   independently re-reviewed. This factory must stay disabled until then.
3. **Reviewed PostgreSQL advisory-lock session** (`postgres-session`,
   `liveCapable: true`) — not a `kind: "advisory"` stub.
4. **Fresh read-only staging catalog** under that lock (emptiness,
   extensions, unexpected objects, full object classes). GATE4 is
   historical.
5. **Post-restore catalog**. Restore is not self-certifying.
6. Default recovery after partial / ambiguous / lock-loss remains
   **recreate staging**.

---

## 8. Required approvals

A status **A** here is **not** permission to:

- inject a live connector
- enable CLI execute
- set `allowNetwork` for a live operation
- open staging or production
- apply the 71 files
- close SHERIVS-001 / 002 / 003

Still required before any mutating restore: items 1–5 in §7, each with
independent review.

---

## 9. Files changed (this mission)

- `scripts/staging/sherivs-restore/connect.mjs`
- `scripts/staging/sherivs-restore/lock.mjs`
- `scripts/staging/sherivs-restore/catalog-contract.mjs`
- `scripts/staging/sherivs-restore/reconcile.mjs`
- `scripts/staging/sherivs-restore/runner.mjs`
- `scripts/staging/sherivs-restore/cli.mjs`
- `scripts/staging/sherivs-restore/constants.mjs`
- `scripts/staging/sherivs-restore/README.md`
- `tests/unit/sherivs-staging-migration-runner.test.ts`
- `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-FINAL-HARDENING-001.md`

Canonical migrations and production apply scripts were not changed.

---

## 10. Explicit confirmation

- Offline hardening of the named review gaps is complete in code and
  targeted tests.
- No database was opened. No SQL was executed against a server.
- No migration was applied. Staging was not restored.
- SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**.
- CLI live execute remains `LIVE_EXECUTE_NOT_ENABLED`.
- This report is **not** authorization to connect, lock, catalog, or apply.

**Final status:** **A. FINAL OFFLINE HARDENING COMPLETE**

Status **B** is refused because the six named remaining issues from the
independent review that were code-level (live factory `connect()`, stub
lock trust, missing-policy completion, partial catalog compare, unverified
cleanup) are addressed in this runner. Fresh catalog and written
authorization remain process/live blockers, not unfinished code in this
mission.

Status **C** is refused because the safety boundary is established: CLI
modes are database-free, the live factory cannot connect, fake advisory
locks cannot satisfy live execution, and catalog mismatches block
`already_complete`.
