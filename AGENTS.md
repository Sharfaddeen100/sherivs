AGENTS.md

CoreGrid Engineering Agent Constitution

Document: "AGENTS.md"
System: CoreGrid
Purpose: Governing instructions for all AI coding agents and autonomous engineering systems
Authority: Repository-wide engineering policy
Applies to: Codex, Claude Code, Goose, autonomous agents, CI agents, review agents, research agents, and human engineers using agentic workflows

---

1. Mission

CoreGrid is an AI-native, multi-tenant institutional platform designed to operate schools, organizations, people, devices, buildings, environments, workflows, knowledge, communications, payments, analytics, automation, and Digital Twins as one governed ecosystem.

The objective is not merely to produce working code.

The objective is to produce a system that is:

- correct
- secure
- tenant-isolated
- policy-governed
- observable
- auditable
- explainable
- testable
- resilient
- maintainable
- replaceable
- scalable
- privacy-preserving
- AI-native
- operationally trustworthy

Working code that violates CoreGrid governance is considered incorrect code.

---

2. Non-Negotiable Principle

«No agent may optimize a local feature at the expense of the global CoreGrid architecture.»

Before changing code, agents must understand:

1. the architectural layer being modified
2. the tenant boundary
3. the identity boundary
4. the authorization model
5. the data classification
6. the policy constraints
7. the audit requirements
8. the Digital Twin implications
9. the AI implications
10. the testing requirements
11. the operational consequences

Never make a local implementation decision that creates a future architectural dead end.

---

3. Source of Truth Hierarchy

When sources disagree, use this precedence:

1. security and privacy invariants
2. CoreGrid Constitution
3. approved architecture decisions
4. phase specifications
5. database schema and RLS policies
6. API contracts
7. domain models
8. implementation
9. tests
10. documentation

Tests are not automatically authoritative if they encode behavior that violates the architecture.

An agent must flag the conflict instead of silently preserving incorrect behavior.

---

4. Repository Discovery Rule

Before modifying code, agents MUST inspect the repository.

At minimum inspect:

AGENTS.md
package.json
package-lock.json
bun.lock
tsconfig*
vite.config.*
src/
tests/
progress/
scripts/
database/
.claude/
.claude-flow/
.codex/
.swarm/
.mcp.json

Also inspect relevant:

routes
server functions
database migrations
RLS policies
authentication
authorization
AI gateway
Digital Twin modules
audit infrastructure
tenant resolution
environment configuration
tests

Do not assume a file, module, API, database table, or service exists.

Verify it.

---

5. Current Core Stack

The current application uses:

- TypeScript 5.9.x
- React 19
- TanStack Start
- TanStack Router
- TanStack React Query
- Vite
- Nitro
- Tailwind CSS 4
- shadcn/ui
- Radix UI
- Lucide
- Recharts
- React Hook Form
- Zod
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Vercel AI SDK
- OpenAI-compatible AI gateway
- Paystack
- Twilio
- Web Push
- Vitest
- Playwright
- ESLint
- Prettier

Agents must reuse existing infrastructure when appropriate.

Do not introduce another framework or infrastructure dependency merely because it is convenient.

---

6. Architecture Philosophy

CoreGrid follows a modular architecture.

Every major subsystem should have:

- clear ownership
- explicit boundaries
- typed interfaces
- domain contracts
- validation
- authorization
- observability
- tests
- auditability
- replaceable implementation

Prefer:

Domain
  ↓
Application
  ↓
Policy
  ↓
Infrastructure
  ↓
External Provider

rather than allowing domain logic to depend directly on vendors.

---

7. CoreGrid Control Plane

CoreGrid has a global internal control plane.

The CoreGrid Control Plane is NOT a school tenant.

It is the operational headquarters of the platform.

It governs:

- CoreGrid organizations
- schools
- campuses
- CoreGrid staff
- engineers
- support teams
- operations
- infrastructure
- AI agents
- Digital Twins
- policies
- platform configuration
- feature flags
- integrations
- billing
- security
- audit
- incidents
- observability
- provisioning

The CoreGrid Control Plane must never be confused with tenant application workspaces.

---

8. Tenant Model

CoreGrid is multi-tenant.

Primary hierarchy:

CoreGrid
│
├── CoreGrid Control Plane
│   ├── Owner
│   ├── Executives
│   ├── Engineers
│   ├── Support
│   ├── Security
│   ├── Operations
│   └── Platform Agents
│
└── Tenants
    ├── School
    │   ├── Campus
    │   ├── Departments
    │   ├── Users
    │   ├── Devices
    │   ├── Buildings
    │   ├── Environments
    │   └── Digital Twins
    │
    └── Future Organizations

Every request must have an explicit tenant context unless it is an authorized CoreGrid control-plane operation.

---

9. Identity Architecture

Never treat authentication as authorization.

Authentication answers:

«Who are you?»

Authorization answers:

«What are you allowed to do?»

Policy answers:

«Under which circumstances are you allowed to do it?»

Context answers:

«Which resource, tenant, relationship, environment, time, device, purpose, and sensitivity apply?»

CoreGrid therefore uses layered authorization.

---

10. Authorization Model

CoreGrid may combine:

- RBAC
- ABAC
- PBAC
- ReBAC
- RLS
- contextual authorization
- resource ownership
- purpose limitation
- data classification
- consent
- environment restrictions
- time restrictions
- device trust
- geographic restrictions where legally appropriate
- risk-based controls

No single authorization mechanism should be assumed sufficient.

---

11. RLS Is a Security Boundary

PostgreSQL Row Level Security is a mandatory isolation layer for tenant-sensitive data.

Application code must never be the sole tenant-isolation mechanism.

Every tenant-owned table must be evaluated for:

- tenant ownership
- user ownership
- organization relationship
- role requirements
- visibility
- administrative override
- service-role access
- audit requirements

Service-role access must never be exposed to untrusted clients.

---

12. Authorization Decision Model

A request should conceptually resolve as:

Identity
+
Tenant
+
Role
+
Relationship
+
Resource
+
Action
+
Policy
+
Data Classification
+
Purpose
+
Context
+
Risk
=
Authorization Decision

The result must be:

ALLOW
DENY
REDACT
ESCALATE
REQUIRE_APPROVAL

Never assume every authorized request should receive the complete underlying record.

---

13. Least Privilege

Every identity receives the minimum permissions necessary.

Examples:

A teacher does not automatically receive:

- another teacher's private notes
- parent financial information
- student medical information
- private AI Tutor conversations
- unrelated disciplinary records

A CoreGrid support engineer does not automatically receive:

- private student conversations
- passwords
- authentication secrets
- unrestricted tenant data

A school administrator does not automatically receive:

- CoreGrid internal systems
- other schools' data
- CoreGrid employee information
- platform secrets

A CoreGrid owner does not bypass audit requirements.

---

14. Break-Glass Access

Emergency access may exist for critical incidents.

Break-glass access MUST:

- require explicit authorization
- create an audit event
- identify the actor
- identify the resource
- identify the purpose
- record timestamp
- record justification
- have limited duration
- be reviewable afterward

Emergency access must never become normal access.

---

15. Sensitive Data

Sensitive data must be classified before use.

Examples include:

- authentication data
- financial data
- private messages
- AI Tutor conversations
- student records
- behavioral information
- health-related information
- disciplinary information
- private recommendations
- identity information
- family information
- location data
- device telemetry
- security data
- employee records
- confidential organizational information

Agents must not expose sensitive information merely because a database query can technically retrieve it.

---

16. AI Privacy Boundary

AI systems must obey the same authorization boundaries as humans.

Never send data to an AI model merely because the backend can access it.

Before AI context construction:

Identity
→ Authorization
→ Data Classification
→ Purpose Check
→ Minimization
→ Redaction
→ Context Construction
→ Model

AI agents must receive only the minimum information required for the task.

---

17. Digital Twin Security

A Digital Twin is NOT a permission bypass.

Every Twin must have:

- owner
- tenant
- resource scope
- identity scope
- policy scope
- data classification
- permitted actions
- permitted observers
- permitted AI agents
- retention policy
- audit policy

A Digital Twin must never reveal information merely because it contains that information.

---

18. Digital Twin Access

Examples:

Student Twin

May access:

- student's authorized academic information
- authorized learning patterns
- permitted recommendations
- permitted schedules
- permitted school interactions

Must not expose:

- another student's private data
- teacher-private notes
- confidential disciplinary information
- protected family information

Teacher Twin

May access:

- assigned classes
- authorized students
- teaching workload
- permitted recommendations

Must not expose:

- unrelated teacher records
- private student information outside scope
- CoreGrid internal data

Parent Twin

May access:

- authorized children
- permitted academic information
- permitted communication
- permitted financial information

Must not access unrelated students.

CoreGrid Support Twin

May access only the minimum operational information necessary for support.

---

19. Dynamic Workspace Principle

CoreGrid interfaces are permission-generated.

A user's workspace must be derived from:

Identity
+
Tenant
+
Role
+
Policies
+
Relationships
+
Assigned responsibilities
+
Resource scope
+
Feature permissions

Do not hardcode:

if user.role === "admin"

as the complete authorization model.

Prefer policy-driven capability resolution.

The UI should reflect authorized capabilities, but the backend remains authoritative.

---

20. CoreGrid Internal Workspace

The internal CoreGrid dashboard should dynamically expose capabilities for:

- platform owner
- engineering
- support
- security
- operations
- finance
- product
- infrastructure
- AI operations
- Digital Twin operations
- compliance
- incident response

A staff member should see only the workspace relevant to their assigned role and policies.

---

21. School Workspace

School administrators may manage:

- school configuration
- campuses
- departments
- staff
- students
- guardians
- classes
- permissions
- devices
- facilities
- workflows

They may not cross tenant boundaries.

---

22. Multi-Campus Model

A school may contain multiple campuses.

Example:

School
├── Campus A
├── Campus B
├── Campus C
└── Campus D

Permissions may be scoped to:

School-wide
Campus-specific
Department-specific
Resource-specific
Read-only
Operational
Administrative

A super administrator may be granted school-wide authority.

A campus administrator may be limited to one campus.

A read-only administrator must remain read-only at every backend boundary.

---

23. Provisioning

CoreGrid owner-authorized users may create schools.

School administrators may provision authorized school members.

Invitations must be:

- authenticated
- scoped
- expirable
- auditable
- revocable
- rate limited
- resistant to enumeration

Never create privileged accounts without an explicit authorization path.

---

24. Staff Roles

CoreGrid staff roles should be capability-oriented.

Examples:

COREGRID_OWNER
PLATFORM_ADMIN
ENGINEER
SENIOR_ENGINEER
SUPPORT_ENGINEER
SECURITY_ENGINEER
SRE
DATA_ENGINEER
AI_ENGINEER
AI_OPERATOR
PRODUCT
FINANCE
COMPLIANCE
AUDITOR
SUPPORT
READ_ONLY

These roles do not automatically grant unrestricted data access.

Policies determine effective permissions.

---

25. Agent Roles

AI agents are identities.

Each agent must have:

- agent ID
- owner
- purpose
- model
- capabilities
- tools
- data scopes
- tenant scopes
- permissions
- policy set
- memory scope
- audit trail
- lifecycle state

Agents must be treated as untrusted by default.

---

26. Agent Lifecycle

Agent lifecycle:

PROPOSED
↓
REVIEW
↓
APPROVED
↓
DEPLOYED
↓
MONITORED
↓
SUSPENDED
↓
REVIEWED
↓
RETIRED

An agent must not silently change its own production permissions.

---

27. AI Tool Access

Tools must be capability-scoped.

An agent should receive:

tool
+
allowed operations
+
resource scope
+
tenant scope
+
policy
+
rate limit

Never expose unrestricted database tools to general-purpose agents.

Prefer explicit tools such as:

get_authorized_student_profile()
get_authorized_schedule()
create_support_ticket()
read_device_health()

over unrestricted SQL access.

---

28. Agent Memory

Agent memory must be permission-aware.

Memory categories may include:

- session memory
- task memory
- user memory
- tenant memory
- operational memory
- research memory
- system memory

Memory retrieval must apply the same authorization model as primary data.

Never assume stored memory is safe simply because it was generated by an AI.

---

29. No Cross-Tenant Memory Leakage

An AI agent operating for School A must not retrieve School B memory unless explicitly authorized by CoreGrid policy.

Likewise:

User A
≠
User B

and:

Twin A
≠
Twin B

unless an explicit relationship permits access.

---

30. API Rules

Every API boundary must validate:

- authentication
- authorization
- tenant context
- input schema
- resource ownership
- policy
- rate limits
- audit requirements

Use Zod or equivalent schema validation at trust boundaries.

Never trust:

- client-provided tenant IDs
- client-provided roles
- client-provided permissions
- client-provided ownership
- hidden form fields
- UI visibility
- URL parameters

as proof of authorization.

---

31. Server Functions

TanStack Start server functions are privileged boundaries.

Treat them as APIs.

Every server function must:

1. authenticate
2. resolve tenant
3. authorize
4. validate input
5. perform operation
6. audit where required
7. return only authorized data

---

32. Database Rules

Database design must enforce invariants where possible.

Prefer:

- foreign keys
- unique constraints
- check constraints
- generated columns
- indexes
- RLS
- transactional operations
- immutable audit records

Do not rely exclusively on application logic for critical invariants.

---

33. Migration Rules

Database migrations must be:

- forward-compatible where practical
- reversible where practical
- tested
- idempotent where appropriate
- reviewed for RLS implications

Any migration affecting tenant-owned data must explicitly evaluate isolation.

---

34. Auditability

Security-sensitive actions must produce audit events.

Examples:

- permission changes
- role changes
- account creation
- account deletion
- invitations
- sensitive data access
- break-glass access
- AI agent creation
- AI tool execution
- policy changes
- Digital Twin access
- financial operations
- administrative actions

Audit logs should answer:

Who?
What?
When?
Where?
Which tenant?
Which resource?
Which action?
Why?
What was the result?

---

35. Observability

Important operations must be observable.

Use:

- structured logs
- metrics
- traces
- audit events
- health checks
- error reporting
- performance telemetry

Never log secrets.

Never log unnecessary private data.

---

36. Secrets

Never commit:

- API keys
- passwords
- private keys
- JWT secrets
- service-role keys
- payment secrets
- VAPID private keys
- database credentials

Agents must never print secrets into logs, patches, tests, or documentation.

---

37. Environment Variables

Before introducing a new environment variable:

1. search for an existing equivalent
2. verify whether the feature already has a configuration path
3. document the variable
4. validate it at runtime where appropriate

Remove stale configuration only after confirming it is genuinely unused.

---

38. External Providers

CoreGrid should remain provider-agnostic.

External services include:

- Supabase
- AI providers
- Paystack
- Twilio
- storage providers
- notification providers

Domain logic must not become permanently coupled to provider-specific APIs.

Use adapters where appropriate.

---

39. AI Gateway

AI requests should normally flow through the centralized AI gateway.

The gateway should provide:

- provider abstraction
- model routing
- authentication
- logging
- rate limiting
- policy enforcement
- cost controls
- safety controls
- observability
- fallback behavior

Do not create random direct model calls throughout the application.

---

40. AI Cost Governance

AI usage must be measurable.

Track where appropriate:

- model
- tokens
- latency
- cost
- user
- tenant
- feature
- agent
- task
- result status

Never expose provider credentials to clients.

---

41. AI Reliability

AI output is untrusted by default.

Do not allow model output to directly perform irreversible operations without appropriate controls.

For high-impact operations:

AI proposal
→ validation
→ policy evaluation
→ human approval where required
→ execution
→ audit

---

42. AI Hallucination Rule

Never treat generated text as authoritative merely because it sounds confident.

Critical decisions require:

- source evidence
- deterministic validation
- domain rules
- database verification
- confidence
- uncertainty
- human escalation where appropriate

---

43. Frontend Rules

Frontend components should be:

- accessible
- composable
- typed
- responsive
- tenant-aware
- permission-aware

Never rely on hiding a button as security.

The backend must independently enforce authorization.

---

44. Design System

Use the existing design system.

Prefer:

- shadcn/ui
- Radix
- Tailwind
- Lucide
- existing tokens

Do not introduce arbitrary styling systems without architectural justification.

Tenant branding should remain data-driven.

Do not hardcode tenant branding into components.

---

45. Data Fetching

Use TanStack Query consistently for client-side server state.

Avoid duplicate fetching mechanisms without reason.

Query keys must include relevant tenant/resource context.

Never construct cache keys that can accidentally collide across tenants.

---

46. Realtime

Realtime subscriptions must be tenant- and authorization-aware.

A user subscribed to School A must never receive School B events.

Validate server-side authorization before broadcasting sensitive events.

---

47. File Storage

Uploaded files must have:

- tenant ownership
- resource association
- authorization
- content validation
- size limits
- safe storage paths
- appropriate retention

Never expose raw private storage URLs without authorization where the content is private.

---

48. Payments

Payment workflows must:

- verify signatures
- be idempotent
- be auditable
- validate amounts
- validate ownership
- protect against replay
- never trust client payment state

Webhook handlers must be treated as security boundaries.

---

49. Testing Pyramid

Every meaningful feature should consider:

Unit
Integration
Database
Authorization
RLS
API
E2E
Security
Performance
Failure recovery

Security-sensitive features require authorization tests.

Tenant-sensitive features require cross-tenant isolation tests.

---

50. Mandatory Security Tests

At minimum test:

tenant A cannot read tenant B
tenant A cannot modify tenant B
user A cannot read user B private data
read-only cannot write
expired invitation cannot activate
revoked permission cannot authorize
wrong campus cannot access campus resource
AI agent cannot exceed scope
service-role access cannot leak to client

---

51. Regression Protection

Never fix a bug by weakening a security boundary.

If a test fails because authorization is correctly blocking an operation:

1. investigate the intended behavior
2. update the product contract if necessary
3. modify policy intentionally
4. add regression coverage

Do not simply remove the authorization check.

---

52. Performance

Optimize only after measuring.

Prefer:

- proper indexes
- query planning
- caching
- pagination
- batching
- streaming
- selective realtime subscriptions

Never optimize by bypassing authorization.

---

53. Scalability

CoreGrid must be designed to eventually support very large ecosystems.

Potential scale includes:

100,000+ users
10,000+ devices
5,000+ buildings
multiple campuses
large event streams
large Digital Twin populations
millions of telemetry records
large AI workloads

Do not prematurely distribute everything.

But avoid architectural choices that make future horizontal scaling impossible.

---

54. Digital Twin Architecture

A Digital Twin represents an authorized digital model of a real-world entity.

Possible Twin types:

Person
Student
Teacher
Parent
Employee
Device
Building
Campus
Room
Vehicle
Environment
Workflow
Organization
School
Department
Asset

A Twin consists of:

Identity
State
Relationships
Events
History
Capabilities
Policies
Predictions
Observations
Memory
Permissions

---

55. Twin Event Model

Prefer event-oriented state evolution.

Conceptually:

Observation
→ Event
→ Validation
→ State Update
→ Policy Evaluation
→ Twin State
→ Derived Intelligence

Do not let arbitrary AI output mutate canonical state.

---

56. Twin Separation

Separate:

Canonical Truth

from:

AI Interpretation

For example:

Student attendance record

is canonical.

AI believes attendance may correlate with declining engagement

is an inference.

Never overwrite canonical truth with inference without an explicit validated workflow.

---

57. Data Provenance

Important Digital Twin facts should have provenance.

Track where information originated.

Examples:

database
device
sensor
user
administrator
external API
AI inference
derived computation

AI-generated information must be distinguishable from verified source data.

---

58. Policy Engine

Policy should be centralized where practical.

A policy decision should be explainable.

Example:

DENY

Actor:
teacher:123

Resource:
student:456/private_ai_memory

Reason:
actor lacks private-memory permission

Avoid opaque authorization behavior.

---

59. Policy Changes

Policy modifications are high-risk.

They require:

- explicit authorization
- validation
- audit
- testing
- rollback strategy

A model must never silently modify authorization policies.

---

60. Error Handling

Errors must be:

- typed where appropriate
- actionable
- safe
- observable

Do not expose internal stack traces or secrets to clients.

Avoid swallowing errors.

Avoid generic "catch {}" blocks unless justified.

---

61. TypeScript Rules

Use strict TypeScript.

Avoid:

any

unless there is a documented reason.

Prefer:

- discriminated unions
- branded IDs
- typed domain objects
- Zod schemas
- explicit return types at important boundaries

---

62. Dependency Rules

Before adding a dependency:

1. check whether the repository already provides the capability
2. check bundle/server impact
3. check maintenance status
4. check security implications
5. check license
6. check whether it duplicates existing functionality

Do not add dependencies casually.

---

63. File Ownership

Agents must avoid unrelated modifications.

A task such as:

«Add student invitation»

does not authorize rewriting:

- authentication
- dashboard architecture
- payment infrastructure
- Digital Twin architecture

unless required.

Keep diffs focused.

---

64. No Destructive Refactors

Do not delete architecture merely because it is inconvenient.

Before deleting:

- search usages
- inspect dependencies
- inspect routes
- inspect imports
- inspect migrations
- inspect tests
- inspect agent configurations
- determine whether it is historical or active

When uncertain, preserve and document.

---

65. Existing Infrastructure

Do not recreate infrastructure that already exists.

Before implementing:

authentication
tenant resolution
AI gateway
audit
notifications
storage
payments
realtime

search the repository first.

Reuse established patterns.

---

66. Progress and Phase System

CoreGrid development is organized into architectural phases.

Agents must determine:

- current phase
- dependencies
- prerequisites
- affected modules
- completion criteria

Never implement a later-phase feature in a way that contradicts earlier foundations.

---

67. Phase Completion

A phase is not complete because files exist.

A phase is complete only when:

Architecture
+
Implementation
+
Tests
+
Security
+
Observability
+
Documentation
+
Migration
+
Operational readiness

are satisfied.

---

68. Agent Workflow

For every engineering task:

1. Read AGENTS.md
2. Inspect repository
3. Identify architecture
4. Identify affected boundaries
5. Identify policies
6. Identify existing implementation
7. Design smallest correct change
8. Implement
9. Test
10. Security-test
11. Inspect diff
12. Update documentation
13. Report remaining risks

---

69. Before Coding

Agents should answer internally:

What am I changing?
Why?
Who owns it?
Which tenant does it belong to?
Who can access it?
What data does it touch?
What policies apply?
What could leak?
What happens if it fails?
How will it be tested?
How will it be observed?

---

70. After Coding

Agents must inspect:

git diff
git status

and relevant test output.

Look specifically for:

- accidental unrelated changes
- security regressions
- tenant leaks
- missing validation
- missing audit events
- broken imports
- type errors
- dead code
- secret exposure

---

71. Commands

Prefer the repository's existing package-manager scripts.

Typical commands may include:

npm install
npm run dev
npm run build
npm run test
npm run lint
npm run typecheck

Verify actual scripts before assuming they exist.

For database work, use the repository's existing migration and Supabase workflow.

---

72. Windows Compatibility

The project may be developed on Windows.

Do not assume Unix-only commands.

When possible provide equivalent commands for:

PowerShell
CMD
Git Bash

Do not introduce shell scripts that silently assume Linux unless deployment requires them.

---

73. Documentation

Important architectural decisions should be documented.

Documentation should explain:

- what
- why
- constraints
- alternatives
- consequences

Do not write documentation that contradicts implementation.

---

74. Decision Records

Major changes should have an architectural decision record when appropriate.

Examples:

- new authorization mechanism
- new data architecture
- new AI provider
- new Digital Twin architecture
- major database restructuring
- new event architecture
- new tenancy model

---

75. Agent Communication

Agents should report:

Implemented
Tests
Security validation
Files changed
Architecture impact
Known limitations
Remaining risks

Do not claim completion when validation was not performed.

---

76. No Fake Completion

Never say:

«Done.»

if:

- tests were not run
- build is broken
- migrations were not validated
- security boundaries were not checked
- implementation is incomplete

Use explicit status.

---

77. Unknowns

When information is missing:

1. inspect the repository
2. inspect configuration
3. inspect tests
4. inspect migrations
5. inspect documentation

If still unknown, state the uncertainty.

Never invent architecture.

---

78. Security Escalation

Agents must stop and request human review when a change involves:

- authentication architecture
- authorization architecture
- tenant isolation
- encryption
- secrets
- payment security
- production credentials
- irreversible data migration
- destructive operations
- high-impact AI actions
- privacy-sensitive data access
- security policy changes

---

79. Autonomous Agent Boundaries

Agents may autonomously:

- inspect code
- write code
- write tests
- run tests
- improve documentation
- refactor local implementation
- diagnose errors

Agents must not autonomously:

- weaken tenant isolation
- disable RLS
- expose secrets
- grant unrestricted permissions
- bypass audit logging
- modify production security policy without authorization
- delete critical data
- deploy destructive changes
- silently change AI safety boundaries

---

80. CoreGrid Golden Rule

Every subsystem must answer five questions:

WHO?
WHAT?
WHERE?
WHY?
UNDER WHICH POLICY?

If those questions cannot be answered, the implementation is not ready.

---

81. Final Engineering Standard

CoreGrid must behave as though every action may eventually be:

- audited
- challenged
- inspected
- replayed
- investigated
- scaled
- attacked
- automated
- governed by AI

Therefore:

«Build for correctness first.

Build for security always.

Build for scale deliberately.

Build for observability continuously.

Build for humans to understand.

Build so autonomous agents can operate without becoming autonomous liabilities.»

---

82. Final Rule

When in doubt:

Do not guess.

Inspect.

Reason.

Validate.

Test.

Audit.

Then change the system.

CoreGrid is not a collection of features.

CoreGrid is a governed computing platform.