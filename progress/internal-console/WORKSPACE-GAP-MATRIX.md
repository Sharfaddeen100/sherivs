# Workspace gap matrix — ACTIVE-V1

| Workspace or capability | Current implementation | Missing | Backend dependencies | Permissions | Data sources | Security risks | Acceptance | Status |
|---|---|---|---|---|---|---|---|---|
| Universal shell | `/console` chrome, selector, search | None for V1 | Host routing | Console operator | Overview | UI is not authz | Shell shared | Implemented, browser tested (fixture) |
| Role-to-workspace engine | SHERIVS-031 RPC + TS mapping | Live DB apply | `platform_role_workspace` | Staff membership | platform_roles / super_admins | Duplicate identities | Idempotent claim | Implemented, unit tested; DB unverified |
| Derived fallback | Compatibility workspaces | Used until 031 applied | None | Role codes | Mapping contract | Must not authorize | Names match mapping | Implemented, unit tested |
| Platform Operations | Experience on `role:platform_owner` | Super-admin session | tenants.read, audit.read | Super-admin | Org metrics, health, audit | School-data bleed | Oversight without school SIS | Implemented, unit tested; browser pending (no super-admin fixture) |
| Platform Administration | Experience on `platform_admin` | Live invite delivery | staff.read/manage, AAL2 writes | platform_admin | platform_staff | Super-admin grant | Cannot grant owner | Implemented, fixture browser tested |
| Operations | Experience + org queue | Live 031 | tenants.read/manage | operations | platform_organization | Tenant data | Lifecycle ≠ school records | Implemented, fixture browser tested |
| Engineering | Health, runtimes, honest logs | Observability provider | engineering.read | engineering | health.json, org failures | Secret leakage | Unknown ≠ healthy | Implemented, fixture browser tested |
| Support | Assignments, directory, no tickets | Ticket system (deferred) | tenants.read, assignments | support | platform_organization_assignment | Student/fee data | Empty escalation | Implemented, fixture browser tested |
| Personal | Identity, recent, shortcuts | Notifications, files | Personal membership | Every staff | recent resources | staff.manage peek | Private by default | Implemented, fixture browser tested |
| Invitation claim sync | claim + sync RPC | Production apply | SHERIVS-031 | Authenticated invitee | platform_staff | Duplicate workspaces | Idempotent | Implemented, SQL fixture; live DB unverified |
| Organization-to-school | Provisioning links school_id | Live apply | schools insert | tenants.manage | public.schools | Duplicate schools | Retry-safe | Implemented, unit tested; DB unverified |
| Subscriptions | Honest unavailable + metric contract | Billing ledger | payments not wired | finance.read | none | Fake revenue | Do not invent | Documented, unit tested |
| Metrics / audit | Contracts + audit_logs filters | Log index | audit.read | As contracted | platform_organization, staff, health | Over-claim | Source on every card | Implemented, fixture browser pending |
