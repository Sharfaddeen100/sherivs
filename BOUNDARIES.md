# BOUNDARIES

> Status: Canonical. Defines architectural ownership: who owns each layer,
> who may call it, what crosses each boundary, and what coupling is
> prohibited. Describes the boundaries that exist today.

## Layer model

```
UI (components / routes)
        |
        v
Application orchestration (server functions, route handlers)
        |
        v
Domain logic (lib/*.functions.ts, lib/*.ts)
        |
        v
Data access (Supabase clients)
        |
        v
Database (Postgres + RLS)
```

External services (Paystack, AI gateway, push, SMS) are reached through
integration modules at the application/domain boundary - never directly
from UI components.

## Boundary ownership

### UI -> Application orchestration

- **Owner:** route files and components.
- **May call:** server functions (`createServerFn`) and its own component
  graph.
- **May not call:** Supabase clients directly for mutations outside the
  client-side data-fetching pattern; service-role client is forbidden in
  client bundles.
- **Crosses:** serializable inputs/outputs validated by Zod.
- **Security assumptions:** tenant identity comes from session context, not
  from UI-supplied values.
- **Tests:** unit tests for pure helpers; e2e for user flows.

### Application orchestration -> Domain logic

- **Owner:** server functions and route handlers.
- **May call:** domain modules in `frontend/src/lib/`.
- **May not call:** database internals directly (no raw SQL outside
  database layer/migrations).
- **Crosses:** typed function calls with validated inputs.
- **Tests:** unit tests where logic is pure; server-function behavior
  covered by build-time type checks and e2e.

### Domain logic -> Data access

- **Owner:** domain modules.
- **May call:** Supabase client APIs (RLS-scoped) or, where explicitly
  justified, the server-only admin client.
- **May not call:** bypass RLS for tenant-scoped reads; service-role access
  is limited to trusted server operations (provisioning, webhooks,
  super-admin).
- **Crosses:** typed row shapes from `frontend/src/integrations/supabase/types.ts`.
- **Security assumptions:** RLS is the isolation boundary; service-role is
  not exposed to clients.
- **Tests:** RLS isolation check + code review of service-role call sites.

### Data access -> Database

- **Owner:** Supabase clients + migrations.
- **May call:** Postgres through Supabase.
- **May not call:** anything outside the project.
- **Crosses:** `school_id`-scoped queries; RLS policies evaluate per session.
- **Security assumptions:** RLS enabled on all tenant tables; helper
  functions (`get_my_school_id`, `is_super_admin`, `get_my_role`) enforce
  scope.
- **Tests:** `database/queries/rls-isolation-check.sql`.

## Cross-cutting boundaries

### Authentication boundary

- Owned by Supabase Auth + `frontend/src/integrations/supabase/`.
- UI never stores or validates tokens itself beyond session persistence.
- Server functions validate bearer/JWT claims before trusting identity
  (`auth-middleware.ts`).

### Authorization boundary

- Application layer: roles -> portal routing + `role-guard.tsx`.
- Database layer: RLS. Neither layer may be treated as sufficient alone;
  both must hold.

### Tenant isolation boundary

- Every tenant table carries `school_id`.
- RLS policies restrict to `get_my_school_id()` unless super admin.
- Tenant resolution (`tenant.ts`) is input for routing, never the security
  boundary.

### AI boundary

- AI features receive scoped, validated context through server functions -
  never unrestricted database access.
- AI gateway calls happen server-side; API keys never reach the client.
- AI outputs are validated before display/persistence.

### Integration boundary

- Paystack webhook verifies HMAC-SHA512 signatures before processing.
- Push/SMS go through dedicated modules (`lib/push*`, gateway env).
- External service credentials are server-side environment variables.

## Prohibited coupling

- UI components importing service-role clients (`client.server.ts`).
- Server functions shipping client-side (`.server.ts` modules and server
  secrets in client bundles) - enforced by import-protection linting.
- Domain modules embedding raw SQL outside the database layer.
- Bypassing RLS to simplify queries; service-role usage without a recorded
  reason.
- AI features reading cross-tenant data or receiving unvalidated context.
- Direct component-to-component reach-through across domains (must go
  through server functions or shared domain modules).

## Tests protecting boundaries

- Unit: `tests/unit/` (auth helpers, roles, subscription tiers).
- E2E: `tests/e2e/` (portal, mobile, gallery, enterprise checklist).
- Database: RLS isolation check.
- Build-time: import-protection rules + TypeScript strict.

