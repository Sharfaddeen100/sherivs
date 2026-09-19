# Phase 08 — Security Engine

## A. Identity

### A.1 Subsystem Identity

The Security Engine is CoreGrid's operational security-control subsystem.

It provides the runtime mechanisms required to detect, evaluate, enforce, record, and respond to security-relevant actions across the platform.

### A.2 Canonical Name

Security Engine

### A.3 Phase

Phase 08

### A.4 Architectural Role

Core platform security-control runtime.

### A.5 Primary Responsibility

The Security Engine converts CoreGrid's security policies into executable runtime controls.

### A.6 Security Engine Principle

Security must be enforced by the platform rather than depending exclusively on application developers, AI agents, or user behavior.

### A.7 Security Model

The engine follows defense-in-depth.

Security decisions may be enforced at:

- API boundaries
- service boundaries
- database boundaries
- agent boundaries
- tool boundaries
- workflow boundaries
- infrastructure boundaries
- tenant boundaries
- device boundaries
- session boundaries
- data boundaries

---

# B. Purpose

## B.1 Primary Purpose

Protect CoreGrid and every tenant, runtime and capability on it from unauthorized, unsafe, malicious, accidental, or policy-violating activity.

## B.2 Secondary Purposes

The engine provides:

- authorization enforcement
- security policy evaluation
- access-risk evaluation
- session security
- credential protection
- threat detection
- anomaly detection
- security event processing
- security incident creation
- security response orchestration
- security audit evidence
- security control enforcement
- agent security controls
- tool security controls
- service security controls
- data-access security controls

## B.3 Security Objective

Every sensitive operation should be:

1. identifiable
2. authenticated
3. authorized
4. policy-evaluated
5. risk-evaluated
6. bounded
7. observable
8. auditable
9. reversible where possible

## B.4 Non-Goals

The Security Engine does not own:

- the complete identity system
- tenant lifecycle
- the complete trust fabric
- organizational governance
- compliance governance
- legal policy
- business continuity
- financial authorization policy
- application business logic
- academic authorization logic
- marketplace business logic

Those responsibilities belong to their respective architectural phases.

---

# C. Ownership

## C.1 Security Engine Owns

The Security Engine owns:

- security policy execution
- security decision enforcement
- authorization evaluation runtime
- risk-based access decisions
- security event processing
- security alert generation
- security incident state
- session-security enforcement
- credential-security controls
- security rate limiting
- suspicious-activity detection
- security control telemetry
- security enforcement APIs
- security middleware
- security decision explanations
- security evidence generation

## C.2 Security Engine Does Not Own

It does not own:

- user identity records
- tenant records
- institutional records
- application domain entities
- educational records
- financial ledgers
- marketplace inventory
- general analytics
- general workflow orchestration

---

# D. Boundaries

## D.1 Identity Boundary

Phase 02 owns identity.

Security Engine consumes identity assertions.

## D.2 Multi-Tenancy Boundary

Phase 03 owns tenant architecture.

Security Engine enforces tenant security boundaries.

## D.3 Application Runtime Boundary

Phase 05 owns application runtime.

Security Engine provides security middleware and enforcement services to it.

## D.4 Workspace Boundary

Phase 06 owns workspace behavior.

Security Engine protects workspace operations.

## D.5 Agent Boundary

Phase 07 owns the agent operating system.

Security Engine controls:

- agent permissions
- tool authorization
- sensitive actions
- agent security events
- agent risk limits

## D.6 Trust Fabric Boundary

Phase 09 owns the broader security and trust architecture.

Phase 08 provides the operational enforcement mechanisms consumed by Phase 09.

---

# E. Dependencies

## E.1 Required Dependencies

Security Engine depends on:

- Phase 01 Foundation
- Phase 02 Identity
- Phase 03 Multi-Tenancy
- Phase 05 Core Application Runtime
- Phase 07 AI Agent System

## E.2 Optional Dependencies

It may consume:

- infrastructure telemetry
- device signals
- network signals
- threat-intelligence signals
- behavioral signals

## E.3 Dependency Principle

Security Engine must never create circular architectural dependencies.

---

# F. Contracts

## F.1 Security Decision Contract

Every security decision should contain:

- request ID
- actor ID
- actor type
- tenant ID
- resource
- action
- context
- policy version
- risk score
- decision
- reason
- timestamp
- expiration
- correlation ID

## F.2 Decision States

Supported decisions:

- ALLOW
- DENY
- CHALLENGE
- STEP_UP
- REVIEW
- QUARANTINE
- RATE_LIMIT
- BLOCK
- DEFER

## F.3 Security Event Contract

Security events contain:

- event ID
- event type
- actor
- tenant
- resource
- actio

Z.2 Risk API
text
POST /security/risk/evaluate

Z.3 Policy API
text
GET /security/policies
POST /security/policies
POST /security/policies/{id}/publish
POST /security/policies/{id}/rollback

Z.4 Session API
text
POST /security/sessions/{id}/revoke

Z.5 Alert API
text
GET /security/alerts
POST /security/alerts/{id}/acknowledge

Z.6 Incident API
text
GET /security/incidents
POST /security/incidents
PATCH /security/incidents/{id}


───

AA. Events
Security events include:
text
security.authorization.requested
security.authorization.decided
security.policy.updated
security.policy.published
security.session.suspicious
security.session.revoked
security.credential.rotated
security.threat.detected
security.anomaly.detected
security.alert.created
security.incident.created
security.incident.updated
security.agent.blocked
security.tool.blocked
security.data.export.detected


───

AB. Webhooks
Security webhooks may notify authorized systems about:
• critical security alerts
• incident creation
• credential events
• security policy changes
• emergency blocks
Webhook security requires:
• signature verification
• replay protection
• delivery tracking
• retry control
• secret rotation

───

AC. MCP Interfaces
Security MCP capabilities may include:
text
security.authorize
security.evaluate_risk
security.inspect_policy
security.inspect_incident
security.inspect_alert
security.inspect_security_event
security.revoke_session
security.block_actor

MCP access itself must be security-controlled.

───

AD. Database Models
Core entities include:
• SecurityPolicy
• PolicyVersion
• AuthorizationDecision
• RiskAssessment
• SecurityEvent
• SecurityAlert
• SecurityIncident
• SecurityEvidence
• SecuritySession
• CredentialRecord
• SecurityBlock
• RateLimitState
• AgentSecurityProfile
• ToolSecurityProfile
AD.1 Required Constraints
Enforce:
• tenant isolation
• unique identifiers
• immutable event IDs
• timestamp integrity
• policy-version references
• actor references
• correlation references

───

AE. Agent Responsibilities
Security Monitor Agent
Detects suspicious behavior.
Threat Analysis Agent
Correlates security signals.
Security Investigation Agent
Builds investigation timelines.
Security Response Agent
Recommends or performs approved containment actions.
Policy Analysis Agent
Analyzes policy effectiveness.
Security Audit Agent
Produces security evidence summaries.
Agents must operate under least privilege.

───

AF. Human Escalation
Human approval should be required for selected high-impact actions.
Examples:
• permanent account termination
• destructive data operations
• broad tenant blocking
• production security-policy changes
• credential revocation affecting critical infrastructure
• emergency infrastructure actions

───

AG. Security Principles
CoreGrid Security Engine follows:
1. least privilege
2. defense in depth
3. fail closed
4. zero implicit trust
5. explicit authorization
6. tenant isolation
7. secure defaults
8. complete auditability
9. separation of duties
10. credential minimization
11. reversible operations where possible
12. human escalation for exceptional high-impact actions

───

AH. Observability
Monitor:
• authorization latency
• denial rate
• policy evaluation latency
• security event throughput
• alert volume
• incident volume
• false-positive rate
• detection latency
• response latency
• failed security controls
Every security decision should be traceable through distributed tracing.

───

AI. Testing
AI.1 Unit Testing
Test:
• policies
• authorization
• risk calculations
• session controls
• rate limits
AI.2 Integration Testing
Test:
• identity integration
• tenant isolation
• API gateway
• database security
• agent security
AI.3 End-to-End Testing
Test complete attack and defense flows.
AI.4 Security Testing
Include:
• penetration testing
• fuzzing
• privilege-escalation testing
• authentication bypass testing
• authorization bypass testing
• injection testing
• API abuse testing
• data-exfiltration testing
AI.5 AI Evaluation
Evaluate AI-assisted security components for:
• precision
• recall
• false positives
• false negatives
• adversarial robustness
• explanation quality

───

AJ. Performance
Security enforcement must minimize operational latency.
Targets must be defined per deployment class.
Critical-path authorization should be optimized through:
• policy caching
• decision caching where safe
• efficient policy evaluation
• local enforcement
• asynchronous telemetry
Security correctness takes precedence over latency optimization.

───

AK. Failure Recovery
Security failures must default to safe behavior.
AK.1 Failure Modes
Handle:
• policy service unavailable
• database unavailable
• identity unavailable
• telemetry unavailable
• threat detector unavailable
• cache unavailable
AK.2 Fail-Safe Strategy
Critical security decisions should fail closed unless an explicitly approved emergency policy states otherwise.

───

AL. Deployment
Deploy components independently where operationally useful.
Possible services:
• security-gateway
• authorization-service
• policy-service
• risk-service
• threat-detection-service
• security-event-service
• alert-service
• incident-service
Containerize services.
Use infrastructure-as-code.
Separate:
• development
• staging
• production

───

AM. Secrets Management
Secrets must be stored in an approved secret-management system.
Never store production secrets in:
• Git
• source files
• agent memory
• prompts
• logs
• documentation

───

AN. Disaster Recovery
Security systems require:
• encrypted backups
• tested restoration
• incident recovery procedures
• policy backups
• evidence preservation
• credential recovery procedures
• emergency access procedures

───

AO. Operational Procedures
Document:
• security incident response
• emergency access
• credential rotation
• policy rollback
• service recovery
• threat investigation
• false-positive review
• security control review

───

AP. Compliance Support
The Security Engine provides technical evidence for compliance systems but does not itself define legal compliance requirements.
Support evidence for:
• access control
• auditability
• data protection
• incident response
• retention
• security monitoring
• tenant isolation

───

AQ. Acceptance Criteria
Phase 08 is accepted when:
1. security policies can be evaluated.
2. authorization is enforced.
3. tenant boundaries are enforced.
4. agent actions are security-controlled.
5. tool access is security-controlled.
6. security events are generated.
7. suspicious behavior can generate alerts.
8. incidents can be created and tracked.
9. security evidence is preserved.
10. critical security failures fail safely.
11. security APIs are documented.
12. security controls are observable.
13. security testing passes.
14. rollback procedures exist.
15. operational recovery has been tested.

───

AR. Definition of Done
Phase 08 is complete only when:
• implementation exists
• APIs exist
• policies are executable
• database models are implemented
• security controls are tested
• agent controls are enforced
• tool controls are enforced
• tenant isolation is verified
• observability exists
• incidents can be investigated
• security evidence is preserved
• deployment is reproducible
• disaster recovery is tested
• documentation is complete
• security contracts are versioned

───

AS. Future Evolution
The Security Engine must evolve without breaking downstream systems.
Future capabilities may include:
• advanced behavioral security
• continuous authorization
• adaptive risk
• autonomous threat hunting
• confidential computing integration
• stronger agent isolation
• cryptographic identity
• hardware-backed security
• privacy-preserving security analytics
• advanced deception systems
All future changes must preserve:
• API compatibility
• event compatibility
• tenant isolation
• authorization semantics
• auditability
• security guarantees

───

AT. Architectural Invariants
The following rules are mandatory:
1. Security cannot be bypassed by application code.
2. AI agents cannot bypass security controls.
3. Tenant boundaries cannot be disabled by ordinary application logic.
4. Security decisions must be attributable.
5. Critical actions require explicit authorization.
6. Production security policies cannot be silently changed.
7. Security events cannot be silently deleted.
8. Credentials cannot enter agent memory without explicit policy authorization.
9. Security failures must not silently become authorization grants.
10. Emergency access must itself be audited.
11. Security controls must remain observable.
12. Security architecture must remain independent from business-domain logic.

───

AU. Phase Boundary With Phase 09
Phase 08 provides the Security Engine.
Phase 09 provides the broader Security & Trust Fabric.
Phase 08 focuses on executable security controls.
Phase 09 will define the wider trust architecture, security governance, trust relationships, cryptographic trust mechanisms, security posture, and cross-system trust model.
Phase 09 must consume Phase 08 capabilities rather than duplicate them.

───

AV. Final Architectural Principle
CoreGrid must never treat security as a feature added after the platform is built.
Security Engine is an active runtime control plane that continuously evaluates and enforces whether actions are permitted, safe, attributable, and appropriately bounded.

───

AW. COMMAND MODEL

AW.1 What a Command Is

Every security-relevant operation is a COMMAND: an attempt by a principal
(human, agent, service, device) to read or change a protected resource. The
engine does not publish one command per resource. It publishes one evaluation
path that any command handler must call before it acts, so commands cannot
diverge from each other.

AW.2 The Command Path

command arrives
  → Security Gateway (Section H) validates identity, tenant context, request
    integrity, session state and rate limit — and fails closed on any missing
    or invalid signal
  → an authorization decision is supplied by the owner of the rules:
    identity and attributes (Phase 02), tenant membership (Phase 03), role
    gates (this phase), domain policy (the owning phase)
  → risk is evaluated (Section K) wherever signals exist
  → ONE decision is produced from the nine states of Section F.2
  → the command proceeds, is challenged, or is denied
  → the decision stays attributable: request, actor, actor type, tenant,
    resource, action, context, policy version, risk score, reason, timestamp,
    TTL, correlation id (Section F.1)

AW.3 Command Classes and Their Decisions

| Command class | Meaning | Decision states it may yield |
| --- | --- | --- |
| ALLOW | proceed now | ALLOW |
| REDACT | proceed; the resource layer masks fields | ALLOW (never a silent DENY) |
| REQUIRE_APPROVAL | hold for a human decision | CHALLENGE |
| ESCALATE | quarantine for investigation | QUARANTINE |
| DENY | refuse | DENY |
| THROTTLE | slow the caller, do not refuse | RATE_LIMIT |
| STEP_UP | the actor may continue after stronger proof | STEP_UP |
| BLOCK | refuse and stop the principal | BLOCK |
| DEFER | no decision yet; do not act | DEFER |

AW.4 Non-Granting Rule (machine form)

`frontend/src/lib/security-core.ts` exports `NON_GRANTING_DECISION_STATES` and
`isGrantingDecision`. Eight of the nine states must never be read as permission;
only ALLOW grants. A handler that treats CHALLENGE, STEP_UP, REVIEW, QUARANTINE,
RATE_LIMIT, BLOCK or DEFER as success has bypassed the engine — that is the
invariant the unit suite pins.

AW.5 Command Attribution and Expiry

An unattributable command is an unauditable command, and an unauditable command
is not permitted. `createSecurityDecision` refuses to build a decision without
request, actor, actor type, tenant, resource, action, context, policy version,
risk score, correlation and a positive TTL; `isSecurityDecisionExpired` exists so
that a stale ALLOW can never be replayed indefinitely.

AW.6 Where Commands Are Enforced Today

- `frontend/src/lib/security-core.ts` — decision contract, gateway, fail-closed rule.
- `frontend/src/lib/security-role-gate.ts` — the canonical role-command gate.
- `frontend/src/lib/*.functions.ts` — the command handlers themselves. Each phase
  owns its commands; this engine owns only the decision they must obtain first.
- `tests/unit/p08-enforcement-surface.test.ts` — machine-checked inventory: every
  role-scoped server-function family must route its decision through the gate, so
  a new family that skips it fails the suite. 22 families are ADOPTED as of the
  gate's last revision.

AW.7 Command Debt (reported, not hidden)

Risk evaluation, security-event emission, alerting, incident state and evidence
records are implemented and unit-tested in this phase but no boundary command
invokes them yet (probe classification IMPLEMENTED_UNWIRED). Until a command path
calls them, they are library capability, not enforcement — and this document
says so.

───

AX. DATA MODEL

AX.1 Entities of the Engine (Section AD) and Where They Live Today

The engine's entities fall into three honest categories: persisted platform
tables, module-owned records built and validated in-process, and entities that
exist only as intent in a document. Naming the category is part of the contract,
because a reader must be able to tell which of them can actually be queried.

| Entity (Section AD) | Representation today | Owner |
| --- | --- | --- |
| SecurityPolicy, PolicyVersion | module records with a versioned lifecycle (draft → … → archived) and controlled rollback in `security-policy.ts`; no table yet — policy sets are configuration, not tenant data | 08 |
| AuthorizationDecision | produced by `createSecurityDecision`; the enforcement surface proves the decision happened | 08 |
| RiskAssessment | `evaluateRisk` produces a score and a level from caller-supplied signals; no signal store yet | 08 |
| SecurityEvent | `createSecurityEvent` with immutable event ids and `assertSecurityEventImmutable`; the durable ledger is the kernel event substrate (Phase 33 `cg_event`/`cg_observation`) | 08 / 33 |
| SecurityAlert | `createSecurityAlert` + `transitionSecurityAlert` (status machine); the operational alert surface belongs to the command centre (Phase 19 `command-alerts.ts`) | 08 / 19 |
| SecurityIncident | `createSecurityIncident` + `INCIDENT_STATES` lifecycle; the operational incident surface belongs to the command centre (Phase 19 `command-incidents.ts`) | 08 / 19 |
| SecurityEvidence | `createSecurityEvidenceRecord` (timestamped, traceable); durable evidence storage is the audit ledger (Phase 01 conventions, Phase 33 substrate) | 08 |
| SecuritySession | `evaluateSessionSecurity`, `evaluateConcurrentSessions`, `revokeSession`; session records are identity's (Phase 02) | 02 |
| CredentialRecord | owned by identity (Phase 02) and by secret management (Phase 01 conventions, `scripts/verification/secret-scan.mjs`) | 01/02 |
| SecurityBlock | the `BLOCK` decision state exists; a block registry is not implemented | 08 (debt) |
| RateLimitState | the limiter lives in the runtime fabric (Phase 05 `runtime-resilience.ts`); this engine consumes the verdict (`withinRateLimit`) | 05 |
| AgentSecurityProfile | `evaluateAgentSecurity`, `HIGH_RISK_AGENT_ACTION_TYPES`, `canActAsUser`; agent registries are Phase 07's | 07/08 |
| ToolSecurityProfile | `evaluateToolSecurity`, `DANGEROUS_TOOL_CATEGORIES`; tool definitions are Phase 07's | 07/08 |

AX.2 Required Constraints (Section AD.1) and Their Machine Form

- Tenant isolation — RLS is this engine's database layer
  (`database/supabase/migrations/*rls*`, `database/queries/rls-isolation-check.sql`,
  `scripts/verify-tenant-isolation.mjs`); cross-tenant access fails closed.
- Unique identifiers — event, decision, alert, incident and evidence ids are
  generated once and carried through the record.
- Immutable event ids and timestamp integrity — `assertSecurityEventImmutable`
  turns a rewritten event into a detectable defect rather than a quiet edit.
- Policy-version references — a decision records the policy version that produced
  it, so a policy change is never retroactively blamed on earlier decisions.
- Actor and correlation references — `actorId`, `actorType` and `correlationId`
  are mandatory on decisions and events; that is what makes an investigation
  possible after the fact.

AX.3 Canonical Truth vs Intelligence

Policy sets, decision records and the security audit trail are canonical (this
phase's contract `canonicalTruth.owners`). Risk scores and anomaly signals are
DERIVED (`canonicalTruth.derived`): they may recommend a decision, they may never
rewrite a record, and a failure may never silently become a grant (AT.9).

AX.4 Classification Vocabulary

The platform's data-classification vocabulary is defined once, by the data
governance capability (Phase 14 `data-core.ts`): PUBLIC, INTERNAL, CONFIDENTIAL,
SENSITIVE, HIGHLY_SENSITIVE, REGULATED. Section P of this document proposed a
different five-word set (RESTRICTED / HIGHLY_RESTRICTED). The platform vocabulary
wins: two classifications for one dataset is a governance defect. This engine
consumes the platform classification instead of defining its own.

AX.5 Not Persisted Yet (reported debt)

A block registry, a durable risk-signal store, and security-specific tables for
policies and decisions do not exist as tables. Until they do, this engine's
guarantees rest on modules that fail closed, RLS, the kernel event substrate and
the audit trail — which is weaker than a persisted decision ledger, and is
recorded here as unfinished work rather than implied completeness.

───

AY. RUNTIME CONSUMER BOUNDARY

AY.1 The Kernel Is the Platform

CoreGrid owns this engine. A runtime is an application installed ON the kernel.
CoreGrid is runtime-001: the first consumer, never the owner. This
document's scope statements therefore describe CoreGrid, and runtime-specific
vocabulary reaches the engine through an adapter in the runtime layer
(`frontend/src/lib/runtime/scholar-*`), never by editing a kernel module.

AY.2 What a Runtime Supplies

- its role vocabulary and role-kind map (the installed runtime: the staff kinds bound to the
  identity catalog and consumed through `security-role-gate.ts`);
- its policy packs — which actions require which decision class;
- its risk-signal producers (device, location, behaviour) where it has them.

AY.3 What No Runtime May Do

- change a decision rule inside the engine;
- treat CHALLENGE, STEP_UP, REVIEW, QUARANTINE, RATE_LIMIT, BLOCK or DEFER as
  success;
- bypass the gateway by calling a protected resource directly;
- fork the decision contract, so that two runtimes mean two different ALLOWs.

AY.4 Machine Enforcement

`tests/unit/platform-neutrality.test.ts` enforces this boundary structurally: no
kernel or capability module may import a runtime, no kernel module may introduce
itself as a runtime's subsystem, and no platform surface may hard-code a limited
role list. `scripts/neutralise-scholar-framing.mjs --check` reports any framing
regression and exits non-zero, so a later phase cannot quietly undo the boundary.

───

AZ. QUERY MODEL

AZ.1 The Read Side of the Engine

A decision nobody can read is a decision nobody can review. The read side of the
Security Engine answers three questions and refuses the fourth:

| Query | Question it answers | Owner |
| --- | --- | --- |
| decision query | "why was this action allowed or denied?" | 08 — `security:audit-query`, declared in this phase's contract |
| event query | "what happened to this actor, tenant or resource?" | 08 / 33 — the kernel event ledger |
| alert and incident query | "what is open, who owns it, what changed?" | 19 — command-centre surfaces over this phase's state machines |
| resource query | "show me the record" | the owning phase, never this engine |

AZ.2 Query Rules

- Every query is tenant-scoped before it is anything else; a cross-tenant read
  fails closed (Section Q.3).
- Queries are paged with a declared maximum. An unpaged "read everything" is an
  export rather than a query, and exports are monitored (Section P.3, the
  `data_export_event` security event type).
- Redaction follows the decision: a REDACT decision means the resource layer masks
  fields, and the query must not hand back what the decision withheld.
- A query result is an observation, never an edit — reading a record may not
  rewrite it (Section AX.3: canonical truth versus derived intelligence).
- A query over a derived signal (risk score, anomaly) must carry the derivation,
  so an investigator can see which signals produced the number they are reading.

AZ.3 Query Debt (reported, not hidden)

No security query surface is implemented or wired today: the contract declares
`security:audit-query`, decision and event records exist in-process, and the
kernel event ledger is the durable read path — but no route, server function or
surface issues a security query yet. This is the same debt class as AW.7, and it
is recorded here rather than implied.

