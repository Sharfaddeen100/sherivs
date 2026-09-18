Phase 09 — Security & Trust Fabric
A. Identity
A.1 Subsystem Identity
The Security & Trust Fabric is CoreGrid's cross-system trust architecture.
It establishes, evaluates, maintains, propagates, and verifies trust relationships between:
• users
• identities
• institutions
• tenants
• organizations
• devices
• agents
• services
• applications
• APIs
• tools
• workloads
• data
• documents
• credentials
• cryptographic keys
• external systems
• infrastructure components
The Security & Trust Fabric is not the runtime authorization engine.
Runtime security enforcement belongs to Phase 08.
The Trust Fabric provides the trust foundations and trust state upon which security decisions can depend.

───

A.2 Canonical Name
Security & Trust Fabric

───

A.3 Phase
Phase 09

───

A.4 Architectural Role
Cross-platform trust and assurance layer.

───

A.5 Primary Responsibility
Establish trustworthy relationships and trustworthy system state across CoreGrid.

───

A.6 Core Principle
No entity should automatically be trusted merely because it exists.
Trust must be:
• established
• contextual
• measurable
• verifiable
• bounded
• revocable
• observable
• attributable
• time-aware

───

A.7 Trust Model
Trust is treated as a continuously changing state rather than a permanent property.
An entity may be:
• trusted
• partially trusted
• conditionally trusted
• untrusted
• compromised
• quarantined
• revoked
• unknown

───

B. Purpose
B.1 Primary Purpose
Provide CoreGrid with a unified trust architecture for determining whether identities, systems, devices, agents, data, software, and external relationships can be considered trustworthy.
B.2 Secondary Purposes
The fabric provides:
• trust establishment
• trust verification
• trust scoring
• trust relationships
• trust provenance
• cryptographic trust
• device trust
• workload trust
• agent trust
• service trust
• data provenance
• software provenance
• credential assurance
• key trust
• certificate trust
• attestation
• security posture
• trust revocation
• trust propagation
• trust federation
• trust evidence

───

C. Ownership
The Trust Fabric owns:
• trust relationships
• trust assertions
• trust scores
• trust evidence
• trust provenance
• trust state
• trust transitions
• trust revocation
• trust federation
• cryptographic trust metadata
• key trust metadata
• certificate relationships
• device trust state
• workload trust state
• agent trust state
• service trust state
• software provenance
• artifact provenance
• attestation records
• security posture references
• trust-policy metadata
• trust graph

───

D. Boundaries
D.1 Phase 08 Boundary
Phase 08 owns:
• runtime authorization
• runtime security enforcement
• security policy execution
• security alerts
• security incident runtime
• security rate limiting
• security enforcement middleware
Phase 09 does not duplicate these mechanisms.
Phase 09 supplies trust information to them.

───

D.2 Phase 02 Boundary
Phase 02 owns:
• identity lifecycle
• account lifecycle
• authentication mechanisms
• identity records
• identity recovery
Phase 09 evaluates the trustworthiness and assurance associated with those identities.

───

D.3 Phase 03 Boundary
Phase 03 owns:
• tenant architecture
• tenant lifecycle
• tenant isolation model
Phase 09 establishes trust relationships across tenant and organizational boundaries.

───

D.4 Phase 07 Boundary
Phase 07 owns:
• agent runtime
• agent lifecycle
• agent execution
• tool orchestration
Phase 09 provides agent trust state and assurance.

───

D.5 Compliance Boundary
The Trust Fabric provides technical trust evidence.
It does not define legal compliance requirements.

───

E. Dependencies
E.1 Required Dependencies
Consumes capabilities from:
• Phase 01 Foundation
• Phase 02 Identity
• Phase 03 Multi-Tenancy
• Phase 07 AI Agent System
• Phase 08 Security Engine
E.2 Optional Dependencies
May consume:
• infrastructure telemetry
• device telemetry
• certificate authorities
• hardware attestation systems
• external identity providers
• threat intelligence
• software-signing infrastructure
• cloud provider attestation
• external trust registries

───

F. Contracts
F.1 Trust Assertion
A trust assertion contains:
• assertion ID
• issuer
• subject
• trust type
• trust level
• evidence
• issued timestamp
• expiration
• scope
• tenant
• policy
• cryptographic signature
• provenance

───

F.2 Trust Decision Input
Trust information may contain:
• subject
• issuer
• context
• trust score
• evidence
• posture
• attestation
• expiration
• revocation status
• provenance
• confidence

───

F.3 Trust State
Supported states:
• UNKNOWN
• UNVERIFIED
• VERIFIED
• TRUSTED
• CONDITIONALLY_TRUSTED
• DEGRADED
• SUSPENDED
• COMPROMISED
• REVOKED
• QUARANTINED

───

G. Internal Architecture
The fabric consists of:
1. Trust Registry
2. Trust Graph
3. Trust Evaluation Engine
4. Trust Assertion Engine
5. Trust Evidence Engine
6. Trust Provenance Engine
7. Trust Federation Engine
8. Trust Revocation Engine
9. Cryptographic Trust Service
10. Key Trust Registry
11. Certificate Trust Registry
12. Attestation Engine
13. Device Trust Engine
14. Workload Trust Engine
15. Agent Trust Engine
16. Service Trust Engine
17. Software Provenance Engine
18. Artifact Integrity Engine
19. Security Posture Engine
20. Trust Scoring Engine
21. Trust Policy Registry
22. Trust Telemetry Engine

───

H. Trust Registry
H.1 Purpose
Maintain canonical trust relationships.
H.2 Trust Subjects
Subjects may include:
• people
• organizations
• institutions
• tenants
• devices
• agents
• services
• applications
• workloads
• software
• artifacts
• data sources

───

I. Trust Graph
I.1 Purpose
Represent relationships between trusted entities.
Example:
text
Institution
    |
    ├── trusts
    │      |
    │      └── User
    |
    ├── operates
    │      |
    │      └── Device
    |
    ├── deploys
    │      |
    │      └── Service
    |
    └── authorizes
           |
           └── Agent

I.2 Relationship Types
Examples:
• TRUSTS
• ISSUED_BY
• VERIFIED_BY
• OPERATED_BY
• OWNED_BY
• ATTESTED_BY
• SIGNED_BY
• DEPLOYED_BY
• DERIVED_FROM
• DEPENDS_ON
• FEDERATED_WITH
• REVOKED_BY
• CERTIFIED_BY

───

J. Trust Evaluation Engine
J.1 Purpose
Evaluate the current trustworthiness of an entity.
J.2 Inputs
Includes:
• trust assertions
• evidence
• provenance
• posture
• attestations
• historical behavior
• revocation state
• credential assurance
• cryptographic verification
J.3 Output
Produces:
• trust state
• trust score
• confidence
• evidence references
• expiration
• recommended restrictions

───

K. Trust Scoring
K.1 Principle
Trust scores must never be treated as absolute truth.
They represent evidence-weighted confidence.
K.2 Factors
Potential factors:
• identity assurance
• credential strength
• device assurance
• software integrity
• workload integrity
• historical behavior
• attestation
• provenance
• certificate validity
• security posture
• recent security incidents
K.3 Score Properties
Scores must be:
• explainable
• versioned
• contextual
• time-sensitive
• evidence-backed

───

L. Trust Assertions
L.1 Assertion Sources
Assertions may originate from:
• CoreGrid services
• institutions
• identity providers
• certificate authorities
• device attestation
• software signing systems
• administrators
• trusted external organizations
L.2 Assertion Requirements
Assertions require:
• issuer
• subject
• scope
• timestamp
• expiration
• evidence
• integrity protection

───

M. Trust Evidence
M.1 Evidence
Evidence may include:
• authentication assurance
• device attestation
• certificate verification
• software signatures
• deployment provenance
• security posture
• security events
• historical trust decisions
M.2 Evidence Quality
Evidence should have:
• source
• freshness
• reliability
• integrity
• provenance
• confidence

───

N. Trust Provenance
N.1 Purpose
Answer:
Why does CoreGrid trust this entity?
N.2 Provenance Chain
Example:
text
Trust Decision
      ↓
Trust Assertion
      ↓
Issuer
      ↓
Evidence
      ↓
Verification Method
      ↓
Source

N.3 Provenance Requirements
Every important trust assertion must be traceable to its evidence.

───

O. Cryptographic Trust
O.1 Purpose
Establish machine-verifiable trust.
O.2 Capabilities
Support:
• digital signatures
• signature verification
• key ownership
• certificate chains
• key rotation
• key revocation
• cryptographic identity
• artifact signing
• data integrity verification

───

P. Key Trust Registry
Maintain metadata for:
• public keys
• signing keys
• encryption keys
• service keys
• agent keys
• device keys
The registry must not expose private keys.

───

Q. Certificate Trust
Support:
• certificate registration
• certificate validation
• expiration tracking
• chain verification
• revocation status
• certificate ownership
• certificate rotation

───

R. Attestation
R.1 Purpose
Verify claims about system state.
Attestation may verify:
• device state
• workload state
• software state
• runtime environment
• secure boot state
• deployment identity
R.2 Attestation Lifecycle
text
Request
   ↓
Evidence
   ↓
Verification
   ↓
Assertion
   ↓
Trust Update


───

S. Device Trust
Device trust may consider:
• device identity
• ownership
• enrollment
• posture
• operating-system state
• security status
• encryption status
• attestation
• recent anomalies
Device trust must remain separate from device functionality.

───

T. Workload Trust
Workload trust evaluates:
• workload identity
• deployment origin
• artifact integrity
• image provenance
• configuration integrity
• runtime identity
• deployment environment

───

U. Agent Trust
U.1 Purpose
Determine whether an AI agent is operating within a trustworthy state.
U.2 Trust Factors
Include:
• agent identity
• model identity
• configuration
• tool permissions
• execution history
• policy compliance
• prompt integrity
• tool behavior
• deployment provenance
• security posture
U.3 Agent Trust State
An agent can become:
• trusted
• degraded
• restricted
• suspended
• quarantined
Trust degradation must not automatically grant additional permissions.

───

V. Model Trust
AI model trust includes:
• model provenance
• model version
• deployment source
• evaluation history
• integrity verification
• approved-use scope
• known limitations
• security evaluation
• rollback version
The Trust Fabric does not own model training.

───

W. Software Provenance
Track:
• source repository
• commit
• build
• dependency versions
• artifact
• signer
• deployment
• environment
This creates a verifiable software supply chain.

───

X. Artifact Integrity
Artifacts may include:
• containers
• packages
• binaries
• models
• datasets
• configuration bundles
• infrastructure artifacts
Verify:
• hash
• signature
• provenance
• source
• build identity

───

Y. Supply-Chain Trust
Track trust relationships across:
• source code
• dependencies
• package registries
• build systems
• CI/CD
• container registries
• deployment systems
Suspicious or unverifiable provenance must reduce trust.

───

Z. Security Posture
The Security & Trust Fabric maintains trust-relevant posture information.
Examples:
• patch status
• certificate status
• credential age
• configuration status
• integrity status
• attestation status
• security-control status
Phase 08 consumes posture signals for runtime enforcement.

───

AA. Trust Revocation
AA.1 Revocation Events
Trust may be revoked because of:
• compromise
• expired evidence
• invalid certificate
• credential compromise
• malicious behavior
• policy violation
• administrative action
• failed attestation
AA.2 Revocation States
Include:
• temporary suspension
• permanent revocation
• quarantine
• conditional restoration

───

AB. Trust Expiration
Trust must have appropriate lifetimes.
Examples:
• short-lived device assertions
• short-lived workload attestations
• expiring certificates
• temporary administrative trust
• temporary external federation
Expired trust must not silently remain valid.

───

AC. Trust Federation
AC.1 Purpose
Allow CoreGrid to establish controlled trust relationships with external organizations.
AC.2 Federation Requirements
Every federation relationship must define:
• parties
• trust scope
• accepted assertions
• verification methods
• expiration
• revocation
• responsibilities
• audit requirements
AC.3 Federation Principle
External trust must never automatically become unrestricted internal trust.

───

AD. External Trust
External systems may include:
• schools
• universities
• government organizations
• payment providers
• identity providers
• cloud providers
• marketplace providers
• developer organizations
Trust must remain:
• scoped
• explicit
• revocable
• auditable

───

AE. Trust Policy Registry
Trust policies define:
• accepted issuers
• acceptable evidence
• trust lifetimes
• verification requirements
• federation requirements
• revocation behavior
• minimum assurance
Policies must be versioned.

───

AF. Trust Context
Trust must be contextual.
The same entity may have different trust states depending on:
• tenant
• resource
• operation
• environment
• device
• time
• network
• workload
• risk state

───

AG. Trust Delegation
Delegated trust must specify:
• delegator
• delegate
• authority
• scope
• expiration
• restrictions
• revocation
Delegation chains must be traceable.

───

AH. Trust Chains
Trust chains may contain:
text
Root Trust
    ↓
Organization
    ↓
Institution
    ↓
Service
    ↓
Agent
    ↓
Tool
    ↓
Action

Each link must be independently verifiable.

───

AI. Trust Anchor Management
Trust anchors include:
• root certificates
• root keys
• approved issuers
• approved registries
• approved identity providers
• approved software-signing authorities
Trust anchors require elevated administrative controls.

───

AJ. Trust Boundary Mapping
The architecture must explicitly identify trust boundaries between:
• user and platform
• tenant and platform
• institution and platform
• agent and platform
• service and service
• device and platform
• external provider and platform
• developer and production
• model and application
• data source and data consumer

───

AK. Zero-Trust Architecture
The Trust Fabric supports zero-trust principles:
1. verify explicitly
2. assume breach
3. use least privilege
4. continuously evaluate trust
5. minimize implicit relationships
Zero trust is an architectural model, not a single product.

───

AL. Security Engine Integration
Phase 09 exposes trust information to Phase 08.
Examples:
text
trust.get_state
trust.get_score
trust.verify_assertion
trust.verify_provenance
trust.check_attestation
trust.check_revocation

Phase 08 remains responsible for the actual security enforcement decision.

───

AM. Identity Integration
Phase 09 consumes identity assurance from Phase 02.
It may evaluate:
• authentication assurance
• identity verification
• credential state
• identity provenance
It does not replace Phase 02 identity lifecycle management.

───

AN. Multi-Tenant Trust
Trust relationships must include tenant scope where applicable.
Cross-tenant trust must be explicit.
Tenant boundaries must never be inferred from trust alone.

───

AO. Trust Data Model
Core entities include:
• TrustSubject
• TrustRelationship
• TrustAssertion
• TrustEvidence
• TrustScore
• TrustState
• TrustPolicy
• TrustPolicyVersion
• TrustAnchor
• TrustDelegation
• TrustChain
• TrustRevocation
• TrustAttestation
• DeviceTrustRecord
• WorkloadTrustRecord
• AgentTrustRecord
• ServiceTrustRecord
• CertificateTrustRecord
• KeyTrustRecord
• SoftwareProvenanceRecord
• ArtifactProvenanceRecord
• SecurityPostureRecord

───

AP. Database Requirements
Trust records require:
• immutable identifiers
• tenant boundaries
• temporal validity
• issuer references
• subject references
• evidence references
• provenance references
• revocation references
Sensitive cryptographic material must not be stored as ordinary database records.

───

AQ. APIs
AQ.1 Trust State
text
GET /trust/subjects/{id}
GET /trust/subjects/{id}/state

AQ.2 Trust Evaluation
text
POST /trust/evaluate

AQ.3 Assertions
text
POST /trust/assertions
GET /trust/assertions/{id}
POST /trust/assertions/{id}/verify

AQ.4 Evidence
text
GET /trust/evidence/{id}
POST /trust/evidence/verify

AQ.5 Provenance
text
GET /trust/provenance/{id}

AQ.6 Revocation
text
POST /trust/revocations
GET /trust/revocations/{id}

AQ.7 Attestation
text
POST /trust/attestation/verify
GET /trust/attestation/{id}


───

AR. Events
Events include:
text
trust.assertion.created
trust.assertion.verified
trust.assertion.expired
trust.assertion.rejected

trust.state.changed
trust.score.changed

trust.relationship.created
trust.relationship.revoked

trust.evidence.created
trust.evidence.invalidated

trust.attestation.received
trust.attestation.verified
trust.attestation.failed

trust.certificate.registered
trust.certificate.expiring
trust.certificate.revoked

trust.key.registered
trust.key.rotated
trust.key.revoked

trust.provenance.created
trust.provenance.invalidated

trust.device.degraded
trust.workload.degraded
trust.agent.degraded
trust.service.degraded

trust.federation.created
trust.federation.suspended
trust.federation.revoked


───

AS. Webhooks
Authorized external systems may receive:
• trust-state changes
• trust revocations
• certificate events
• attestation failures
• federation events
• critical provenance failures
Webhooks require:
• signatures
• replay protection
• delivery tracking
• retry policy
• secret rotation

───

AT. MCP Interfaces
Potential MCP interfaces:
text
trust.inspect
trust.evaluate
trust.verify_assertion
trust.inspect_provenance
trust.inspect_attestation
trust.inspect_device
trust.inspect_workload
trust.inspect_agent
trust.inspect_service
trust.inspect_federation
trust.inspect_revocation

MCP access must itself pass Phase 08 security enforcement.

───

AU. Agents
AU.1 Trust Analysis Agent
Analyzes trust relationships.
AU.2 Provenance Agent
Investigates provenance chains.
AU.3 Trust Investigation Agent
Explains why an entity is trusted or distrusted.
AU.4 Supply Chain Trust Agent
Analyzes software and dependency provenance.
AU.5 Attestation Agent
Processes attestation evidence.
AU.6 Trust Federation Agent
Monitors external trust relationships.
AU.7 Trust Governance Agent
Detects trust-policy inconsistencies.
Agents cannot unilaterally create unrestricted trust.

───

AV. Agent Permissions
Agents must follow least privilege.
Trust agents may:
• read trust state
• analyze evidence
• create recommendations
• create bounded trust assertions where explicitly permitted
High-impact actions require controlled authorization.

───

AW. Security
The Trust Fabric must protect:
• trust assertions
• trust relationships
• provenance
• cryptographic metadata
• attestation records
• federation data
• trust policies
Controls include:
• encryption
• access control
• tenant isolation
• immutable audit trails
• key protection
• integrity verification

───

AX. Cryptographic Requirements
Support:
• modern digital signatures
• secure hashing
• key rotation
• certificate validation
• signature verification
• cryptographic agility
Cryptographic algorithms must be configurable without redesigning the trust model.

───

AY. Privacy
Trust information may itself be sensitive.
Therefore:
• minimize collected data
• minimize retention
• restrict visibility
• separate evidence from unnecessary personal information
• support redaction
• enforce tenant boundaries

───

AZ. Auditability
Every significant trust change must be attributable.
Audit information includes:
• actor
• action
• previous state
• new state
• evidence
• policy
• timestamp
• correlation ID

───

BA. Observability
Monitor:
• trust evaluation latency
• trust-state changes
• assertion failures
• revocations
• attestation failures
• provenance failures
• federation failures
• certificate expiration
• trust-score instability

───

BB. Reliability
Trust infrastructure must remain highly available.
Critical trust information should support:
• replication
• backup
• recovery
• consistency verification
• integrity checks

───

BC. Failure Modes
Potential failures:
• trust registry unavailable
• attestation unavailable
• certificate authority unavailable
• federation unavailable
• provenance unavailable
• trust evidence unavailable
The system must distinguish:
• trusted
• unverified
• unknown
It must never silently convert UNKNOWN into TRUSTED.

───

BD. Disaster Recovery
Recovery must preserve:
• trust relationships
• trust anchors
• revocations
• provenance
• evidence references
• policy versions
Recovery procedures must be tested.

───

BE. Testing
BE.1 Unit Testing
Test:
• trust calculations
• state transitions
• assertions
• expiration
• revocation
• provenance
• policy evaluation
BE.2 Integration Testing
Test:
• identity integration
• Security Engine integration
• agent integration
• tenant boundaries
• certificate systems
• attestation systems
BE.3 Security Testing
Test:
• forged assertions
• replay attacks
• trust escalation
• malicious federation
• revoked credentials
• invalid certificates
• provenance tampering
• trust-chain manipulation

───

BF. Adversarial Testing
Test attacks including:
• forged trust assertions
• compromised issuers
• malicious delegation
• trust-chain poisoning
• stale trust evidence
• revoked certificate reuse
• compromised agent identity
• malicious software provenance
• supply-chain substitution

───

BG. AI Evaluation
AI-assisted trust systems must be evaluated for:
• false trust
• false distrust
• evidence hallucination
• provenance hallucination
• reasoning reliability
• adversarial manipulation
• explanation accuracy
AI recommendations cannot silently override deterministic trust controls.

───

BH. Performance
Optimize through:
• trust-state caching
• evidence caching
• efficient graph traversal
• indexed provenance
• incremental trust updates
Caching must respect expiration and revocation.

───

BI. Deployment
Deploy trust components independently where required.
Possible services:
text
trust-registry
trust-evaluation
trust-provenance
trust-attestation
trust-federation
trust-revocation
trust-cryptography
trust-posture
trust-telemetry


───

BJ. Infrastructure
Infrastructure should support:
• encryption
• isolated trust services
• secure key storage
• high availability
• disaster recovery
• monitoring
• controlled administrative access

───

BK. Configuration
Configuration includes:
• trust thresholds
• assertion lifetimes
• evidence requirements
• federation policies
• attestation requirements
• approved trust anchors
• revocation behavior
Configuration must be version-controlled and auditable.

───

BL. Operational Procedures
Document procedures for:
• trust-anchor rotation
• compromised issuer response
• certificate revocation
• federation suspension
• trust restoration
• compromised-device handling
• compromised-agent handling
• provenance investigation
• trust-policy rollback

───

BM. Human Escalation
Human review is required for selected high-impact trust changes.
Examples:
• adding a root trust anchor
• approving a new federation
• restoring a compromised trust subject
• changing organization-wide trust policy
• accepting a new certificate authority
• overriding critical revocation

───

BN. Compliance Support
The Trust Fabric supports evidence for:
• identity assurance
• access assurance
• provenance
• data integrity
• software supply-chain integrity
• auditability
• security controls
It does not define legal compliance.

───

BO. Acceptance Criteria
Phase 09 is accepted when:
1. trust subjects can be registered.
2. trust relationships can be represented.
3. trust assertions can be issued and verified.
4. trust evidence is traceable.
5. provenance chains can be inspected.
6. trust states can change safely.
7. trust can expire.
8. trust can be revoked.
9. cryptographic trust can be verified.
10. device trust can be represented.
11. workload trust can be represented.
12. agent trust can be represented.
13. software provenance can be represented.
14. external federation can be scoped.
15. trust information can be consumed by Phase 08.
16. unknown trust cannot silently become trusted.
17. trust changes are auditable.
18. tenant boundaries are preserved.
19. recovery procedures work.
20. adversarial testing passes.

───

BP. Definition of Done
Phase 09 is complete only when:
• trust architecture is implemented
• trust registry exists
• trust graph exists
• trust evaluation exists
• assertions exist
• evidence exists
• provenance exists
• revocation exists
• attestation integration exists
• cryptographic trust exists
• device trust exists
• workload trust exists
• agent trust exists
• software provenance exists
• federation controls exist
• APIs exist
• events exist
• observability exists
• testing exists
• disaster recovery exists
• documentation exists
• Phase 08 integration is verified

───

BQ. Future Evolution
Future capabilities may include:
• decentralized identity
• verifiable credentials
• hardware-rooted trust
• confidential computing
• remote attestation
• advanced supply-chain verification
• privacy-preserving trust proofs
• cryptographic agility
• autonomous trust analysis
• cross-institution trust networks
• global trust federation
• zero-knowledge trust proofs
Future evolution must preserve:
• trust provenance
• revocation semantics
• auditability
• tenant isolation
• backward-compatible contracts
• cryptographic agility

───

BR. Architectural Invariants
The following rules are mandatory:
1. Trust is never permanent by default.
2. Trust must have evidence.
3. Trust must have provenance.
4. Trust must be revocable.
5. Trust must be contextual.
6. Trust must expire where appropriate.
7. External trust must remain explicitly scoped.
8. AI agents cannot create unrestricted trust.
9. Trust scores cannot replace evidence.
10. UNKNOWN cannot silently become TRUSTED.
11. Revocation must propagate.
12. Trust anchors require elevated protection.
13. Private cryptographic keys must never enter ordinary application storage.
14. Trust relationships must be auditable.
15. Tenant boundaries must remain explicit.
16. Security enforcement remains Phase 08 responsibility.
17. Trust governance must not be duplicated inside application services.
18. Trust architecture must remain independent from business-domain logic.

───

BS. Phase Boundary With Phase 08
Phase 08 answers:
"May this action happen?"
Phase 09 answers:
"How much should CoreGrid trust the entities, evidence, relationships, systems, software, devices, agents, and assertions involved in this decision?"
Phase 08 performs security enforcement.
Phase 09 supplies trust and assurance context.
Neither phase should duplicate the other's responsibilities.

───

BT. Final Architectural Principle
CoreGrid must not treat trust as a boolean.
Trust is a continuously evaluated relationship backed by evidence, provenance, cryptographic assurance, context, time, and revocation.
The Security & Trust Fabric therefore becomes the platform's shared trust substrate while remaining strictly separated from the runtime enforcement responsibilities of Phase 08.

───

BU. COMMAND MODEL

BU.1 What a Trust Command Is

A trust command is an attempt to change what the platform believes: record an
assertion, record evidence, verify a subject, revoke trust, register a key,
certificate or anchor, create a federation or a delegation, publish a trust policy,
or evaluate zero-trust. Every one of them is a write to trust state, and therefore
every one of them is attributable, evidenced and reversible-or-revocable.

BU.2 The Command Path

command arrives
  → Phase 08 decides whether the actor may issue it at all (BS: enforcement is
    not this phase's job; the fabric never authorizes its own writes)
  → evidence is supplied and validated: an assertion needs an issuer, a subject,
    evidence and an integrity reference (F.1, L.2)
  → the command is applied by the fabric, which returns a result object rather
    than throwing: refusal is a value, not an exception
  → the state transition is recorded with evidence references attached
  → the change is attributable: actor, action, previous state, new state,
    evidence, policy, timestamp, correlation (AZ)

BU.3 Command Classes and Their Guards

| Command class | Examples | Guard that must hold |
| --- | --- | --- |
| Record | create assertion, create evidence, register subject | issuer + subject + evidence + integrity reference (F.1) |
| Verify | verify assertion, evaluate certificate, evaluate policy | integrity verified, issuer accepted, scope matched, not expired, not revoked |
| Change state | transition trust state | the transition is allowed, and UNKNOWN may never jump to a trusted state (BR.10) |
| Revoke | revoke assertion, relationship, anchor; create revocation | attributable actor (BR.14); evidence of the reason (BR.2); conditional restoration requires its condition |
| Register | key, certificate, model, software provenance, artifact integrity | fingerprint/hash/signature facts; already-expired certificates are refused |
| Scope | create federation, create delegation | distinct parties, explicit scope, future expiry, restrictions recorded (AC.2, AG) |
| Publish | create trust policy version | accepted issuers, assurance bounds, positive lifetime (AE) |
| Evaluate | trust score, zero-trust verdict | factors with evidence references; the verdict is advice for Phase 08, never enforcement (BS) |

BU.4 Approval-Gated Commands (BM)

Adding a root trust anchor, approving a new federation, restoring a compromised
trust subject, changing organization-wide trust policy, accepting a new certificate
authority and overriding a critical revocation are human-approval operations. The
fabric records the anchor's managing administrator today (`managedBy` is required),
which is the minimum form of that gate; the workflow itself is Section BW.

BU.5 Where Commands Live Today, and the Honest Limit

- `frontend/src/lib/trust-core.ts` — subjects, state transitions, scoring, relationships.
- `frontend/src/lib/trust-assertions.ts` — assertions, evidence, provenance, revocation.
- `frontend/src/lib/trust-entities.ts` — device, workload, agent, model, software, artifact.
- `frontend/src/lib/trust-governance.ts` — keys, certificates, federation, delegation, anchors, policies, zero-trust.

The limit, stated plainly: these are module commands. No HTTP route and no server
function issues a trust command today, and nothing consumes the result (P09-5). A
command model that nothing calls is a prepared interface, not an operating one.

───

BV. QUERY MODEL

BV.1 What a Trust Query Answers

| Query | Question | Consumer |
| --- | --- | --- |
| trust.get_state | what is this subject's trust state right now? | Phase 08 enforcement |
| trust.get_score | how much evidence-weighted confidence exists, and from which factors? | Phase 08, human review |
| trust.verify_assertion | is this assertion usable for this scope, now? | Phase 08, federation |
| trust.verify_provenance | can this decision be traced to its evidence? | auditors, incident review |
| trust.check_attestation | is the attestation behind a device/workload claim valid? | device and workload trust |
| trust.check_revocation | has this subject, key, certificate or relationship been revoked? | Phase 08, all consumers |

BV.2 Query Rules

- Tenant scope is explicit on every query where it applies (AN). Cross-tenant
  trust is never inferred from a trust relationship.
- Expiry and revocation are evaluated at read time: a cached trust state that
  outlives its evidence is a defect, not an optimisation (AB, BH).
- Answers are explainable (K.3): a score carries its factor breakdown, evidence
  references, confidence, version and context. A number without its derivation is
  not a trust answer.
- Unknown is answered as unknown (BC). The fabric distinguishes TRUSTED,
  UNVERIFIED and UNKNOWN, and never converts UNKNOWN into TRUSTED to satisfy a
  caller.
- A query result is evidence for a decision, never the decision itself: Phase 08
  answers "may this action happen?", and this fabric answers "how much should it
  be trusted, and why?" (BS).

BV.3 Query Debt (reported, not hidden)

No trust query surface is implemented or wired: the contract declares the six
queries above, the fabric builds the records in-process, and no persisted trust
store exists (P09-4), so every "query" today is a function call over a record the
caller already holds. This is the same debt class as AW.7 and AZ.3 of Phase 08.

───

BW. WORKFLOW MODEL

BW.1 The Trust Lifecycle Workflows

| Workflow | Trigger | Evidence required | Exit condition |
| --- | --- | --- | --- |
| Establishment | a subject is registered | enrolment + attestation facts | state reaches VERIFIED, then TRUSTED or CONDITIONALLY_TRUSTED |
| Continuous re-evaluation | new evidence, posture change, incident | fresh evidence within its freshness window | state is raised, lowered or left unchanged — always with the reason recorded |
| Degradation | anomalies, posture failure, unverifiable provenance | the failing fact and its source | state becomes DEGRADED and recommended restrictions are carried to Phase 08 |
| Quarantine | suspicious behaviour, compromised evidence | evidence of the reason (BR.2) | the subject is isolated, never silently restored |
| Revocation | compromise, credential loss, policy violation, failed attestation | attributable actor + reason (BR.14, AA.1) | REVOKED is terminal; restoration requires a new, evidenced establishment |
| Restoration | remediation accepted by a human | remediation evidence + approval | state returns at or below VERIFIED, never straight to TRUSTED |
| Federation lifecycle | a cross-organization agreement is signed | parties, scope, accepted assertions, verification methods, expiry (AC.2) | federation is active until revoked or expired; external trust never becomes internal by default |
| Anchor rotation | a root certificate or key approaches expiry | the successor anchor and its managing administrator | the old anchor is revoked, the new one is registered |
| Compromised issuer | an accepted issuer is suspect | the incident reference | every assertion from that issuer is re-evaluated and revocations are issued |

BW.2 Workflow Rules

- A workflow may only move a subject along transitions the state machine allows;
  an illegal transition is refused as a value, never silently dropped (BU.2).
- Trust is never raised by a workflow that lacks fresh evidence (AB, M.2).
- Degradation never grants anything: it can only reduce privilege or trigger
  review (U.3).
- Human approval gates the workflows of BU.4 (new anchor, new federation,
  restoration of a compromised subject, organization-wide policy change, override
  of a critical revocation).

BW.3 Workflow Debt (reported, not hidden)

The state machine and the guards are implemented and exercised; the workflows are
not automated. There is no scheduler that re-evaluates trust on new evidence, no
approval workflow for the BU.4 operations beyond the required managing
administrator, and no propagation step that re-evaluates dependents after a
revocation (P09-3, P09-5). Today a workflow runs when a caller runs it.

───

BX. TRUST MEMORY AND KNOWLEDGE

BX.1 What the Fabric Remembers

The fabric's memory is its trust record, and every part of it is evidence-backed:

- **Subject memory** — a subject's current state plus the evidence references that
  justified each transition; a state with no evidence reference is a defect.
- **Assertion memory** — who asserted what, for which scope and tenant, issued and
  expiring when, with which integrity reference and provenance.
- **Evidence memory** — source, capture time, freshness window, reliability,
  integrity reference, provenance and confidence (M.2).
- **Revocation memory** — who revoked what, why, of which kind, and under which
  restoration condition (AA).
- **Policy memory** — versioned trust policies, effective from a stated time (AE).
- **Governance memory** — keys, certificates, anchors, federations and delegations
  with their expiries and restrictions (P, Q, AC, AG, AI).

BX.2 What the Fabric Knows — the Five Laws of Trust Knowledge

1. **Knowledge is granted, never assumed.** Existence produces UNKNOWN; only
   evidence moves a subject (BR.1, BR.2).
2. **Derived knowledge never becomes canonical.** A trust score is
   evidence-weighted confidence with a version and a factor breakdown; it is
   advice, and it never replaces the evidence it summarises (K.1, BR.9).
3. **Knowledge is time-bound.** A claim is only as good as the freshness of its
   evidence, and expiry is evaluated at read time (AB, BV.2).
4. **Knowledge is revocable.** Every trust the fabric grants can be withdrawn, and
   withdrawal is attributable (AA, BR.4).
5. **Knowledge is explainable.** The provenance chain answers "why does CoreGrid
   trust this entity?" from the decision down to the source (N.1, N.2).

BX.3 Trust Knowledge Is Sensitive (AY)

Trust knowledge is itself regulated data: it reveals who is suspected, what failed
and where the platform is weak. It is therefore minimised (only the evidence
needed for the decision), retained no longer than its usefulness, restricted in
visibility, separated from unnecessary personal information, and tenant-scoped.

BX.4 Where the Memory Lives Today

In-process records built by the four trust modules, plus the kernel event and
audit ledger as the durable substrate (Phase 33). There is no trust memory store:
nothing persists a subject's state history today, which is why P09-4 is reported
as the phase's largest structural gap.

───

BY. TRUST MIGRATION

BY.1 What Migration Means for Trust

Trust records outlive the systems that create them, so migration is a trust
operation, not a database operation:

- **Schema migration** — trust records evolve (a new factor, a new assertion type,
  a new revocation kind) without invalidating what was already asserted.
- **Policy migration** — a new policy version supersedes the old one from its
  effective time; versions are additive and never rewritten (AE).
- **Anchor and key migration** — rotation is a migration: the successor anchor is
  registered first, the old one is revoked second, and both steps are attributable
  and approval-gated (AI, BM).
- **Credential and algorithm migration** — signatures and hashes move to stronger
  algorithms without redesigning the trust model (AX: cryptographic agility).
- **Tenant migration** — a subject moving between tenants is re-established in the
  new scope; tenant scope is never inferred from a relationship (AN).
- **Federation migration** — moving from one external provider to another means a
  new federation relationship, a new verification method and an explicit
  revocation of the old one (AC.2).
- **Recovery migration** — after disaster recovery, revocations are replayed
  before trust is served (BD).

BY.2 Migration Rules

- Provenance survives migration. A migrated assertion keeps its issuer, evidence
  references and integrity reference; a record that loses its provenance becomes
  UNVERIFIED, never TRUSTED (BR.2, BR.10).
- Revocation wins. If a migrated record conflicts with a revocation, the
  revocation is authoritative and the record is not usable (AA, BR.4).
- Migration is auditable: who migrated what, from which version, with which
  evidence, at which time (AZ).
- A migration may not raise trust. It may preserve it or lower it; raising trust
  requires new evidence, exactly as establishment does.

BY.3 Migration Debt (reported, not hidden)

No trust migration exists, because no trust store exists (P09-4). The fabric's
state is rebuilt from the callers' records each time, so today's only migration is
the one nobody performs: there is nothing to carry. This is stated rather than
implied, and it is why the persisted trust data model is the phase's next
structural step after Phase 08 consumption is wired.

───

BZ. RUNTIME CONSUMER BOUNDARY

BZ.1 The Kernel Is the Platform

CoreGrid owns the Security & Trust Fabric. A runtime is an application installed
ON the kernel; CoreGrid Scholar is runtime-001, the first consumer of this fabric
and never its owner. This document's scope statements therefore describe CoreGrid,
and runtime-specific vocabulary reaches the fabric through contracts and adapters
in the runtime layer — never by editing a kernel module.

BZ.2 What a Runtime Supplies

- its identity-assurance sources (which issuers it accepts, with which evidence);
- its device, workload, agent and model populations to be evaluated;
- its federation partners and the scopes it accepts from them;
- its policy pack: minimum assurance, required attestation, trust lifetimes.

BZ.3 What No Runtime May Do

- grant itself trust, or read a trust score as permission (BS);
- register a root anchor or approve a federation without human approval (BM);
- convert UNKNOWN into TRUSTED, or skip VERIFIED (BR.10);
- fork the trust state machine or the trust record shape;
- bypass Phase 08 enforcement, or ask the fabric to decide enforcement.

BZ.4 Machine Enforcement

`tests/unit/platform-neutrality.test.ts` enforces the boundary structurally: no
kernel or capability module may import a runtime, only a runtime layer may name a
runtime, and no platform surface may hard-code a limited role list.
`scripts/neutralise-scholar-framing.mjs --check` reports any framing regression and
exits non-zero, so a later phase cannot quietly re-attribute the fabric to a
runtime. The control-plane surface for this phase (`/super-admin/trust-fabric`)
declares no role list of its own, and it exercises the shipped machine instead of
describing it.
