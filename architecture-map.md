# Architecture Map - Current System to CoreGrid Scholar

This document maps the existing School OS application onto the CoreGrid
Scholar platform, showing what exists today and where each capability will
live as the platform evolves.

```
REMIX SCHOOL OS (now)                       COREGRID SCHOLAR (target)
====================                        =========================

TanStack Start web app (frontend/src/)  ->  phase-17-web-platform
  routes (pages)                        ->  frontend/ web platform
  components/design system              ->  phase-17 + phase-05 workspace
  portals (8 roles)                     ->  phase-03 multi-tenancy + RBAC
  BFF api routes (routes/api)           ->  backend/ services (extracted)
  server functions (lib/*.functions)    ->  backend/ services (extracted)

Supabase (database/supabase/)           ->  phase-10 data platform
  schema + 29 migrations                ->  database/ (immutable history)
  RLS + school_id isolation             ->  phase-03 multi-tenancy + RLS
  audit_logs                           ->  phase-07 security engine

Supabase Auth                           ->  phase-02 identity
  roles (users.role)                    ->  RBAC foundation
  RLS helpers                           ->  ABAC/ReBAC/PBAC roadmap

Paystack payments                       ->  phase-09 payment & billing
  fees, subscriptions, webhooks         ->  billing engine

AI assistants (components/ai)           ->  phase-06 ai-agent-system
  AI gateway (lib/ai-gateway.server)    ->  phase-18 ai-intelligence-layer
  digital twin functions                ->  phase-12 digital-twin

Bus tracking, geofence                  ->  phase-11 hardware-integration
Push notifications                      ->  phase-08 communication-platform
Messages, broadcast                     ->  phase-08 communication-platform
Realtime (Supabase)                     ->  phase-10 data platform

Playwright/Vitest tests                 ->  phase-01 foundation (tests/)
Smoke scripts                           ->  scripts/ automation
No deployment config                    ->  phase-01 + phase-23 infra
No mobile app                           ->  phase-16 mobile-platform
No marketplace/developer platform       ->  phase-19/20
No education cloud                      ->  phase-15 government cloud
```

## Capability-to-phase table

| Current capability | Location today | CoreGrid phase |
| --- | --- | --- |
| Web app + portals | `frontend/src/routes` | 17 Web Platform |
| UI components/design system | `frontend/src/components` | 17 / 05 Workspace |
| API routes (BFF) | `frontend/src/routes/api` | 01/17, extract to `backend/` |
| Business logic (server functions) | `frontend/src/lib/*.functions.ts` | 01, extract to `backend/` |
| Auth (Supabase) | `frontend/src/integrations/supabase` | 02 Identity |
| Roles/authorization | `frontend/src/lib/roles.ts` + RLS | 03 Multi-tenancy / 07 Security |
| Tenant isolation | `school_id` + RLS | 03 Multi-tenancy |
| Schema/migrations | `database/supabase/migrations` | 10 Data Platform |
| RLS verification | `database/queries` | 03 / 07 |
| Audit logs | `audit_logs` table + `lib/audit.ts` | 07 Security Engine |
| Payments/billing | Paystack + `fees`/`subscriptions` | 09 Payment & Billing |
| AI assistants | `components/ai`, `lib/*ai*` | 06 AI Agents / 18 Intelligence |
| Digital twin | `lib/digital-twin.functions.ts` | 12 Digital Twin |
| Push/messages | `lib/push*`, `messages*` | 08 Communication |
| Geofence/attendance hardware | `lib/geofence.ts`, `attendance_logs` | 11 Hardware Integration |
| Tests | `tests/unit`, `tests/e2e` | 01 Foundation |
| Scripts/automation | `scripts/` | 01 / 13 Automation Engine |
| Deployment | (none yet) | 01 Foundation / 23 Enterprise Scale |
| Mobile | (none yet) | 16 Mobile Platform |
| Marketplace | (none yet) | 19 Marketplace |
| Developer platform | (none yet) | 20 Developer Platform |
| Education cloud | (none yet) | 15 Government Education Cloud |
| Globalization | (none yet) | 22 Globalization |

## Principles preserved in the mapping

- No feature is deleted during migration.
- RLS remains the tenant isolation boundary.
- Backend extraction happens only when the boundary is justified and tested.
- Every future capability is scoped by an architecture phase before code.

