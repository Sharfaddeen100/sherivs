# SHERIVS-001-TRUSTED-DATABASE-EXECUTION-CONTEXT-VERIFICATION-001

**Mission ID:** SHERIVS-001-TRUSTED-DATABASE-EXECUTION-CONTEXT-VERIFICATION-001  
**Mission class:** Critical security verification / database trust-boundary assurance  
**Engineering mode:** Evidence-first, fail-closed, repository-bound, non-production  
**Version-target classification:** ACTIVE-V1 identity / Scholar RLS helpers. No V2/V3 work.  
**Verification date:** 2026-10-15  
**Final verdict:** **BLOCKED**

PostgreSQL integration tests were **not executed**. No live database was contacted. The proposed migration was **not applied**. SHERIVS-001 remains **OPEN**.

This mission does not authorize staging or production application.

---

## 1. Executive summary

The current proposed freeze (`62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416`) no longer treats `auth.uid() IS NULL` as trust. Executable plpgsql allows privilege-column UPDATE (`role`, `school_id`, `is_active`) only when `current_user = 'service_role'`, or when an identified JWT caller updates a **different** row (RLS still applies). Identified self-updates of those columns raise. Unidentified non-`service_role` privilege writes raise.

That **source design is fail-closed relative to the previous null-uid skip**. It is **not** a demonstrated PostgreSQL trust boundary.

The critical remaining question is: when `supabaseAdmin` (the `SUPABASE_SERVICE_ROLE_KEY` client) UPDATEs `public.users`, does the BEFORE UPDATE trigger observe `current_user = 'service_role'`?

This environment cannot answer that question safely:

- `SHERIVS_DATABASE_TARGET` is unset.
- `DATABASE_URL` hostname is a remote Supabase pooler; the username contains the **production** project ref `nwrflbpbhyiqdptmlccm`.
- `SUPABASE_URL` is the production HTTPS host.
- `STAGING_DATABASE_URL` / `STAGING_SUPABASE_URL` name staging ref `dvxszhracsjwdancijdc`.
- No local `psql`, `postgres`, Docker, Supabase CLI, or listener on 5432/54322.

Connecting would be production or staging access. Installing a vanilla PostgreSQL server would still not reproduce PostgREST authenticator `SET ROLE` or `auth.uid()`. Runtime tests 1–10 are **NOT EXECUTED**.

**Verdict BLOCKED:** a critical trust-boundary question remains unresolved and the environment cannot be safely verified. Offline tests (222 passed) are source evidence only.

---

## 2. Mission scope and safety boundaries

**In scope:** source tracing of identity/authority/execution context; qualification of any database target; offline tests; transaction-contract inspection; invariant matrix; smallest safe next step.

**Out of scope / not performed:** production or staging connections; SQL execution; migration apply/rollback; Supabase CLI against a live project; deploy; DNS; secret or environment changes; provisioning real users; closing SHERIVS-001/002/003.

**Safety decision:** do not connect. Do not install a PostgreSQL toolchain. Do not modify the proposed SQL in this mission (no runtime evidence supporting a correction).

---

## 3. Repository baseline and commit SHA

| Item | Value |
|---|---|
| Repository root | `/workspace` |
| Inspection branch | `cursor/sherivs-001-proposed-sql-trusted-role-txn-d80b` |
| Inspection HEAD | `0f43deef5488b0f17af3c55f2be4e086d9925369` |
| Working tree at inspection | clean |
| Uncommitted user changes | none |
| Verification branch | `cursor/sherivs-001-trusted-db-exec-context-d80b` |
| Report commit | `6c31999d350b3d9da3cb2bc78933385793ef3b05` |
| Prior SQL-correction report | `docs/security/SHERIVS-001-PROPOSED-SQL-TRUSTED-ROLE-SKIP-AND-TRANSACTION-001.md` |
| Prior independent review | `docs/security/SHERIVS-001-PROPOSED-SQL-INDEPENDENT-REVIEW-001.md` |
| Identity-hardening report | `docs/security/SHERIVS-001-IDENTITY-AND-PRIVILEGE-ESCALATION-HARDENING-001.md` |
| Environment-target report | `docs/security/SHERIVS-ENVIRONMENT-TARGET-AND-DATABASE-TOOLING-HARDENING-001.md` |

Previously reported hashes matched current files. No silent branch switch or history rewrite.

---

## 4. Proposed migration SHA-256

| File | SHA-256 |
|---|---|
| `database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` | `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (215 lines) |
| `database/supabase/rollbacks/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` | `6a9363db98dd3c82036b315e67d38559a0db00583b8ea7de541375a334bfb7e4` (49 lines) |

Status: AUTHORED, NOT APPLIED. Excluded from the canonical 71-file pin (`*.sql.proposed`). Presence in Git is not catalog proof.

---

## 5. Current security finding

**PATH A (confirmed in canonical source, live catalog unknown):** `GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated` plus policy `"User updates self"` (`USING`/`WITH CHECK` only `id = auth.uid()`) lets a JWT caller PATCH `role`, `school_id`, and `is_active` through PostgREST. Application allowlists are not a database boundary.

**Proposed control (unapplied):** BEFORE UPDATE trigger `trg_users_forbid_self_privilege_mutation` calling `public.forbid_self_privilege_mutation()` (SECURITY INVOKER).

**Previous apply blocker B-1:** `auth.uid() IS NULL THEN RETURN NEW` treated missing subject as trust. **Removed in current proposal** (static executable plpgsql).

**Unverified trust exception:** `IF current_user = 'service_role' THEN RETURN NEW`. This is the remaining critical finding for *this* mission: it is a source-level design, not a measured execution context.

**PATH E (helpers ignore `is_active`):** still present in canonical `20260620151525`; proposed helpers add `is_active = true`. Unapplied.

SHERIVS-002 (broad UPDATE grant / non-FORCE RLS) and SHERIVS-003 (sensitive columns) remain OPEN and were not rewritten here.

---

## 6. Trust-boundary / execution-path description

```
Caller
  ├─ Browser / user JWT  → supabase-js → PostgREST
  │     intended DB role after authenticator SET ROLE: authenticated
  │     auth.uid() from JWT sub
  │     UPDATE public.users
  │       RLS: "User updates self" OR "School admin manages users"
  │       BEFORE UPDATE trg_users_forbid_self_privilege_mutation (if applied)
  │         current_user ?=? 'service_role'  → allow privilege columns
  │         else privilege change + uid NULL → RAISE
  │         else privilege change + NEW.id = uid → RAISE
  │         else other-row → RETURN NEW (RLS already decided visibility)
  │
  ├─ Server supabaseAdmin (SUPABASE_SERVICE_ROLE_KEY)
  │     staff-accounts upsert, inviteTeacher insert, demo-provision upsert
  │     intended DB role: service_role   ← UNVERIFIED AT RUNTIME
  │     auth.uid() typically absent      ← UNVERIFIED AT RUNTIME
  │     INSERT is not covered by this UPDATE trigger
  │     UPDATE/UPSERT-as-update would hit the trigger
  │
  └─ Direct SQL as table owner / postgres (dashboard, DEFINER UPDATE)
        current_user is not 'service_role' in the proposed skip
        privilege-column UPDATE intended to RAISE
        DBA recovery: SET ROLE service_role (if granted) or DISABLE TRIGGER
```

Application self-update: `frontend/src/lib/profile.functions.ts` uses the user JWT client after `parseSelfProfilePatch`. Direct PostgREST from the browser is not bound by that parser.

Admin other-user update: `frontend/src/routes/_authenticated/admin/hr.tsx` uses the user JWT client after `parseHrStaffPatch`. Database still sees `authenticated`, not `service_role`.

---

## 7. Findings for `auth.uid()`, `current_user`, and `session_user`

### QUESTION A — `auth.uid()`

| Context | What it represents | Evidence class |
|---|---|---|
| User JWT PostgREST | Intended: JWT `sub` as uuid, matching `auth.users.id` / `public.users.id` | EXTERNAL_DOCUMENTATION_EVIDENCE + STATIC_SOURCE_EVIDENCE (helpers `WHERE id = auth.uid()`). **Not** defined in this repo’s migrations. |
| Service-role key | Often null (no user `sub`). Must not be assumed null. Proposal does not skip on null. | UNVERIFIED_ASSUMPTION for live nullity; STATIC_SOURCE_EVIDENCE that null is not trust |
| SECURITY DEFINER helper | Session `auth.uid()` is unchanged by DEFINER; helpers read it then `public.users` | STATIC_SOURCE_EVIDENCE |
| Absent/invalid JWT | `auth.uid()` NULL | EXTERNAL_DOCUMENTATION_EVIDENCE; runtime **NOT EXECUTED** |

### QUESTION B — `current_user`

PostgreSQL name of the role with whose privileges the current statement executes (`CURRENT_USER`). After `SET ROLE`, it is the SET role, not the login role.

| Context | Intended value | Evidence class |
|---|---|---|
| User JWT | `authenticated` | EXTERNAL_DOCUMENTATION_EVIDENCE (PostgREST authenticator). Runtime **NOT EXECUTED** |
| Anon | `anon` | same |
| Service-role key | `service_role` — **this is the proposed skip predicate** | UNVERIFIED_ASSUMPTION. Supported only by grants (`GRANT ALL … TO service_role`) and client using the service-role key. |
| SECURITY DEFINER function body | Function owner (typically `postgres`) | EXTERNAL_DOCUMENTATION_EVIDENCE (PostgreSQL DEFINER rules) |
| INVOKER trigger fired by that UPDATE | The role executing the UPDATE, i.e. the DEFINER owner if the UPDATE is inside DEFINER | EXTERNAL_DOCUMENTATION_EVIDENCE. Why `postgres` is not allowlisted. |

### QUESTION C — `session_user`

Login role. Under PostgREST this is commonly `authenticator` for **both** user and service JWTs. The proposed trigger does not read `session_user`. Using it as a discriminator would not separate user from service-role requests.

Evidence: EXTERNAL_DOCUMENTATION_EVIDENCE. Runtime **NOT EXECUTED**. Executable plpgsql contains no `session_user` (OFFLINE_TEST_EVIDENCE via comment-stripped scan).

---

## 8. Role-switching and SECURITY DEFINER analysis

### QUESTION D — Can a service-role key reach the trigger with `current_user = 'service_role'`?

**Not proven.**

STATIC_SOURCE_EVIDENCE: `frontend/src/integrations/supabase/client.server.ts` builds `createClient` with `SUPABASE_SERVICE_ROLE_KEY`. Call sites: `staff-accounts.functions.ts` upsert, `teachers.functions.ts` insert, `demo-provision.functions.ts` upsert. Canonical `GRANT ALL ON public.users TO service_role` (`20260620122048`).

EXTERNAL_DOCUMENTATION_EVIDENCE: legacy service-role JWTs carry `role=service_role`; PostgREST `SET ROLE` to that claim.

UNVERIFIED_ASSUMPTION: this project’s live PostgREST (including opaque `sb_secret_` keys that the client may send as `apikey` without Bearer) actually presents `current_user = 'service_role'` to an INVOKER trigger.

If the live mapping used another role name, privilege-column service-role UPDATEs would **fail closed** (RAISE). That is safer than a guessed extra allowlist, and it would break legitimate provisioning until measured.

### QUESTION E — Can SECURITY DEFINER change `current_user` seen by the trigger?

For an UPDATE issued **inside** a SECURITY DEFINER function, PostgreSQL executes the UPDATE as the function owner. An INVOKER trigger on that UPDATE sees that owner as `current_user`, not the original JWT role.

STATIC_SOURCE_EVIDENCE: proposed trigger is SECURITY INVOKER; Scholar helpers are DEFINER but only SELECT `public.users` (they do not UPDATE). Canonical SQL contains no `UPDATE public.users`.

Therefore a DEFINER UPDATE of privilege columns would **not** receive the `service_role` skip unless the owner is `service_role` (it typically is `postgres`). Self-row privilege writes would RAISE; other-row writes would be trigger-permitted and must be authorized by that function and by RLS.

Runtime **NOT EXECUTED**.

### QUESTION F — Can an ordinary authenticated user satisfy the trusted-role exception?

They would need `current_user = 'service_role'` on the UPDATE. That requires `SET ROLE service_role` or connecting as that role. An `authenticated` PostgREST session is not expected to hold that membership.

STATIC_SOURCE_EVIDENCE: JWT user path uses the non-admin supabase client; HR/profile updates are `authenticated`. No application path SET ROLE.

UNVERIFIED_ASSUMPTION: live `authenticated` cannot `SET ROLE service_role`. Runtime **NOT EXECUTED**.

### QUESTION G — JWT subject absent, invalid, or NULL?

Proposed plpgsql: if privilege columns changed and `current_user <> 'service_role'` and `auth.uid()` is NULL → RAISE. Null subject is **not** trust.

Canonical RLS `"User updates self"` requires `id = auth.uid()` (NULL is not TRUE), so an `authenticated` session without `sub` should not pass USING. The trigger still fail-closes if RLS is bypassed.

STATIC_SOURCE_EVIDENCE + OFFLINE_TEST_EVIDENCE (simulated CASE 5/10). Runtime **NOT EXECUTED**.

### QUESTION H — Pooling, role switching, request-context reuse?

PostgREST is documented to `SET ROLE` per request on pooled `authenticator` connections and reset after. This repo does not implement that pool. Transaction poolers can break `SET ROLE` session state if used incorrectly.

This agent’s `DATABASE_URL` is a remote **production** pooler host (`aws-1-eu-west-1.pooler.supabase.com`, username contains production ref). It was **not** used.

Evidence: EXTERNAL_DOCUMENTATION_EVIDENCE + STATIC_SOURCE_EVIDENCE (URL host classification only). Runtime **NOT EXECUTED**.

### QUESTION I — Does the exception bypass more than intended?

Yes, **narrowly but not minimally**. Once `current_user = 'service_role'`, **all** privilege-column changes on the row are allowed (any user, including what would have been a self-update). That matches `supabaseAdmin` as a broad table `ALL` principal, not a single provisioning RPC. INSERT remains unguarded by this UPDATE trigger.

STATIC_SOURCE_EVIDENCE.

### QUESTION J — Narrower design?

Investigation candidates (not implemented):

1. Measure live `current_user` under the service-role key in an isolated Supabase, then keep the current skip if confirmed.
2. A dedicated `provision_user_identity(...)` SECURITY DEFINER function with `EXECUTE` revoked from PUBLIC, granted only to `service_role`, performing the write after its own authorization. The current trigger would **block** a `postgres`-owned DEFINER UPDATE of self privilege columns — so this design needs an explicit, verified execution mark, not a silent DEFINER skip.
3. Column REVOKE of UPDATE(`role`,`school_id`,`is_active`) from `authenticated` would also block school-admin JWT updates of **other** users (same DB role). Not equivalent.

No candidate can be proven safe here without isolated PostgreSQL/PostgREST. No SQL patch in this mission.

---

## 9. Test-environment qualification

| Check | Result |
|---|---|
| `SHERIVS_DATABASE_TARGET` | unset (`TARGET_MISSING` if any `requirePostgresTarget()` script ran) |
| `DATABASE_URL` | present; host `aws-1-eu-west-1.pooler.supabase.com`; username contains **production** ref; **not used** |
| `SUPABASE_URL` | production HTTPS host `nwrflbpbhyiqdptmlccm.supabase.co`; **not used** |
| `STAGING_DATABASE_URL` | staging host `db.dvxszhracsjwdancijdc.supabase.co`; **not used** |
| Local `psql` / `postgres` / `initdb` | absent |
| Docker | absent |
| Supabase CLI | absent |
| Listen 5432 / 54322 | none |
| `pg` npm package | present; irrelevant without a proven local server |
| testcontainers / PGlite / embedded-postgres | not in this repository |

**Qualification: FAIL.** No isolated disposable PostgreSQL. Available URLs are production or staging. **No connection was opened.**

---

## 10. Test cases, commands, outputs, counts, and exit codes

### 10.1 PostgreSQL integration (Tests 1–10)

**All NOT EXECUTED.** Reason: no isolated local database; remaining URLs are production or staging; `SHERIVS_DATABASE_TARGET` unset.

| Test | Expected | Result |
|---|---|---|
| 1 Self role | Rejected by DB control | NOT EXECUTED |
| 2 Self school_id | Rejected | NOT EXECUTED |
| 3 Self is_active | Rejected | NOT EXECUTED |
| 4 Allowed profile field | Allowed if policy permits | NOT EXECUTED |
| 5 Authorized provisioning of another user | Succeeds only on verified path | NOT EXECUTED |
| 6 No subject, privilege column | No implicit trust from null uid | NOT EXECUTED |
| 7 Trigger under each realistic DB role | Only authorized contexts skip | NOT EXECUTED |
| 8 SECURITY DEFINER / ownership | Effective-role semantics | NOT EXECUTED |
| 9 Controlled migration failure | Transaction rolls back | NOT EXECUTED |
| 10 Cannot disable/bypass trigger | Invariant holds | NOT EXECUTED |

Simulated (JavaScript transcription of plpgsql, **not PostgreSQL**) cases 1–10 in `tests/unit/sherivs-001-identity-privilege.test.ts` remain OFFLINE_TEST_EVIDENCE only.

### 10.2 Offline suites (source-level)

Command:

```
npx vitest run \
  tests/unit/sherivs-sql-comment-strip.test.ts \
  tests/unit/sherivs-001-identity-privilege.test.ts \
  tests/unit/sherivs-db-target.test.ts \
  tests/unit/sherivs-staging-migration-runner.test.ts \
  tests/unit/security-role-gate.test.ts
```

| File | Passed | Failed |
|---|---|---|
| `tests/unit/sherivs-sql-comment-strip.test.ts` | 10 | 0 |
| `tests/unit/sherivs-001-identity-privilege.test.ts` | 54 | 0 |
| `tests/unit/sherivs-db-target.test.ts` | 23 | 0 |
| `tests/unit/sherivs-staging-migration-runner.test.ts` | 108 | 0 |
| `tests/unit/security-role-gate.test.ts` | 27 | 0 |
| **Total** | **222** | **0** |

`VITEST_EXIT:0`. Log: `/opt/cursor/artifacts/sherivs-001-trusted-exec-context-offline-tests.log`.

These are **not** PostgreSQL results. The comment stripper is not a PostgreSQL parser; its documented limitations (unterminated quotes, ASCII dollar tags, unscoped `U&`/`B`/`X`/`N` prefixes, `standard_conforming_strings = off`) do not affect the current proposal’s token shapes. No assertion was weakened.

---

## 11. Transaction and migration-runner findings

Forward file: explicit `BEGIN;` … helper replacements … trigger drop/create … `COMMIT;`. All statements are transactional (no `CONCURRENTLY` / `VACUUM` in SQL-level executable tokens). No `EXCEPTION WHEN OTHERS` in function bodies.

| Client | Contract | Partial-apply risk |
|---|---|---|
| `scripts/db-apply.mjs` / `db-apply-one.mjs` | `requirePostgresTarget()` then `client.query(sql)` with **no** pre-wrap | File `BEGIN`/`COMMIT` is the boundary **if** node-pg simple-query honors it. Runtime **NOT EXECUTED**. These tools refuse without `SHERIVS_DATABASE_TARGET`. Staging refuses unscoped `DATABASE_URL`. Production needs `SHERIVS_CONFIRM_PRODUCTION`. |
| `scripts/staging/sherivs-restore/runner.mjs` | Outer `BEGIN`; `query(sql)`; ledger insert; `COMMIT` | Inner `COMMIT` would close the outer transaction before the ledger write. File is `*.sql.proposed` and excluded from the pin/runner. Execute mode requires staging-ref confirmation and still returns `LIVE_EXECUTE_NOT_ENABLED` in current tests. |
| `psql -f` | Honors `BEGIN`/`COMMIT` | Not present in this environment |

Rollback proposal also uses `BEGIN`/`COMMIT` and restores `20260620151525` helper bodies after dropping the trigger. Rolling back reopens PATH A and PATH E. Not executed.

Rerun safety: `CREATE OR REPLACE FUNCTION` and `DROP TRIGGER IF EXISTS` are idempotent **if** a full successful apply completes. A failed apply under a honoring client should roll back. Under the runner wrap, do not promote this file with inner `COMMIT`.

Staging and production remain impossible **in this mission** because they were not targeted and connections were refused.

---

## 12. Security-invariant matrix

| Invariant | Result | Evidence and limits |
|---|---|---|
| A. Ordinary user cannot modify own `role` | **NOT VERIFIED** | Proposal plpgsql raises on self-role (STATIC + simulated). Unapplied. No PG. Live PATH A may still be open. |
| B. Ordinary user cannot retarget own `school_id` | **NOT VERIFIED** | Same. |
| C. Ordinary user cannot self-toggle `is_active` | **NOT VERIFIED** | Same. Application `assertNotSelfAccountStatusChange` is not a DB boundary. |
| D. Missing JWT subject does not establish trust | **PASS** (proposal source only) | Executable plpgsql raises on null uid unless `current_user = 'service_role'`. Live trigger absent → live invariant **NOT VERIFIED**. |
| E. Privileged exception narrowly defined and supported by actual PG context | **NOT VERIFIED** | Predicate is `current_user = 'service_role'` only. Live mapping **unmeasured**. **This is the blocking invariant.** |
| F. Inactive users cannot authorize via leftover role/tenant | **NOT VERIFIED** | Proposed helpers require `is_active = true` (NULL fails closed). Canonical helpers do not. Unapplied. Neutral `is_tenant_admin` still ignores `users.is_active`. |
| G. Legitimate provisioning only through verified authorized path | **NOT VERIFIED** | App uses `supabaseAdmin` after `decideAccountAdministration`. Trigger skip for that path is unproven. INSERT not trigger-covered. |
| H. No new escalation route from this proposal | **PASS** (source of this file) | No GRANT/REVOKE/POLICY in the proposal. Residual: `service_role` skip is broad for that role; DEFINER other-row UPDATE still trigger-permitted. Live catalog **NOT VERIFIED**. |
| I. Migration failure does not leave partial state under intended contract | **NOT VERIFIED** | Static file is one transaction for db-apply-one. Incompatible with runner wrap. Controlled failure test NOT EXECUTED. |
| J. No live database accessed | **PASS** | No `pg.Client.connect`, no `psql`, no Supabase CLI, no fetch to project URLs from this mission’s investigation commands. Host classification used URL parse of env values without printing secrets. |

---

## 13. Confirmed facts versus assumptions

**Proven facts (this environment / Git):** current branch/HEAD; proposal hashes; `SHERIVS_DATABASE_TARGET` unset; `DATABASE_URL` is remote production pooler (username contains production ref); no local PostgreSQL; offline 222 tests exit 0; proposed trigger executable text has no null-uid skip.

**Source-derived evidence:** grants/policies/helpers/trigger plpgsql; `supabaseAdmin` call sites; runner outer transaction; db-apply target guard.

**Test-derived evidence:** comment-stripped assertions; simulated matrix; runner offline modes never construct a live client; target helper fail-closed.

**Runtime-verified evidence:** **none**.

**Assumptions:** PostgREST `SET ROLE` to JWT `role`; service-role key ⇒ `current_user = 'service_role'`; `session_user = authenticator` for both; `authenticated` cannot `SET ROLE service_role`; `auth.uid()` is uuid `sub`.

**Unresolved dependencies:** live `current_user` under user JWT, service-role JWT, and `sb_secret_` keys; `auth.uid()` signature; whether `users` RLS is enabled/forced live; trigger present live; pooler `SET ROLE` persistence.

---

## 14. Open blockers

1. **BLOCKER-RUNTIME-CONTEXT:** Isolated PostgreSQL/PostgREST is unavailable; remaining URLs are production or staging. Cannot measure `current_user` / `session_user` / `auth.uid()` for the trigger.
2. **BLOCKER-SERVICE-ROLE-MAPPING:** `current_user = 'service_role'` is unverified against the actual provisioner path.
3. **BLOCKER-UNAPPLIED:** Proposed SQL is not in any catalog this mission inspected (none were contacted). PATH A remains a live risk until a separately authorized apply and independent verification.
4. **BLOCKER-RUNNER-COMMIT:** Promoting the file into `runner.mjs` with inner `COMMIT` is unsafe.
5. SHERIVS-002 / SHERIVS-003 / `news_reads` unchanged and OPEN.

---

## 15. Proposed remediation

**No SQL change in this mission.** Changing the skip without a measured execution context would be guessing.

**Do not** restore `auth.uid() IS NULL` as trust.

**Do not** allowlist `postgres` or JWT GUCs.

**Smallest safe path toward verification (separate authorization):**

1. Stand up a **disposable local Supabase** (or equivalent) with no production/staging credentials, explicit `SHERIVS_DATABASE_TARGET=development`, and a development-only `DATABASE_URL` whose host is localhost.
2. Apply the proposed file **there only** via `db-apply-one.mjs` (honors file `BEGIN`/`COMMIT`; not `runner.mjs`).
3. As `authenticated` with a user JWT: Tests 1–4.
4. As the service-role key: `SELECT current_user, session_user, auth.uid();` then a privilege-column UPDATE (Tests 5–8).
5. Controlled statement failure inside the same transaction (Test 9).
6. Attempt `ALTER TABLE … DISABLE TRIGGER` as `authenticated` (Test 10).
7. Only if `current_user` is not `service_role` on the provisioner path, draft a **new** `*.sql.proposed` correction; keep this file for review.

Until step 4 is measured, treat the trusted exception as **unverified**. Fail-closed behavior if the role name differs is acceptable; silent extra allowlists are not.

---

## 16. Exact changed-file list

This verification mission adds:

- `docs/security/SHERIVS-001-TRUSTED-DATABASE-EXECUTION-CONTEXT-VERIFICATION-001.md`

No application code, proposed SQL, rollback, pin, grants, or test assertion changes.

---

## 17. Final Git diff summary

Report-only diff against `0f43deef5488b0f17af3c55f2be4e086d9925369`. Proposed SQL hash unchanged.

---

## 18. Live resources

No production database connection. No staging database connection. No Supabase Management API call. No Vercel/DNS/deploy. No environment-variable or secret modification. Env values were inspected only to classify **hosts and project-ref membership**; secrets, passwords, and keys were not printed.

---

## 19. SQL execution

**SQL was not executed.** The proposed migration and rollback were not applied. `psql` is not installed. `pg.Client.connect` was not invoked.

---

## 20. Recommended next step

Authorize a **disposable local (or explicitly development) Supabase/PostgreSQL** whose connection host is localhost, with `SHERIVS_DATABASE_TARGET=development`, then run Tests 1–10 including a measurement of `current_user` under the service-role key **before** any staging apply.

Do not apply `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` to staging or production on the strength of this report.

---

## 21. Verdict statement

**BLOCKED.**

Offline source analysis supports a fail-closed **proposal**: null uid is not trust; the named skip is `current_user = 'service_role'`; the forward file is transactional under db-apply-one. Those are not substitutes for PostgreSQL/PostgREST execution evidence.

Invariant E is not demonstrated. The environment cannot be qualified as isolated. SHERIVS-001 stays OPEN.
