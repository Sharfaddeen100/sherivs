# SHERIVS-002 cross-tenant sweep — how to run

`sherivs-002-cross-tenant.local.sql` seeds two schools (A, B) with one user per role (admin, principal, teacher, bursar, driver, parent, student), one row per tenant in every table keyed by `school_id` / `tenant_id` / `tenant_ref`, and two `school-media` storage objects. It then attacks school B from each school-A user and from `anon` (SELECT, UPDATE, UPDATE that moves a row into B, DELETE, INSERT with B's tenant), plus SECURITY DEFINER functions called with B's ids. Everything is in one transaction that is rolled back.

## Safety rules

- **Loopback / disposable only.** Use a throwaway local database (local Supabase Postgres or a scratch container) reachable on `127.0.0.1` or a unix socket. The script refuses non-loopback server addresses and non-superusers.
- **Never** run `supabase link`, point at a hosted project, or use production/staging credentials.
- Keep connection strings out of the repo and out of logs; pass them via environment or `~/.pgpass`.
- The database must already have `database/supabase/migrations/*.sql` applied (plus the local identity freeze, if you are testing with it).

## Run

```bash
psql "postgresql://postgres@127.0.0.1:<port>/<disposable_db>" \
  -v ON_ERROR_STOP=1 \
  -f tests/integration/sherivs-002-cross-tenant.local.sql 2>&1 | tee /tmp/sv2-sweep.out
echo "exit=${PIPESTATUS[0]}"
```

Exit code `0` and `NOTICE: NO LEAKS` mean no leak was found. Non-zero with `LEAKS FOUND: n` means leaks; the LEAK list is printed (as result tables and `NOTICE` lines) before the failure. A disposable container reached through a Docker bridge address needs `PGOPTIONS="-c sv2.allow_non_loopback=on"`; use it only for a container you can destroy.

## Reading the output

| Outcome | Meaning |
|---|---|
| PASS | Cross-tenant access was denied (`42501`, RLS filter returned 0 rows, or a guard trigger rejected it) |
| LEAK | Access succeeded. For `INSERT`, `RLS-PASSED-BUT-CONSTRAINT-STOPPED` means the policy allowed the row and only an FK/unique/check constraint stopped it. Also `SECRET_COLUMN`: a secret-named column is column-readable by `anon`/`authenticated` while a victim row was visible to that role |
| PUBLIC_BY_DESIGN | Intentional public exposure, classified not fixed: published website rows (second victim row seeded with the publish flag TRUE), active `schools` row, `admission_applications` INSERT, `school-media` anon read |
| SKIPPED | Table could not be seeded (reason recorded) — not tested, review manually. Target is 0 |
| ERROR | Inconclusive (unexpected error, or a failed `get_my_tenant_id()` / `cg_tenant` mapping check); triage by message |
| INFO | Seed notes, `school-media` control counts, secret-column inventory, SECURITY DEFINER inventory (search_path pinning and EXECUTE grants) |

Ops: `SELECT` (B rows visible; for flagged tables only the victim row with all `is_published`/`is_active`/`published`/`is_public` flags FALSE), `SELECT[published]` / `SELECT[public]` (by-design public visibility), `OWN_SELECT` (control: own-tenant rows), `UPDATE`, `UPDATE_MOVE` (A row re-pointed to B — tests WITH CHECK), `DELETE`, `INSERT` / `INSERT[public]`, `FUNC(...)` (DEFINER function output mentioning B's ids), `TENANT_MAP`, `SECRET_COLUMN`.

Seeding: victim (B) rows have every visibility flag FALSE so public policies cannot mask a leak. `cg_*` tables use per-table overrides (digest/envelope/id formats, bitemporal ranges, status enums) read from the migrations' CHECK constraints; `cg_idempotency_record` also gets an expired victim row. The run fails if fewer than 8 actors (7 roles + anon) were swept or if a user does not resolve to its school through `get_my_tenant_id()`.

## Expected classifications

- `schools` active-row SELECT, published website tables, `school-media` anon read and `admission_applications` INSERT appear as `PUBLIC_BY_DESIGN`.
- `schools.paystack_secret_key` and `cg_idempotency_record` leaked in run 1; migrations `20261020000010` / `20261020000020` must be applied to the disposable stack for them to PASS.

Save the output into the "Cross-tenant test results" section of `docs/security/SHERIVS-002-TENANT-ISOLATION-001.md`.

### Operator note (local Supabase CLI stack)

On the Supabase CLI stack, `postgres` is not a superuser, and the harness needs `session_replication_role`. Connect as `supabase_admin` on the loopback DB port, with the stack's local default password. Set `PGOPTIONS="-c sv2.allow_non_loopback=on"`, because the server sees the Docker bridge address even when you connect to `127.0.0.1`. Apply the identity freeze `.sql.proposed` and the `20261020*` migrations to that disposable stack first. `tests/integration/sherivs-002-admission-insert.local.sql` runs the same way.
