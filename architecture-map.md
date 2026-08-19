CoreGrid Scholar — Architecture Map

Document: "architecture-map.md"
Status: Canonical Architecture Reference
Scope: Current School OS → CoreGrid Scholar migration
Authority: CoreGrid Engineering Architecture
Primary Objective: Preserve working capabilities while progressively transforming the existing application into the CoreGrid Scholar institutional platform.

---

1. Purpose

This document defines the architectural relationship between the existing Remix School OS implementation and the target CoreGrid Scholar platform.

It answers four questions:

1. What exists today?
2. Where does that capability belong in CoreGrid?
3. How does the capability migrate without breaking existing functionality?
4. What architectural, security, tenancy, identity, AI, data, and operational boundaries must remain intact during migration?

This document is not a list of future features.

It is a migration and architectural control map.

The existing system is treated as a valuable implementation baseline. CoreGrid Scholar is the long-term architecture into which those capabilities will progressively evolve.

---

2. Architectural Direction

REMIX SCHOOL OS
Existing Production/Prototype System
        │
        │ Preserve
        │ Understand
        │ Test
        │ Isolate
        ▼
COREGRID FOUNDATION
Identity + Tenancy + Security + Data + Contracts
        │
        ▼
COREGRID PLATFORM
Workspaces + Communication + Finance + Hardware
        │
        ▼
COREGRID INTELLIGENCE
AI Agents + Digital Twins + Intelligence
        │
        ▼
COREGRID EXPERIENCE
Web + Mobile + Institutional UX
        │
        ▼
COREGRID ECOSYSTEM
Marketplace + Developer Platform + Education Cloud
        │
        ▼
COREGRID GLOBAL PLATFORM
Globalization + Enterprise Scale + Institutional Infrastructure

The migration must be incremental.

No large-scale rewrite is permitted merely for architectural aesthetics.

---

3. Core Migration Principles

3.1 Preserve Working Capability

No existing capability is deleted simply because CoreGrid has a different architectural destination.

Existing functionality must first be:

1. identified,
2. tested,
3. documented,
4. assigned to a target boundary,
5. migrated or adapted,
6. verified,
7. deprecated only after replacement is proven.

---

3.2 Architecture Before Extraction

A piece of code must not be extracted into a new service merely because the target architecture contains a service with a similar name.

Extraction requires a justified boundary.

Examples:

- ownership boundary,
- security boundary,
- scaling boundary,
- deployment boundary,
- data boundary,
- reliability boundary,
- latency boundary,
- team ownership boundary.

---

3.3 Security Boundaries Survive Migration

Existing tenant isolation must not become weaker during migration.

The current:

school_id + Supabase RLS

must continue protecting tenant data until a formally verified replacement exists.

Future authorization may introduce:

RBAC
ABAC
PBAC
ReBAC
RLS
resource ownership
workspace boundaries
policy evaluation
purpose limitation
data classification

but additional authorization layers must strengthen, not weaken, isolation.

---

4. Current System

4.1 Current Application

frontend/
├── routes/
├── components/
├── lib/
├── integrations/
└── public/

The current application is primarily a TanStack Start web application with:

- React
- TypeScript
- TanStack Router
- TanStack React Query
- Vite
- Tailwind
- shadcn/Radix
- Supabase
- server functions
- API routes
- AI integrations
- realtime functionality
- payment integrations
- hardware-related functionality
- automated tests.

---

5. Current → Target Architecture Map

Current System| Current Location| CoreGrid Target| Migration Phase
TanStack Start application| "frontend/"| CoreGrid Web Platform| Phase 23
File-based routes| "frontend/src/routes"| Web Application / Workspace Routing| Phase 23
React components| "frontend/src/components"| CoreGrid Design + Workspace System| Phase 06 / 23 / 24
BFF API routes| "frontend/src/routes/api/**"| Platform API / Backend Boundaries| Phase 01 / 23
Server functions| "frontend/src/lib/*.functions.ts"| Backend Application Services| Phase 01 / 23
Supabase database| "database/supabase/"| CoreGrid Data Platform| Phase 14
Supabase migrations| "database/supabase/migrations/"| Immutable Database History| Phase 14
Supabase RLS| Database policies| CoreGrid Authorization Architecture| Phase 03 / 08
Supabase Auth| Supabase Auth| CoreGrid Identity Platform| Phase 02
User roles| "users.role", role utilities| RBAC + ABAC + Policy Engine| Phase 03 / 08
Audit logging| "audit_logs"| Security + Audit Platform| Phase 08
Paystack| Payment integration| Financial Platform| Phase 13
Fee management| Financial tables/functions| Billing + Finance| Phase 13
AI assistants| "components/ai"| AI Agent Platform| Phase 07
AI Gateway| "lib/ai-gateway.server"| AI Intelligence Gateway| Phase 26
Digital Twin| "lib/digital-twin.functions.ts"| Digital Twin Platform| Phase 16
Realtime| Supabase Realtime| Event/Data Platform| Phase 14
Messaging| Messaging modules| Communication Platform| Phase 10
Push notifications| "lib/push*"| Notification Platform| Phase 10
Bus tracking| Transport modules| Hardware/IoT Platform| Phase 15
Geofencing| "lib/geofence.ts"| Location/Hardware Platform| Phase 15
Attendance hardware| Attendance logs| Hardware Integration Platform| Phase 15
Unit tests| "tests/unit"| CoreGrid Test Platform| Phase 01
E2E tests| "tests/e2e"| CoreGrid Verification Platform| Phase 01
Smoke scripts| "scripts/"| Engineering Automation| Phase 01 / 17
AI digital-twin intelligence| AI/twin modules| CoreGrid Intelligence Layer| Phase 16 / 26
Portal experiences| Role-specific routes| Dynamic Workspaces| Phase 03 / 06 / 23
Workforce identity| Users/provisioning| Institutional Workforce Identity| Phase 25
Mobile| Not currently implemented| CoreGrid Mobile| Phase 22
Marketplace| Not currently implemented| CoreGrid Marketplace| Phase 27
Developer platform| Not currently implemented| CoreGrid Developer Platform| Phase 28
Education cloud| Not currently implemented| Government Education Cloud| Phase 20
Globalization| Not currently implemented| Global CoreGrid Platform| Phase 30
Enterprise scaling| Not currently implemented| Enterprise Infrastructure| Phase 31

---

6. Phase Architecture Map

Phase 01 — Foundation

Purpose: Establish the engineering constitution and repository foundation.

Owns:

- repository standards,
- TypeScript standards,
- testing foundation,
- linting,
- formatting,
- environment management,
- configuration,
- scripts,
- CI/CD foundations,
- observability foundations,
- engineering documentation,
- architecture records,
- agent instructions.

Current sources:

frontend/
tests/
scripts/
AGENTS.md
.codex/

Target:

CoreGrid Engineering Foundation

---

7. Phase 02 — Identity

Current:

Supabase Auth
users
JWT
password reset
authentication helpers

Target:

CoreGrid Identity Platform

Responsibilities:

- authentication,
- identity lifecycle,
- account provisioning,
- session management,
- device identity,
- workforce identity,
- service identity,
- machine identity,
- identity verification,
- organization membership,
- role assignment.

Future identity relationships:

Person
 ├── Account
 ├── Identity
 ├── Organization Membership
 ├── Workspace Membership
 ├── Roles
 ├── Policies
 ├── Devices
 └── Digital Twin

---

8. Phase 03 — Multi-Tenancy & Authorization

Current isolation:

school_id
+
Supabase RLS

Target authorization architecture:

RBAC
 +
ABAC
 +
PBAC
 +
ReBAC
 +
RLS
 +
Resource Ownership
 +
Workspace Boundaries
 +
Data Classification
 +
Purpose Limitation

Target hierarchy:

CoreGrid
 ├── School
 │    ├── Campus
 │    ├── Department
 │    ├── Workspace
 │    └── Users
 │
 ├── CoreGrid Staff
 │    ├── Engineering
 │    ├── Support
 │    ├── Operations
 │    ├── Security
 │    └── Administration
 │
 └── Platform Services

No user receives access merely because they can technically reach an endpoint.

Authorization must be evaluated against:

identity
role
relationship
resource
action
tenant
workspace
policy
context
purpose
classification

---

9. Phase 04–06 — Platform & Workspace Foundations

These phases establish:

- domain architecture,
- workspace primitives,
- dynamic navigation,
- role-aware experiences,
- permission-aware interfaces,
- institutional collaboration.

The future workspace model is:

Identity
   ↓
Role
   ↓
Policy
   ↓
Workspace Assignment
   ↓
Allowed Capabilities
   ↓
Dynamic UI
   ↓
Authorized Data

The UI must never become the security boundary.

The server remains authoritative.

---

10. Phase 07 — AI Agent System

Current:

AI assistants
components/ai
AI gateway

Target:

CoreGrid Agent Platform

Agents become governed platform entities.

Each agent requires:

Agent Identity
Agent Role
Agent Permissions
Agent Tools
Agent Memory
Agent Policy
Agent Scope
Agent Model
Agent Audit Trail
Agent Budget
Agent Risk Level
Agent Owner
Agent Lifecycle

Agents must not automatically inherit unrestricted user permissions.

---

11. Phase 08 — Security Engine

Current:

audit_logs
RLS verification

Target:

CoreGrid Security & Trust Platform

Responsibilities:

- authorization,
- policy enforcement,
- audit logging,
- security events,
- anomaly detection,
- access review,
- privileged operations,
- data classification,
- secret handling,
- security monitoring.

Security decisions must be:

deterministic where possible
auditable
explainable
reproducible
testable

---

12. Phase 10 — Communication Platform

Current:

messages
notifications
push
broadcast
Supabase Realtime

Target:

CoreGrid Communication Platform

Includes:

- direct messaging,
- institutional messaging,
- announcements,
- notifications,
- push,
- email integrations,
- SMS integrations,
- event-driven communication,
- communication preferences,
- delivery tracking.

Every communication channel remains policy-aware.

---

13. Phase 13 — Financial Platform

Current:

Paystack
fees
subscriptions
webhooks

Target:

CoreGrid Financial Platform

Responsibilities:

- billing,
- subscriptions,
- fee collection,
- invoices,
- payment reconciliation,
- payment events,
- financial audit,
- transaction history,
- institutional finance.

Payment webhooks remain cryptographically verified.

---

14. Phase 14 — Data Platform

Current:

Supabase/Postgres
29 migrations
Realtime
RLS
Storage

Target:

CoreGrid Data Platform

Responsibilities:

- operational database,
- analytical data,
- event streams,
- data contracts,
- migrations,
- tenant isolation,
- data lineage,
- retention,
- archival,
- backups,
- recovery.

Database migrations remain immutable historical artifacts.

---

15. Phase 15 — Hardware Integration

Current:

bus tracking
geofencing
attendance logs

Target:

CoreGrid Hardware / IoT Platform

Devices become first-class platform entities.

Device
 ├── Identity
 ├── Owner
 ├── Tenant
 ├── Location
 ├── Firmware
 ├── Telemetry
 ├── Health
 ├── Security State
 └── Digital Twin

---

16. Phase 16 — Digital Twin Platform

Current:

digital-twin.functions.ts

Target:

CoreGrid Digital Twin Platform

Digital twins may represent:

Person
Device
Building
Room
Vehicle
Campus
School
Organization
Workflow
System
Environment

A twin must never become a free-form database of everything known about an entity.

It requires:

- ownership,
- authorization,
- provenance,
- confidence,
- freshness,
- classification,
- purpose,
- retention,
- access policy.

---

17. Phase 17 — Automation Engine

Current:

scripts/
server functions
automation

Target:

CoreGrid Automation Platform

Responsibilities:

- scheduled workflows,
- event-triggered workflows,
- background jobs,
- retries,
- workflow state,
- task queues,
- automation observability.

Automation must be idempotent where possible.

---

18. Phase 20 — Government Education Cloud

Future platform capability.

Responsibilities:

- government-scale education deployments,
- institutional tenancy,
- regional administration,
- regulatory requirements,
- data residency,
- education infrastructure,
- large-scale analytics.

---

19. Phase 22 — Mobile Platform

Current:

Not implemented.

Target:

CoreGrid Mobile

The mobile platform consumes the same:

Identity
Authorization
API
Workspace
AI
Notification
Digital Twin
Data

platform contracts.

Mobile must not create a second authorization model.

---

20. Phase 23 — Web Platform

Current:

TanStack Start
React
TanStack Router
React Query
Vite
Tailwind
shadcn

Target:

CoreGrid Web Platform

Responsibilities:

- application shell,
- routing,
- workspaces,
- dashboards,
- institutional portals,
- administration,
- CoreGrid internal operations,
- responsive experiences.

---

21. Phase 24 — CoreGrid Experience & Design Intelligence

Current:

frontend/src/components
design system
Tailwind
shadcn
Radix
Lucide
Recharts

Target:

CoreGrid Design System
+
Dynamic Experience Engine

Interfaces become context-aware without bypassing authorization.

Design can adapt based on:

role
workspace
task
device
tenant
preferences
accessibility
context

but data authorization remains server-side.

---

22. Phase 25 — Institutional Onboarding & Workforce Identity

Current:

users
provisioning functions

Target:

Institutional Identity & Provisioning

Capabilities:

CoreGrid Owner
    ↓
Create School
    ↓
Create School Administrator
    ↓
School Administrator
    ↓
Create Campuses
    ↓
Invite Staff
    ↓
Assign Roles
    ↓
Assign Policies
    ↓
Generate Workspace

For CoreGrid internal teams:

CoreGrid Owner
    ↓
Invite Staff
    ↓
Assign Organization
    ↓
Assign Role
    ↓
Assign Policies
    ↓
Assign Workspace
    ↓
Dynamic Internal Dashboard

Every workspace is derived from authorization state.

---

23. Phase 26 — AI Intelligence Layer

Current:

AI Gateway
AI assistants
digital twin functions

Target:

CoreGrid Intelligence Platform

Includes:

- model routing,
- AI gateway,
- tool execution,
- agent orchestration,
- memory,
- reasoning,
- evaluation,
- observability,
- AI safety,
- policy enforcement,
- cost controls.

AI must respect the same authorization system as humans.

---

24. Phase 27 — Marketplace

Future.

Target:

CoreGrid Marketplace

Third-party applications must receive explicitly scoped permissions.

No marketplace application receives unrestricted tenant access.

---

25. Phase 28 — Developer Platform

Future.

Responsibilities:

- APIs,
- SDKs,
- webhooks,
- OAuth,
- developer identities,
- application permissions,
- API quotas,
- auditability,
- developer tooling.

---

26. Phase 30 — Globalization

Future.

Responsibilities:

- localization,
- internationalization,
- currencies,
- languages,
- regional policies,
- timezone handling,
- regulatory adaptation,
- data residency.

---

27. Phase 31 — Enterprise Scale

Future target:

100K+ users
10K+ devices
5K+ buildings
thousands of workspaces
large event volumes
large AI workloads

The architecture must support horizontal scaling without sacrificing:

- tenant isolation,
- policy enforcement,
- auditability,
- reliability,
- observability.

---

28. Phase 32 — Future Evolution

The final architecture evolves from a school-management application into a broader institutional intelligence platform.

The system becomes capable of understanding:

People
Devices
Buildings
Organizations
Workflows
Events
Resources
Relationships
Policies
AI agents
Digital twins

while maintaining strict governance boundaries.

---

29. Current Repository → Target Repository

The current repository should evolve toward a structure conceptually similar to:

/
├── AGENTS.md
├── constitution.md
├── architecture-map.md
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── security/
│   ├── data/
│   ├── ai/
│   ├── digital-twin/
│   └── operations/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── tests/
│
├── backend/
│   ├── identity/
│   ├── authorization/
│   ├── security/
│   ├── data/
│   ├── ai/
│   ├── digital-twin/
│   ├── communication/
│   ├── finance/
│   ├── hardware/
│   └── automation/
│
├── database/
│   ├── migrations/
│   ├── queries/
│   ├── policies/
│   └── seeds/
│
├── agents/
│   ├── definitions/
│   ├── policies/
│   ├── tools/
│   ├── evaluations/
│   └── memory/
│
├── infrastructure/
├── scripts/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── security/
│   ├── authorization/
│   ├── e2e/
│   └── load/
│
└── progress/

This is a target architecture, not permission to restructure the repository immediately.

---

30. Dependency Direction

The target dependency direction is:

Experience
    ↓
Application
    ↓
Domain
    ↓
Platform
    ↓
Infrastructure

Never:

UI
 ↓
database directly

or:

AI agent
 ↓
unrestricted database

or:

third-party integration
 ↓
tenant data

Domain and policy boundaries must remain explicit.

---

31. Data Flow Principle

The canonical data flow is:

External Event
      ↓
Ingestion
      ↓
Validation
      ↓
Authorization
      ↓
Domain Processing
      ↓
Persistence
      ↓
Event Publication
      ↓
Consumers
      ↓
AI / Analytics / Experience

AI must consume authorized data views rather than bypassing the platform.

---

32. Digital Twin Data Flow

Real World
   │
   ├── Person
   ├── Device
   ├── Building
   ├── Vehicle
   ├── Campus
   └── Environment
          │
          ▼
      Telemetry
          │
          ▼
    Data Ingestion
          │
          ▼
    Identity Resolution
          │
          ▼
    Policy Evaluation
          │
          ▼
    Twin State Store
          │
          ▼
    Twin Intelligence
          │
          ├── Analytics
          ├── AI Agents
          ├── Automation
          └── User Experience

---

33. Authorization Model

Every protected operation should conceptually evaluate:

Can
    SUBJECT
perform
    ACTION
against
    RESOURCE
within
    TENANT
through
    WORKSPACE
under
    POLICY
given
    CONTEXT
for
    PURPOSE
?

Examples:

Student → read → own lesson data → allowed

Teacher → read → assigned student's academic data → allowed

Teacher → read → unrelated student's private AI tutor conversation → denied

School admin → manage → school users → allowed

Campus read-only admin → read → assigned campus → allowed

CoreGrid support engineer → inspect → support-approved diagnostic data → conditionally allowed

CoreGrid engineer → read → private student AI conversation → denied

AI agent → access → user data → only through explicit scoped tool permission

---

34. Digital Twin Privacy Boundary

A digital twin does not automatically expose all information about the entity it represents.

Twin information must be segmented.

Public
Internal
Operational
Confidential
Sensitive
Highly Sensitive
Restricted

Sensitive information such as:

- AI Tutor conversations,
- private recommendations,
- behavioral analysis,
- personal communications,
- financial information,
- private educational records,
- security events,

must require explicit authorization.

---

35. AI Authorization

AI agents operate under:

Agent Identity
+
User Context
+
Tenant Context
+
Role
+
Tool Permissions
+
Data Permissions
+
Purpose
+
Policy
+
Audit

An agent must not interpret:

"help me"

as:

"give me everything you can access."

---

36. Workspace Architecture

CoreGrid workspaces are dynamically generated from:

Identity
+
Organization
+
Role
+
Policies
+
Responsibilities
+
Resources
+
Context

Therefore:

CoreGrid Owner

and:

CoreGrid Support Engineer

do not receive the same dashboard.

Likewise:

School Owner
School Admin
Teacher
Student
Parent
Campus Admin
Read-only Admin
Finance Officer
Transport Officer

receive different experiences.

The workspace is a projection of authorized capabilities.

---

37. Internal CoreGrid Dashboard

The CoreGrid internal dashboard is a first-class platform component.

It is not merely an administrative page.

It becomes the operational command center for:

- CoreGrid ownership,
- school provisioning,
- workforce management,
- support,
- engineering,
- infrastructure,
- security,
- AI operations,
- device operations,
- tenant operations,
- system health,
- incident management,
- audit investigation.

Conceptually:

                    COREGRID COMMAND
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Organizations       Workforce        Infrastructure
        │                 │                 │
      Schools           Staff             Devices
        │                 │                 │
     Campuses           Roles             Systems
        │                 │                 │
    Workspaces         Policies           Twins
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                     Intelligence
                          │
                    AI / Agents

---

38. Migration Rule

Before migrating a capability:

Inventory
   ↓
Understand
   ↓
Test
   ↓
Classify
   ↓
Assign Target Boundary
   ↓
Define Contract
   ↓
Implement
   ↓
Verify
   ↓
Migrate
   ↓
Observe
   ↓
Deprecate Old Path

Never:

Rewrite everything
→ hope nothing breaks

---

39. Existing Code Classification

Every existing module should eventually receive one classification:

KEEP
MIGRATE
ADAPT
EXTRACT
REPLACE
DEPRECATE
DELETE

"DELETE" is only permitted after the replacement capability has been verified.

---

40. Architecture Governance

Every major architectural change requires:

Problem
Decision
Alternatives
Trade-offs
Security Impact
Data Impact
Operational Impact
Migration Plan
Rollback Plan
Testing Strategy

Architectural decisions should be recorded as ADRs.

---

41. Definition of Architectural Completion

A phase is not complete because files exist.

A phase is complete when:

- contracts exist,
- implementation exists,
- tests exist,
- security boundaries are verified,
- observability exists,
- documentation exists,
- migration behavior is understood,
- failure modes are tested,
- rollback is understood,
- dependent systems are compatible.

---

42. Final Architecture Principle

CoreGrid Scholar must evolve from:

School Management Software

into:

Institutional Operating Platform

and eventually into:

Institutional Intelligence Infrastructure

The architecture therefore treats:

Identity
Data
Policy
Security
Workspaces
Agents
Digital Twins
Devices
Organizations
AI
Automation
Infrastructure

as interconnected platform primitives.

The ultimate system is not defined by the number of features it contains.

It is defined by the quality of its boundaries.

Every person gets the data they are authorized to receive.
Every agent gets the tools it is authorized to use.
Every workspace exposes only the capabilities its role permits.
Every tenant remains isolated.
Every sensitive operation is auditable.
Every architectural change remains reversible until proven safe.

That is the architectural bridge from the existing School OS to CoreGrid Scholar.