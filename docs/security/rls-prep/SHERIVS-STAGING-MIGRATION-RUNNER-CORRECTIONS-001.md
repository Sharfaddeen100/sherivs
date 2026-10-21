# SHERIVS-STAGING-MIGRATION-RUNNER-CORRECTIONS-001

**Mission ID:** SHERIVS-STAGING-MIGRATION-RUNNER-CORRECTIONS-001
**Mission class:** TARGETED RUNNER SECURITY CORRECTIONS AND OFFLINE TESTS
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-14T21:15:00Z
**Role:** Principal PostgreSQL Security Engineer / Migration Infrastructure Architect

**Final status:** **A. CORRECTIONS IMPLEMENTED — OFFLINE TESTS PASS**

This mission corrected named defects in the staging-only 71-file restore
runner. It did **not** open a database, apply migrations, restore staging,
enable live execute, or close SHERIVS-001 / 002 / 003.

---

## 0. Non-contact and execution gate

- **No database was opened.** No Postgres session, pooler session, or
  Supabase Management API query ran.
- **No SQL was executed against a server.** Fake advisory sessions and mock
  connectors never set `allowNetwork`. `pg.Client.prototype.connect` is
  patched in the targeted unit file to throw `NETWORK_DISABLED`.
- **CLI execute remains `LIVE_EXECUTE_NOT_ENABLED`.** This process did not
  inject a live connector. `--allow-network` remains a no-op in the CLI.
- Production (`nwrflbpbhyiqdptmlccm`) and staging (`dvxszhracsjwdancijdc`)
  were unchanged.
- Canonical migration files were not modified.
- Production-default apply scripts (`scripts/db-apply.mjs`,
  `scripts/lib/pg-ssl.mjs`) were not modified.
- Environment variables and secrets were not changed. Credentials were not
  printed.
- No deploy, merge-to-default, or restore publish occurred.

Source pin (unchanged):

| Item | Value |
|------|-------|
| Commit | `d195ba861f80379b79533126653b9cee82a8e872` |
| Migrations tree | `bbd828951e166662bbe831fd74972e1a15488468` |
| Count | **71** |
| Implementation under review | PR #22 `5cfb9eba8d7583a45cad972921c6c8f1ba08d189` |
| Review | `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-REVIEW-001.md` |

---

## 1. Exact changed files

| Path | Change |
|------|--------|
| `scripts/staging/sherivs-restore/tls.mjs` | Fail-closed TLS parse; X.509 CA; no `connectionString` in Client config |
| `scripts/staging/sherivs-restore/connect.mjs` | Discrete Client fields; driver-overwrite inspector; still network-gated |
| `scripts/staging/sherivs-restore/lock.mjs` | **New.** Advisory-lock plan, state machine, fake session |
| `scripts/staging/sherivs-restore/catalog-contract.mjs` | **New.** Expected CREATE TABLE / CREATE POLICY contract + limitations |
| `scripts/staging/sherivs-restore/reconcile.mjs` | **New.** Manifest + vendor history + catalog reconciliation |
| `scripts/staging/sherivs-restore/ledger.mjs` | Filename inflight unique index; `recordUncertain` |
| `scripts/staging/sherivs-restore/runner.mjs` | Lock + reconcile required for execute; no ledger-only completion |
| `scripts/staging/sherivs-restore/preflight.mjs` | Honest `NOT_CHECKED` reconciliation note |
| `scripts/staging/sherivs-restore/cli.mjs` | Help text; live execute still refused |
| `scripts/staging/sherivs-restore/constants.mjs` | TLS allowlist, forbidden PG SSL env, advisory-lock keys |
| `scripts/staging/sherivs-restore/README.md` | TLS, lock, and reconciliation operator notes |
| `scripts/README.md` | Pointer to this report |
| `tests/unit/sherivs-staging-migration-runner.test.ts` | Expanded offline suite |
| `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-CORRECTIONS-001.md` | This report |

Not changed: `approved-manifest.json`, canonical migrations, application
code, `scripts/db-apply.mjs`, deployment configuration.

---

## 2. Original findings and corrections

### 2.1 R-TLS-1 — URL `sslmode` overwrote pinned ssl

**Original:** `pg@8.23.1` `ConnectionParameters` does
`Object.assign({}, config, parse(connectionString))`. Passing
`{ connectionString, ssl: { rejectUnauthorized: true, ca } }` lets
`sslmode=no-verify` become `{ rejectUnauthorized: false }` and
`sslmode=require` drop the CA.

**Correction:**

- Parse URL *components* in `tls.mjs`. Query keys are allowlisted
  (`sslmode` only). Host/user/password/database cannot be overridden by
  `?host=` / `?hostaddr=`.
- `sslmode` must be omitted or `verify-full`. `disable` and `no-verify`
  have dedicated refuse codes. `require` / `prefer` / `verify-ca` refuse.
- `uselibpqcompat`, `ssl=false` / `ssl=no-verify`, `SHERIVS_DB_INSECURE_TLS=1`,
  and libpq SSL environment (`PGSSLMODE`, `PGSSLROOTCERT`, `PGSSLCERT`,
  `PGSSLKEY`, `PGSSLNEGOTIATION`) refuse.
- CA is parsed with `crypto.X509Certificate`. Private keys and
  non-parseable `-----BEGIN CERTIFICATE-----` blocks fail. `ca === false`
  is refused.
- `buildPinnedClientConfig` returns discrete `host` / `port` / `user` /
  `password` / `database` / `ssl` and **never** includes `connectionString`.
- Port must be 5432.
- Errors go through `redactText`. Logs still redact credentials.

The CLI still does not construct a live client. The live constructor
remains behind `allowNetwork` and is not invoked here.

Live handshake (CA matches the staging server certificate) remains
**NOT VERIFIED**.

### 2.2 R-HIST-1 — no concurrency protection

**Original:** Unique key was `(attempt_id, filename)`. Two processes could
both `fresh_apply` the same non-idempotent file.

**Correction:**

- Execute requires an **advisory** lock controller. `mutex` / `memory`
  kinds are refused (`LOCK_NOT_DISTRIBUTED`).
- Lock scope: entire restore attempt. Lifetime: acquire after
  authorization/TLS pin, release in `finally`, or implicitly when the lock
  session dies.
- Dedicated lock session; per-file apply connections do **not** hold the
  lock. The runner probes the lock before every file.
- `pg_try_advisory_lock(classid=0x53485256, objid=0x53544147)` is the
  documented live SQL. Offline tests use a fake session that interprets
  the same SQL against an in-memory registry (no socket).
- Why advisory lock: session-level, database-local, released on backend
  death, and can span 71 apply connections because it is not
  transaction-scoped on the apply session.
- Defense in depth: unique index
  `sherivs_staging_ledger_filename_inflight` on `filename` where status is
  `started` or `succeeded`.
- Acquire failure or probe/connection loss blocks execution and does not
  auto-retry. In-flight work is recorded `ambiguous` / reconciliation
  required.

A live lock session (real `pg.Client.connect`) was **not** added.

### 2.3 R-HIST-2 — ledger `already_complete` without schema

**Original:** `evaluateLedger` all-71 succeeded returned `already_complete`
and execute returned success without looking at the catalog.

**Correction:** Execute calls `reconcileRestoreState`. Ledger-complete
without an observed catalog → `CATALOG_NOT_CHECKED`. Ledger-complete with
missing expected tables → `LEDGER_SCHEMA_ABSENT`. Schema existence is
explicitly **not** security proof (`securityProof: false`).

### 2.4 R-HIST-3 — `fresh_apply` ignored vendor history and catalog

**Original:** Empty private ledger was treated as a green field.

**Correction:** `fresh_apply` requires:

- observed catalog (not `NOT_CHECKED`)
- vendor history `absent` or `available` with no expected versions
- no expected Scholar tables present
- no unexpected public tables

Vendor versions present while the private ledger is empty →
`VENDOR_HISTORY_DISAGREE`. Partial expected tables → `PARTIAL_SCHEMA`.
Full expected tables with empty ledger → `UNKNOWN_MIGRATION_STATE`.
Vendor checksum ≠ manifest SHA-256 →
`MANIFEST_CHECKSUM_DIFFERS_FROM_HISTORY`. None of these auto-retry.

Expected objects are derived from static `CREATE TABLE` / `CREATE POLICY`
in the pinned SQL. Limitations are exported and must not be treated as a
correctness fingerprint (no column/RLS-expression comparison; dynamic SQL
invisible; existence ≠ application security).

---

## 3. Execution gate (Correction E)

Preserved:

- `--confirm-staging-ref=dvxszhracsjwdancijdc`
- `--confirm-source-commit=d195ba861f80379b79533126653b9cee82a8e872`
- `--i-authorize-staging-restore`
- CLI `LIVE_EXECUTE_NOT_ENABLED` when no connector is injected
- `allowNetwork: false` hardcoded in the CLI
- unprefixed `DATABASE_URL` / production-ref refusal
- 71-file git pin and transport order `#59` then `#69`

Live execute is **not** enabled.

---

## 4. Test results

Command:

```
npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts
```

**Result:** **56 passed / 56**, 1 file, ~1s. No database integration tests
were run.

Covered offline:

- TLS URL override / `sslmode=disable` / `sslmode=no-verify`
- missing / invalid / private-key CA
- unexpected URL parameters (`host`, `hostaddr`) and `PGSSLMODE`
- `pg.Client` constructor overwrite proof vs pinned discrete config
- concurrent lock acquisition
- lock acquire failure
- lock release and connection-loss; no automatic retry
- conflicting ledgers / vendor history
- private ledger complete + schema absent
- manifest checksum ≠ recorded vendor checksum
- partial and unknown schema block continuation
- process-local mutex refused
- 71-file pin, transport order, production-ref refusal
- `pg.Client.connect` cannot succeed in this file

### 4.1 Suite output

```
 ✓ tests/unit/sherivs-staging-migration-runner.test.ts (56 tests)
 Test Files  1 passed (1)
      Tests  56 passed (56)
```

Additional offline CLI checks (no database URL, no connector):

- `node scripts/staging/sherivs-restore/cli.mjs --mode=manifest` →
  `manifest_ok` count 71, commit `d195ba8…`, tree `bbd82895…`
- `node …/cli.mjs --mode=execute` with all three confirmation flags →
  exit 2, `LIVE_EXECUTE_NOT_ENABLED`

---

## 5. What was verified offline vs what still requires live work

| Claim | Offline now | Still requires |
|-------|-------------|----------------|
| URL sslmode cannot weaken pinned ssl in constructed Client | Yes (constructor, no socket) | Live handshake vs staging cert |
| CA is parseable X.509 CA | Yes | CA matches staging server name |
| Two fake sessions cannot both hold the lock | Yes | Live `pg_try_advisory_lock` on staging |
| Ledger-complete ≠ schema-complete | Yes (injected catalog) | Fresh staging catalog observation |
| Vendor/ledger disagreement blocks | Yes | Actual `schema_migrations` shape on staging |
| 71-file pin / transport order / production refusal | Yes | Unchanged |
| `#23` GUC cannot leak across live sessions | Design only | Live session probe |
| Empty Scholar public schema | No (`NOT_CHECKED`) | Read-only staging catalog |
| Multi-statement simple-query on PostgreSQL 17 | No | Live apply (unauthorized) |

---

## 6. What still requires a live connector

A **separate** future mission, after written authorization and independent
review of these corrections, would still need to:

1. Construct `pg.Client` from `buildPinnedClientConfig` (no `connectionString`).
2. Open a dedicated lock session, `pg_try_advisory_lock`, keep it for the
   run, probe, unlock.
3. Run the read-only catalog / vendor-history SQL in
   `catalog-contract.mjs` `CATALOG_OBSERVE_SQL`.
4. Only then consider apply.

This mission did not implement or enable that wiring in the CLI.

---

## 7. Recovery limitations

- The 71-file set is not one transaction. Many `CREATE TABLE` /
  `CREATE POLICY` statements are not idempotent.
- Default recovery after partial, ambiguous, lock-loss, or vendor/catalog
  disagreement: **recreate staging**, then a new authorized run.
- Automatic resume / replay is refused.
- Companion rollback files are not an apply path.
- Advisory-lock connection-loss has a TOCTOU window; unique inflight index
  + catalog reconcile + no auto-retry are the mitigations, not a guarantee
  that two backends never overlap during a dying lock session.
- Operator snapshots / PITR were not verified.

---

## 8. Remaining approvals

Still required before any live execute:

1. Written human authorization naming staging ref, Git pin, OPTION A,
   this runner, and acceptance of OPEN SHERIVS-001 / 002 / 003.
2. Independent re-review of these corrections.
3. Fresh read-only staging catalog (identity, emptiness, extensions,
   unexpected objects). Catalog remains `NOT_CHECKED`.
4. A later process that injects a live connector **and** a live advisory
   lock session after (1)–(3).
5. Post-restore catalog mission. Restore is not self-certifying.
6. Proposed SQL remains excluded.

This document is **not** that authorization. It does **not** authorize
future execution automatically.

SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**. Staging schema
has **not** been restored. No RLS finding is claimed resolved.

---

## 9. Version-target classification

**ACTIVE-V1 ONLY.** No V2 device/IoT or V3 Reality Intelligence
implementation. The V2-named transport file remains authorization-posture
restore of a V1 Scholar table present at `d195ba8`.

---

## 10. Agent report

**Implemented:** TLS fail-closed Client config; advisory-lock abstraction;
three-source ledger/catalog/vendor reconciliation; expanded offline tests;
operator notes; this report.

**Files changed:** see §1.

**Architecture impact:** none to running systems. Tightens a still-disabled
staging restore tool.

**Tests:** targeted unit file only. No database tests. No apply.

**Security validation:** production/staging non-contact; live execute not
enabled; secrets redacted; named blockers addressed in code, not claimed
live-proven.

**Known risks:** see §7–§8. Working tree may still be 69 files; pin remains
git `d195ba8`.

**Remaining work:** independent re-review; written apply authorization;
live catalog; separately authorized live connector + lock; post-restore
catalog; later eligible proposed SQL.

**Confirmation:** no database was opened or changed.

**Final status:** **A. CORRECTIONS IMPLEMENTED — OFFLINE TESTS PASS**
