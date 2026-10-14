# SHERIVS-STAGING-MIGRATION-RUNNER-001

**Mission ID:** SHERIVS-STAGING-MIGRATION-RUNNER-001
**Mission class:** IMPLEMENT STAGING-ONLY MIGRATION RUNNER WITH OFFLINE TESTS
**Version target:** ACTIVE-V1 ONLY
**Timestamp (UTC):** 2026-10-14T20:14:21Z
**Role:** Principal Database Infrastructure Engineer / PostgreSQL Migration Engineer / Production Safety Architect

**Final status:** **A. RUNNER IMPLEMENTED — OFFLINE TESTS PASS; LIVE EXECUTION NOT PERFORMED**

This mission implemented a dedicated fail-closed staging-only runner for the
approved 71-file Scholar baseline. It did **not** open a database, apply
migrations, restore staging, or close SHERIVS-001 / 002 / 003.

---

## 0. Non-contact and source mismatch

- **No database was opened.** No Postgres session, pooler session, or
  Supabase Management API query ran.
- **No SQL was executed against a server.** Mock connectors used in tests
  never set `allowNetwork`.
- **CLI execute was not invoked.** `node …/cli.mjs --mode=manifest` ran
  (git object verification only).
- Production (`nwrflbpbhyiqdptmlccm`) and staging (`dvxszhracsjwdancijdc`)
  were unchanged.
- Canonical migration files were not modified.
- `scripts/db-apply.mjs` and production-default apply scripts were not
  modified.

**Working-tree mismatch (documented, not silently repaired):**

| Item | Value |
|------|-------|
| Inspection branch | `cursor/sherivs-staging-migration-runner-9668` |
| Working-tree migration tree | `a104d5e34f0f4020ffe0d6e36b97cc444459c3f2` (**69** files) |
| Pinned restore commit | `d195ba861f80379b79533126653b9cee82a8e872` |
| Pinned restore tree | `bbd828951e166662bbe831fd74972e1a15488468` (**71** files) |
| Files missing from working tree | `20261008000050_coregrid_organization_memberships.sql`, `20261008000060_organization_onboarding.sql` |

The runner **loads migration bytes from the pinned Git commit**, not from
the unmatched working tree. It does not switch branches.

---

## 1. Deliverables

| Item | Path |
|------|------|
| CLI | `scripts/staging/sherivs-restore/cli.mjs` |
| Orchestrator | `scripts/staging/sherivs-restore/runner.mjs` |
| Pinned manifest | `scripts/staging/sherivs-restore/approved-manifest.json` |
| Source / target / TLS / ledger / connect | `scripts/staging/sherivs-restore/*.mjs` |
| Operator notes | `scripts/staging/sherivs-restore/README.md` |
| Offline tests | `tests/unit/sherivs-staging-migration-runner.test.ts` |
| This report | `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-001.md` |

Input report consumed (not modified):
`docs/security/rls-prep/SHERIVS-STAGING-RESTORE-INDEPENDENT-REVIEW-001.md`.

---

## 2. Implemented behavior

### 2.1 Source and manifest

- Pins commit `d195ba8…` and tree `bbd82895…`.
- Verifies count **71**, lexicographic order, per-file sha256.
- Rejects missing, additional, duplicate, reordered, or checksum-changed files.
- Requires transport pair
  `20261002000014_coregrid_v2_transport_buses_rls.sql` **before**
  `20261003000041_coregrid_transport_bus_reads.sql`.
- Refuses `*.sql.proposed`.
- Wrong commit / wrong tree fail closed.

### 2.2 Target isolation

- Reads only `STAGING_DATABASE_URL` and/or `SHERIVS_RLS_STAGING_URL`.
- Positively requires project ref `dvxszhracsjwdancijdc` in hostname
  (`db.dvxszhracsjwdancijdc.supabase.co`) or pooler username
  (`postgres.dvxszhracsjwdancijdc` @ `*.pooler.supabase.com`).
- Rejects `nwrflbpbhyiqdptmlccm` and production host markers.
- Refuses to start if `DATABASE_URL`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, or
  `SUPABASE_PROJECT_ID` is set. No fallback.
- Disagreeing staging URL names fail closed.
- A fixture/synthetic URL is not treated as live staging identity
  (`liveIdentity` is true only for allowlisted direct/pooler hosts).

### 2.3 TLS

- Requires `rejectUnauthorized: true`.
- Requires pinned CA via `COREGRID_DB_CA_CERT` or `STAGING_DB_CA_CERT`.
- Refuses `COREGRID_DB_INSECURE_TLS=1`.
- Refuses `sslmode=disable` / `ssl=false`.
- Does not call `scripts/lib/pg-ssl.mjs` (that helper still has insecure
  escapes for other scripts).

### 2.4 Per-migration connection isolation

- One connection per migration file; overlapping connections are refused.
- Connection is closed in `finally` before the next file starts.
- Migration **#23** (`20260707225659_…`) contains
  `SET statement_timeout = '0'`. Isolation is by new connection, not by
  relying on RESET in a reused session.

### 2.5 Ledger and failure handling

Table `supabase_migrations.sherivs_staging_ledger` records filename,
checksum, source commit, manifest id, status, timestamps, attempt id,
redacted error, transaction outcome, reconciliation flag.

On success, timestamp prefix is also inserted into
`supabase_migrations.schema_migrations(version)` so a later **correctly
linked** Supabase CLI does not replay non-idempotent files.

**Why this does not conflict with Supabase conventions:** the CLI table
name is unchanged. The restore ledger is an additional table in the same
schema. `supabase db push` is still refused while `config.toml` names
production.

**Atomicity and failure window:**

1. STARTED is committed on its own connection **before** apply SQL.
2. Apply SQL + `schema_migrations` insert + SUCCEEDED update share one
   transaction on a **new** connection. Succeeded is not recorded before
   that commit.
3. On apply error: ROLLBACK of (2), then FAILED on a third connection.
4. Crash between (1) and (3) leaves STARTED with no completion →
   continuation refused (reconciliation required).
5. Partial success prefix is **not** auto-resumed.
6. Failed / checksum-mismatched / wrong-commit success rows block
   continuation. No automatic retry.

### 2.6 Modes and authorization

| Mode | Connects? | Purpose |
|------|-----------|---------|
| `manifest` | No | Git pin + 71 checksums |
| `offline` | No | Source + target parse + TLS + ledger state |
| `preflight` | No by default | Same as offline; catalog = **NOT_CHECKED** |
| `execute` | Only if a live connector is injected | Apply |

Execute requires **all** of:

- `--confirm-staging-ref=dvxszhracsjwdancijdc`
- `--confirm-source-commit=d195ba861f80379b79533126653b9cee82a8e872`
- `--i-authorize-staging-restore`

The CLI **still does not construct a `pg` client**. Credentials alone
never start apply. This process did not inject a live connector.

### 2.7 Logging

Structured JSON. Passwords, URLs with credentials, tokens, and CA PEM are
redacted. The logger refuses to emit an unredacted credentialed URL.

---

## 3. Evidence classes

### 3.1 Implemented (code on this branch)

All of §2 exists in `scripts/staging/sherivs-restore/`.

### 3.2 Statically reviewed

- `#23` SQL contains session `SET statement_timeout = '0'` (git bytes at
  `d195ba8`).
- `db-apply.mjs` still uses `DATABASE_URL` and was **not** changed.
- `apply-canonical-hardening.mjs` still SKIPs `00014`; not used here.

### 3.3 Offline-tested

`npx vitest run tests/unit/sherivs-staging-migration-runner.test.ts`
→ **34 passed**, including the 24 required cases plus:

- `sslmode=disable` refused
- pooler user pin
- disagreeing staging URLs
- catalog NOT_CHECKED
- working-tree 69 vs git 71
- `#23` GUC detection
- partial prefix not auto-resumed
- CLI manifest mode
- overlapping connections refused

`node scripts/staging/sherivs-restore/cli.mjs --mode=manifest` →
`manifest_ok` count 71, tree `bbd82895…`.

### 3.4 Requires future live staging validation

- Hostname actually reachable (IPv6 direct vs IPv4 pooler).
- Pinned CA matches the live server certificate.
- `CREATE SCHEMA` / ledger DDL on empty staging.
- Vendor `pgcrypto`, `uuid-ossp`, `supabase_realtime`.
- Fresh emptiness catalog (GATE4 is historical).
- 71-file apply transaction behavior on PostgreSQL 17 (simple-query vs
  `DO` blocks).
- `schema_migrations` column shape if the vendor table already exists
  with a different definition.

**Not done in this mission.** Catalog remains `NOT_CHECKED`.

---

## 4. Remaining security risks

- Canonical 71-file restore still **reintroduces** SHERIVS-001 / 002 / 003.
  Those findings remain **OPEN**.
- A future operator could still run `scripts/db-apply.mjs` or mgmt scripts
  against production; those scripts were not deleted.
- Live connector code exists in `connect.mjs` behind `allowNetwork`. Abuse
  requires a later process that opts in. CLI does not opt in.
- Ledger STARTED-without-completion is a documented crash window.
- `#59` rollback SQL remains a security regression if used as undo; this
  runner does not apply rollbacks.

---

## 5. Recovery limitations

- The 71-file set is not one transaction.
- Default recovery after partial failure: **recreate staging**, then a new
  authorized run. Resume is not automatic.
- Companion rollback files are not an apply path.
- Operator snapshots / PITR were not verified.

---

## 6. Required human approvals (still)

Before any live execute:

1. Written authorization naming staging ref, Git pin, OPTION A, and
   acceptance of OPEN RLS findings.
2. Independent review of this runner implementation.
3. Fresh read-only staging catalog (identity + emptiness + extensions).
4. A later process that injects a live connector after (1)–(3).
5. Post-restore catalog mission. Restore is not self-certifying.
6. Proposed SQL remains excluded until a separate remediation authorization.

This document is **not** that authorization.

---

## 7. Prior named blockers — status after this mission

| Prior blocker | After this mission |
|---------------|--------------------|
| No staging-only runner | **Implemented, offline-tested.** Live apply still unauthorized |
| Fresh staging preflight | **Still required.** Offline preflight records NOT_CHECKED |
| History mechanism undesigned | **Designed and unit-tested.** Not applied to a live database |
| Session isolation | **Implemented** (new connection per file). Not live-proven |
| Written human authorization | **Still required** |
| Harness insufficient / absent from `d195ba8` | **Replaced for this runner** by positive staging pin + unprefixed refusal. Old harness not copied onto `master` |

---

## 8. Explicit confirmation

- Authoritative source pin verified: commit `d195ba8`, tree `bbd82895`, 71 files.
- Transport pair included in the pinned manifest in the correct order.
- Proposed SQL excluded.
- No database was opened.
- No migration was applied.
- Staging schema has **not** been restored.
- SHERIVS-001, SHERIVS-002, and SHERIVS-003 remain **OPEN**.
- The runner was **not** executed in migration mode.
- Live execution remains blocked until human authorization and a live
  preflight.

---

## 9. Agent report

**Implemented:** dedicated staging-only 71-file runner with offline tests
and documentation.

**Files changed:** `scripts/staging/sherivs-restore/*`,
`tests/unit/sherivs-staging-migration-runner.test.ts`,
`scripts/README.md`,
`docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-001.md`.

**Architecture impact:** none to running systems. Adds a fail-closed
operator tool that must not be confused with `db-apply.mjs`.

**Tests:** 34/34 offline unit tests passed. Manifest CLI ok. No database
tests. No apply.

**Security validation:** production/staging non-contact; unprefixed URL
refusal; production ref refusal; TLS insecure paths refused; secrets
redacted; execute authorization flags required; live connector not
constructed.

**Known risks:** see §4. Working tree remains 69 files; pin is git
`d195ba8`.

**Remaining work:** independent review of this runner; written apply
authorization; live catalog preflight; separately authorized execute;
post-restore catalog; later eligible proposed SQL.

**Final status:** **A. RUNNER IMPLEMENTED — OFFLINE TESTS PASS; LIVE EXECUTION NOT PERFORMED**
