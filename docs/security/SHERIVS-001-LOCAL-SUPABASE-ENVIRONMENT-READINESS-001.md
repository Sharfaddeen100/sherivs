# SHERIVS-001-LOCAL-SUPABASE-ENVIRONMENT-READINESS-001

**Mission ID:** SHERIVS-001-LOCAL-SUPABASE-ENVIRONMENT-READINESS-001  
**Mission class:** Critical security / local database environment readiness  
**Engineering mode:** Evidence-first, fail-closed, repository-bound, non-production  
**Version-target classification:** ACTIVE-V1 identity verification only. No V2/V3 work.  
**Verification date:** 2026-10-16  
**Final verdict:** **BLOCKED**

This is an **environment-readiness** report. It does **not** authorize applying the identity-freeze migration. Runtime PostgreSQL/PostgREST verification has **not** occurred. SHERIVS-001 remains **OPEN**.

No database was accessed. No SQL was executed. Live disposable execution remains disabled. This Cloud Agent pod cannot host the required local Supabase services.

---

## 1. Executive verdict

A reproducible path to a disposable local Supabase stack can be specified. That stack is **not** present here.

- `database/supabase/config.toml` is a five-line production `project_id` pin, not a local API/DB config.
- `database/README.md` documents `supabase start --workdir database/supabase` but this pod has no Supabase CLI, no Docker, no PostgreSQL, and no listeners on 54321/54322.
- `infrastructure/deploy/docker-compose.yml` is a production Scholar **app** image, not a database.
- The JS client `@supabase/supabase-js` is not a local stack.

A mixed-shell defect in the **inspect qualifier** was corrected: a loopback `SHERIVS_DISPOSABLE_DATABASE_URL` no longer qualifies while `DATABASE_URL` or staging/production URL variables remain set. The harness already refused those names. Live execute is still off.

---

## 2. Repository baseline

Verified at inspection on `cursor/sherivs-001-disposable-exec-harness-d80b` before this branch:

| Item | Value |
|---|---|
| Inspection HEAD | `505b94e4a50267728e12c2320cfa15091ceb154d` (confirmed) |
| Prior inspection baseline | `4df714122063e6e9c18d9e91ff7c6d7a3eb476bb` (ancestor; confirmed) |
| Working tree at inspection | clean |
| This mission branch | `cursor/sherivs-001-local-supabase-readiness-d80b` |
| Mixed-shell correction commit | `6ebd4a0d5dfcbe136211d4c5110eaef84cba4911` |
| Proposed SQL | `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` |
| Proposed SHA-256 | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (confirmed; **unchanged**) |
| Rollback SHA-256 | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` (confirmed; **unchanged**) |
| Staging pin | `PINNED_MIGRATION_COUNT = 71` at `PINNED_SOURCE_COMMIT = d195ba861f80379b79533126653b9cee82a8e872` |
| Current `migrations/*.sql` (canonical) | **69** files |
| Current proposed files | 1 |
| Production ref | `nwrflbpbhyiqdptmlccm` |
| Staging ref | `dvxszhracsjwdancijdc` |
| Node | v22.14.0 |

The working-tree canonical migration count (69) is **not** the 71-file staging pin. A local `supabase start` would load current `*.sql` files, would **not** load `*.sql.proposed`, and would **not** automatically equal the pinned restore set.

Proposed SQL bytes were not modified. `DISPOSABLE_LIVE_EXECUTE_ENABLED` remains `false`.

---

## 3. Qualifier and harness findings

Inspected without connecting:

- `scripts/lib/sherivs-disposable-pg.mjs`
- `scripts/sherivs-001-qualify-disposable-pg.mjs`
- `scripts/lib/sherivs-disposable-exec.mjs`
- `scripts/sherivs-001-disposable-exec.mjs`
- `tests/unit/sherivs-disposable-pg.test.ts`
- `tests/unit/sherivs-disposable-exec.test.ts`

| # | Question | Finding |
|---|---|---|
| A | Qualifier `DATABASE_URL` fallback? | **Yes, for inspect only.** Candidate order: `SHERIVS_DISPOSABLE_DATABASE_URL` → `LOCAL_DATABASE_URL` → `DEVELOPMENT_DATABASE_URL` → `DATABASE_URL`. The harness never uses that chain. |
| B | Can qualifier and harness select different targets? | **They could.** A loopback named disposable URL plus a still-set `DATABASE_URL` (including production) used to inspect-qualify. `db-apply-one.mjs` would then prefer `DATABASE_URL`. **Corrected:** mixed shells now fail `DISPOSABLE_MIXED_URL_ENV`. Harness already refused forbidden URL names. |
| C | `localhost`? | Accepted only as the exact hostname `localhost` (lowercase, no trailing dot), postgres(ql) protocol, explicit port `1..65535`, no `host`/`hostaddr`/`port` query overrides, `SHERIVS_DATABASE_TARGET=development`, lifecycle `ephemeral-local`. DNS is **not** resolved. Prefer `127.0.0.1` or `[::1]`. |
| D | Query overrides? | **Rejected** (`host`, `hostaddr`, `port`, case-insensitive), even when the override is also loopback. |
| E | Recheck before connection? | Harness calls `qualifyDisposablePostgres` twice on a sanitized env and compares endpoints. No connect path is implemented, so the recheck is planning-only. |
| F | Production/staging refs? | Whole-string scan plus hosted hostname patterns. Harness also refuses `SUPABASE_URL` / `STAGING_SUPABASE_URL` when they contain known refs. |
| G | Arbitrary SQL? | Harness refuses `SHERIVS_DISPOSABLE_SQL`, `MIGRATION_SQL`, `SQL` if set. Operations are an allowlist. Apply is not implemented. |
| H | File selection allowlist? | Exact pinned relative paths. No `readdirSync`. Unknown operations refused. |
| I | SHA-256 vs exact bytes? | `createHash("sha256")` over file bytes compared to `PINNED_FORWARD` / `PINNED_ROLLBACK`. Apply also requires `SHERIVS_DISPOSABLE_EXECUTE_SHA256` to equal the pin. |
| J | Live execution disabled? | **Yes.** `DISPOSABLE_LIVE_EXECUTE_ENABLED = false`. CLI apply exits 2 with `DISPOSABLE_LIVE_EXECUTE_NOT_ENABLED`. |
| K | Can inspect connect? | **No.** Qualifier and harness inspect/CLI do not import `pg`. `connects: false`, `connected: false`, `executedSql: false`. |
| L | Credential logging? | Results omit raw URLs and userinfo. Reasons pass `redactSecrets`. Tests forbid fixture passwords in CLI stdout. |

**Remaining conditions (not fail-open for apply):**

- Qualifier inspect can still classify a **lone** loopback `DATABASE_URL` when no named disposable URL and no live URL vars are set. The harness will not apply via `DATABASE_URL`.
- Loopback/lifecycle attestation does not detect SSH tunnels.
- `PGHOST` / `PGHOSTADDR` / `PGPORT` are not inspected (no connect).
- `localhost` is not DNS-validated.

---

## 4. Local Supabase setup discovery

| Artifact | What it actually is |
|---|---|
| `database/supabase/config.toml` | Production `project_id` documentation pin only. **No** `[api]`, `[db]`, `[auth]`, or local ports. |
| `database/README.md` | Documents `supabase start --workdir database/supabase`, also `db push` and `link`. Do **not** link or push from this pod. |
| `database/supabase/migrations/` | Canonical `*.sql` plus one `*.sql.proposed`. No `seed.sql`. |
| `infrastructure/deploy/docker-compose.yml` | Production Scholar app container. Requires `/opt/coregrid/scholar.env`. Not Postgres. |
| `.env.example` | Names for app/runtime, including `DATABASE_URL` and production project comment. Not a local stack. |
| `package.json` | `@supabase/supabase-js` only. No `supabase` CLI package. |
| Docker / Podman / Supabase CLI / `psql` | **Absent** in this pod. |
| Listeners 5432 / 54321 / 54322 / 6543 | **None.** |

A directory named `database/supabase/` is not a running local project.

**Required services for the SHERIVS-001 tests:** PostgreSQL with Supabase roles (`authenticator`, `anon`, `authenticated`, `service_role`); Auth/GoTrue-compatible JWT minting; PostgREST (or Kong→PostgREST) for the real `SET ROLE` path. Plain PostgreSQL is insufficient for Tests 1–7.

**Docker:** required by the supported Supabase CLI local workflow (`supabase start`). Not installed here. Not installed by this mission.

**Toolchain (operator machine, not this pod):**

- Docker Engine with permission to run containers without targeting Sherivs production/staging.
- Supabase CLI (`supabase start --workdir database/supabase` only after a **local** config that does not treat production `project_id` as an execution target).
- Node.js (repo already uses v22) for qualifier/harness CLIs.
- Loopback bind for DB (~54322) and API (~54321). Do not publish those ports publicly.

**Current execution environment:** cannot host those tools. A **separate operator-controlled machine** is required. This mission does not provision one and does not select a cloud provider.

**Loading migrations:** a fresh local stack would apply current canonical `*.sql` (69 files). It would skip `*.sql.proposed`. It is not the 71-file staging pin. Identity tables come from that canonical history. The freeze file must remain proposed until a disposable harness apply is separately authorized.

---

## 5. Environment qualification contract

An authorized disposable environment may be used for future runtime tests only when **all** of the following are true. Variable names are not proof.

1. Operator owns create/teardown (container/volume/data-dir identity recorded).
2. PostgreSQL + Auth + PostgREST on **loopback only**.
3. Synthetic users and **local** keys. No production/staging service-role keys, JWTs, or project refs in that shell.
4. `SHERIVS_DATABASE_TARGET=development`
5. `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`
6. `SHERIVS_DISPOSABLE_DATABASE_URL` with host `127.0.0.1` or `[::1]` (prefer IP over `localhost`), explicit port, no `host`/`hostaddr`/`port` query params.
7. `DATABASE_URL`, `STAGING_DATABASE_URL`, `PRODUCTION_DATABASE_URL`, `SHERIVS_RLS_STAGING_URL`, and live `SUPABASE_URL` values **unset**.
8. `node scripts/sherivs-001-qualify-disposable-pg.mjs` exits 0, `connects: false`.
9. `node scripts/sherivs-001-disposable-exec.mjs --operation=inspect` reports `qualified: true`, SHA pins match, `connected: false`.
10. Qualifier success does **not** authorize SQL. Live execute stays disabled until a later reviewed change.

Loopback is not proof against a tunnel. Do not `supabase link` or `db push` to production/staging.

---

## 6. Transaction-runner findings

Inspected source; **not executed**.

| Component | Transaction wrap | Target | Proposed file |
|---|---|---|---|
| Forward/rollback `*.sql.proposed` | File-level `BEGIN`/`COMMIT` | n/a | Inner COMMIT is the boundary for a client that does not pre-wrap |
| `scripts/db-apply-one.mjs` | **No** pre-wrap; `client.query(sql)` | `requirePostgresTarget()`; development may use `DATABASE_URL` | `endsWith(".sql")` **excludes** `*.sql.proposed` |
| `scripts/db-apply.mjs` | **No** pre-wrap; applies **every** `*.sql` | same | excludes proposed; forbidden for this test |
| `scripts/staging/sherivs-restore/runner.mjs` | Outer `BEGIN` → `query(sql)` → ledger `INSERT` → `COMMIT` | staging-only; execute still `LIVE_EXECUTE_NOT_ENABLED` | `*.sql.proposed` excluded (`PROPOSED_SQL_EXCLUDED`) |
| Disposable harness | `DISPOSABLE_WRAPS_OUTER_TRANSACTION = false`; apply **not implemented** | `SHERIVS_DISPOSABLE_DATABASE_URL` only | SHA-pinned exact paths |

**Preserved finding:** an inner `COMMIT` inside `runner.mjs`’s outer transaction would close that transaction **before** the ledger write. A later `ROLLBACK` cannot undo committed DDL. Do not promote the proposal into the pin without stripping file `COMMIT` or changing the runner under a separate review. Do not remove runner production-ref / proposed-file guards.

**Eventual disposable apply contract (not enabled):** injected connector; `client.query(entireFile)` with no outer `BEGIN`; `client.end()`; never `DATABASE_URL`; never `runner.mjs`.

---

## 7. Security test readiness matrix

**No row is PASS.** None executed.

| # | Test | Local services | Context | Expected | Evidence | Cleanup | Status |
|---|---|---|---|---|---|---|---|
| 1 | Self-update `role` | PG + Auth + PostgREST | User JWT PATCH | Rejected | HTTP; row | Synthetic rows | **NOT READY** (no stack) |
| 2 | Self-update `school_id` | PG + Auth + PostgREST | User JWT PATCH | Rejected | HTTP; row | Shared | **NOT READY** |
| 3 | Self-update `is_active` | PG + Auth + PostgREST | User JWT PATCH | Rejected | HTTP; row | Shared | **NOT READY** |
| 4 | Permitted profile update | PG + Auth + PostgREST | User JWT PATCH non-privileged column | Allowed; privileged columns unchanged | HTTP 2xx; diffs | Revert profile | **NOT READY** |
| 5 | Authorized provisioning | PG + Auth + PostgREST | Local service-role HTTP | Succeeds only after Test 7 measures `current_user` | HTTP; row; Test 7 | Delete U-new | **NOT READY** |
| 6 | Missing JWT subject | PostgREST (+ optional labeled SQL) | Anon/missing `sub` | Untrusted-context exception | HTTP/SQLSTATE | Shared | **NOT READY** |
| 7 | Service-role via real PostgREST | PostgREST + Auth | Local service-role HTTP probe of `current_user` | Measure; do not assume | Probe from that HTTP request | Drop probe | **NOT READY** |
| 8 | SECURITY DEFINER | PG (+ PostgREST for helpers) | DEFINER wrapper UPDATE; inactive helper RPC | INVOKER sees caller; inactive helpers fail closed | Exception; returns | Drop wrapper | **NOT READY** |
| 9 | Trigger bypass | PG + PostgREST | DISABLE TRIGGER as `authenticated`; INSERT residual | Ordinary caller cannot disable | SQLSTATE | Re-enable | **NOT READY** |
| 10 | Transaction rollback | PG | Disposable copy fails after helpers / before trigger; no outer wrap | Helpers unchanged; trigger absent | `pg_proc` / `pg_trigger` | Destroy instance | **NOT READY** |

`SET ROLE` is not a PostgREST test.

---

## 8. Identified defects and proposed fixes

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| R-1 | Critical (inspect vs apply target) | Qualifier could pass a named disposable loopback URL while `DATABASE_URL` or staging/production URL vars remained set | **Fixed:** `DISPOSABLE_MIXED_URL_ENV` + regression tests |
| R-2 | Condition | Qualifier inspect still has a `DATABASE_URL` last-candidate path | Left as inspect-only; harness refuses `DATABASE_URL` |
| R-3 | Condition | No local Supabase config/stack in this pod | Spec only; no auto-install |
| R-4 | Condition | `config.toml` production `project_id` | Documented as not an execution default; do not `link` |
| R-5 | Condition | 69 working-tree SQL files vs 71-file pin | Do not assume pin = `supabase start` |
| R-6 | Residual | Tunnel / `localhost` DNS | Prefer `127.0.0.1`; ownership evidence |
| R-7 | Residual | Renaming `*.sql.proposed` to `*.sql` would expose `db-apply-one` | Do not rename |

Live execute was **not** enabled.

---

## 9. Exact files changed

- `scripts/lib/sherivs-disposable-pg.mjs`
- `tests/unit/sherivs-disposable-pg.test.ts`
- `docs/security/SHERIVS-001-LOCAL-SUPABASE-ENVIRONMENT-READINESS-001.md`

Proposed SQL, harness live-execute flag, runner, and `db-apply*.mjs` were **not** modified except as listed.

---

## 10. Offline test commands and results

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

`VITEST_EXIT:0`. Summary: `/opt/cursor/artifacts/sherivs-001-local-supabase-readiness-offline-summary.log`.

These are **not** PostgreSQL results. Integration tests were not run.

Qualifier CLI in this pod: exit **2**, `qualified: false`, `connects: false`. Harness inspect: SHA pins match, `qualified: false`, `connected: false`, `executedSql: false`, `liveExecuteEnabled: false`.

---

## 11. Live-resource and SQL-execution declarations

**No database was accessed.**  
No production or staging connection. No remote probing. No `pg.Client.connect`. No `psql`. No Docker/Supabase CLI start. No ports opened. No paid infrastructure. No secrets printed.

**No SQL was executed.**  
The proposed identity-freeze SQL was not applied. Live disposable execution remains disabled.

---

## 12. Exact prerequisite for runtime verification

All of §5, then a later reviewed change that implements connect **without** using `DATABASE_URL` or `runner.mjs`. Then Test 7 and Test 10 before treating provisioning as verified.

Until qualifier CLI exits 0 on an operator-owned loopback stack with live URL variables unset, **stop**.

---

## 13. Single safest next action

Do not enable live execute. On a separate operator-controlled machine with Docker and Supabase CLI already permitted, create a loopback local stack that is not linked to production or staging, unset live URL variables, and get both qualifier CLI and harness inspect to `qualified: true` with `connected: false`. Do not apply `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416`.

---

## 14. Verdict statement

**BLOCKED.**

The local Supabase environment has not been established. This pod cannot host it. Mixed-shell inspect qualification was tightened. SHERIVS-001 remains OPEN. Database-security verification has not passed.
