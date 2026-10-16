# SHERIVS-001-EXTERNAL-POSTGREST-CONTEXT-VERIFICATION-001

**Mission ID:** SHERIVS-001-EXTERNAL-POSTGREST-CONTEXT-VERIFICATION-001  
**Mission class:** Critical security / database execution-context verification  
**Version-target classification:** ACTIVE-V1 identity verification only. No V2/V3 work.  
**Date:** 2026-10-16  
**Final verdict:** **BLOCKED**  
**SHERIVS-001 status:** **OPEN**

This mission is a runtime-measurement mission. It does **not** authorize applying the identity-freeze SQL. Phase 0 qualification failed. Phase 1 measurements were **not started**. No database was accessed. No SQL was executed.

---

## 1. Executive verdict

STOP after independent environment qualification.

PASS requires actual PostgreSQL/PostgREST execution-context measurements in a qualified disposable environment. This pod does not provide that environment. Offline unit tests and `SET ROLE` simulations are insufficient.

Missing or failing gates, exactly:

| Gate | Result |
|---|---|
| Shared qualifier exit 0 | **FAIL** — exit 2, `DISPOSABLE_PRODUCTION_REF` |
| `SHERIVS_DISPOSABLE_DATABASE_URL` | **ABSENT** |
| `SHERIVS_DATABASE_TARGET=development` | **ABSENT** |
| `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local` | **ABSENT** |
| No live URL variables | **FAIL** — `DATABASE_URL`, `STAGING_DATABASE_URL`, `SHERIVS_RLS_STAGING_URL` present |
| Harness `qualified=true` | **FAIL** |
| Harness `connected=false` | true (no connect) |
| Harness `executedSql=false` | true |
| Harness `liveExecuteEnabled=false` | true |
| Proposed SQL SHA-256 match | true |
| Docker CLI | **ABSENT** |
| Docker Engine | TCP API on `127.0.0.1:2375` answers (Engine 29.1.4); **0 containers**; unix socket absent |
| Supabase CLI | **ABSENT** |
| Local PostgreSQL | **ABSENT** (no `psql`/`postgres`; `127.0.0.1:5432` and `:54322` refused) |
| Local Supabase Auth | **ABSENT** |
| Local PostgREST | **ABSENT** (`postgrest` binary absent; `:54321` refused) |

No containers were created. No images were pulled. Docker CLI was not installed. Live credentials present in the shell were **not used**.

---

## 2. Repository baseline (verified this mission)

| Item | Value |
|---|---|
| Root | `/workspace` |
| Inspection branch | `cursor/sherivs-001-external-verification-handoff-d80b` |
| Inspection HEAD | `98b039ce68b7416aa16c4db185016defa1774113` (confirmed) |
| Working tree at inspection | clean |
| Uncommitted user work | none |
| This mission branch | `cursor/sherivs-001-external-postgrest-context-d80b` |
| OS | Ubuntu 24.04.5 LTS, Linux 6.12.94+, x86_64, uid 1000 |
| Node | v22.14.0 |
| Proposed SQL | `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` |
| Proposed SHA-256 | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (confirmed; **unchanged**) |
| Rollback SHA-256 | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` |
| Trusted skip (source) | `current_user = 'service_role'` only; `auth.uid() IS NULL` is not trust |
| Live execute | `DISPOSABLE_LIVE_EXECUTE_ENABLED = false` |
| Production ref | `nwrflbpbhyiqdptmlccm` |
| Staging ref | `dvxszhracsjwdancijdc` |
| Staging pin | 71 files at `d195ba861f80379b79533126653b9cee82a8e872` |
| Working-tree canonical `*.sql` | 69 (`*.sql.proposed` excluded from a normal start) |

Prior SHERIVS-001 reports are not replaced. The latest handoff (`SHERIVS-001-EXTERNAL-VERIFICATION-HANDOFF-001.md`, verdict PASS WITH CONDITIONS for the **handoff artifact**) remains the transfer document. This mission independently re-verified the repository and this pod; it does not close SHERIVS-001.

---

## 3. Environment qualification evidence

Read-only. No database connection. Environment-variable **presence** only; values were not printed.

### 3.1 Tooling and listeners

| Check | Result |
|---|---|
| `docker` / `dockerd` / `podman` / `nerdctl` | absent from PATH |
| `/var/run/docker.sock` | absent |
| Docker Engine HTTP API `GET /version` on `127.0.0.1:2375` | 200; ApiVersion 1.52; Version 29.1.4; Os linux; Arch amd64 |
| `GET /containers/json?all=true` | 0 containers |
| `GET /images/json` | 1 image (`moby/buildkit:v0.29.0` only) |
| `supabase` CLI | absent; not an npm dependency |
| `@supabase/supabase-js` | present (JS client; not a local stack) |
| `psql` / `postgres` / `initdb` / `pg_isready` / `postgrest` | absent |
| `127.0.0.1:5432`, `:54321`, `:54322`, `:54323`, `:6543`, `:3000`, `:8000` | `connect_ex=111` (refused) |
| Matching processes (`docker`, `postgres`, `postgrest`, `supabase`, `gotrue`) | none |
| `apt-get` / passwordless `sudo` | present / available; **not used** |

Unrelated listeners observed (`2375`, `26500`, `26058`, `50052`, `5901`, `26054`, `26053`) are not PostgreSQL, Auth, or PostgREST. No container was created against the Engine API.

A Docker Engine API without the Docker CLI, without a Supabase CLI, and without a disposable URL is **not** a qualified local Supabase host.

### 3.2 Environment-variable presence (values not printed)

| Name | Present |
|---|---|
| `SHERIVS_DISPOSABLE_DATABASE_URL` | no |
| `SHERIVS_DISPOSABLE_PG_LIFECYCLE` | no |
| `SHERIVS_DATABASE_TARGET` | no |
| `SHERIVS_DISPOSABLE_EXECUTE` | no |
| `SHERIVS_DISPOSABLE_EXECUTE_SHA256` | no |
| `SHERIVS_DISPOSABLE_SQL` | no |
| `DATABASE_URL` | **yes** |
| `STAGING_DATABASE_URL` | **yes** |
| `SHERIVS_RLS_STAGING_URL` | **yes** |
| `PRODUCTION_DATABASE_URL` | no |
| `LOCAL_DATABASE_URL` / `DEVELOPMENT_DATABASE_URL` | no |
| `SUPABASE_URL` | **yes** |
| `STAGING_SUPABASE_URL` | **yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** (not used) |
| `SUPABASE_ANON_KEY` | **yes** (not used) |
| `SUPABASE_JWT_SECRET` | no |
| `PGHOST` / `PGPORT` / `PGUSER` / `PGDATABASE` / `PGPASSWORD` | no |

The disposable URL was **not** configured. `DATABASE_URL` was **not** used as a fallback.

### 3.3 Local configuration

`database/supabase/config.toml` is a four-line production `project_id = "nwrflbpbhyiqdptmlccm"` pin. It is **not** a local stack (`[api]` / `[db]` / loopback bind are absent). It was not overwritten. `supabase link` / `db push` were not run.

### 3.4 Qualifier CLI (no connect)

```
node scripts/sherivs-001-qualify-disposable-pg.mjs
```

Outcome:

- exit **2**
- `qualified: false`
- `code: DISPOSABLE_PRODUCTION_REF`
- `candidate: DATABASE_URL`
- `connects: false`
- endpoint host classified as hosted Supabase pooler `aws-1-eu-west-1.pooler.supabase.com:5432`, `loopback: false`, production ref true
- reasons include missing `SHERIVS_DATABASE_TARGET`, missing lifecycle attestation, production-ref refusal, and mixed live URL variables

### 3.5 Harness inspect (no connect, no SQL)

```
node scripts/sherivs-001-disposable-exec.mjs --operation=inspect
```

Outcome:

- exit **0** (inspect reports; does not apply)
- `qualified: false`
- `authorized: false`
- `liveExecuteEnabled: false`
- `wrapsOuterTransaction: false`
- `connected: false`
- `executedSql: false`
- `candidate: SHERIVS_DISPOSABLE_DATABASE_URL`
- `code: DISPOSABLE_URL_MISSING`
- `gates.shaPinned: true` — forward and rollback SHA-256 match the reviewed pins
- forbidden live URL names present: `DATABASE_URL`, `STAGING_DATABASE_URL`, `SHERIVS_RLS_STAGING_URL`

**Preflight required by this mission:** `qualified=true` **failed**. Stop before connecting.

---

## 4. Actual PostgreSQL / PostgREST versions

| Component | Version |
|---|---|
| PostgreSQL server | **NOT AVAILABLE** |
| `psql` client | **NOT AVAILABLE** |
| PostgREST | **NOT AVAILABLE** |
| Supabase CLI | **NOT AVAILABLE** |
| Docker Engine (API only) | 29.1.4 (not used to start a stack) |
| Node | v22.14.0 |

---

## 5. Execution-context measurements

**NOT VERIFIED.** No request was issued. `SET ROLE` was not used as a substitute. Role behavior was not inferred from key names.

| ID | Context | Request path | Database role | `current_user` | `session_user` | `auth.uid()` | JWT claim classification | Observation source |
|---|---|---|---|---|---|---|---|---|
| A | Ordinary authenticated JWT (synthetic user) | **NOT VERIFIED** | — | — | — | — | not issued | no PostgREST |
| B | Anonymous | **NOT VERIFIED** | — | — | — | — | not issued | no PostgREST |
| C | Service-role through **actual local PostgREST** | **NOT VERIFIED** | — | — | — | — | not issued | no PostgREST |
| D | Missing JWT subject | **NOT VERIFIED** | — | — | — | — | not issued | no PostgREST |

The proposed trigger was **not applied**. Helpers were **not replaced**.

---

## 6. Verified facts versus assumptions

**Verified (this mission):**

- HEAD `98b039ce68b7416aa16c4db185016defa1774113` and proposed SHA-256 `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` match the handoff baseline.
- Qualifier refuses this shell. Harness inspect does not connect and does not execute SQL.
- This pod has no local PostgreSQL, Auth, or PostgREST listeners.
- Source plpgsql trusts `current_user = 'service_role'` on an **INVOKER** trigger and treats `auth.uid() IS NULL` as untrusted.

**Assumptions in the proposed SQL comments (not measured here):**

- After authenticator `SET ROLE`, a local service-role PostgREST request observes `current_user = 'service_role'`.
- `session_user` stays `authenticator` for both user and service JWTs.
- `postgres` would be a silent bypass if allowlisted, so it is not.
- Caller-controlled JWT GUCs cannot set `current_user` to `service_role`.

Those comments are **not** PostgreSQL evidence. They remain the unanswered trust question from prior BLOCKED missions.

---

## 7. Role-switching and SECURITY DEFINER findings

Source only. Runtime: **NOT VERIFIED**.

| Object | Source attribute | Runtime |
|---|---|---|
| `public.forbid_self_privilege_mutation()` | `SECURITY INVOKER`; skip iff `current_user = 'service_role'` | **NOT VERIFIED** |
| `public.get_my_school_id()` / `get_my_role()` / `is_school_admin()` | `SECURITY DEFINER`, `search_path=public`, gate on `auth.uid()` and `is_active` | **NOT VERIFIED** |
| Trigger | `BEFORE UPDATE` on `public.users`, per row | **NOT APPLIED** |
| Ordinary authenticated user reaching a trusted skip | Source: only if `current_user` is `service_role` | **NOT VERIFIED** — cannot confirm PostgREST never runs user JWTs as `service_role` |
| Missing JWT subject treated as trust | Source: no; unidentified non-`service_role` privilege writes raise | **NOT VERIFIED** |
| Exception vs privileges it permits | Source: skip is a single role name; it permits privilege-column UPDATE when that role is the invoker | **NOT VERIFIED** whether PostgREST actually presents that role |

The trusted-role exception was **not** widened or narrowed in this mission.

---

## 8. Transaction-contract findings

Inspected in source. **Not executed.**

The proposed file contains explicit `BEGIN;` … `COMMIT;` around helper replacement and trigger install. Statements are transactional (`CREATE OR REPLACE FUNCTION`, `COMMENT ON`, `DROP TRIGGER`, `CREATE TRIGGER`). There is no `CONCURRENTLY` / `VACUUM`.

| Path | Behavior | For this file |
|---|---|---|
| File itself | Inner `BEGIN`/`COMMIT` is the intended boundary | Unmeasured |
| `scripts/db-apply-one.mjs` | `client.query(sql)` with **no** outer wrap; uses `DATABASE_URL` after `requirePostgresTarget()`; `endsWith(".sql")` **excludes** `*.sql.proposed` | Do **not** use |
| `scripts/db-apply.mjs` | Every `*.sql`, no pre-wrap | Do **not** use |
| `scripts/staging/sherivs-restore/runner.mjs` | Outer `BEGIN` → `query(sql)` → ledger `INSERT` → `COMMIT` | Inner `COMMIT` **closes the outer transaction before the ledger write**. File is `*.sql.proposed` and excluded (`endsWith(".sql") && !endsWith(".sql.proposed")`). Live execute remains `LIVE_EXECUTE_NOT_ENABLED`. Do **not** use |
| Disposable harness | `DISPOSABLE_WRAPS_OUTER_TRANSACTION=false`; apply not implemented while live execute is false | Inspect only |

A future execution path must submit the whole file as one `query` with **no** outer wrap, after SHA pin, disposable qualification, and a separately reviewed enablement of live execute. Do not strip `BEGIN`/`COMMIT` from the proposal merely to fit `runner.mjs`. Do not bypass production/staging safeguards to force a test.

---

## 9. Unresolved blockers

1. No qualified disposable local Supabase target on this pod.
2. No actual `current_user` / `session_user` / `auth.uid()` under real PostgREST (Tests A–D).
3. Proposed SQL unapplied.
4. Transaction contract unmeasured at runtime.
5. Qualifier inspect still has a last-candidate `DATABASE_URL` path; the harness refuses that name. Mixed live URL variables remain in this shell.
6. 69 working-tree canonical `*.sql` files ≠ 71-file staging pin.

---

## 10. Exact files changed

- `docs/security/SHERIVS-001-EXTERNAL-POSTGREST-CONTEXT-VERIFICATION-001.md`

Proposed SQL, rollback SQL, `config.toml`, harness live-execute flag, runners, and qualifier were **not** modified.

---

## 11. Offline test results

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

Results are recorded after the command runs. They are **not** PostgreSQL or PostgREST results.

Qualifier/harness inspect outcomes for this pod are in §3.4–§3.5.

---

## 12. Declarations

**Production was not accessed.**  
**Staging was not accessed.**  
No remote database was probed. No `pg.Client.connect`. No `psql`. No `supabase start`. No `supabase link`. No `db push`. No container create. No deploy, DNS, or cloud project change. Present service-role and anon keys were not used.

**The proposed identity-freeze migration was not executed.**  
Live disposable execution remains disabled.

---

## 13. Recommendation for the next separately authorized mission

On an authorized **external** machine that already has Docker Engine **and** the Docker CLI **and** the Supabase CLI: create a loopback-only local stack with no remote `link`, unset live URL variables, set `SHERIVS_DISPOSABLE_DATABASE_URL` (explicit port, no `?host=` / `?hostaddr=` / `?port=`), set `SHERIVS_DATABASE_TARGET=development` and `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`, obtain qualifier exit 0 and harness inspect `qualified=true`, `connected=false`, `executedSql=false`, then measure contexts A–D through **real local PostgREST** **before** any apply. Do not apply `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` from this pod. Do not use `runner.mjs`. Do not enable `DISPOSABLE_LIVE_EXECUTE_ENABLED` in this mission’s follow-up unless a later review authorizes it after Test C records `current_user`.

This Cloud Agent pod remains unqualified. Do not retry bootstrap here by installing the Docker CLI or pulling Supabase images.

---

## 14. Verdict statement

**BLOCKED.**

No execution-context measurement was obtained. SHERIVS-001 remains OPEN. The identity freeze is **not** verified.
