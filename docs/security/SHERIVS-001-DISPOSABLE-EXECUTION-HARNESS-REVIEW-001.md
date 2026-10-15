# SHERIVS-001-DISPOSABLE-EXECUTION-HARNESS-REVIEW-001

**Mission ID:** SHERIVS-001-DISPOSABLE-EXECUTION-HARNESS-REVIEW-001  
**Mission class:** Critical database security / pre-execution assurance  
**Engineering mode:** Evidence-first, fail-closed, repository-bound, non-production  
**Version-target classification:** ACTIVE-V1 identity verification only. No V2/V3 work.  
**Verification date:** 2026-10-15  
**Final verdict:** **PASS WITH CONDITIONS**

This is a **harness review**, not a database-security verification. SHERIVS-001 remains **OPEN**. The proposed identity-freeze SQL was **not executed**. No database was accessed. PostgreSQL behavior was **not** tested.

A passing harness review does not mean the identity-freeze migration is verified.

---

## 1. Executive verdict

The disposable qualifier is connection-free and, after the previous mission’s host-override correction, fail-closed on the URL forms that node-pg would retarget. It is **not** permission to run SQL.

No execution helper existed at inspection. This mission added a **pre-execution** disposable harness that:

- uses only `SHERIVS_DISPOSABLE_DATABASE_URL`
- calls the shared qualifier, then re-qualifies before any future connect decision
- refuses `DATABASE_URL` and other live/unscoped URL variables
- pins the two `*.sql.proposed` files by SHA-256
- requires a separate authorization value **and** matching SHA
- keeps `DISPOSABLE_LIVE_EXECUTE_ENABLED = false`
- does not import `pg`, does not connect, and does not implement SQL apply

Named conditions remain: live apply is disabled; loopback is not proof against tunnels; the shared inspect qualifier still has a fallback URL chain that the harness does not use; transaction semantics are still unmeasured on PostgreSQL.

---

## 2. Current branch and HEAD

Verified at inspection before this branch was created:

| Item | Value |
|---|---|
| Inspection branch | `cursor/sherivs-001-external-isolated-db-verify-d80b` |
| Inspection HEAD | `4df714122063e6e9c18d9e91ff7c6d7a3eb476bb` (confirmed) |
| Working tree at inspection | clean |
| This mission branch | `cursor/sherivs-001-disposable-exec-harness-d80b` |
| Harness commit | `f527893c7325f29acbc0832f26543c09a67dccb9` |
| Proposed SQL | `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` |
| Proposed SHA-256 | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (confirmed; **unchanged**) |
| Rollback SHA-256 | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` (confirmed; **unchanged**) |
| Pin | 71 files, `PINNED_SOURCE_COMMIT = d195ba861f80379b79533126653b9cee82a8e872` |
| Production ref | `nwrflbpbhyiqdptmlccm` |
| Staging ref | `dvxszhracsjwdancijdc` |

Proposed SQL bytes were not modified.

---

## 3. Qualifier review

Inspected: `scripts/lib/sherivs-disposable-pg.mjs`, `scripts/sherivs-001-qualify-disposable-pg.mjs`, `tests/unit/sherivs-disposable-pg.test.ts`, `scripts/lib/sherivs-db-target.mjs`, `node_modules/pg-connection-string/index.js`.

| Requirement | Result |
|---|---|
| Parses PostgreSQL URLs via WHATWG `URL` | **Yes.** `postgres` / `postgresql` only. |
| Rejects `host` / `hostaddr` / `port` query overrides | **Yes.** Case-insensitive; even loopback-valued overrides refused. |
| Requires explicit port | **Yes.** `1..65535`. |
| Rejects malformed / keyword=value / unix-socket empty host | **Yes.** No regex host salvage. |
| Rejects production / staging project refs | **Yes.** Whole-string scan plus hosted hostname patterns. |
| Rejects unscoped `DATABASE_URL` while live URL vars are present | **Yes**, in the **shared inspect qualifier**. |
| IPv4 `127.0.0.1` and IPv6 `[::1]` | **Yes.** `localhost` also allowed. |
| Avoids leaking credentials | **Yes.** No raw URL/userinfo in results; CLI tests assert fixture password absent. |
| Fails closed on unexpected URL forms | **Yes** for aliases (`localhost.`, `127.0.0.2`, `0.0.0.0`, IPv4-mapped). |
| Lifecycle contract | **Yes.** `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`. `NODE_ENV` is not proof. |
| Loopback ≠ no tunnel | **Documented.** Attestation is not cryptographic. |
| Does not connect during qualification | **Yes.** No `pg` import. `connects: false`. |

**Qualifier residual (not used by the harness execute plan):**

- Inspect candidate chain still includes `LOCAL_DATABASE_URL`, `DEVELOPMENT_DATABASE_URL`, and `DATABASE_URL`. A loopback `DATABASE_URL` with no staging/production URL variables can still inspect-qualify. That is acceptable only as an isolation **check**, not as an apply target.
- `localhost` can theoretically resolve off-loopback; prefer `127.0.0.1` / `[::1]`.
- `PGHOST` / `PGHOSTADDR` / `PGPORT` are not inspected (qualifier never connects).
- Unit tests are not live-target proof.

No additional qualifier code change was required for this review. The harness **does not** consume that fallback chain.

---

## 4. Execution-harness review

**At inspection:** no disposable execution helper existed.

**Prepared (not live-enabled):**

- `scripts/lib/sherivs-disposable-exec.mjs`
- `scripts/sherivs-001-disposable-exec.mjs`
- `tests/unit/sherivs-disposable-exec.test.ts`

| Gate | Implementation |
|---|---|
| A. Explicit disposable target | `SHERIVS_DATABASE_TARGET=development` via shared qualifier. |
| B. Shared qualification before connect decision | `qualifyDisposablePostgres` on a sanitized env containing only target, lifecycle, and `SHERIVS_DISPOSABLE_DATABASE_URL`. |
| C. Reject production/staging refs | Shared classifier + refuse `SUPABASE_URL` / `STAGING_SUPABASE_URL` when they contain known refs. |
| D. Never fall back to `DATABASE_URL` | Presence of `DATABASE_URL` (and other forbidden URL names) **fails** the harness. The sanitized qualifier env omits them. |
| E. Never log credentials | Plan JSON has host/port/protocol only. Reasons pass `redactSecrets`. CLI tests forbid fixture userinfo. |
| F. Narrow operation allowlist | `inspect`, `apply-proposed-freeze`, `apply-proposed-rollback`. Unknown operations refused. |
| G. No arbitrary SQL from env | `SHERIVS_DISPOSABLE_SQL`, `MIGRATION_SQL`, `SQL` refused if set. |
| H. No migrations-directory scan | Exact pinned relative paths. No `readdirSync`. |
| I. Re-qualify immediately | Second `qualifyDisposablePostgres` call; endpoints must match. |
| J. Cleanup only disposable | No live apply; no teardown of shared environments. Future connect must `client.end()` in `finally` when implemented. |
| K. Fail closed on unexpected target/lifecycle | Shared qualifier + forbidden-env gates. |
| L. Qualification ≠ execute permission | Inspect of a qualified URL leaves `authorized: false`. Apply without `SHERIVS_DISPOSABLE_EXECUTE=I-AUTHORIZE-DISPOSABLE-APPLY` is `DISPOSABLE_EXECUTE_NOT_AUTHORIZED`. |
| M. Separate authorization before security-critical SQL | Authorization value **and** `SHERIVS_DISPOSABLE_EXECUTE_SHA256` equal to the pinned file hash. Live apply still disabled. |

`DISPOSABLE_LIVE_EXECUTE_ENABLED` is `false`. `runDisposableExecution` never calls a connect factory, never imports `pg`, and sets `executedSql: false`. A synthetic `decide()` plan with every gate true still cannot apply SQL through `run()`.

This follows the staging restore CLI pattern (`LIVE_EXECUTE_NOT_ENABLED` even after confirmation flags).

**Not used (and must not be used) for this file:**

- `scripts/db-apply.mjs` — applies every `*.sql`; uses `requirePostgresTarget()` / `DATABASE_URL`; would connect.
- `scripts/db-apply-one.mjs` — `DATABASE_URL` fallback; selects `endsWith(".sql")` so it **does not** see `*.sql.proposed` today; if the file were renamed, it could apply it without the disposable qualifier.
- `scripts/staging/sherivs-restore/runner.mjs` — staging-only; outer `BEGIN`; ledger insert; `*.sql.proposed` excluded; execute still `LIVE_EXECUTE_NOT_ENABLED`. Bypassing it is required **only** because this file is proposed, not pinned, and its inner `COMMIT` is incompatible with the runner wrap. That is not a license to target staging/production.

---

## 5. Transaction-contract analysis

Inspected actual code, not historical description.

### 5.1 Proposed forward file

`BEGIN;` then helper replacements and trigger install then `COMMIT;`. Statements are transactional. No `CREATE INDEX CONCURRENTLY` / `VACUUM`. No `EXCEPTION WHEN OTHERS`. Unchanged SHA-256 as above.

Rollback file: same `BEGIN`/`COMMIT` shape; restores `20260620151525` helper bodies and drops the trigger.

### 5.2 `scripts/db-apply-one.mjs`

- `requirePostgresTarget()` then `client.query(sql)` with **no** pre-wrap.
- Honors file `BEGIN`/`COMMIT` **if** used.
- File filter: `endsWith(".sql")` **excludes** `*.sql.proposed`.
- Uses unscoped `DATABASE_URL` for development. **Not** a disposable harness.

### 5.3 `scripts/db-apply.mjs`

- Same target helper; **every** `*.sql` in order on one connection.
- Forbidden for this proposed file and for disposable verification.

### 5.4 `scripts/staging/sherivs-restore/runner.mjs`

```
BEGIN
  query(sql)
  INSERT ledger schema_migrations
  markSucceededInTransaction
COMMIT
```

Inner `COMMIT` in the proposal would close the outer transaction before the ledger insert. `inspectWorkingTree` filters `*.sql` and excludes `*.sql.proposed`. `verifyLoadedFiles` fails `PROPOSED_SQL_EXCLUDED`. Execute mode remains `LIVE_EXECUTE_NOT_ENABLED`.

### 5.5 Recommendation for the eventual test path

1. Do not modify the proposed migration merely to satisfy the runner.
2. Do not promote it into the 71-file pin in this mission.
3. Do not use `runner.mjs`, `db-apply.mjs`, or `db-apply-one.mjs`.
4. Future disposable apply (separate mission, after `DISPOSABLE_LIVE_EXECUTE_ENABLED` is reviewed) must:  
   `assert` harness gates → injected loopback-only factory → `client.query(entireFile)` with **no** outer `BEGIN` → `client.end()`.
5. Controlled failure (Test 10) uses a disposable-only copy with a deliberate error after helpers and before `CREATE TRIGGER`; it must not be committed to git.
6. Optional labeled demonstration of runner incompatibility (outer `BEGIN` + file `COMMIT`) only on a disposable instance that will be destroyed.

Runtime of this contract: **NOT EXECUTED**.

---

## 6. Security test plan

Specified for a future qualified local Supabase/PostgREST environment. **Not executed here.** Direct `SET ROLE` is simulation and must be labeled; it does not satisfy tests that require PostgREST.

Shared fixtures (after qualifier CLI exit 0 **and** harness inspect `qualified: true` with live URL vars unset): synthetic school A/B, user U-self (JWT `authenticated`), U-peer, U-admin, local service-role key. Cleanup: delete synthetic rows; destroy the disposable instance.

| # | Test | Service | Context | Setup | Expected | Evidence | Cleanup | PG vs PostgREST |
|---|---|---|---|---|---|---|---|---|
| 1 | Self-update `role` | Auth + PostgREST + PG | User JWT `PATCH /users?id=eq.<self>` `{role:admin}` | Apply freeze via future harness | 4xx; exception self-privilege; row unchanged | HTTP status/body; `SELECT role` | Restore if needed | **PostgREST required** |
| 2 | Self-update `school_id` | Auth + PostgREST + PG | User JWT PATCH `{school_id:B}` | Same | Rejected; school remains A | HTTP; before/after | Shared | **PostgREST required** |
| 3 | Self-update `is_active` | Auth + PostgREST + PG | User JWT PATCH `{is_active:false}` | Same | Rejected | HTTP; before/after | Shared | **PostgREST required** |
| 4 | Permitted profile update | Auth + PostgREST + PG | User JWT PATCH non-privileged column | Confirm live grants first | Success; privileged columns unchanged | HTTP 2xx; column diffs | Revert profile | **PostgREST required** |
| 5 | Legitimate provisioning | Auth + PostgREST + PG | Local service-role upsert of U-new; optional U-admin other-row update | Test 7 measured first | Service-role succeeds only if `current_user=service_role`; admin other-row still subject to RLS | HTTP; row; Test 7 probe | Delete U-new | **PostgREST required** (psql `SET ROLE` is not this test) |
| 6 | Protected update, no JWT `sub` | PostgREST + PG | Anon/missing sub PATCH of privileged columns; optional labeled SQL simulation | Freeze installed | Untrusted-context exception; no trust from `auth.uid() IS NULL` | HTTP/SQLSTATE; row | Shared | PostgREST for real path; SQL simulation labeled |
| 7 | Service-role via real PostgREST | PostgREST + Auth | HTTP with **local** service-role `apikey` + `Authorization`; probe `current_user`, `session_user`, `auth.uid()` inside INVOKER | Qualified local stack | **Measure, do not assume.** Hypothesis: `current_user=service_role`, `session_user=authenticator`. If not, stop; do not widen the exception | Probe from that HTTP request | Drop probe objects | **PostgREST required** |
| 8 | SECURITY DEFINER | PG + PostgREST | (1) throwaway DEFINER wrapper UPDATE; (2) inactive user helper RPCs | INVOKER trigger; DEFINER helpers | (1) non-`service_role` DEFINER fails closed; (2) inactive helpers NULL/false | Exception; helper returns; `current_user` in trigger | Drop wrapper | (1) PG; (2) PostgREST+Auth |
| 9 | Trigger bypass | PG + PostgREST | DISABLE TRIGGER as `authenticated`; view/function UPDATE; owner DISABLE; INSERT as U-self | Freeze installed | Ordinary caller cannot disable; INSERT is **not** covered (residual); owner disable is DBA | SQLSTATE; INSERT result | Re-enable trigger | Mixed |
| 10 | Controlled txn failure | PG | Disposable helper submits a disposable **copy** that fails after helpers / before trigger; no outer wrap | Snapshot | Helpers unchanged; trigger absent | `pg_proc` / `pg_trigger` | Restore snapshot; destroy instance | PostgreSQL only |

---

## 7. Identified defects

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| H-0 | n/a | No execution helper existed | Harness added, live apply disabled |
| Q-fallback | Condition | Shared inspect qualifier still accepts `DATABASE_URL` as last candidate | Harness refuses those names; qualifier left unchanged |
| H-live | Condition | SQL apply not implemented; flag false | Intentional pre-execution control |
| Q-tunnel | Condition | Loopback + attestation cannot detect SSH tunnels | Documented; ownership evidence required at runtime |
| T-runtime | Condition | File `BEGIN`/`COMMIT` vs runner wrap unmeasured on PostgreSQL | Future Test 10; do not change the proposal for the runner |
| R-rename | Residual | Renaming `*.sql.proposed` to `*.sql` would expose `db-apply-one` | Do not rename; do not use that tool |

No critical fail-open in the new harness: qualification cannot apply SQL; `DATABASE_URL` cannot be the apply target; directory-wide apply is impossible through this helper.

---

## 8. Exact files changed

- `scripts/lib/sherivs-disposable-exec.mjs`
- `scripts/sherivs-001-disposable-exec.mjs`
- `tests/unit/sherivs-disposable-exec.test.ts`
- `docs/security/SHERIVS-001-DISPOSABLE-EXECUTION-HARNESS-REVIEW-001.md`

Proposed SQL, rollback, runner, `db-apply*.mjs`, and the shared qualifier **not** modified.

---

## 9. Offline test results

Commands:

```
npx vitest run \
  tests/unit/sherivs-disposable-exec.test.ts \
  tests/unit/sherivs-disposable-pg.test.ts \
  tests/unit/sherivs-sql-comment-strip.test.ts \
  tests/unit/sherivs-001-identity-privilege.test.ts \
  tests/unit/sherivs-db-target.test.ts \
  tests/unit/sherivs-staging-migration-runner.test.ts \
  tests/unit/security-role-gate.test.ts
```

| File | Passed | Failed |
|---|---|---|
| `sherivs-disposable-exec.test.ts` | 16 | 0 |
| `sherivs-disposable-pg.test.ts` | 26 | 0 |
| `sherivs-sql-comment-strip.test.ts` | 10 | 0 |
| `sherivs-001-identity-privilege.test.ts` | 54 | 0 |
| `sherivs-db-target.test.ts` | 23 | 0 |
| `sherivs-staging-migration-runner.test.ts` | 108 | 0 |
| `security-role-gate.test.ts` | 27 | 0 |
| **Total** | **264** | **0** |

`VITEST_EXIT:0`. Summary: `/opt/cursor/artifacts/sherivs-001-harness-offline-summary.log`.

These are **not** PostgreSQL results. Integration tests were **not** run.

Harness CLI inspect in this pod (no connect): exit **0** (pinned SHA-256 values match on disk), `qualified: false`, `authorized: false`, `connected: false`, `executedSql: false`, `code: DISPOSABLE_URL_MISSING`. Sanitized JSON: `/opt/cursor/artifacts/sherivs-001-harness-inspect.sanitized.json`.

---

## 10. Live-resource and SQL-execution declarations

**No database was accessed.**  
No production connection. No staging connection. No remote probing. No `pg.Client.connect`. No `psql`. No use of `DATABASE_URL` as a connection target. No credential values printed. No infrastructure install. No deploy or DNS change.

**No SQL was executed.**  
The proposed identity-freeze SQL was not applied. The rollback proposed SQL was not applied. The harness apply path is disabled.

---

## 11. Conditions that must be satisfied before future execution

1. Separately authorized local Supabase (Postgres + Auth + PostgREST) the operator owns, with teardown evidence.
2. Unset `DATABASE_URL`, staging/production URL variables, and live project `SUPABASE_URL` values in that shell.
3. `SHERIVS_DATABASE_TARGET=development`
4. `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`
5. `SHERIVS_DISPOSABLE_DATABASE_URL` loopback, explicit port, no host/port query overrides.
6. `node scripts/sherivs-001-qualify-disposable-pg.mjs` exits 0.
7. `node scripts/sherivs-001-disposable-exec.mjs --operation=inspect` reports `qualified: true`, SHA pins match, `connected: false`.
8. A **later reviewed change** enables live execute (or implements the connect path) only after this environment is real. That change must keep: no `DATABASE_URL`, no outer `BEGIN`, injected connector, SHA pin, explicit authorization.
9. Then Test 7 (PostgREST `current_user`) and Test 10 (rollback) before treating provisioning as verified.

Until step 6 succeeds, **stop**. Do not connect. Do not apply.

---

## 12. Single safest next action

Keep live execute disabled. In a separately authorized local Supabase environment, satisfy the inspect/qualify gates above. Do **not** flip `DISPOSABLE_LIVE_EXECUTE_ENABLED` from this pod, and do **not** apply `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` to staging or production.

---

## 13. Verdict statement

**PASS WITH CONDITIONS.**

The verification mechanism was reviewed and a refuse-by-default harness was added. Critical isolation/authorization fail-opens in that harness were not found. Live SQL apply remains disabled. SHERIVS-001 remains OPEN. The identity-freeze migration is **not** verified.
