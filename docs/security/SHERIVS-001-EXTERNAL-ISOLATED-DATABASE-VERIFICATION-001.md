# SHERIVS-001-EXTERNAL-ISOLATED-DATABASE-VERIFICATION-001

**Mission ID:** SHERIVS-001-EXTERNAL-ISOLATED-DATABASE-VERIFICATION-001  
**Mission class:** Critical security verification / controlled environment handoff  
**Engineering mode:** Evidence-first, fail-closed, repository-bound, non-production  
**Version-target classification:** ACTIVE-V1 identity verification only. No V2/V3 work.  
**Verification date:** 2026-10-15  
**Final verdict:** **BLOCKED**

This mission prepares a reproducible handoff for a separately authorized isolated PostgreSQL/PostgREST environment. It does **not** qualify such an environment in the current execution pod. It does **not** claim runtime verification has passed.

No database connection was opened. The proposed SQL was **not executed**. SHERIVS-001 remains **OPEN**. The trusted execution exception remains `current_user = 'service_role'` and is **unmeasured** on a live PostgREST path. The migration-runner transaction contract remains **unmeasured**.

---

## 1. Executive verdict

The current Cloud Agent pod still cannot host a qualifying PostgreSQL/PostgREST instance. Historical claims (HEAD `e7f8b8dd4de9511323b2ca3c0a519cc2b8d3403f`, proposed SHA-256 `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416`, 231 offline tests) were re-verified at inspection before this branch diverged. They describe **source** evidence only.

This mission:

1. Reviewed the disposable-Postgres qualifier.
2. Corrected a real fail-open in URL classification (`?host=` / `?hostaddr=` / `?port=` libpq overrides; missing explicit port; missing lifecycle attestation).
3. Defined the external environment contract.
4. Defined the runtime security test matrix (all **NOT EXECUTED** here).
5. Restated the migration-runner `BEGIN`/`COMMIT` incompatibility as static source evidence.

A specification without a qualified environment is not a runtime PASS. **BLOCKED** is the correct result.

---

## 2. Repository baseline

Verified at inspection on `cursor/sherivs-001-disposable-postgres-verify-d80b` before this branch was created:

| Item | Value |
|---|---|
| Repository root | `/workspace` |
| Historical baseline branch | `cursor/sherivs-001-disposable-postgres-verify-d80b` |
| Historical baseline HEAD | `e7f8b8dd4de9511323b2ca3c0a519cc2b8d3403f` (confirmed) |
| Working tree at inspection | clean |
| This mission branch | `cursor/sherivs-001-external-isolated-db-verify-d80b` |
| Qualifier correction commit | `d0ac023c8bd1f769b9abc63de14f690ef80dfc50` |
| Offline-results report commit | `3e6fd6272fc903be3b4f64e829cc5bfa66af03e8` |
| Proposed SQL | `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` |
| Proposed SHA-256 | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (confirmed; **unchanged**) |
| Rollback SHA-256 | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` (**unchanged**) |
| Prior BLOCKED reports | `docs/security/SHERIVS-001-TRUSTED-DATABASE-EXECUTION-CONTEXT-VERIFICATION-001.md`, `docs/security/SHERIVS-001-DISPOSABLE-POSTGRES-TRUST-BOUNDARY-VERIFICATION-001.md` |
| Pin | `PINNED_MIGRATION_COUNT = 71`, `PINNED_SOURCE_COMMIT = d195ba861f80379b79533126653b9cee82a8e872` |
| Production project ref | `nwrflbpbhyiqdptmlccm` |
| Staging project ref | `dvxszhracsjwdancijdc` |

`database/supabase/config.toml` still pins production `project_id` as documentation only. It is not an execution default.

Proposed SQL bytes were not modified. The trusted skip remains `IF current_user = 'service_role' THEN RETURN NEW`. `auth.uid() IS NULL` is still not a trust predicate.

---

## 3. Qualifier implementation review

Reviewed without connecting:

- `scripts/lib/sherivs-disposable-pg.mjs`
- `scripts/sherivs-001-qualify-disposable-pg.mjs`
- `tests/unit/sherivs-disposable-pg.test.ts` (pre-correction: 9 tests)
- `scripts/lib/sherivs-db-target.mjs`
- `scripts/staging/sherivs-restore/tls.mjs` (`parseDiscreteConnection` already refuses `host` / `hostaddr`)
- `node_modules/pg-connection-string/index.js` (query `host` **overrides** URL hostname; query `port` **overrides** URL port)

### 3.1 What the qualifier checked before this mission

Positive checks, connection-free:

- `SHERIVS_DATABASE_TARGET` must be `development`.
- Candidate URL from `SHERIVS_DISPOSABLE_DATABASE_URL` → `LOCAL_DATABASE_URL` → `DEVELOPMENT_DATABASE_URL` → `DATABASE_URL`.
- WHATWG `URL` parser; protocol `postgres` / `postgresql`.
- Authority hostname in `{localhost, 127.0.0.1, ::1}` after bracket strip.
- Whole-string scan for production/staging project refs.
- Hosted Supabase hostname patterns.
- Unscoped `DATABASE_URL` refused while staging/production URL variables are present.
- `connects: false`. No `pg` import. CLI JSON omits userinfo.

### 3.2 Defects found (pre-correction)

| ID | Defect | Risk |
|---|---|---|
| Q-1 | Authority hostname only. `?host=` / `?hostaddr=` ignored. node-pg copies search params onto `config` and **does not** set `config.host` from the URL when `host` is already present. | `postgresql://…@127.0.0.1:54322/postgres?host=db.example.com` classified as loopback while a later `pg.Client` would target the remote host. |
| Q-2 | `?port=` ignored. | Authority port 54322 with `?port=5432` could reach a different listener, including a tunnel. |
| Q-3 | Implicit default port allowed (`url.port \|\| null`). | Intended host/port not verified. |
| Q-4 | Unparseable URLs used a regex `/@([^/:]+)/` salvage for display host (qualification still failed closed on `unparseable`). | Misleading endpoint metadata; removed. |
| Q-5 | Loopback treated as isolation. | SSH tunnel / local proxy to production binds `127.0.0.1` and would qualify. |
| Q-6 | No IPv6 `[::1]` test; no alias tests (`localhost.`, `127.0.0.2`, `0.0.0.0`, IPv4-mapped). | Allowlist behavior unproven. |
| Q-7 | Unix-socket and keyword=value DSNs untested. | Fail-closed path unproven. |

Q-1 is a true fail-open relative to the later connect path. Q-5 is a documented limitation of any connection-free loopback check.

### 3.3 What the qualifier still cannot prove

Loopback + lifecycle attestation **does not** prove:

- The listener is disposable (vs a tunnel to production).
- The operator owns create/teardown.
- PostgREST is present.
- `current_user` under a service-role HTTP request.

`SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local` is an explicit operator claim, not cryptographic proof. Variable names (`LOCAL_DATABASE_URL`, `NODE_ENV=development`) remain untrusted.

The qualifier does **not** connect, so it cannot follow TCP, TLS, or HTTP redirects. PostgreSQL URLs are not HTTP redirectors. The practical redirect analogue is `?host=` / `?hostaddr=` / `?port=` (now refused) and SSH/local forwards (attestation + ownership evidence required at runtime).

### 3.4 Credentials and fail-closed parsing

- Classification never returns the raw URL or userinfo.
- `assertDisposablePostgres` runs reasons through `redactSecrets`.
- CLI prints JSON of the classification object only.
- Malformed / keyword=value DSNs: `URL` constructor throws → `DISPOSABLE_URL_UNPARSEABLE`, host `null`. No regex salvage.
- Empty-authority unix socket (`postgresql:///postgres?host=/tmp`): unparseable.
- Unencoded `@` in userinfo: WHATWG uses the last `@`; if the resulting host is not loopback, qualification fails. Tests cover a remote-host outcome.

### 3.5 Production / staging exclusions (unchanged)

Refused when the candidate string contains:

- production ref `nwrflbpbhyiqdptmlccm`
- staging ref `dvxszhracsjwdancijdc`
- `*.supabase.co` / `*.supabase.com` hosts

Targets `staging` and `production` are refused even with a loopback URL. Unscoped `DATABASE_URL` is refused while `STAGING_DATABASE_URL`, `PRODUCTION_DATABASE_URL`, or `SHERIVS_RLS_STAGING_URL` are set.

Environment-target guards in `scripts/lib/sherivs-db-target.mjs` were **not** removed or weakened.

### 3.6 Correction applied (smallest)

`scripts/lib/sherivs-disposable-pg.mjs`:

1. Refuse libpq endpoint-override query keys `host`, `hostaddr`, `port` (case-insensitive), even when the override value is also loopback.
2. Require an explicit authority port in `1..65535`.
3. Require `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`.
4. Drop regex host salvage on parse failure.
5. Regression tests for Q-1–Q-7, IPv6 `[::1]`, aliases, unix sockets, keyword DSNs, lifecycle refusal.

No change to proposed SQL. No change to runner production-ref guards.

---

## 4. Environment qualification requirements

A future environment may begin runtime verification **only** when every item below is true. Prefer an already-established **local Supabase** stack (`supabase start` / local Docker Compose for the Supabase CLI) over assembling PostgreSQL and PostgREST by hand.

### 4.1 Required capabilities

| Capability | Requirement |
|---|---|
| PostgreSQL | Local instance; roles `authenticator`, `anon`, `authenticated`, `service_role`, `postgres`; schema `auth` with `auth.uid()`; table `public.users` matching Scholar identity columns. |
| Supabase Auth-compatible identity | Ability to mint synthetic user JWTs whose `sub` is a `public.users.id`, and a service-role key **local to that stack** (not production/staging secrets). |
| PostgREST | HTTP API that performs the real `SET ROLE` / JWT GUC path. Direct SQL `SET ROLE` is simulation and must be labeled as such. |
| Synthetic identities | Create/delete users and `public.users` rows that never existed in production/staging. |
| Disposable lifecycle | Operator can create and destroy the data directory / containers. Evidence: start log, container/volume id, teardown command, post-teardown listener absence. |
| Network | Listen on loopback only (`127.0.0.1` and/or `::1`). Do not publish 5432/54322/54321 to a public interface. |
| No live dependencies | Do not mount or use production/staging URLs, service-role keys, or project refs. |
| Reproducible setup/teardown | Documented commands; teardown refuses live refs the same way the qualifier does. |
| Preflight gate | `node scripts/sherivs-001-qualify-disposable-pg.mjs` exits **0** with `connects: false` **before** any `pg` connect. |

### 4.2 Required environment variables (values not printed)

Set in the **authorized isolated environment only**:

- `SHERIVS_DATABASE_TARGET=development`
- `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`
- `SHERIVS_DISPOSABLE_DATABASE_URL=postgresql://…@127.0.0.1:<explicit-port>/postgres` (or `[::1]` / `localhost`)
- Local stack API URL and local synthetic keys under names that are **not** the production `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` if those names already point at live projects in that shell.

Do not set `SHERIVS_CONFIRM_PRODUCTION`. Do not use `DATABASE_URL` while staging/production URL variables are present.

### 4.3 Explicit production / staging exclusions

Do **not**:

- Connect with this pod’s `DATABASE_URL` (production pooler).
- Connect with `STAGING_DATABASE_URL` or `SHERIVS_RLS_STAGING_URL`.
- Run `scripts/staging/sherivs-restore/runner.mjs` against any live project.
- Rename `*.sql.proposed` to `*.sql` in this repository to sneak into the pin.
- Use production or staging JWTs, service-role keys, or user ids.
- Select a cloud provider or incur cost without a separate human authorization record.

A remote disposable environment, if ever required, must be **separately authorized**, isolated from Sherivs production/staging, and identified as a test environment. This mission does **not** implement a remote-host qualifier and does **not** authorize cloud provisioning.

### 4.4 Capabilities that plain PostgreSQL cannot reproduce

These require Supabase Auth + PostgREST (or a demonstrated equivalent HTTP role switcher). A `psql` session with `SET ROLE` is **not** a substitute for the rows marked PostgREST below.

| Behavior | Plain PostgreSQL | PostgREST / Auth |
|---|---|---|
| JWT `role` claim → `SET ROLE authenticated` / `service_role` | Not automatic | Yes |
| `session_user` remains `authenticator` while `current_user` is the JWT role | Only if you reproduce authenticator | Yes on the real path |
| `auth.uid()` from `request.jwt.claim.sub` / `request.jwt.claims` | Only if GUCs are set by hand | Yes |
| `Authorization: Bearer <service_role>` + `apikey` from `supabaseAdmin` | No | Yes — this is the PATH E / provisioning path |
| `BYPASSRLS` of `service_role` as assigned by PostgREST | Role attribute can be set, request path cannot | Yes |
| Auth user create + JWT mint | No | Yes |

The blocking measurement is: under a **PostgREST** request authenticating with the **local** service-role key, is `current_user` equal to `service_role` when the INVOKER trigger runs?

### 4.5 Preferred stack

**Preferred:** official local Supabase CLI stack already installed in the authorized environment (`supabase start`), loopback API + DB ports, synthetic project, no link to production `nwrflbpbhyiqdptmlccm` or staging `dvxszhracsjwdancijdc`.

**Acceptable:** Docker Compose that starts Postgres **and** PostgREST **and** GoTrue/Auth with the same role/GUC contract, bound to loopback, torn down after tests.

**Not acceptable:** this Cloud Agent pod; production; staging; pglite-only (no PostgREST); `SET ROLE` in psql labeled as a PostgREST test; any target the qualifier rejects.

This repository’s `database/supabase/config.toml` is a five-line production-ref pin, **not** a local stack definition. `infrastructure/deploy/docker-compose.yml` is a production VM app image, **not** a disposable database.

### 4.6 Preflight sequence (future environment)

1. Prove ownership: show how the instance was created and that production/staging refs are absent from its config.
2. Prove lifecycle: start, note container/data-dir identity, plan teardown.
3. Set the three required variables above. Do not export live URLs into that shell.
4. `node scripts/sherivs-001-qualify-disposable-pg.mjs` → exit 0, `qualified: true`, `connects: false`, `lifecycle: "ephemeral-local"`, `endpoint.loopback: true`, `endpoint.endpointOverrides: []`.
5. Only then may a dedicated disposable apply helper connect. Do not use `runner.mjs`. Do not use `db-apply-one.mjs` until it is taught to read `*.sql.proposed` **and** call `assertDisposablePostgres` — today it matches only `*.sql` and uses `requirePostgresTarget()` without the disposable qualifier.

---

## 5. Security test matrix

**Status: specified, not executed.** No row below is a pass. Do not relabel a simulated SQL session as a PostgREST test.

Shared synthetic fixtures (created only after qualification):

- School A / School B uuids.
- User U-self: JWT `authenticated`, `users.id = auth.uid()`, `role=teacher`, `is_active=true`, `school_id=A`.
- User U-peer: same school, different id.
- User U-admin: `role=admin` (for legitimate other-row updates if RLS permits).
- Local service-role key for that stack only.

Cleanup for every test: delete synthetic rows/users; after the whole battery, destroy the disposable instance. Capture SQLSTATE / HTTP status / response body **without** tokens.

### Test 1 — Authenticated self-update of `role`

- **Setup:** Apply proposed SQL on the disposable DB. Create U-self. Mint user JWT.
- **Execution context:** PostgREST `PATCH /rest/v1/users?id=eq.<U-self>` with user JWT. Body `{ "role": "admin" }`.
- **Expected:** HTTP 4xx; PostgreSQL exception `Forbidden: cannot modify privileged identity fields on your own account`. Row unchanged.
- **Evidence:** HTTP status/body; `SELECT role FROM public.users WHERE id = U-self`; optional `RAISE` SQLSTATE.
- **Cleanup:** none beyond shared teardown if the row is unchanged; otherwise restore.
- **Components:** PostgreSQL + PostgREST + Auth (JWT). Direct SQL `SET ROLE authenticated` is simulation only.

### Test 2 — Authenticated self-update of `school_id`

- **Setup:** Same as Test 1.
- **Execution context:** PostgREST PATCH as U-self, `{ "school_id": "<school B>" }`.
- **Expected:** Rejected; `school_id` remains A.
- **Evidence:** HTTP status; before/after row.
- **Cleanup:** shared.
- **Components:** PostgreSQL + PostgREST + Auth.

### Test 3 — Authenticated self-update of `is_active`

- **Setup:** Same as Test 1.
- **Execution context:** PostgREST PATCH as U-self, `{ "is_active": false }`.
- **Expected:** Rejected; `is_active` remains true.
- **Evidence:** HTTP status; before/after row.
- **Cleanup:** shared.
- **Components:** PostgreSQL + PostgREST + Auth.

### Test 4 — Allowed profile-field update

- **Setup:** Same as Test 1. Choose a non-privileged column already granted/policy-permitted (e.g. `full_name` or `phone` — confirm live grants before asserting).
- **Execution context:** PostgREST PATCH as U-self, privileged columns omitted.
- **Expected:** Success; privileged columns unchanged.
- **Evidence:** HTTP 2xx; before/after privileged vs profile columns.
- **Cleanup:** revert profile field.
- **Components:** PostgreSQL + PostgREST + Auth.

### Test 5 — Legitimate provisioning of another user

- **Setup:** Synthetic new user id; local service-role key.
- **Execution context:** PostgREST (or local `supabaseAdmin` equivalent) **service-role** upsert/update of U-new `role` / `school_id` / `is_active`. Separately, if RLS permits, U-admin JWT updating **U-peer** (not self).
- **Expected:** Service-role path succeeds **only if** Test 7 has already measured `current_user = 'service_role'` on that path. U-admin other-row update is allowed by the trigger and still subject to RLS; record allow or RLS deny as measured, not assumed.
- **Evidence:** HTTP status; row; `current_user` probe from Test 7.
- **Cleanup:** delete U-new.
- **Components:** PostgreSQL + PostgREST + Auth. Do not count `SET ROLE service_role` in psql as this test.

### Test 6 — Protected-column update with no JWT subject

- **Setup:** Proposed trigger installed.
- **Execution context A (required):** PostgREST PATCH of privileged columns with anon key / missing `sub`.  
- **Execution context B (labeled simulation):** SQL as a non-`service_role` role with `request.jwt.claim.sub` unset.
- **Expected:** Exception `Forbidden: untrusted execution context cannot modify privileged identity fields`. No implicit trust from `auth.uid() IS NULL`.
- **Evidence:** HTTP/SQLSTATE; row unchanged.
- **Cleanup:** shared.
- **Components:** A requires PostgREST; B is PostgreSQL-only simulation.

### Test 7 — Service-role request through the intended PostgREST path

- **Setup:** Qualified local stack. No production service-role key.
- **Execution context:** HTTP to PostgREST with local service-role secret (`apikey` + `Authorization`), then a statement that records `current_user`, `session_user`, `auth.uid()`, and `current_setting('role', true)` **inside** the INVOKER trigger or an equivalent request-scoped probe.
- **Expected:** Measure, do not assume. Source hypothesis: `current_user = 'service_role'`, `session_user = 'authenticator'`. If `current_user` is not `service_role`, the trusted skip does **not** match the real path — stop and report; do not widen the exception in the same change.
- **Evidence:** Probe query result captured from that HTTP request (log table, `RAISE NOTICE` collected by PostgREST, or a SECURITY INVOKER recorder). Label the capture method.
- **Cleanup:** drop probe objects.
- **Components:** **PostgREST required.** PostgreSQL `SET ROLE` is not this test.

### Test 8 — SECURITY DEFINER execution

- **Setup:** Trigger is `SECURITY INVOKER`. Helpers `get_my_role` / `get_my_school_id` / `is_school_admin` are `SECURITY DEFINER` `sql` functions.
- **Execution context:**  
  1. `UPDATE public.users` issued from a SECURITY DEFINER helper owned by `postgres` (construct a throwaway DEFINER wrapper in the disposable DB).  
  2. Call the three identity helpers as an inactive user JWT via PostgREST RPC or `SELECT`.
- **Expected:** (1) INVOKER trigger sees the **calling** role, not `postgres`, unless `SET ROLE` occurred; privilege change by a non-`service_role` DEFINER wrapper fails closed. (2) Inactive user helpers return NULL / false (PATH E).
- **Evidence:** exception or success; helper return values; `current_user` inside the trigger for (1).
- **Cleanup:** drop throwaway wrapper.
- **Components:** (1) PostgreSQL sufficient if DEFINER wrapper is local; (2) PostgREST + Auth for real JWT `auth.uid()`.

### Test 9 — Bypass or disable the trigger

- **Setup:** Trigger installed; U-self JWT; also a table-owner/`postgres` SQL session on the disposable instance.
- **Execution context:**  
  1. U-self: `ALTER TABLE … DISABLE TRIGGER` via PostgREST RPC (should not exist) or SQL as `authenticated`.  
  2. U-self: `UPDATE` using a view/function that updates `public.users`.  
  3. Owner session: `DISABLE TRIGGER` then privileged self-update (expected to succeed as DBA — document as out-of-band, not a silent skip).  
  4. Attempt `INSERT` of a privileged row as U-self (trigger is BEFORE UPDATE only).
- **Expected:** Ordinary caller cannot disable the trigger. INSERT is **not** covered by this trigger; record the measured INSERT result as a known residual, do not silently expand scope. Owner disable is a DBA action, not a JWT bypass.
- **Evidence:** SQLSTATE for ALTER; INSERT row or denial; owner disable then restore trigger.
- **Cleanup:** `ENABLE TRIGGER` / recreate trigger; delete inserted rows.
- **Components:** 1–2 PostgREST + PostgreSQL; 3–4 PostgreSQL.

### Test 10 — Controlled migration failure and rollback

- **Setup:** Qualified disposable DB **without** the proposed objects, or with a snapshot. Apply path = dedicated disposable helper that submits the **whole file** with **no** outer `BEGIN` (same contract as `db-apply-one.mjs`).
- **Execution context A (file contract):** Submit a **copy used only in the disposable DB** of the proposed file with a deliberate error **after** helper `CREATE OR REPLACE` and **before** `CREATE TRIGGER` (for example an invalid `CREATE TRIGGER` name). Do not commit that copy to git.
- **Expected A:** Transaction aborts; helpers remain at pre-apply definition; trigger absent. `pg_proc` / `pg_trigger` before/after match.
- **Execution context B (runner incompatibility demonstration, optional, labeled):** Outer `BEGIN`; `query(file-sql)`; observe that inner `COMMIT` ends the transaction so a following ledger `INSERT` is **not** in the same transaction; then `ROLLBACK` of a new transaction cannot undo committed DDL. Do this **only** on the disposable DB. Do **not** change `runner.mjs` or promote the file.
- **Evidence:** `pg_proc` / `pg_trigger` snapshots; notice/error; whether objects persist after the failed apply; for B, `SELECT txid_current()` / `txid_current_if_assigned()` or an equivalent before/after inner COMMIT.
- **Cleanup:** restore snapshot or drop proposed objects; destroy the disposable instance.
- **Components:** PostgreSQL. Runner wrap demonstration does not need PostgREST.

---

## 6. Migration-runner contract findings

Inspected, **not executed**.

### 6.1 Proposal

Forward file `BEGIN;` … helpers + trigger … `COMMIT;`. All listed statements are transactional. No `CREATE INDEX CONCURRENTLY` / `VACUUM` / `REINDEX` as migration statements. No `EXCEPTION WHEN OTHERS` in the trigger.

### 6.2 `scripts/db-apply-one.mjs` / `scripts/db-apply.mjs`

- Guard: `requirePostgresTarget()` (explicit `SHERIVS_DATABASE_TARGET`; not the disposable qualifier).
- Execution: `client.query(sql)` with **no** pre-wrap.
- File `BEGIN`/`COMMIT` is the intended boundary **if** node-pg simple Query protocol honors multiple statements in one `query()` (supported for a multi-statement string without parameters).
- `db-apply-one.mjs` selects files with `endsWith(".sql")` and **excludes** `*.sql.proposed`. That is a safety property: the proposed freeze cannot be applied accidentally by filename prefix today.
- `db-apply.mjs` likewise lists `*.sql` only.

Runtime of this contract: **NOT EXECUTED**.

### 6.3 `scripts/staging/sherivs-restore/runner.mjs`

```
BEGIN
  query(sql)
  INSERT ledger schema_migrations
  markSucceededInTransaction
COMMIT
```

An inner `COMMIT` in the proposal would close that outer transaction **before** the ledger insert. Subsequent ledger writes would auto-commit separately. A later `ROLLBACK` in the `catch` path cannot undo DDL already committed by the inner `COMMIT`.

Additional runner guards (leave in place):

- `inspectWorkingTree` ignores `*.sql.proposed`.
- `verifyLoadedFiles` fails `PROPOSED_SQL_EXCLUDED` if a proposed file is loaded.
- Execute mode still requires staging-ref confirmation and currently returns `LIVE_EXECUTE_NOT_ENABLED`.
- This mission must not run execute mode against staging.

### 6.4 Safest disposable transaction test (once an environment exists)

1. Do **not** remove environment-target or production-ref guards.
2. Do **not** promote the proposal into the pin.
3. Do **not** use `runner.mjs` as the apply tool for this file.
4. Add (in a later mission) a disposable-only helper that:  
   `assertDisposablePostgres(env)` → connect to the qualified loopback URL only → `client.query(proposedSql)` with **no** outer wrap → disconnect. Refuse if qualifier fails.
5. Run Test 10A on that helper.
6. Optionally run Test 10B as a labeled demonstration of why promotion into `runner.mjs` is unsafe, then discard that database.
7. Only after 10A passes, run Tests 1–9.

Do not “fix” the discrepancy by deleting `BEGIN`/`COMMIT` from the proposal in the same change as an untested runner wrap, and do not add a second transaction wrapper in the disposable helper.

---

## 7. Known limitations

- This pod has no PostgreSQL, no PostgREST, no Supabase CLI, no Docker (reconfirmed as still BLOCKED; no install attempted).
- Qualifier cannot detect an SSH tunnel that binds loopback.
- Qualifier does not inspect `PGHOST` / `PGHOSTADDR` / `PGPORT`. node-pg `connectionString` parse overwrites host/port from the URL **unless** query overrides exist (now refused). Operators must not rely on libpq environment to retarget.
- Lifecycle attestation is operator-asserted.
- `db-apply-one.mjs` cannot apply `*.sql.proposed` today.
- Offline unit tests do not execute SQL.
- Trusted skip `current_user = 'service_role'` is still a source hypothesis.

---

## 8. Proposed qualifier correction

Applied in this mission (see §3.6). Proposed freeze SQL: **no change**.

---

## 9. Exact changed-file list

- `scripts/lib/sherivs-disposable-pg.mjs`
- `scripts/sherivs-001-qualify-disposable-pg.mjs`
- `tests/unit/sherivs-disposable-pg.test.ts`
- `docs/security/SHERIVS-001-EXTERNAL-ISOLATED-DATABASE-VERIFICATION-001.md`

Proposed SQL and rollback **not** changed. Runner, db-target, pin, and environment-target guards **not** weakened.

---

## 10. Offline test commands and results

Commands:

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
| `sherivs-disposable-pg.test.ts` | 26 | 0 |
| `sherivs-sql-comment-strip.test.ts` | 10 | 0 |
| `sherivs-001-identity-privilege.test.ts` | 54 | 0 |
| `sherivs-db-target.test.ts` | 23 | 0 |
| `sherivs-staging-migration-runner.test.ts` | 108 | 0 |
| `security-role-gate.test.ts` | 27 | 0 |
| **Total** | **248** | **0** |

`VITEST_EXIT:0`. Log: `/opt/cursor/artifacts/sherivs-001-external-isolated-offline-tests.log`.

These are **not** PostgreSQL results. They do not measure `current_user` under PostgREST.

Qualifier CLI (no connect) in this pod:

```
node scripts/sherivs-001-qualify-disposable-pg.mjs
```

Result: `qualified: false`, `code: DISPOSABLE_PRODUCTION_REF`, `connects: false`, `lifecycle: null`, **exit 2**. Candidate was unscoped `DATABASE_URL`. Reasons: missing `SHERIVS_DATABASE_TARGET`, missing `SHERIVS_DISPOSABLE_PG_LIFECYCLE`, production ref in the candidate, staging/production URL variables also present. Sanitized JSON: `/opt/cursor/artifacts/sherivs-001-qualify-cli.sanitized.json`.

---

## 11. Live-resource access declaration

No production database access.  
No staging database access.  
No remote database probing.  
No `pg.Client.connect`.  
No `psql`.  
No Supabase CLI.  
No use of `DATABASE_URL` as a connection target.  
No deployment, DNS, or credential disclosure.  
No privileged package installation.  
No cloud environment provisioning.

**No database was accessed.**

---

## 12. SQL-execution declaration

**The proposed SQL was not executed.**  
The rollback proposed SQL was not executed.  
No migration was applied.  
No `BEGIN`/`COMMIT` runtime behavior was measured.

---

## 13. Exact prerequisite for beginning runtime verification

All of the following, in order:

1. A separately authorized environment that already provides (or is permitted to run) local Supabase or loopback PostgreSQL **plus** PostgREST and Auth-compatible JWT issuance.
2. Operator ownership and teardown evidence for that instance.
3. `SHERIVS_DATABASE_TARGET=development`
4. `SHERIVS_DISPOSABLE_PG_LIFECYCLE=ephemeral-local`
5. `SHERIVS_DISPOSABLE_DATABASE_URL` with loopback authority, explicit port, no `host`/`hostaddr`/`port` query overrides, no production/staging refs.
6. `node scripts/sherivs-001-qualify-disposable-pg.mjs` exits 0.
7. A disposable-only apply helper that calls `assertDisposablePostgres` before connect and submits the proposed file without an outer transaction wrap (not `runner.mjs`; not unscoped live `DATABASE_URL`).
8. Then Test 7 (PostgREST `current_user`) and Test 10A (rollback) before treating provisioning as verified.

Until step 6 succeeds, **stop**. Do not connect. Do not apply.

---

## 14. Verdict statement

**BLOCKED.**

An external environment was specified. None was qualified. Runtime verification has not passed. SHERIVS-001 remains OPEN.
