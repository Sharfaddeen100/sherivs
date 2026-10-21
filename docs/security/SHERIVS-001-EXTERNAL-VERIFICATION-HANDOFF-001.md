# SHERIVS-001-EXTERNAL-VERIFICATION-HANDOFF-001

**Mission ID:** SHERIVS-001-EXTERNAL-VERIFICATION-HANDOFF-001  
**Mission class:** Critical security / controlled engineering handoff  
**Version-target classification:** ACTIVE-V1 identity verification only  
**Date:** 2026-10-16  
**Handoff verdict:** **PASS WITH CONDITIONS**  
**SHERIVS-001 status:** **OPEN** (this handoff does not close it)

This document transfers SHERIVS-001 verification to an authorized external development machine. It does **not** bootstrap this Cloud Agent pod. It does **not** authorize applying the identity-freeze SQL. No database was accessed. No SQL was executed.

---

## 1. Repository baseline (verified this mission)

| Item | Value |
|---|---|
| Root | `/workspace` |
| Inspection branch | `cursor/sherivs-001-operator-owned-supabase-bootstrap-d80b` |
| Inspection HEAD | `5f655d76cdc854a501aeab308df6e21577dbf999` (confirmed) |
| Working tree at inspection | clean |
| This handoff branch | `cursor/sherivs-001-external-verification-handoff-d80b` |
| Handoff commit | `1f8f8dcb42cd0790c0d3a7c22558ac7db2f6d4ce` |
| Offline-results commit | `d58054f0b56c98bf219adf225158e65dc4f85b5c` |
| Proposed SQL | `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` |
| Proposed SHA-256 | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (confirmed) |
| Rollback SHA-256 | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` |
| Trusted skip (source) | `current_user = 'service_role'` only; `auth.uid() IS NULL` is not trust |
| Live execute | `DISPOSABLE_LIVE_EXECUTE_ENABLED = false` |
| Production ref | `nwrflbpbhyiqdptmlccm` |
| Staging ref | `dvxszhracsjwdancijdc` |
| Staging pin | 71 files at `d195ba861f80379b79533126653b9cee82a8e872` |
| Working-tree canonical `*.sql` | 69 files (`*.sql.proposed` not loaded by a normal start) |

Do not invent replacements for the reports listed in §2.

---

## 2. Security findings and current status

Prior SHERIVS-001 reports (do not silently replace):

| Report | Verdict |
|---|---|
| `SHERIVS-001-IDENTITY-AND-PRIVILEGE-ESCALATION-HARDENING-001.md` | PASS WITH CONDITIONS |
| `SHERIVS-001-PROPOSED-SQL-INDEPENDENT-REVIEW-001.md` | PASS WITH CONDITIONS |
| `SHERIVS-001-PROPOSED-SQL-TRUSTED-ROLE-SKIP-AND-TRANSACTION-001.md` | PASS WITH CONDITIONS |
| `SHERIVS-001-TRUSTED-DATABASE-EXECUTION-CONTEXT-VERIFICATION-001.md` | BLOCKED |
| `SHERIVS-001-DISPOSABLE-POSTGRES-TRUST-BOUNDARY-VERIFICATION-001.md` | BLOCKED |
| `SHERIVS-001-EXTERNAL-ISOLATED-DATABASE-VERIFICATION-001.md` | BLOCKED |
| `SHERIVS-001-DISPOSABLE-EXECUTION-HARNESS-REVIEW-001.md` | PASS WITH CONDITIONS |
| `SHERIVS-001-LOCAL-SUPABASE-ENVIRONMENT-READINESS-001.md` | BLOCKED |
| `SHERIVS-001-OPERATOR-OWNED-SUPABASE-BOOTSTRAP-001.md` | BLOCKED |

**Qualifier / harness (reconfirmed, no connect):**

```
node scripts/sherivs-001-qualify-disposable-pg.mjs
→ exit 2, qualified=false, code=DISPOSABLE_PRODUCTION_REF, connects=false, candidate=DATABASE_URL

node scripts/sherivs-001-disposable-exec.mjs --operation=inspect
→ exit 0 (SHA pins match), qualified=false, connected=false, executedSql=false,
  liveExecuteEnabled=false, code=DISPOSABLE_URL_MISSING
```

**Production/staging exclusions:** known refs in URLs; hosted `*.supabase.co` / `*.supabase.com`; mixed shells (`DISPOSABLE_MIXED_URL_ENV`); harness forbids `DATABASE_URL` and other live URL names; staging runner excludes `*.sql.proposed` and stays `LIVE_EXECUTE_NOT_ENABLED`.

**Transaction-runner conflict:** file `BEGIN`/`COMMIT` vs `runner.mjs` outer wrap (see §6).

**Last offline unit suite on this lineage:** 266 passed, 0 failed, exit 0. Not PostgreSQL evidence.

### Unresolved security questions

1. Under a **real PostgREST** request with a **local** service-role key, is `current_user` equal to `service_role` when the INVOKER trigger runs?
2. What are `session_user` and `auth.uid()` on that same request?
3. Do Tests 1–10 pass on a qualified disposable stack after a reviewed apply?
4. Does file-level `BEGIN`/`COMMIT` roll back helper+trigger as one unit when submitted with **no** outer wrap?
5. (Must not be “resolved” by using `runner.mjs`.)

Do not widen `current_user = 'service_role'` without measuring (1).

---

## 3. External environment requirements

### A. Software

- Docker Engine **and** a working daemon (this pod has neither).
- Supabase CLI (`supabase start --workdir database/supabase` only after a **local** config that is not production-linked).
- Node.js (repo uses v22) and `npm install` for qualifier/harness CLIs.
- Do **not** `supabase link` or `supabase db push` to remote projects.

### B. Local services

- PostgreSQL with roles `authenticator`, `anon`, `authenticated`, `service_role`.
- Supabase Auth (synthetic JWT mint).
- PostgREST (real `SET ROLE` / JWT GUC path). Plain `psql SET ROLE` is simulation.

### C. Isolation

- No production/staging credentials, JWTs, or service-role keys in the test shell.
- No remote project linking.
- Synthetic users and **local-only** keys.
- Bind API/DB to `127.0.0.1` (prefer IP over `localhost`). Do not publish 54321/54322 publicly.
- Disposable lifecycle with recorded create/teardown.
- Verify the target **before** any connect.
- Loopback is not proof against an SSH tunnel.

**Do not reuse** `database/supabase/config.toml` `project_id = nwrflbpbhyiqdptmlccm` as an execution default. Propose a separate local config (example only, not applied here):

```toml
project_id = "sherivs-001-disposable-local"
[api]
enabled = true
port = 54321
bind_addr = "127.0.0.1"
[db]
port = 54322
```

---

## 4. Qualification checklist

Unset live URL variables in the **test process** (`DATABASE_URL`, `STAGING_DATABASE_URL`, `PRODUCTION_DATABASE_URL`, `SHERIVS_RLS_STAGING_URL`, live `SUPABASE_URL`). Do not print values.

Then set (values not shown):

1. `SHERIVS_DATABASE_TARGET=development`
2. `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`
3. `SHERIVS_DISPOSABLE_DATABASE_URL` → loopback, **explicit port**, no `?host=` / `?hostaddr=` / `?port=`

Gates:

- [ ] `node scripts/sherivs-001-qualify-disposable-pg.mjs` exits **0**, `qualified: true`, `connects: false`, no production/staging refs.
- [ ] `node scripts/sherivs-001-disposable-exec.mjs --operation=inspect` → `qualified: true`, `connected: false`, `executedSql: false`, SHA pins match.
- [ ] Candidate is `SHERIVS_DISPOSABLE_DATABASE_URL` only (no `DATABASE_URL` fallback in the harness).
- [ ] Qualification is **not** permission to execute. Leave `DISPOSABLE_LIVE_EXECUTE_ENABLED=false` until a later reviewed change.

This pod **fails** the checklist today.

---

## 5. Runtime security test matrix

**Do not run these until §4 passes and a later mission enables a reviewed apply.** Status now: **NOT EXECUTED**.

| # | Test | Services | Expected | Evidence |
|---|---|---|---|---|
| 1 | Self-update `role` | Auth+PostgREST+PG | Reject | HTTP; row |
| 2 | Self-update `school_id` | Auth+PostgREST+PG | Reject | HTTP; row |
| 3 | Self-update `is_active` | Auth+PostgREST+PG | Reject | HTTP; row |
| 4 | Permitted profile field | Auth+PostgREST+PG | Allow; privileged columns unchanged | HTTP; diffs |
| 5 | Authorized provisioning | PostgREST service-role | Allow only after Test 7 measures `current_user` | HTTP; row |
| 6 | Missing JWT `sub` | PostgREST | Untrusted-context exception | HTTP/SQLSTATE |
| 7 | Real PostgREST service-role | PostgREST+Auth | **Measure** `current_user` / `session_user` / `auth.uid()` | Probe from that HTTP request |
| 8 | SECURITY DEFINER | PG (+ PostgREST helpers) | INVOKER sees caller; inactive helpers fail closed | Exception; returns |
| 9 | Trigger bypass | PG+PostgREST | Ordinary caller cannot DISABLE TRIGGER | SQLSTATE |
| 10 | Transaction rollback | PG via harness, **no** outer wrap | Helpers+trigger abort together | `pg_proc` / `pg_trigger` |

Required evidence for Test 7: actual `current_user`, `session_user`, `auth.uid()`, execution path/role, tool versions. Do not label `SET ROLE` as PostgREST.

Cleanup: delete synthetic users/rows; destroy the disposable instance. Do not prune unrelated Docker volumes.

---

## 6. Transaction-runner issue

The proposed file wraps DDL in `BEGIN;` … `COMMIT;`.

| Path | Behavior | For this file |
|---|---|---|
| File itself | Inner `BEGIN`/`COMMIT`; no `CONCURRENTLY`/`VACUUM` | Intended boundary |
| `db-apply-one.mjs` | `client.query(sql)` **no** pre-wrap; uses `DATABASE_URL` for development; `endsWith(".sql")` **excludes** `*.sql.proposed` | Do **not** use |
| `db-apply.mjs` | Every `*.sql`, no pre-wrap | Do **not** use |
| `runner.mjs` | Outer `BEGIN` → `query(sql)` → ledger `INSERT` → `COMMIT` | Inner `COMMIT` **closes the outer transaction before the ledger write**. File is `*.sql.proposed` and excluded. Do **not** use |
| Disposable harness | Apply **not implemented**; `DISPOSABLE_WRAPS_OUTER_TRANSACTION=false` | Inspect only until live execute is reviewed |

**Do not** strip `BEGIN`/`COMMIT` from the proposal in the same change as an untested runner wrap. **Do not** bypass production/staging guards to “make it apply.” Future apply: harness + injected loopback connector + whole-file `query` + no outer `BEGIN`, after SHA pin + explicit authorization.

Runtime of this contract: **NOT EXECUTED**.

---

## 7. Known limitations

- This Cloud Agent pod cannot host Docker/Supabase/PostgreSQL. Do not retry bootstrap here.
- Unscoped `DATABASE_URL` in this pod is a hosted production pooler; classified, **not connected**.
- Qualifier inspect still has a last-candidate `DATABASE_URL` path; harness refuses that name.
- Loopback + lifecycle attestation does not detect tunnels.
- `localhost` is an exact hostname allowlist; prefer `127.0.0.1`.
- 69 working-tree SQL files ≠ 71-file staging pin.
- Offline 266 tests are not PostgreSQL/PostgREST results.
- Proposed SQL unapplied.

---

## 8. Exact files changed

- `docs/security/SHERIVS-001-EXTERNAL-VERIFICATION-HANDOFF-001.md`

Proposed SQL, `config.toml`, harness live-execute flag, runners, and qualifier were **not** modified.

---

## 9. Offline test results

```
npx vitest run \
  tests/unit/sherivs-disposable-pg.test.ts \
  tests/unit/sherivs-disposable-exec.test.ts \
  tests/unit/sherivs-sql-comment-strip.test.ts \
  tests/unit/sherivs-001-identity-privilege.test.ts \
  tests/unit/sherivs-db-target.test.ts \
  tests/unit/sherivs-staging-migration-runner.test.ts \
  tests/unit/security-role-gate.test.ts
```

| File | Passed | Failed |
|---|---|---|
| `sherivs-disposable-pg.test.ts` | 28 | 0 |
| `sherivs-disposable-exec.test.ts` | 16 | 0 |
| `sherivs-sql-comment-strip.test.ts` | 10 | 0 |
| `sherivs-001-identity-privilege.test.ts` | 54 | 0 |
| `sherivs-db-target.test.ts` | 23 | 0 |
| `sherivs-staging-migration-runner.test.ts` | 108 | 0 |
| `security-role-gate.test.ts` | 27 | 0 |
| **Total** | **266** | **0** |

`VITEST_EXIT:0`. These are **not** PostgreSQL results. Qualifier/harness inspect results for this pod are in §2.

---

## 10. Declarations

**No database was accessed.**  
No production or staging connection. No remote probing. No Docker/Supabase start.

**No SQL was executed.**  
The proposed identity-freeze SQL remains unapplied. Live execute remains disabled.

---

## 11. Single safest next action

On an authorized **external** machine that already has Docker Engine and the Supabase CLI: create a loopback-only local stack (no `link`), unset live URL variables, satisfy §4, then open a **separate** reviewed mission to enable harness apply and run Tests 7 and 10. Do not apply `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` from this pod. Do not use `runner.mjs`.

---

## 12. Verdict statement

**PASS WITH CONDITIONS** for the handoff artifact.

The recipient has a complete, reviewable path. Conditions: this pod still cannot host services; live execute stays off; transaction contract is unmeasured; SHERIVS-001 remains OPEN. The identity freeze is **not** verified.
