# Tenant model: Scholar schools vs Sherivs tenants

Status: SHERIVS-003b incremental step (migration `20261020000070`). V1 scope only.

## Current: two models

| | Scholar (authoritative for V1 data) | Sherivs `cg_*` kernel |
|---|---|---|
| Tenant id | `schools.id` (uuid) | `cg_tenant.id` (uuid); referenced as **text** in `cg_*` columns (`tenant_ref`, `tenant_id`) |
| Membership | `users.school_id`, `get_my_school_id()` | `cg_org_membership`, `cg_role_assignment` |
| Admin predicate | `is_school_admin()` (role `admin`/`principal`, active) | `is_tenant_admin(text)` -> `holds_tenant_role(tenant, 'role:administrator')` |
| RLS | school-scoped policies on all Scholar tables | `cg_*` policies using the `holds_*`/`is_*` helpers |

By convention a `cg_tenant` row exists per school with `cg_tenant.id = schools.id`. Until now nothing enforced that link, and a school admin held **no** rights in `cg_*` tables unless a `cg_role_assignment`/`cg_org_membership` row was created separately.

## Mapping (this step)

`public.school_tenant_map(school_id PK -> schools ON DELETE CASCADE, tenant_id UNIQUE -> cg_tenant)`:

- Backfilled from existing `cg_tenant` rows whose id equals a school id; a trigger on `cg_tenant` inserts keeps new tenants mapped.
- RLS: members of a school read their own row, super admins read all; **no** client writes (service role / migrations only).
- `holds_tenant_role(p_tenant text, p_role_ref text)` (signature unchanged) additionally returns true when `p_role_ref = 'role:administrator'`, the caller satisfies `is_school_admin()`, and `school_tenant_map` maps `p_tenant` to **the caller's own school**. `is_tenant_admin(text)` inherits this. Other roles, other tenants, unmapped tenants, inactive users and anon (no EXECUTE) are unaffected; existing assignment/membership paths are untouched. Tenant ids are compared as `m.tenant_id::text = p_tenant`, so non-uuid input is simply false.

Effect: a school admin/principal now passes `cg_*` policies that use `is_tenant_admin` for their own school only.

## Target model

One tenant identity: the Sherivs tenant is the source of truth, `schools` becomes a Scholar-runtime projection keyed by `tenant_id`, `users.school_id` is derived from tenant membership, and Scholar policies call tenant helpers rather than `get_my_school_id()`. Roles come from `cg_role_assignment` only (Scholar `users.role` becomes a derived chrome hint).

## Follow-up steps (not done here)

1. Provision `cg_tenant` + map row transactionally when a school is created (today only the `cg_tenant` insert trigger exists; school creation does not create the tenant).
2. Report/alert on schools without a map row; add a constraint/CI check.
3. Migrate `cg_role_assignment` rows for admins/principals and drop the bridge branch once assignments are authoritative.
4. Introduce `current_tenant_id()` and convert Scholar policies incrementally, table family by family, each with the cross-tenant sweep (`tests/integration/sherivs-002-cross-tenant.local.sql`).
5. Retire `get_my_school_id()` / `users.school_id` last, behind the freeze on identity columns.

Tests: `tests/integration/sherivs-003b.local.sql`.
