# SHERIVS-001-IDENTITY-FREEZE-LOCAL-CLOSEOUT-001

**Mission ID:** SHERIVS-001-IDENTITY-FREEZE-LOCAL-CLOSEOUT-001  
**Mission type:** Disposable local proof of the proposed identity freeze  
**Version-target classification:** ACTIVE-V1 identity verification only. No V2/V3 work.  
**Date:** 2026-10-18  
**Parent HEAD:** `db35e3ab3f659cef1b3f85143688a30a25ff78cd`  
**Proposal SHA-256:** `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` (unchanged)  
**Final verdict:** **LOCAL CHECKS PASS, WITH ONE OWNER RESIDUAL**  
**SHERIVS-001 status:** **OPEN**  
**Staging recommendation:** **not ready to apply until that residual is accepted**

The proposal was applied only inside a new loopback disposable database, using `psql -f` on the `.sql.proposed` file. It was not renamed, not copied into `migrations/*.sql`, and not sent through `scripts/staging/sherivs-restore/runner.mjs`. Production and staging were not contacted. `supabase link` was not run.

---

## 1. Apply

`psql -v ON_ERROR_STOP=1 -f` the proposal file. No extra transaction wrapper.

| Result | Value |
|---|---|
| Exit | 0 |
| stderr | empty |
| stdout | `BEGIN`, three helper `CREATE FUNCTION`s, `CREATE FUNCTION` for the trigger function, `DROP TRIGGER`, `CREATE TRIGGER`, `COMMIT` |

After commit, on this database only:

- Trigger `trg_users_forbid_self_privilege_mutation` exists and is `SECURITY INVOKER`.
- Executable body contains `current_user = 'service_role'` and the untrusted-context `RAISE`.
- Executable body does not contain `IF auth.uid() IS NULL THEN`.
- `get_my_school_id`, `get_my_role`, and `is_school_admin` each require `is_active = true`.
- `public.users` has row security enabled, **not** forced. Owner is `postgres`.

The same file applied cleanly again on this already-migrated disposable database (idempotent `CREATE OR REPLACE` / `DROP TRIGGER IF EXISTS`). The captured result above is that second clean apply. The first apply had already committed: the trigger was enforcing before the captured run.

---

## 2. Close-out checks

Synthetic local Auth user, `public.users.role = admin`, active, school A. A second school and a second user existed only so school changes had a real foreign key. Calls were PostgREST on `127.0.0.1:54321` unless noted. The signed-in call used that user's access token. Service-role JWT calls sent `apikey` and `Authorization`. Opaque secret calls sent `apikey` only.

| Check | Result | Evidence |
|---|---|---|
| 1a. Signed-in user cannot change own `role` | **PASS** | HTTP 400, `P0001`, `Forbidden: cannot modify privileged identity fields on your own account`. Row stayed `admin`. |
| 1b. Signed-in user cannot change own `school_id` | **PASS** | Same 400 and message. School stayed school A. |
| 1c. Signed-in user cannot change own `is_active` | **PASS** | Same 400 and message. `is_active` stayed true. |
| 1d. Signed-in user can edit an ordinary field | **PASS** | `phone` PATCH HTTP 200. Phone became `555-0100`. Role, school, and active flag stayed put. |
| 2. `service_role` can change the protected fields | **PASS** | JWT service-role PATCH set `role` to `teacher` (HTTP 200). Opaque secret PATCH set `school_id` to school B (HTTP 200) and `is_active` to false (HTTP 200). A later JWT service-role PATCH restored role, school, and active flag (HTTP 200). |
| 3. Inactive account fails the three helpers | **PASS** | While active, as that user: `get_my_school_id` returned school A, `get_my_role` returned `admin`, `is_school_admin` returned true. After the service-role deactivation, the same user token got null, null, and false. All six RPCs were HTTP 200. |
| 4a. `postgres`, no JWT subject, cannot change a protected field | **PASS** | `UPDATE ... SET role` as `postgres` exited 1: `Forbidden: untrusted execution context cannot modify privileged identity fields`. The row did not change. |
| 4b. Anonymous / missing subject gets no privilege change | **PASS** | Anon PATCH of `role` and of `phone` returned HTTP 200 and changed no column (row security matched no row). `SET ROLE authenticated` with an empty subject updated 0 rows. |

---

## 3. Surprise

`public.users` row security is not forced, and the table owner is `postgres`. The trigger allows a privilege-column change when `auth.uid()` is a **different** user and leaves that case to row security.

A `postgres` session with `request.jwt.claim.sub` set to the other synthetic user ran `UPDATE public.users SET role='bursar'` on the first user. It committed. The role became `bursar`. Service-role then restored the row.

So a subject-less superuser session is refused, and a superuser session wearing some other subject is not. That does not match the comment that owner repair must `SET ROLE service_role` or disable the trigger. Row security never sees the owner statement.

Anonymous HTTP 200 is not a second bypass. The columns did not change.

---

## 4. Stack

Workdir `/tmp/sherivs-001-local`, `project_id = sherivs-001-local`, 69 canonical `*.sql` files, zero `*.sql.proposed` in that directory. Host ports were `127.0.0.1:54321` and `127.0.0.1:54322` only. Repository `config.toml` was not used and was not modified.

Teardown: `supabase stop --yes --no-backup`. Listeners and volumes were gone afterward.

---

## 5. Tests and files

No application code, qualifier, runner, or proposal file changed. `node_modules` was not installed. The 266 unit tests were not re-run.

Changed file:

- `docs/security/SHERIVS-001-IDENTITY-FREEZE-LOCAL-CLOSEOUT-001.md`

---

## 6. Declarations

**Production was not accessed.**  
**Staging was not accessed.**  
The proposal was not promoted out of `.sql.proposed` and was not applied anywhere except this destroyed local database.

**SHERIVS-001 remains OPEN.**

---

## 7. Staging recommendation

Do **not** apply this file to staging yet.

The signed-in freeze, the service-role allowlist, and the inactive-account helpers behaved as written on this local stack, and a subject-less `postgres` or anonymous session did not change protected fields. The owner residual in section 3 is still open: staging SQL run as the table owner can change another person's role, school, or active flag whenever a different `auth.uid()` is set in that session. Accept that residual explicitly, or change the proposal so a non-`service_role` owner cannot do it, before a staging apply.

A later apply still must not use `runner.mjs`. The file commits its own transaction.
