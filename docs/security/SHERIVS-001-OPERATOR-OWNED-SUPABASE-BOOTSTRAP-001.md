# SHERIVS-001-OPERATOR-OWNED-SUPABASE-BOOTSTRAP-001

**Mission ID:** SHERIVS-001-OPERATOR-OWNED-SUPABASE-BOOTSTRAP-001  
**Mission class:** Critical security infrastructure / local test environment  
**Engineering mode:** Evidence-first, fail-closed, repository-bound, non-production  
**Version-target classification:** ACTIVE-V1 identity verification only. No V2/V3 work.  
**Verification date:** 2026-10-16  
**Final verdict:** **BLOCKED**

This mission attempted to establish a disposable local Supabase stack on the current operator-controlled machine. **Phase 0 failed.** Docker CLI, Docker daemon, and the Supabase CLI are absent. Installation was not performed. Services were not started. Ports were not opened.

This is **not** a database-security verification. The proposed identity-freeze SQL was **not executed**. SHERIVS-001 remains **OPEN**. Live disposable execution remains disabled.

---

## 1. Executive verdict

STOP after read-only machine qualification.

Missing, exactly:

| Tool | Status |
|---|---|
| Docker CLI | **ABSENT** |
| Docker daemon / socket | **ABSENT** (`/var/run/docker.sock` missing) |
| Podman / nerdctl | **ABSENT** |
| Supabase CLI | **ABSENT** |
| `psql` / `postgres` / `initdb` / `pg_isready` | **ABSENT** |
| Listeners on 5432 / 54321 / 54322 / 6543 | **none** |

`apt-get` is present. Passwordless `sudo` is available. Neither was used. This mission forbids automatic system-level infrastructure installation.

No existing Docker containers or volumes were found. No destructive Docker commands were run.

The qualifier did **not** exit 0. Harness inspect reported `connected: false` and `executedSql: false`. Phase 2–5 service establishment did not start.

---

## 2. Repository baseline

Verified on `cursor/sherivs-001-local-supabase-readiness-d80b` before this branch:

| Item | Value |
|---|---|
| Repository root | `/workspace` |
| Inspection branch | `cursor/sherivs-001-local-supabase-readiness-d80b` |
| Inspection HEAD | `21d8545394369d74883a4f973a6969b0d0350e5e` (confirmed) |
| Prior baseline | `505b94e4a50267728e12c2320cfa15091ceb154d` (ancestor) |
| Working tree at inspection | clean |
| Uncommitted user work | none |
| This mission branch | `cursor/sherivs-001-operator-owned-supabase-bootstrap-d80b` |
| Report commit | `8e06ec285eb5d7396970e0ce47245362d354f4dd` |
| Offline-results commit | `ba3de58135715847971cb2b364ef27eb55d86562` |
| OS | Ubuntu 24.04.5 LTS, Linux 6.12.94+, x86_64, uid 1000 |
| Node | v22.14.0 |
| Proposed SQL SHA-256 | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (confirmed; **unchanged**) |
| Rollback SHA-256 | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` |
| Canonical `migrations/*.sql` | 69 |
| Proposed files | 1 |
| Staging pin | 71 files at `d195ba861f80379b79533126653b9cee82a8e872` |
| `DISPOSABLE_LIVE_EXECUTE_ENABLED` | `false` |

---

## 3. Machine qualification results

Read-only. No database connection.

| Check | Result |
|---|---|
| Docker CLI | absent |
| Docker daemon | not applicable |
| Existing containers | none observed (no Docker) |
| Existing volumes | none observed |
| Relevant host ports | no listeners on 5432/54321/54322/54323/6543 |
| Supabase CLI | absent |
| PostgreSQL tooling | absent |
| npm `supabase` package | not in `package.json` (JS client only) |
| Auto-install | **not performed** |

**Phase 0 conclusion:** this machine is **not** qualified to host local Supabase. Per mission rules, stop and do not install.

---

## 4. Tool versions

| Tool | Version |
|---|---|
| Node | v22.14.0 |
| npm | present (nvm 22.23.3 path) |
| Docker | n/a |
| Supabase CLI | n/a |
| PostgreSQL | n/a |

---

## 5. Local configuration findings

`database/supabase/config.toml` is four lines: a comment plus `project_id = "nwrflbpbhyiqdptmlccm"` (production). It is documented as **not** an execution default. There is no `[api]`, `[db]`, or loopback bind. It must not be treated as a local stack.

`database/README.md` documents `supabase start --workdir database/supabase` and also `supabase link` / `db push`. Those last two must **not** be run from this pod. They were not run.

`.env.example` names production-oriented variables including `DATABASE_URL`. It is not a local stack.

`infrastructure/deploy/docker-compose.yml` is a production Scholar **app** image requiring `/opt/coregrid/scholar.env`. It is not Postgres/PostgREST.

**Proposed local-only config (reviewable, not applied, not written to disk in this mission):**

A future operator machine should use a **separate** local config that does not reuse the production `project_id`, binds API and DB to `127.0.0.1`, and is reviewed before `supabase start`. This mission did **not** overwrite `config.toml`.

Suggested shape (not executed):

```toml
# DISPOSABLE LOCAL ONLY. Do not link. Do not db push to remote.
project_id = "sherivs-001-disposable-local"
[api]
enabled = true
port = 54321
bind_addr = "127.0.0.1"
[db]
port = 54322
```

Do not `supabase link`. Do not publish 54321/54322 on `0.0.0.0`.

---

## 6. Existing-resource safety checks

| Resource | Observation | Action |
|---|---|---|
| Docker containers | none | none |
| Docker volumes | none | none |
| `config.toml` | production-ref documentation pin | **not modified** |
| User data | none identified | none |
| Destructive Docker commands | n/a | **not run** (`down -v`, `volume prune`, `system prune` unused) |

---

## 7. Environment isolation evidence

Isolation **cannot** be established. There is no local listener to qualify as disposable.

Shell classification (names only; values not printed):

| Variable | Present |
|---|---|
| `SHERIVS_DATABASE_TARGET` | absent |
| `SHERIVS_DISPOSABLE_PG_LIFECYCLE` | absent |
| `SHERIVS_DISPOSABLE_DATABASE_URL` | absent |
| `SHERIVS_CONFIRM_PRODUCTION` | absent |
| `DATABASE_URL` | present |
| `STAGING_DATABASE_URL` | present |
| `SHERIVS_RLS_STAGING_URL` | present |
| `SUPABASE_URL` | present |
| `STAGING_SUPABASE_URL` | present |
| `SUPABASE_SERVICE_ROLE_KEY` | present (unread as a value; unused) |

Qualifier classified the unscoped `DATABASE_URL` candidate as hosted Supabase pooler host `aws-1-eu-west-1.pooler.supabase.com:5432`, loopback **false**, production ref **true**. **No connection was opened.**

Connecting would be production or staging access. STOP.

---

## 8. Service availability

| Service | Status |
|---|---|
| PostgreSQL | **not available** |
| Supabase Auth / GoTrue | **not available** |
| PostgREST | **not available** |
| Local synthetic JWT minting | **not available** |

No remote service was contacted to complete startup. No paid infrastructure was provisioned.

Startup of services **was not attempted**.

---

## 9. Qualifier output

Command:

```
node scripts/sherivs-001-qualify-disposable-pg.mjs
```

Result (sanitized; no userinfo):

- Exit **2**
- `qualified: false`
- `code: DISPOSABLE_PRODUCTION_REF`
- `connects: false`
- `candidate: DATABASE_URL`
- `lifecycle: null`
- Reasons: missing `SHERIVS_DATABASE_TARGET`; missing ephemeral-local lifecycle; production ref in candidate; unscoped `DATABASE_URL` while staging URL variables are present

**Phase 3 gate failed.** Required exit 0 / `qualified: true` was not met. Stop.

---

## 10. Harness inspect output

Command:

```
node scripts/sherivs-001-disposable-exec.mjs --operation=inspect
```

Result (sanitized):

- Exit **0** (pinned SHA-256 values match on disk)
- `operation: inspect`
- `qualified: false`
- `authorized: false`
- `connected: false`
- `executedSql: false`
- `connects: false`
- `liveExecuteEnabled: false`
- `candidate: SHERIVS_DISPOSABLE_DATABASE_URL`
- `code: DISPOSABLE_URL_MISSING`
- SHA matches: forward **true**, rollback **true**

Inspect did not connect. Apply was not invoked. Live execute was not enabled.

---

## 11. Production / staging protections (unchanged)

- Qualifier mixed-shell refusal (`DISPOSABLE_MIXED_URL_ENV`) remains.
- Harness never uses `DATABASE_URL`; live execute false.
- `requirePostgresTarget()` still required for `db-apply*.mjs`.
- Staging runner still excludes `*.sql.proposed` and returns `LIVE_EXECUTE_NOT_ENABLED`.
- These guards were **not** disabled.

---

## 12. Transaction contract (preserved, not executed)

Proposed file: explicit `BEGIN`/`COMMIT`.

| Tool | Wrap | Use for this file |
|---|---|---|
| `db-apply-one.mjs` | no pre-wrap; `DATABASE_URL` for development; `*.sql` only | **Do not use** |
| `db-apply.mjs` | no pre-wrap; every `*.sql` | **Do not use** |
| `runner.mjs` | outer `BEGIN` / query / ledger / `COMMIT` | **Do not use**; inner `COMMIT` would close the outer txn before ledger write |
| Disposable harness | apply not implemented; no outer wrap | inspect only this mission |

Future execution must stay on the reviewed harness after live execute is separately authorized. Not this mission.

---

## 13. Security test environment (documented, not executed)

Do **not** run these until a qualified local stack exists and a later mission applies the freeze SQL via the harness.

Synthetic identities (future): create users only in the local Auth service; insert matching `public.users` rows; never reuse production/staging ids or keys.

| # | Test | Future method | This mission |
|---|---|---|---|
| 1–4 | Self / profile PATCH | Local user JWT → local PostgREST | **not executed** |
| 5 | Provisioning | Local service-role HTTP after Test 7 | **not executed** |
| 6 | Missing JWT `sub` | Anon/missing sub PATCH | **not executed** |
| 7 | Service-role `current_user` | Real PostgREST with **local** key | **not executed** |
| 8 | SECURITY DEFINER | Local DEFINER wrapper + helper RPC | **not executed** |
| 9 | Trigger bypass | Local `authenticated` ALTER/UPDATE | **not executed** |
| 10 | Rollback | Disposable copy via harness, no outer wrap | **not executed** |

`SET ROLE` is not a PostgREST test.

---

## 14. Blockers

1. Docker CLI and daemon absent.
2. Supabase CLI absent.
3. PostgreSQL server/tools absent.
4. Qualifier exit 2 on production-shaped `DATABASE_URL`; no `SHERIVS_DISPOSABLE_DATABASE_URL`.
5. `config.toml` is a production project-ref pin, not a local bind config.
6. Automatic install forbidden; sudo unused.

Environment is **not** ready for a separate verification mission that applies SQL.

---

## 15. Exact files changed

- `docs/security/SHERIVS-001-OPERATOR-OWNED-SUPABASE-BOOTSTRAP-001.md`

Proposed SQL, `config.toml`, harness live-execute flag, runners, and qualifier logic were **not** modified in this mission.

---

## 16. Test commands and results

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

`VITEST_EXIT:0`. These are **not** PostgreSQL results. Qualifier CLI exit 2 and harness inspect `connected: false` are recorded in §9–§10.

---

## 17. Live-resource and SQL-execution declarations

**No production database was accessed.**  
**No staging database was accessed.**  
No remote database was probed. No `pg.Client.connect`. No `psql`. No `supabase start`. No `supabase link`. No `db push`. No Docker. No deploy, DNS, or cloud project change.

**The proposed identity-freeze SQL was not executed.**  
Live disposable execution remains disabled.

---

## 18. Ready for a separate verification mission?

**No.**

Services are not up. Qualifier is not exit 0. Isolation is not established.

---

## 19. Single safest next action

Move this workflow to a machine that **already** has Docker Engine and the Supabase CLI, with operator permission to start loopback-only containers. Do not install Docker in this pod. Do not apply `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416`. Do not enable `DISPOSABLE_LIVE_EXECUTE_ENABLED`.

---

## 20. Verdict statement

**BLOCKED.**

The machine cannot be safely qualified as a local Supabase host. SHERIVS-001 remains OPEN. Bootstrap did not succeed. The security migration is not verified.
