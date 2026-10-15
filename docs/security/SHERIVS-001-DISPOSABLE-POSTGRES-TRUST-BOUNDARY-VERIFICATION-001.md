# SHERIVS-001-DISPOSABLE-POSTGRES-TRUST-BOUNDARY-VERIFICATION-001

**Mission ID:** SHERIVS-001-DISPOSABLE-POSTGRES-TRUST-BOUNDARY-VERIFICATION-001  
**Mission class:** Critical security infrastructure / isolated database verification  
**Engineering mode:** Evidence-first, fail-closed, repository-bound, non-production  
**Version-target classification:** ACTIVE-V1 identity verification only. No V2/V3 work.  
**Verification date:** 2026-10-15  
**Final verdict:** **BLOCKED**

The current execution environment **cannot be qualified** as an isolated disposable PostgreSQL/PostgREST host. No database connection was opened. The proposed SQL was **not executed**. SHERIVS-001 remains **OPEN**. This mission does not authorize staging or production application.

PostgreSQL integration tests were **not executed**. PostgREST was **not available**. `current_user` under a service-role request was **not measured**.

---

## 1. Executive verdict

Preferred options were evaluated in order:

| Option | Result |
|---|---|
| A. Repository-supported local Supabase | **Unavailable.** `database/supabase/config.toml` pins production `project_id` as documentation only. No Supabase CLI. No local stack. Compose file is a production VM app image, not a database. |
| B. Disposable local PostgreSQL reproducing Supabase roles / `auth.uid()` / PostgREST | **Unavailable.** No `psql`, `postgres`, `initdb`, Docker, Podman, or listener on 5432/54322. Plain PostgreSQL would still not be PostgREST without additional services. |
| C. Separate authorized isolated environment | **Required.** This cloud pod is not that environment. Remote URLs present here are production or staging and were not used. |

Installing PostgreSQL or Docker would require elevated privileges (`sudo=yes`), system package changes, and possibly a network service. This mission forbids automatic installation under those conditions. A user-space WASM engine (`pglite`) is not installed and would not be PostgREST.

**STOP before connecting** was followed. Isolation was independently verified as **absent**, not inferred from variable names.

A fail-closed **qualification gate** was added so a future environment cannot treat `DATABASE_URL` or `LOCAL_DATABASE_URL` as local without a loopback hostname check. The gate does not connect.

---

## 2. Repository baseline

| Item | Value |
|---|---|
| Repository root | `/workspace` |
| Historical baseline branch | `cursor/sherivs-001-trusted-db-exec-context-d80b` |
| Historical baseline HEAD | `4f730f5cdd003f38c0de1512f1d7c1f0a82bd883` (confirmed) |
| Working tree at inspection | clean |
| Uncommitted user work | none |
| This mission branch | `cursor/sherivs-001-disposable-postgres-verify-d80b` |
| Report commit | `47d7f5da3aa14101f4600ce91bc8389924a3ccd0` |
| Qualifier commit | `34ca40f121d9e661e13b4306117223300d5a9e71` |
| Proposed SQL | `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` |
| Proposed SHA-256 | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (confirmed) |
| Rollback SHA-256 | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` |
| Prior verification report | `docs/security/SHERIVS-001-TRUSTED-DATABASE-EXECUTION-CONTEXT-VERIFICATION-001.md` |
| OS | Ubuntu 24.04.5 LTS, Linux 6.12.94+, x86_64, uid 1000 |

Hashes and HEAD matched the previous report. Proposed SQL remains unapplied.

---

## 3. Environment capabilities

| Capability | Observed |
|---|---|
| Docker binary | absent |
| Docker daemon | not applicable |
| Podman / nerdctl | absent |
| Supabase CLI | absent |
| `psql` / `postgres` / `initdb` / `pg_isready` | absent |
| `/usr/lib/postgresql` | absent |
| Listen 5432 / 54322 / 6543 | none |
| `pg` npm package | present (`node_modules/pg`) — unused; a driver is not a server |
| `@electric-sql/pglite` | not installed |
| `apt-get` | present |
| Passwordless sudo | available — **not used** to install infrastructure |
| Network listener created by this mission | none |

---

## 4. Environment-variable classification (no values printed)

`SHERIVS_DATABASE_TARGET`: **unset**.  
`SHERIVS_CONFIRM_PRODUCTION`: **unset**.  
`LOCAL_DATABASE_URL`: **absent**.  
`DEVELOPMENT_DATABASE_URL`: **absent**.  
`PRODUCTION_DATABASE_URL`: **absent**.

| Variable | Present | Sanitized classification |
|---|---|---|
| `DATABASE_URL` | yes | postgresql host `aws-1-eu-west-1.pooler.supabase.com:5432`, loopback **false**, production project ref **true** |
| `STAGING_DATABASE_URL` | yes | postgresql host `db.dvxszhracsjwdancijdc.supabase.co:5432`, staging **true** |
| `SHERIVS_RLS_STAGING_URL` | yes | https host `dvxszhracsjwdancijdc.supabase.co`, staging **true** |
| `SUPABASE_URL` | yes | https host `nwrflbpbhyiqdptmlccm.supabase.co`, production **true** |
| `STAGING_SUPABASE_URL` | yes | staging HTTPS host |
| Service-role key names | present | **not read as values; not used** |

Positive isolation CLI (no connect):

```
node scripts/sherivs-001-qualify-disposable-pg.mjs
```

Result: `qualified: false`, `code: DISPOSABLE_PRODUCTION_REF`, `connects: false`, **exit 2**. Candidate was unscoped `DATABASE_URL`. Reasons: missing `SHERIVS_DATABASE_TARGET`, production ref in the candidate, staging/production URL variables also present.

---

## 5. Isolation evidence

Independent checks (not variable-name inference):

1. Hostname of `DATABASE_URL` is a remote Supabase pooler, not loopback.
2. Username/ref scan of that URL contains production ref `nwrflbpbhyiqdptmlccm`.
3. No process listens on local PostgreSQL ports.
4. Qualifier refuses `LOCAL_DATABASE_URL` when the host is remote (unit test with a production-shaped fixture).
5. `database/supabase/config.toml` `project_id` is the production ref and is documented as **not** an execution default.

**Isolation: FAIL.** Connecting would be production or staging access.

---

## 6. Database engine and version

**Not available.** No local server. Remote engines were not queried.

---

## 7. Supabase / PostgREST availability

**Not available.** No CLI, no local API, no local Kong/PostgREST. `infrastructure/deploy/docker-compose.yml` runs the Scholar app image on a VM and requires `/opt/coregrid/scholar.env`; it is not a disposable database. Real PostgREST role switching **cannot** be measured here. A direct SQL `SET ROLE` simulation would **not** satisfy that requirement and was not substituted.

---

## 8. Exact execution contexts tested

| Context | Executed? |
|---|---|
| Synthetic user JWT via PostgREST | NO |
| Anonymous PostgREST | NO |
| Service-role key via PostgREST | NO |
| Direct SQL as `authenticated` / `anon` / `service_role` / `postgres` | NO |
| SECURITY DEFINER UPDATE vs INVOKER trigger | NO |
| No JWT subject | NO |
| Transaction-local `SET ROLE` / request GUCs | NO |

Measured `current_user` / `session_user` / `auth.uid()`: **none**.

---

## 9. Security tests A–J

All **NOT EXECUTED** (environment not qualified). A skipped test is not a pass.

| Test | Expected | Actual |
|---|---|---|
| A Self `role` | Rejected by DB control | NOT EXECUTED |
| B Self `school_id` | Rejected | NOT EXECUTED |
| C Self `is_active` | Rejected | NOT EXECUTED |
| D Permitted profile field | Allowed if policy permits | NOT EXECUTED |
| E Authorized provisioning | Succeeds only on verified path | NOT EXECUTED |
| F No subject, privilege column | No implicit trust | NOT EXECUTED |
| G Authenticated / anonymous | Per measured roles | NOT EXECUTED |
| H SECURITY DEFINER | Effective-role semantics | NOT EXECUTED |
| I Trigger disablement | Ordinary caller cannot | NOT EXECUTED |
| J Controlled migration failure | Rollback per contract | NOT EXECUTED |

---

## 10. Transaction behavior

**Not measured on PostgreSQL.**

Static source (unchanged):

- Forward proposal wraps helper replacement and trigger install in `BEGIN`/`COMMIT`.
- `scripts/db-apply.mjs` / `db-apply-one.mjs`: `requirePostgresTarget()` then `client.query(sql)` with **no** pre-wrap. File-level `BEGIN`/`COMMIT` is the intended boundary for those tools. They were **not** run (would require a qualified URL and would apply SQL).
- `scripts/staging/sherivs-restore/runner.mjs`: outer `BEGIN`; `query(sql)`; ledger insert; `COMMIT`. An inner `COMMIT` in the proposal would close that outer transaction before the ledger write. The file remains `*.sql.proposed` and is excluded from the pin. Nested-transaction behavior was **not** executed.

**Runner contract remains unresolved at runtime.** That is a documented blocker, not a PASS.

---

## 11. Migration-runner compatibility

Inspected, not executed. Incompatibility between file-level `COMMIT` and runner pre-wrap is **STATIC_SOURCE_EVIDENCE**. No correction was applied. No live apply. Do not promote the proposal into the runner without stripping inner `COMMIT` or changing the runner under a separate review.

---

## 12. Fail-closed design review (without runtime)

No new evidence that `current_user = 'service_role'` is the live PostgREST execution role. No broadening of the exception. No restoration of `auth.uid() IS NULL` as trust. No alternative provisioning function implemented. Proposed SQL bytes were not modified.

---

## 13. Security-invariant matrix

| # | Invariant | Result |
|---|---|---|
| 1 | Ordinary users cannot change own `role` | **NOT VERIFIED** |
| 2 | Ordinary users cannot change own `school_id` | **NOT VERIFIED** |
| 3 | Ordinary users cannot change own `is_active` | **NOT VERIFIED** |
| 4 | Missing JWT identity never grants implicit trust | **NOT VERIFIED** at runtime (proposal source still raises; unapplied) |
| 5 | Trusted exception matches measured PostgreSQL | **NOT VERIFIED** (blocking) |
| 6 | Inactive users cannot authorize via stale identity | **NOT VERIFIED** |
| 7 | Provisioning only through verified path | **NOT VERIFIED** |
| 8 | No alternate bypass | **NOT VERIFIED** live |
| 9 | Migration failure matches verified transaction contract | **NOT VERIFIED** |
| 10 | No production or staging resource accessed | **PASS** |

Source-level offline tests do not establish runtime PASS for 1–9.

---

## 14. Confirmed facts versus assumptions

**Facts:** HEAD/hash confirmation; no local DB tools; qualifier exit 2 on this env; `DATABASE_URL` classified production pooler; 231 offline tests passed; proposed SQL unapplied; sudo not used to install.

**Assumptions unchanged:** PostgREST `SET ROLE` to JWT `role`; service-role key ⇒ `current_user = 'service_role'`.

**Not executed:** all runtime contexts and Tests A–J.

---

## 15. Tests not executed and why

Integration Tests A–J and execution-context measurement require a loopback PostgreSQL **and** PostgREST (or a demonstrated equivalent). This pod has neither. Remote URLs are forbidden. Auto-install of Docker/PostgreSQL would use elevated privileges and was not performed.

---

## 16. Required installation and isolation plan (next authorized environment)

Do **not** use this pod’s `DATABASE_URL` or staging URLs.

A future environment MUST provide, before any connect:

1. Docker daemon usable without targeting shared clouds, **or** a preinstalled local `postgres` + PostgREST/Supabase CLI.
2. Loopback-only bind (`127.0.0.1`). Do not publish 5432 to public interfaces.
3. `SHERIVS_DATABASE_TARGET=development`.
4. `SHERIVS_DISPOSABLE_DATABASE_URL=postgresql://…@127.0.0.1:<local-port>/postgres` (synthetic password, no production keys).
5. `node scripts/sherivs-001-qualify-disposable-pg.mjs` exits **0**.
6. Then, and only then, apply the **proposed** file on that loopback instance via `db-apply-one.mjs` (not `runner.mjs`).
7. Measure `select current_user, session_user, auth.uid();` under:
   - synthetic user JWT through **PostgREST**
   - service-role key through **PostgREST**
   - direct `SET ROLE` (labeled simulation if used)
8. Run Tests A–J on synthetic rows.
9. Cause a statement failure after helpers replace and observe rollback.
10. Tear down the container/data directory; cleanup scripts must hard-code loopback and refuse live refs.

Synthetic JWTs stay inside that environment. Production `SUPABASE_SERVICE_ROLE_KEY` must not be mounted.

---

## 17. Proposed correction

**None to the freeze SQL.** Isolation failed; changing `current_user = 'service_role'` would be guessing.

Qualifier added (does not connect):

- `scripts/lib/sherivs-disposable-pg.mjs`
- `scripts/sherivs-001-qualify-disposable-pg.mjs`
- `tests/unit/sherivs-disposable-pg.test.ts`

---

## 18. Exact changed-file list

- `scripts/lib/sherivs-disposable-pg.mjs`
- `scripts/sherivs-001-qualify-disposable-pg.mjs`
- `tests/unit/sherivs-disposable-pg.test.ts`
- `docs/security/SHERIVS-001-DISPOSABLE-POSTGRES-TRUST-BOUNDARY-VERIFICATION-001.md`

Proposed SQL and rollback **not** changed.

---

## 19. Offline test commands and exit codes

```
npx vitest run \
  tests/unit/sherivs-disposable-pg.test.ts \
  tests/unit/sherivs-sql-comment-strip.test.ts \
  tests/unit/sherivs-001-identity-privilege.test.ts \
  tests/unit/sherivs-db-target.test.ts \
  tests/unit/sherivs-staging-migration-runner.test.ts \
  tests/unit/security-role-gate.test.ts
```

| File | Passed | Failed |
|---|---|---|
| `sherivs-disposable-pg.test.ts` | 9 | 0 |
| `sherivs-sql-comment-strip.test.ts` | 10 | 0 |
| `sherivs-001-identity-privilege.test.ts` | 54 | 0 |
| `sherivs-db-target.test.ts` | 23 | 0 |
| `sherivs-staging-migration-runner.test.ts` | 108 | 0 |
| `security-role-gate.test.ts` | 27 | 0 |
| **Total** | **231** | **0** |

`VITEST_EXIT:0`. Log: `/opt/cursor/artifacts/sherivs-001-disposable-pg-offline-tests.log`.

Qualifier CLI: exit **2** (not qualified). `connects: false`.

These are **not** PostgreSQL results.

---

## 20. Live-resource and SQL-execution declarations

No production connection. No staging connection. No remote database connection. No `pg.Client.connect`. No `psql`. No Supabase CLI. No deploy, DNS, or environment-variable change. Privileged package installation was not performed.

**The proposed SQL was not executed.**

---

## 21. Safest next step

Authorize a **different** execution environment that already has (or is permitted to run) local Docker + Supabase CLI or local PostgreSQL+PostgREST bound to `127.0.0.1`. Require `qualifyDisposablePostgres` to return `qualified: true` **before** any `pg` connect. Then measure PostgREST `current_user` under the service-role key.

Do not apply `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` to staging or production from this pod.

---

## 22. Verdict statement

**BLOCKED.**

The environment cannot be qualified. Critical execution context remains unverified. The runner nested-transaction question remains unexecuted. Offline tests passing is not a runtime PASS.
