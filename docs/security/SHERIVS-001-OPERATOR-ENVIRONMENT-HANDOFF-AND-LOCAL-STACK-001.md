# SHERIVS-001-OPERATOR-ENVIRONMENT-HANDOFF-AND-LOCAL-STACK-001

**Mission ID:** SHERIVS-001-OPERATOR-ENVIRONMENT-HANDOFF-AND-LOCAL-STACK-001  
**Mission type:** Security verification environment handoff  
**Version-target classification:** ACTIVE-V1 identity verification only. No V2/V3 work.  
**Date:** 2026-10-16  
**Final verdict:** **BLOCKED**  
**SHERIVS-001 status:** **OPEN**

This mission is an **environment-readiness** handoff. It is **not** a PostgreSQL/PostgREST security verification. Contexts A–D were **not** measured. The proposed identity-freeze SQL was **not** applied. Production and staging were **not** accessed. Live execute remains disabled.

---

## 1. Outcome

**BLOCKED** after Phase 1. This Cloud Agent pod cannot safely support an isolated local Supabase stack.

Stop conditions that fired:

- Tooling is unavailable (Docker CLI, unix socket, Supabase CLI, `psql`).
- The qualifier rejects the environment (`DISPOSABLE_PRODUCTION_REF`).
- A production project reference is detected in the unscoped `DATABASE_URL` candidate (classified, not connected).
- Isolation cannot be demonstrated (no local PostgreSQL/Auth/PostgREST endpoints).
- Continuing would require weakening a safeguard or using TCP `:2375` as a substitute for the missing Docker CLI, which this mission forbids.

Phases 2–4 were **not started**. No container was created. Docker CLI was not installed. The exposed Docker API port was **not** used as a CLI substitute.

Environment readiness: **FAILED**.  
Security verification: **NOT ATTEMPTED**.

---

## 2. Repository baseline (verified this mission)

Do not use the previously reported inspection HEAD as current. Actual values:

| Item | Value |
|---|---|
| Root | `/workspace` |
| Inspection branch | `cursor/sherivs-001-external-postgrest-context-002-d80b` |
| Inspection HEAD | `fe79437eef2e5b5134849e864f4adab1ac8bbaa7` (confirmed; **not** `8e02190`) |
| Working tree at inspection | clean |
| Uncommitted user work | none |
| This mission branch | `cursor/sherivs-001-operator-env-handoff-local-stack-d80b` |
| OS | Ubuntu 24.04.5 LTS, Linux 6.12.94+, x86_64, uid 1000 |
| Node | v22.14.0 |
| Proposed migration | `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` |
| Proposed rollback | `database/supabase/rollbacks/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` |
| Recomputed forward SHA-256 | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` |
| Pinned SHA-256 | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` |
| Checksum comparison | **MATCH** (file not modified) |
| Recomputed rollback SHA-256 | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` |
| Canonical working-tree `*.sql` | 69 |
| Live execute | `DISPOSABLE_LIVE_EXECUTE_ENABLED = false` |
| Production ref | `nwrflbpbhyiqdptmlccm` |
| Staging ref | `dvxszhracsjwdancijdc` |

`database/supabase/config.toml` is a four-line production `project_id` pin. It is not a local stack and was not overwritten.

---

## 3. Tool versions and Docker CLI/daemon readiness

| Component | Result |
|---|---|
| Docker CLI (`docker` on PATH) | **ABSENT** |
| `dockerd` / `podman` / `nerdctl` | **ABSENT** |
| `/var/run/docker.sock` / `/run/docker.sock` | **ABSENT** |
| Docker CLI ↔ local daemon | **NOT POSSIBLE** — no CLI, no unix socket |
| `127.0.0.1:2375` | TCP open; **not queried**; not treated as a Docker control plane |
| Supabase CLI | **ABSENT** |
| `psql` / `postgres` / `pg_isready` / `postgrest` | **ABSENT** |
| Node / npm | v22.14.0 / 10.9.9 |

---

## 4. Why the qualifier returns `DISPOSABLE_PRODUCTION_REF`

Inspected `scripts/lib/sherivs-disposable-pg.mjs` without changing it.

Candidate order: `SHERIVS_DISPOSABLE_DATABASE_URL` → `LOCAL_DATABASE_URL` → `DEVELOPMENT_DATABASE_URL` → `DATABASE_URL`.

This shell: disposable/local/development URL names are **unset**. `DATABASE_URL` is **set**. The qualifier therefore classifies `DATABASE_URL` without connecting.

Classification (no secrets printed):

- protocol `postgresql`
- host `aws-1-eu-west-1.pooler.supabase.com`
- port `5432`
- `loopback: false`
- `hostedSupabase: true`
- `refs.production: true` → code **`DISPOSABLE_PRODUCTION_REF`**

Additional independent refusals in the same run:

- `SHERIVS_DATABASE_TARGET` unset (must be `development`)
- `SHERIVS_DISPOSABLE_PG_LIFECYCLE` unset (must be `ephemeral-local`)
- unscoped `DATABASE_URL` while `STAGING_DATABASE_URL` / `SHERIVS_RLS_STAGING_URL` are present

```
node scripts/sherivs-001-qualify-disposable-pg.mjs
→ exit 2, qualified=false, code=DISPOSABLE_PRODUCTION_REF,
  candidate=DATABASE_URL, connects=false
```

The qualifier was **not** bypassed, weakened, patched, or skipped.

Harness inspect (never falls back to `DATABASE_URL`):

```
node scripts/sherivs-001-disposable-exec.mjs --operation=inspect
→ exit 0, qualified=false, connected=false, executedSql=false,
  liveExecuteEnabled=false, candidate=SHERIVS_DISPOSABLE_DATABASE_URL,
  code=DISPOSABLE_URL_MISSING, gates.shaPinned=true
```

---

## 5. Isolation and hosted-database evidence

Environment-variable **presence** only (values not printed):

| Name | Present |
|---|---|
| `SHERIVS_DISPOSABLE_DATABASE_URL` | no |
| `SHERIVS_DISPOSABLE_PG_LIFECYCLE` | no |
| `SHERIVS_DATABASE_TARGET` | no |
| `DATABASE_URL` | **yes** |
| `STAGING_DATABASE_URL` | **yes** |
| `SHERIVS_RLS_STAGING_URL` | **yes** |
| `SUPABASE_URL` | **yes** |
| `STAGING_SUPABASE_URL` | **yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** (not used) |
| `SUPABASE_ANON_KEY` | **yes** (not used) |
| `DOCKER_HOST` | no |

`127.0.0.1:5432`, `:54321`, `:54322` refused. There is no local stack whose traffic could be proven loopback-only. Isolation is therefore **not demonstrated**.

No hosted database was targeted: the qualifier classified `DATABASE_URL` as production and **did not connect**. `supabase link` was not run. Live credentials were not used.

---

## 6. Local stack health

**NOT STARTED.** Phase 2 requires qualifier success first.

| Service | Health |
|---|---|
| PostgreSQL | not running |
| Auth | not running |
| PostgREST | not running |

The proposed `*.sql.proposed` file is excluded from ordinary `*.sql` loaders and from `runner.mjs`. It was not loaded and not applied.

---

## 7. Handoff for execution-context verification (next mission)

The next separately scoped mission must measure, on a **qualified** disposable local stack, with synthetic users only:

| ID | Context | This mission |
|---|---|---|
| A | Direct administrative PostgreSQL session | **NOT MEASURED** |
| B | Authenticated local PostgREST | **NOT MEASURED** |
| C | Service-role local PostgREST | **NOT MEASURED** |
| D | Anonymous local PostgREST | **NOT MEASURED** |

Required observations: actual `current_user`, `session_user`, `auth.uid()` where available. Do not infer `current_user = 'service_role'` from a key name.

This pod is **not** ready for that mission.

---

## 8. Transaction contract (source; not executed)

- The proposal contains its own `BEGIN;` … `COMMIT;`.
- `scripts/staging/sherivs-restore/runner.mjs` wraps each file in an outer `BEGIN` → `query(sql)` → ledger `INSERT` → `COMMIT`. An inner `COMMIT` would close that outer transaction before the ledger write.
- Do **not** feed this proposal to `runner.mjs`. The file is `*.sql.proposed` and already excluded.
- `scripts/db-apply-one.mjs` selects `endsWith(".sql")` and does not select `*.sql.proposed`. Do not rename or copy the proposal to bypass that selector.
- No migration-application shortcut was implemented in this mission.

A future disposable-only apply requires a separately reviewed contract: whole-file `client.query(sql)` with **no** outer wrap, SHA pin, qualifier exit 0, and explicit authorization.

---

## 9. Remaining blockers

1. Docker CLI and docker.sock absent; TCP `:2375` must not be used as a substitute.
2. Supabase CLI and `psql` absent.
3. No `SHERIVS_DISPOSABLE_DATABASE_URL`.
4. Qualifier exit 2 on hosted production pooler `DATABASE_URL`.
5. Live URL variables present in this shell.
6. No local PostgreSQL/Auth/PostgREST.
7. Proposed SQL unapplied; transaction contract unmeasured at runtime.

---

## 10. Offline tests

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

Results are recorded after the command runs. They are **not** local-stack or PostgREST evidence.

---

## 11. Exact files changed

- `docs/security/SHERIVS-001-OPERATOR-ENVIRONMENT-HANDOFF-AND-LOCAL-STACK-001.md`

Proposed SQL, `config.toml`, qualifier, harness, and runners were **not** modified.

---

## 12. Declarations

**Production was not accessed.**  
**Staging was not accessed.**  
No remote database was probed. No `pg.Client.connect`. No `psql`. No `supabase start`. No `supabase link`. No Docker CLI control of any daemon. No container create.

**The proposed identity-freeze migration was not executed.**  
Live disposable execution remains disabled. SHERIVS-001 is **not** closed.

---

## 13. Exact next step

On an authorized **operator-controlled** machine that already has Docker Engine **with Docker CLI talking to the local unix socket**, plus Supabase CLI and `psql`: create a loopback-only local stack (`supabase start` with a local-only config, **no** `link`), unset live URL variables **in that process only**, set `SHERIVS_DISPOSABLE_DATABASE_URL` (explicit port, no `?host=` / `?hostaddr=` / `?port=`), set `SHERIVS_DATABASE_TARGET=development` and `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`, obtain qualifier **exit 0**, then open the separately scoped execution-context mission (contexts A–D).

Do not apply `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` from this pod. Do not use `runner.mjs`. Do not install Docker CLI here. Do not treat `:2375` as Docker.

---

## 14. Verdict statement

**BLOCKED.**

This machine is not ready for isolated local Supabase. Environment readiness failed. Security verification was not attempted. SHERIVS-001 remains OPEN.
