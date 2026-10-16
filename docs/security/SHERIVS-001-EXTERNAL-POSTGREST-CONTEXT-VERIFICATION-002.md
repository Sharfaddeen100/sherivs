# SHERIVS-001-EXTERNAL-POSTGREST-CONTEXT-VERIFICATION-002

**Mission ID:** SHERIVS-001-EXTERNAL-POSTGREST-CONTEXT-VERIFICATION-002  
**Mission title:** Isolated Supabase Runtime Verification and Identity Privilege Freeze Readiness  
**Mission class:** Security-critical database verification  
**Version-target classification:** ACTIVE-V1 identity verification only. No V2/V3 work.  
**Date:** 2026-10-16  
**Final verdict:** **BLOCKED**  
**SHERIVS-001 status:** **OPEN**

This mission independently re-qualified the execution environment for real PostgreSQL and PostgREST measurement. It is **not** authorized to change production or staging. It is **not** authorized to apply the proposed identity-freeze SQL. Phase 1 failed. Phases 2–4 were **not started**. No database was accessed. No SQL was executed.

This report does not replace `SHERIVS-001-EXTERNAL-POSTGREST-CONTEXT-VERIFICATION-001.md`. That mission was also **BLOCKED**. This mission re-verified the same class of gates on a later HEAD and stopped without improvising around them.

---

## 1. Outcome

**BLOCKED** after Phase 1 preflight.

PASS requires actual PostgreSQL and PostgREST execution-context measurements in an isolated, disposable local Supabase environment. This Cloud Agent pod is not such an environment. Offline unit tests do not establish database behavior.

Exact Phase 1 failures:

| Gate | Result |
|---|---|
| Shared qualifier exit 0 | **FAIL** — exit 2, `DISPOSABLE_PRODUCTION_REF` |
| Qualifier `connects=false` | true (no connect) |
| Disposable local target | **FAIL** — no `SHERIVS_DISPOSABLE_DATABASE_URL`; unscoped `DATABASE_URL` classified as hosted production pooler |
| `SHERIVS_DATABASE_TARGET=development` | **ABSENT** |
| `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local` | **ABSENT** |
| No production/staging URL or project ref in the shell | **FAIL** — `DATABASE_URL`, `STAGING_DATABASE_URL`, `SHERIVS_RLS_STAGING_URL`, `SUPABASE_URL`, `STAGING_SUPABASE_URL` present |
| Harness `qualified=true` | **FAIL** |
| Harness `connected=false` | true |
| Harness `executedSql=false` | true |
| Harness `liveExecuteEnabled=false` | true |
| Proposed SHA-256 matches pin | true — `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` |
| Docker CLI | **ABSENT** |
| Docker daemon unix socket | **ABSENT** |
| Docker Engine TCP API `127.0.0.1:2375` | answers (Engine 29.1.4); **0 containers**; **not used** to create a stack |
| Supabase CLI | **ABSENT** |
| PostgreSQL client (`psql`) | **ABSENT** |
| Local PostgreSQL / Auth / PostgREST | **ABSENT** (`127.0.0.1:5432`, `:54321`, `:54322` refused) |

Stop conditions that fired:

- Environment cannot be proven disposable and local.
- Production/staging URL and project reference detected in the shell (classified, not connected).
- Environment qualifier rejects the target.
- Required Docker CLI, Supabase CLI, and PostgreSQL client are not installed.

No safeguard was weakened. Docker CLI was not installed. No image was pulled. No container was created. `DATABASE_URL` was not used as a fallback. Present service-role and anon keys were not used.

---

## 2. Repository baseline (verified this mission)

| Item | Value |
|---|---|
| Root | `/workspace` |
| Inspection branch | `cursor/sherivs-001-external-postgrest-context-d80b` |
| Inspection HEAD | `8e02190557bd6cbfe4b59a84bceae638626ec683` (confirmed) |
| Working tree at inspection | clean |
| Uncommitted user work | none |
| This mission branch | `cursor/sherivs-001-external-postgrest-context-002-d80b` |
| Report commit | `6c3850d6fa2bc7c513d3fb218ff904bb4d616805` |
| OS | Ubuntu 24.04.5 LTS, Linux 6.12.94+, x86_64, uid 1000 |
| Node | v22.14.0 |
| Product brand | Sherivs |
| Finding | SHERIVS-001 (**OPEN**) |
| Proposed migration | `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` |
| Proposed rollback | `database/supabase/rollbacks/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` |
| Proposed SHA-256 (recomputed) | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (**unchanged**; files not modified) |
| Rollback SHA-256 (recomputed) | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` |
| Trusted skip (source) | `current_user = 'service_role'` only; `auth.uid() IS NULL` is not trust |
| Live execute | `DISPOSABLE_LIVE_EXECUTE_ENABLED = false` |
| Production ref | `nwrflbpbhyiqdptmlccm` |
| Staging ref | `dvxszhracsjwdancijdc` |
| Staging pin | 71 files at `d195ba861f80379b79533126653b9cee82a8e872` |
| Working-tree canonical `*.sql` | 69 |

`database/supabase/config.toml` remains a four-line production `project_id` pin. It is not a local stack and was not overwritten.

---

## 3. Tool versions and local service health

| Component | Version / health |
|---|---|
| Node | v22.14.0 |
| npm | 10.9.9 |
| Docker CLI | **NOT INSTALLED** |
| Docker Engine (read-only `GET /version` on `127.0.0.1:2375`) | 29.1.4, API 1.52; unix socket absent; CLI absent |
| Docker containers | 0 |
| Docker images | 1 (`moby/buildkit:v0.29.0` only) |
| Supabase CLI | **NOT INSTALLED** |
| PostgreSQL server | **NOT AVAILABLE** |
| `psql` | **NOT AVAILABLE** |
| PostgREST | **NOT AVAILABLE** |
| Local Auth | **NOT AVAILABLE** |
| `127.0.0.1:5432` / `:54321` / `:54322` / `:54323` / `:6543` | refused (`connect_ex=111`) |

No SSH-tunnel / port-forward proof of isolation is possible: there is no local PostgreSQL endpoint to isolate. Loopback listeners for the stack do not exist.

---

## 4. Environment-variable presence (values not printed)

| Name | Present |
|---|---|
| `SHERIVS_DISPOSABLE_DATABASE_URL` | no |
| `SHERIVS_DISPOSABLE_PG_LIFECYCLE` | no |
| `SHERIVS_DATABASE_TARGET` | no |
| `SHERIVS_DISPOSABLE_EXECUTE` | no |
| `DATABASE_URL` | **yes** |
| `STAGING_DATABASE_URL` | **yes** |
| `SHERIVS_RLS_STAGING_URL` | **yes** |
| `SUPABASE_URL` | **yes** |
| `STAGING_SUPABASE_URL` | **yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** (not used) |
| `SUPABASE_ANON_KEY` | **yes** (not used) |
| `DOCKER_HOST` | no |
| `PGHOST` / `PGPORT` / `PGPASSWORD` | no |

---

## 5. Qualifier and harness (no connect)

```
node scripts/sherivs-001-qualify-disposable-pg.mjs
→ exit 2, qualified=false, code=DISPOSABLE_PRODUCTION_REF,
  candidate=DATABASE_URL, connects=false
  host classified: aws-1-eu-west-1.pooler.supabase.com:5432
  loopback=false, hostedSupabase=true, production ref=true
```

```
node scripts/sherivs-001-disposable-exec.mjs --operation=inspect
→ exit 0, qualified=false, connected=false, executedSql=false,
  liveExecuteEnabled=false, wrapsOuterTransaction=false,
  candidate=SHERIVS_DISPOSABLE_DATABASE_URL, code=DISPOSABLE_URL_MISSING,
  gates.shaPinned=true
```

Phase 2 was not entered. `supabase start` was not run. `runner.mjs` was not used. `db-apply-one.mjs` was not used. The proposed files were not renamed, copied, or moved.

---

## 6. Measured execution contexts

**NOT VERIFIED.** No request was issued. No administrative `psql` session was opened. `SET ROLE` was not used as a substitute. Values were not inferred from credential names.

| ID | Context | `current_user` | `session_user` | `auth.uid()` | JWT role claim (no token) | Observation source |
|---|---|---|---|---|---|---|
| A | Direct administrative PostgreSQL session | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | n/a | no local PostgreSQL |
| B | Local PostgREST, ordinary authenticated user | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | not issued | no local PostgREST |
| C | Local PostgREST, local service-role credential | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | not issued | no local PostgREST |
| D | Local PostgREST, unauthenticated / anonymous | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** | not issued | no local PostgREST |

Whether `current_user = 'service_role'` actually represents a local service-role PostgREST request remains **unmeasured**. Whether `auth.uid()` is NULL in A–D remains **unmeasured**. Whether ordinary users cannot update `role` / `school_id` / `is_active` remains **unmeasured** (the trigger is also unapplied).

The trusted-role exception was **not** changed.

---

## 7. Security-semantics review (source only)

The proposed INVOKER trigger skips privilege-column UPDATE when `current_user = 'service_role'`. Unidentified non-`service_role` privilege writes raise. Identified self-updates of `role`, `school_id`, and `is_active` raise. `auth.uid() IS NULL` is not a trust predicate.

That source design cannot be confirmed or contradicted without contexts A–D. No narrowly scoped SQL correction is proposed: there is no runtime discrepancy to correct.

SECURITY DEFINER helpers (`get_my_school_id`, `get_my_role`, `is_school_admin`) remain unapplied and unmeasured.

---

## 8. Transaction-contract findings

Inspected in source. **Not executed.** **Not applied.**

The proposed file contains its own `BEGIN;` … `COMMIT;`.

| Path | Behavior | Use for this file |
|---|---|---|
| Proposed file | Inner `BEGIN`/`COMMIT`; transactional DDL only | Unmeasured intended boundary |
| `scripts/staging/sherivs-restore/runner.mjs` | Outer `BEGIN` → `query(sql)` → ledger `INSERT` → `COMMIT` | **Do not use.** Inner `COMMIT` would close the outer transaction before the ledger write. File is `*.sql.proposed` and excluded. Live execute remains `LIVE_EXECUTE_NOT_ENABLED`. |
| `scripts/db-apply-one.mjs` | `client.query(sql)` with no outer wrap; `endsWith(".sql")` excludes `*.sql.proposed`; uses `DATABASE_URL` | **Do not use.** Do not rename the proposal to satisfy the selector. |
| `scripts/db-apply.mjs` | Every `*.sql`, no pre-wrap | **Do not use.** |
| Disposable harness | `DISPOSABLE_WRAPS_OUTER_TRANSACTION=false`; live execute false | Inspect only |

**Future disposable-only test strategy (not authorized in this mission):**

1. Qualified loopback `SHERIVS_DISPOSABLE_DATABASE_URL` with `SHERIVS_DATABASE_TARGET=development` and `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`.
2. Live URL names unset in that process.
3. Qualifier exit 0; harness inspect `qualified=true`, `connected=false`, `executedSql=false`.
4. Measure contexts A–D **before** apply.
5. Separately reviewed enablement of harness apply: inject a loopback connector; submit the **whole** proposed file as one `client.query(sql)` with **no** outer `BEGIN`; keep the file’s own `BEGIN`/`COMMIT`; pin SHA-256 `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416`.
6. Destroy the disposable instance.

Any future application requires a separate explicit authorization.

---

## 9. Tests

### Offline unit tests

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

`VITEST_EXIT:0`. These are **not** PostgreSQL or PostgREST results. Qualifier/harness inspect outcomes are in §5.

### Local PostgreSQL tests

**NOT RUN.** No local PostgreSQL.

### Local PostgREST integration tests

**NOT RUN.** No local PostgREST.

### Production / staging verification

**NOT AUTHORIZED. NOT RUN.**

---

## 10. Remaining uncertainties

1. Under a real local PostgREST service-role request, is `current_user` equal to `service_role`?
2. What are `session_user` and `auth.uid()` in contexts A–D?
3. Does a NULL `auth.uid()` occur for service-role and anonymous requests?
4. After a reviewed apply, do privilege-column self-updates fail and does authorized provisioning still succeed?
5. Does file-level `BEGIN`/`COMMIT` abort helper+trigger as one unit when submitted with no outer wrap?

---

## 11. Exact files changed

- `docs/security/SHERIVS-001-EXTERNAL-POSTGREST-CONTEXT-VERIFICATION-002.md`

Proposed SQL, rollback SQL, `config.toml`, harness live-execute flag, runners, and qualifier were **not** modified.

---

## 12. Declarations

**Production was not accessed.**  
**Staging was not accessed.**  
No remote database was probed. No `pg.Client.connect`. No `psql`. No `supabase start`. No `supabase link`. No `db push`. No container create. No deploy, DNS, or cloud project change. Present service-role and anon keys were not used.

**The proposed identity-freeze migration was not executed.**  
Live disposable execution remains disabled. SHERIVS-001 is **not** closed.

---

## 13. Recommended next milestone

On an authorized **external** machine that already has Docker Engine, Docker CLI, and the Supabase CLI: create a loopback-only local stack with no remote `link`, unset live URL variables, set `SHERIVS_DISPOSABLE_DATABASE_URL` (explicit port, no `?host=` / `?hostaddr=` / `?port=`), set `SHERIVS_DATABASE_TARGET=development` and `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`, obtain qualifier exit 0 and harness inspect `qualified=true`, then measure contexts A–D through real local PostgREST **before** any apply.

Do not apply `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` from this pod. Do not use `runner.mjs`. Do not rename `*.sql.proposed` to `*.sql`. Do not install Docker CLI or pull Supabase images in this pod to bypass Phase 1.

---

## 14. Verdict statement

**BLOCKED.**

Phase 1 qualification failed. No execution-context measurement was obtained. SHERIVS-001 remains OPEN. The identity freeze is **not** verified and is **not** ready to apply.
