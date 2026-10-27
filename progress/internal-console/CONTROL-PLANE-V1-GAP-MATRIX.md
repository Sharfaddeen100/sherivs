# Sherivs Control Plane V1 — Gap Matrix

Version target: **ACTIVE-V1**. Canonical destinations remain `console.sherivs.com/console` and `app.sherivs.com/home`. Scholar educational workflows are not duplicated in the console.

| Requirement | Existing implementation | Evidence | Gap | Proposed / delivered change | Dependencies | Risk | Acceptance | Status |
|---|---|---|---|---|---|---|---|---|
| Console shell, host routing, staff directory, invitations, workspaces, runtimes, audit views | SHERIVS-008 + SHERIVS-030 + `/console` routes | `frontend/src/routes/console`, PR #148 | Foundation complete; not a full operating system | Keep and extend | Auth, `platform_staff` | Low | Pages render for authorized staff | Implemented and unit tested |
| One control plane, one runtime | Host map + Scholar contract | `console-host-routing`, `runtime-contract.ts` | None for V1 product boundary | No additional runtimes | V1 envelope | Low | Scholar is the only operational product | Implemented and verified |
| Organization as first-class lifecycle | Tenant = `public.schools`; founder RPC `create_organization_with_founder`; no console case | migrations 050/060, onboarding lib | No prospect record, no staff-driven questionnaire, no activation gate | `platform_organization` case linked to `schools` after provisioning | SHERIVS-031, `platform.tenants.manage` | Medium: unapplied migration | Draft→Active with rejected invalid transitions | Implemented, unit tested; database not production-verified |
| Onboarding questionnaire | Founder wizard unused; `/onboarding` is mailto | `organization-onboarding.ts` | Console questionnaire missing | 5-step staff questionnaire with saved progress | Engine A | Low | Validation + resume | Implemented, browser pending |
| Idempotent provisioning | Super-admin `provisionOrganization` engine exists, not wired to console | `provision-organization.ts` | Console provisioning missing | Create inactive `schools` row, link `school_id`, retry-safe | Service role | Medium | Retry does not duplicate schools | Implemented, unit tested; DB unverified |
| Activation / suspension / deactivation | `schools.is_active`, `subscription_status` | foundation schema | No authorized console operations | Explicit transitions; records retained | Engine A | Medium | Suspend does not delete | Implemented, unit tested |
| Organization assignment | `platform_support_grants` only | SHERIVS-009 | No persistent onboarding owner | `platform_organization_assignment` | Engine A | Low | Release keeps history | Implemented, unit tested |
| Role-to-workspace provisioning | Personal workspace on claim; derived `role:*` fallback | SHERIVS-030, `workspaces.ts` | No durable role workspace mapping; role change did not sync membership | `platform_role_workspace` + `sync_platform_staff_workspaces` | SHERIVS-031 | Medium | Claim/role-change/revoke are idempotent | Implemented, unit tested; DB unverified |
| Staff lifecycle | Invite, suspend, revoke, roles | `staff.functions.ts` | Role catalogue / suspended views incomplete | Catalogue + suspended screens; sync on role/status | Engine B | Low | Revoke bans auth and drops role membership | Implemented, unit tested |
| Evidence-based metrics | Staff counts + process uptime; honest unavailable cards | `overview.functions.ts` | Org/user metrics missing | Contracts + `platform_control_plane_metrics()` | Engine A, auth.users | Medium | No fabricated numbers | Implemented, unit tested |
| Homepage as decision surface | Health, attention (invites), quick actions | `home-screen.tsx` | No pipeline / assignments | Pipeline + assignments empty-or-real; fixture store drives counts | Metrics | Low | Progressive disclosure | Implemented, unit tested; browser pending |
| RLS / no client writes | FORCE RLS on console store | SHERIVS-030 | New tables need same posture | FORCE RLS + SELECT-only grants in 031 | Migration apply | High if applied untested | Unauthorized insert fails | Designed + SQL fixture; not production verified |
| Logs / incidents / tasks | Honest unavailable | module-screens | None that V1 should fill | Deferred | Observability provider | — | Do not fake | Deferred |

## Role-to-workspace mapping

| Presentation | Database identity | Default workspace |
|---|---|---|
| Platform Owner | `super_admins` (not a `platform_roles` row) | Platform Operations |
| Platform Administrator | `platform_admin` | Platform Administration |
| Operations Administrator | `operations` | Operations |
| Engineer | `engineering` | Engineering |
| Support Specialist | `support` | Support |
| Standard Team Member | assigned `platform_roles` or none | Personal workspace |

Security, finance, and sales keep their existing database roles and receive matching role workspaces. Capabilities still come from `has_platform_capability`.

## Organization lifecycle

`draft → submitted → under_review → provisioning → provisioning_failed | ready_for_activation → active → suspended | deactivated`

Provisioning creates `public.schools` with `is_active = false`. Activation sets `is_active = true`. Suspension sets `is_active = false` and `subscription_status = suspended`. Deactivation is terminal in V1. Rows are never deleted for access control.

## Data model (additive)

- `platform_organization` — control-plane case; `school_id` nullable until provisioned
- `platform_organization_assignment` — staff responsibility, not tenant membership
- `platform_organization_transition` — append-only
- `platform_role_workspace` — role code → workspace
- Workspace `kind` extended with `role`

## Deferred

General task management, incident management, queryable logs, dashboard builder, AI workforce control plane, digital twins, runtime marketplace, generic workflow designer, billing.

## Verification distinction

- **Designed / implemented / unit tested:** this change
- **Integration / RLS on a live database:** blocked until SHERIVS-031 is applied through the authorized release process
- **Browser:** local visual fixture walkthrough on 127.0.0.1:4173 — questionnaire, activation, homepage pipeline 0→1 active, metrics, desktop and mobile
- **Production verified / deployed:** no
