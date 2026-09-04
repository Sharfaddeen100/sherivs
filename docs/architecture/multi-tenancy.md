# Multi-Tenancy

> Status: Canonical. Describes tenant isolation as implemented.

## Model

One database, many tenants. Each school is a row in `schools`; every tenant
table has a `school_id` foreign key.

## Isolation layers

1. **Database (authoritative):** Postgres RLS restricts rows to
   `get_my_school_id()` unless `is_super_admin()`.
2. **Application (defense in depth):** tenant resolution
   (`frontend/src/lib/tenant.ts`) via `?school=<slug>` or subdomain;
   role-based routing; `role-guard.tsx`.

## Tenant resolution

`resolveTenantSlug()`: query param first, then first subdomain label when
not a platform host. Platform hosts are runtime config in `tenant.ts`
(legacy domains pending CoreGrid DNS cutover).

## Current limitations / future

- Flat tenant model (no hierarchy) today.
- Phase 03 (Multi-Tenancy) plans school -> district -> state hierarchy and
  tenant provisioning APIs.
- Authorization evolution (RBAC/ABAC/ReBAC/PBAC) is tracked in
  `DECISIONS.md` and specified in `architecture/phase-08-security-engine.md`.

