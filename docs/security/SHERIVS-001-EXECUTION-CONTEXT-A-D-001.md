# SHERIVS-001-EXECUTION-CONTEXT-A-D-001

**Mission ID:** SHERIVS-001-EXECUTION-CONTEXT-A-D-001  
**Mission type:** Disposable local execution-context measurement  
**Version-target classification:** ACTIVE-V1 identity verification only. No V2/V3 work.  
**Date:** 2026-10-18  
**Parent HEAD:** `0df303c7a29bfcaf02236efcee67a5ef2a5a95e7`  
**Final verdict:** **CONTEXTS A–D MEASURED**  
**SHERIVS-001 status:** **OPEN**

Measured on a new loopback disposable Supabase stack. The proposed identity-freeze file was **not** applied. Production and staging were **not** accessed. `supabase link` was not run.

---

## 1. Outcome

Qualifier before any measurement:

```
node scripts/sherivs-001-qualify-disposable-pg.mjs
→ exit 0, qualified=true, code=DISPOSABLE_QUALIFIED,
  host=127.0.0.1, port=54322, connects=false,
  refs.production=false, refs.staging=false
```

Each context below is the value returned **inside that session**. Nothing was inferred from a key name. The probe was `public.sherivs_001_execution_context()`, `SECURITY INVOKER`, created only in the disposable database and dropped before teardown. It is not the proposed freeze.

| ID | How it was sent | HTTP | `current_user` | `session_user` | `auth.uid()` | `auth.role()` | JWT role claim |
|---|---|---|---|---|---|---|---|
| A | `psql` as `postgres` to `127.0.0.1:54322` | n/a | `postgres` | `postgres` | null | null | absent |
| B | Local Auth user JWT. `apikey` was the opaque publishable key. `Authorization: Bearer` was the user access token. A second call with the anon JWT as `apikey` and the same user token matched. | 200 | `authenticated` | `authenticator` | non-null uuid, equal to that synthetic `auth.users.id` | `authenticated` | `authenticated` |
| C | Local service-role JWT: `apikey` plus `Authorization: Bearer` | 200 | `service_role` | `authenticator` | null | `service_role` | `service_role` |
| C | Local opaque secret key: `apikey` only. `Authorization` omitted, matching `client.server.ts` when the key is `sb_secret_` | 200 | `service_role` | `authenticator` | null | `service_role` | `service_role` |
| D | Anon JWT: `apikey` plus `Authorization: Bearer` | 200 | `anon` | `authenticator` | null | `anon` | `anon` |
| D | Opaque publishable key: `apikey` only | 200 | `anon` | `authenticator` | null | `anon` | `anon` |

`auth.uid()` and `auth.role()` are both `SECURITY INVOKER` functions in this local database (`auth.uid()`, `auth.role()`).

The first PostgREST calls for C and D returned `PGRST202` because the schema cache had not reloaded. After `NOTIFY pgrst, 'reload schema'` they returned 200. The table is those 200 responses. B was measured twice, once before that reload and once after; both agreed.

---

## 2. What this does and does not show

On this local stack, a service-role PostgREST request presents `current_user = 'service_role'` and `auth.uid() = null`. That is true for both the JWT service-role key and the opaque secret key. `session_user` stays `authenticator` for B, C, and D, so `session_user` does not distinguish them.

`auth.uid()` is also null for the direct `postgres` session (A) and for anonymous PostgREST (D). A null subject is therefore not evidence of `service_role`.

The signed-in user (B) is the only measured context with a subject. That subject was the synthetic user created through local Auth at `http://127.0.0.1:54321`. The user was deleted afterward (`DELETE` HTTP 200, zero rows left for that email).

`public.forbid_self_privilege_mutation` was absent before and after (count 0). The only non-internal trigger on `public.users` was `trg_users_updated`. No privilege-column update was attempted. The trigger's raise/allow behavior is **not** measured, because the proposed SQL was not applied.

---

## 3. Stack and isolation

| Item | Value |
|---|---|
| Workdir | `/tmp/sherivs-001-local` (outside the git tree) |
| `project_id` | `sherivs-001-local` |
| Repository `database/supabase/config.toml` | unchanged production pin; not used to start |
| Canonical migrations applied | 69 `*.sql` |
| `*.sql.proposed` copied or applied | 0 |
| Postgres | 17.11 (local container) |
| Host publish | `127.0.0.1:54322` database, `127.0.0.1:54321` API |
| Off-loopback TCP to `172.31.35.177:54322` | connection refused |
| Supabase CLI | 2.121.0 |
| Docker | 29.1.3, unix socket |
| `psql` | 18.6 |

CLI 2.121.0 publishes with an empty host IP. A process-local `docker` wrapper rewrote those publishes to `127.0.0.1` for this start only. The wrapper was not committed. Realtime, Studio, SMTP, edge runtime, and analytics were disabled. Storage stayed enabled because the canonical migrations reference `storage.objects`.

Teardown: `supabase stop --yes --no-backup --workdir /tmp/sherivs-001-local` (`backup=false`). Listeners on 54321 and 54322 were gone. No Supabase volumes remained. The workdir and wrapper were removed.

---

## 4. Tests

No application, qualifier, migration, or `config.toml` file changed. Measurement used `psql` and local HTTP only, so `node_modules` was not installed. The previously recorded 266 unit tests were not re-run.

---

## 5. Exact files changed

- `docs/security/SHERIVS-001-EXECUTION-CONTEXT-A-D-001.md`

---

## 6. Declarations

**Production was not accessed.**  
**Staging was not accessed.**  
No `supabase link`. No `supabase db push`. The proposed file `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416` was not executed. Live URL variables were not set in the qualifier process. Credential values were not printed and were not committed.

**SHERIVS-001 remains OPEN.**

---

## 7. What the unapplied SQL would change

`database/supabase/migrations/20261015000010_sherivs_identity_privilege_freeze.sql.proposed` is still only a proposal. If it were applied, it would do two things:

1. **Active account required.** `get_my_school_id()`, `get_my_role()`, and `is_school_admin()` would return a school, role, or admin answer only when that person's `users` row is active. An inactive account would stop satisfying those Scholar checks.

2. **No self-promotion.** A before-update trigger on `public.users` would reject a change to that same person's `role`, `school_id`, or `is_active`. Other profile fields could still change. An identified user changing a **different** person's row would not be stopped by this trigger; existing row-security policies would still apply. The only role allowed to change those three columns without that self-check is a session whose PostgreSQL `current_user` is exactly `service_role`. A missing `auth.uid()` is not treated as permission. The `postgres` superuser is not on that allowlist.

This local measurement supports the shape of that exception: the local service-role API really is `current_user = service_role`, and anonymous plus direct `postgres` sessions are not. It does not show the trigger firing, and it was not run against staging or production.

---

## 8. What is still required to close SHERIVS-001

1. An explicit decision to apply or reject `62aaad757e3b7ff79cf6fc89aaa3d604cd1fb151feadee6ea03f813361715416`.
2. If applied, an apply contract that does not feed the file to `scripts/staging/sherivs-restore/runner.mjs` (the file has its own `COMMIT`, which would close that runner's outer transaction).
3. After any apply, runtime proof that a signed-in user cannot change their own `role`, `school_id`, or `is_active`; that a `service_role` session can; and that an inactive row no longer satisfies the three helpers.
4. Until that apply, canonical `public.users` still grants `authenticated` self-update of those columns. Measurement did not close that hole.

---

## 9. Verdict statement

**CONTEXTS A–D MEASURED** on a loopback disposable stack. The service-role PostgREST path presents `current_user = service_role`. The identity freeze remains unapplied. SHERIVS-001 remains OPEN.
