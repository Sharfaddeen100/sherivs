# SHERIVS-001-OPERATOR-LOCAL-STACK-QUALIFIER-001

**Mission ID:** SHERIVS-001-OPERATOR-LOCAL-STACK-QUALIFIER-001  
**Mission type:** Operator-machine disposable PostgreSQL qualification  
**Version-target classification:** ACTIVE-V1 identity verification environment only. No V2/V3 work.  
**Date:** 2026-10-18  
**Parent branch:** `cursor/sherivs-001-operator-env-handoff-local-stack-d80b`  
**Parent HEAD:** `daba88666e07618405c332903403451195f9a3d4`  
**Result commit:** `8be072b0c31d02bbb36b554ad77b8fb482604947`  
**Final verdict:** **QUALIFIER PASS**  
**SHERIVS-001 status:** **OPEN**

This mission completes the exact next step from `docs/security/SHERIVS-001-OPERATOR-ENVIRONMENT-HANDOFF-AND-LOCAL-STACK-001.md` on the authorized operator machine. It qualifies a loopback disposable database URL. It does **not** close SHERIVS-001. Contexts A–D were **not** measured. The proposed identity-freeze SQL was **not** applied. Production and staging were **not** accessed. Live execute remains disabled.

---

## 1. Outcome

```
node scripts/sherivs-001-qualify-disposable-pg.mjs
→ exit 0
  qualified=true
  code=DISPOSABLE_QUALIFIED
  candidate=SHERIVS_DISPOSABLE_DATABASE_URL
  target=development
  lifecycle=ephemeral-local
  connects=false
  endpoint.host=127.0.0.1
  endpoint.port=54322
  endpoint.loopback=true
  endpoint.hostedSupabase=false
  endpoint.endpointOverrides=[]
  endpoint.refs.production=false
  endpoint.refs.staging=false
  reasons=[]
```

Companion inspect, same process environment, did not connect and did not execute SQL:

```
node scripts/sherivs-001-disposable-exec.mjs --operation=inspect
→ exit 0
  code=DISPOSABLE_INSPECT_OK
  qualified=true
  connected=false
  executedSql=false
  liveExecuteEnabled=false
  gates.shaPinned=true
  gates.authorized=false
  gates.noForbiddenUrlEnv=true
  gates.noLiveProjectRefEnv=true
  gates.connectorInjected=false
```

Forward SHA-256 `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` matches the pin (`shaMatches=true`, 9454 bytes).  
Rollback SHA-256 `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` matches the pin (`shaMatches=true`, 1578 bytes).

The qualifier source was not modified. It still does not open a database connection (`connects=false`).

---

## 2. Operator machine

| Item | Value |
|---|---|
| Host | Ubuntu 26.04 LTS, Linux 7.0.0-1006-aws |
| Docker CLI / Engine | 29.1.3, unix socket `/var/run/docker.sock` |
| Docker group | `ubuntu` primary group `docker` (no `sg` required) |
| Supabase CLI | 2.121.0 |
| `psql` | 18.6 |
| Node | v24.5.0 |
| Repository | `/home/ubuntu/coregrid-scholar-migration` |
| Live URL names in the login shell | none (`DATABASE_URL`, `STAGING_DATABASE_URL`, `PRODUCTION_DATABASE_URL`, `SHERIVS_RLS_STAGING_URL`, `SUPABASE_URL` unset) |

`database/supabase/config.toml` in the repository was not modified. It remains the four-line production `project_id` pin and was not used as an execution default.

---

## 3. Local stack (outside the repository)

Workdir: `/tmp/sherivs-001-local` (not in the git tree).  
`project_id = "sherivs-001-local"`. That id is not the production ref and not the staging ref.  
`supabase link` was not run. `supabase db push` was not run.

Canonical migrations copied: **69** `*.sql` files.  
`*.sql.proposed` copied: **0**. The identity-freeze proposal was not in the local migration directory and was not applied.

`supabase start --yes --workdir /tmp/sherivs-001-local` applied those 69 files on the first successful start. Storage was enabled because early migrations create policies on `storage.objects`. Realtime, Studio, local SMTP, edge runtime, and analytics were disabled. The database pooler was disabled.

Containers that reached healthy on the qualified run:

| Container | Host publish |
|---|---|
| `supabase_db_sherivs-001-local` | `127.0.0.1:54322` → `5432` |
| `supabase_kong_sherivs-001-local` | `127.0.0.1:54321` → `8000` |
| `supabase_auth_sherivs-001-local` | no host port |
| `supabase_rest_sherivs-001-local` | no host port |
| `supabase_storage_sherivs-001-local` | no host port |

`ss` showed listeners only on `127.0.0.1:54321` and `127.0.0.1:54322`. There was no `0.0.0.0` listener and no `[::]` listener for those ports. TCP connect to the host addresses `172.31.35.177`, `172.17.0.1`, and `172.18.0.1` on both ports returned `ConnectionRefusedError`. TCP connect to `127.0.0.1` on both ports succeeded.

Local health, after qualification, from this host into that loopback publish:

| Check | Result |
|---|---|
| `psql` `current_user` | `postgres` |
| `inet_server_addr()` / `inet_server_port()` | `172.18.0.2/32` / `5432` (container address; host publish remained `127.0.0.1:54322`) |
| `server_version` | `17.11` |
| `GET http://127.0.0.1:54321/auth/v1/health` | `200` |
| `GET http://127.0.0.1:54321/rest/v1/` | `200` |

This health probe is not context A, B, C, or D. `auth.uid()` was not measured. PostgREST role identity was not measured.

### Loopback publish

Supabase CLI 2.121.0 publishes with `docker -p <hostPort>:<containerPort>` and an empty `HostIp`. On Docker 29.1.3 that binds `0.0.0.0` and `[::]`. A first start did that. It was stopped before the qualifier ran. Setting `/etc/docker/daemon.json` `{"ip":"127.0.0.1"}` and restarting the daemon did not change the empty `HostIp`.

The qualified start prepended a process-local `docker` wrapper on `PATH` that rewrote only `-p` / `--publish` values without a host address to `127.0.0.1:<hostPort>:<containerPort>`. Inspected `HostIp` was `127.0.0.1`. The wrapper was not committed. After teardown, `/etc/docker/daemon.json` was removed and Docker was restarted, restoring the previous daemon configuration.

---

## 4. Qualifier process environment

The qualifier and inspect processes were given a fresh environment. Present names:

- `SHERIVS_DISPOSABLE_DATABASE_URL` (loopback, explicit port `54322`, no query string)
- `SHERIVS_DATABASE_TARGET=development`
- `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`
- `PATH`, `HOME`, `LANG`

Absent from that process: `DATABASE_URL`, `LOCAL_DATABASE_URL`, `DEVELOPMENT_DATABASE_URL`, `STAGING_DATABASE_URL`, `PRODUCTION_DATABASE_URL`, `SHERIVS_RLS_STAGING_URL`, `SUPABASE_URL`, `STAGING_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

`supabase status -o env` was read only inside that helper process. Connection strings and local key values were not printed and were not committed.

---

## 5. Teardown

```
supabase stop --yes --no-backup --workdir /tmp/sherivs-001-local
```

`--no-backup` removed the disposable data volumes (`backup=false`). After stop, `ss` showed no listeners on `54321` or `54322`, and `docker volume ls` showed no Supabase volumes. The temporary workdir and the publish wrapper were removed. The repository `config.toml` pin was unchanged.

---

## 6. Tests

No application, qualifier, harness, migration, or `config.toml` file was modified. `node_modules` is not installed on this machine, so the previously recorded 266 unit tests were not re-executed here. New evidence is the qualifier exit 0 and the inspect exit 0 above, plus the loopback `psql` and HTTP health checks.

---

## 7. Exact files changed

- `docs/security/SHERIVS-001-OPERATOR-LOCAL-STACK-QUALIFIER-001.md`

---

## 8. Declarations

**Production was not accessed.**  
**Staging was not accessed.**  
No `supabase link`. No `supabase db push`. No remote database connection. The proposed identity-freeze migration was not executed. `runner.mjs` was not used. Live disposable execution remains disabled.

**SHERIVS-001 remains OPEN.** Contexts A–D remain unmeasured. The transaction contract remains unmeasured at runtime.

---

## 9. Exact next step

On a separately scoped mission, measure contexts A–D on a newly created loopback stack with synthetic users only: direct administrative PostgreSQL, authenticated local PostgREST, service-role local PostgREST, and anonymous local PostgREST. Record actual `current_user`, `session_user`, and `auth.uid()` where the API returns them. Do not infer `current_user` from a key name. Do not apply `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` until that mission has an explicit apply contract. Publish host ports on `127.0.0.1` only; CLI 2.121.0 does not do that by itself on Docker 29.

---

## 10. Verdict statement

**QUALIFIER PASS.**

`scripts/sherivs-001-qualify-disposable-pg.mjs` exited 0 against a loopback ephemeral local URL. The stack was stopped and its volumes removed. SHERIVS-001 is not closed.
