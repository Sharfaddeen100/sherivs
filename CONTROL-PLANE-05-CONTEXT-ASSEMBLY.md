COREGRID
MACHINE-OPERABLE ENGINEERING NERVOUS SYSTEM
05 — CONTEXT ASSEMBLY SYSTEM
Architectural Status: DESIGNED
Implementation Status: NOT ESTABLISHED BY AVAILABLE EVIDENCE
Operational Status: NOT CLAIMED
Authority: Derived from the CoreGrid ten mother surfaces and machine-operable nervous-system architecture
Primary Question:
“What is the minimum sufficient, authorized, relevant, temporally valid, provenance-preserving context required for this mission, worker, decision, verification, or execution?”

───

1. Executive Definition
The Context Assembly System is the CoreGrid nervous-system component responsible for transforming distributed authoritative and machine-readable information into a bounded, provenance-preserving, mission-specific Context Package.
It determines:
• what information is relevant,
• why it is relevant,
• where it comes from,
• what authority it carries,
• whether it is current,
• whether it is permitted to be exposed,
• whether it conflicts with other information,
• what dependencies are required,
• what information is intentionally excluded,
• what uncertainty remains,
• and whether the resulting context is sufficient for the intended operation.
Its fundamental transformation is:
text
MISSION / OPERATION
        ↓
REQUIRED CAPABILITIES
        ↓
CONTEXT REQUIREMENTS
        ↓
SOURCE DISCOVERY
        ↓
AUTHORITY / ACCESS FILTERING
        ↓
RELEVANCE FILTERING
        ↓
TEMPORAL FILTERING
        ↓
DEPENDENCY EXPANSION
        ↓
CONFLICT / CONSISTENCY ANALYSIS
        ↓
CONTEXT PROJECTION
        ↓
CONTEXT VALIDATION
        ↓
CONTEXT PACKAGE
        ↓
AUTHORIZED WORKER / EXECUTION

Context Assembly therefore acts as the information boundary between CoreGrid's enormous knowledge/engineering environment and a bounded execution or reasoning operation.
It is not a second database.
It is not a truth engine.
It is not a reasoning engine.
It is not an authority engine.
It is not a memory system.
It is not an agent.
It is not a generic search layer.
It is a controlled contextualization mechanism.

───

2. Architectural Position
Context Assembly sits after the systems that establish:
• canonical authority,
• structured definitions,
• identity,
• current state,
• evidence,
and before systems that require bounded working information:
• mission orchestration,
• workforce delegation,
• execution,
• verification,
• conformance,
• human decision-making,
• selected runtime operations.
Conceptually:
text
CANONICAL AUTHORITY
        ↓
ARCHITECTURE
        ↓
STRUCTURED DEFINITION
        ↓
REGISTRY
        ↓
SCHEMAS
        ↓
STATE
        ↓
EVIDENCE
        ↓
CONTEXT ASSEMBLY
        ↓
MISSION
        ↓
WORKFORCE
        ↓
EXECUTION

But Context Assembly does not become a mandatory linear bottleneck for every read in CoreGrid.
Some components may directly consume authoritative machine interfaces when appropriate.
Context Assembly is specifically responsible when a bounded contextual view must be constructed for a particular purpose.

───

3. Purpose
The purpose of Context Assembly is to solve the context problem.
CoreGrid contains potentially enormous quantities of:
• architecture,
• reality models,
• phases,
• missions,
• contracts,
• state,
• evidence,
• decisions,
• dependencies,
• implementation,
• runtime observations,
• security constraints,
• historical information,
• domain information,
• worker information,
• external information.
Giving all of this to every worker would be:
• inefficient,
• insecure,
• cognitively destructive,
• expensive,
• difficult to audit,
• difficult to reproduce,
• vulnerable to irrelevant information,
• vulnerable to conflicting information,
• and potentially capable of exposing information beyond authorization.
Giving too little information creates a different failure:
text
insufficient context
        ↓
incorrect interpretation
        ↓
incorrect action
        ↓
incorrect result

Context Assembly therefore optimizes for:
Minimum Sufficient Context, not Maximum Available Context.

───

4. Scope
Context Assembly owns the controlled creation of context packages and context projections.
Its scope includes:
• context requirement interpretation,
• source discovery,
• source selection,
• authority-aware retrieval,
• relevance filtering,
• temporal filtering,
• dependency-aware expansion,
• context composition,
• context compression where safe,
• provenance preservation,
• conflict identification,
• uncertainty preservation,
• context completeness assessment,
• context sufficiency assessment,
• context versioning,
• context reproducibility,
• context authorization,
• context redaction,
• context expiration,
• context invalidation,
• context refresh,
• context lineage,
• context-package auditing.

───

5. Non-Scope
Context Assembly does not own:
• canonical architecture,
• governance authority,
• object identity,
• schema authority,
• current state,
• evidence authority,
• mission lifecycle,
• worker lifecycle,
• execution,
• verification judgment,
• conformance judgment,
• progress reconciliation,
• architectural evolution,
• ultimate human authority,
• model intelligence,
• domain truth.
It may retrieve and project these things.
It does not become their owner.

───

6. Ownership
Context Assembly owns:
text
Context Requirement
Context Source Selection
Context Resolution
Context Projection
Context Package
Context Lineage
Context Sufficiency Assessment
Context Access Decision
Context Freshness Assessment
Context Conflict Manifest
Context Redaction
Context Version
Context Expiration
Context Refresh Policy

Other components retain ownership of the underlying information.

Information
Owner

Canonical meaning
Mother surfaces

Object identity
Registry

Structure
Schema System

Current condition
State System

Proof
Evidence System

Mission lifecycle
Mission Orchestration

Worker authority
Workforce Delegation

Execution
Execution System

Verification judgment
Verification System

Conformance judgment
Conformance System

Progress
Progress Reconciliation

Evolution
Drift & Evolution

Contextual projection
Context Assembly



───

7. Authority
Context Assembly has contextualization authority, not truth authority.
It may decide:
• which authorized information is relevant,
• which version is applicable,
• which evidence belongs in a context package,
• which dependencies are necessary,
• how information is structured for consumption,
• what information must be redacted,
• whether the context package satisfies declared requirements.
It may not decide:
• that an architecture is correct,
• that a state is true merely because it was selected,
• that evidence is valid merely because it was included,
• that a worker deserves additional authority,
• that a mission should exist,
• that a phase owns a capability,
• that a policy should be changed.
A context package therefore carries references to authority, rather than becoming authority itself.

───

8. Responsibilities
Context Assembly is responsible for:
1. Interpreting context requirements.
2. Identifying required source classes.
3. Resolving object references.
4. Selecting relevant information.
5. Enforcing access boundaries.
6. Applying temporal validity.
7. Preserving provenance.
8. Preserving uncertainty.
9. Detecting relevant conflicts.
10. Identifying missing required context.
11. Avoiding unnecessary context.
12. Building context projections.
13. Producing reproducible context packages.
14. Versioning context packages.
15. Recording assembly decisions.
16. Supporting refresh and invalidation.
17. Detecting stale context.
18. Supporting context-aware worker execution.
19. Preventing context-induced authority escalation.
20. Providing machine-readable context manifests.

───

9. Invariants
The Context Assembly System must preserve these invariants.
9.1 No Context Without Purpose
Every context package must have a declared purpose.
9.2 No Authority Through Inclusion
Including information in a package does not elevate its authority.
9.3 No Hidden Source
Every material contextual claim must have provenance.
9.4 No Silent Conflict Erasure
Conflicting relevant sources must not be silently collapsed.
9.5 No Permission Through Context
Context access does not grant execution permission.
9.6 No Temporal Blindness
Time-sensitive information must carry temporal semantics.
9.7 No Unbounded Retrieval
Context retrieval must be bounded by scope and policy.
9.8 No Silent Compression Loss
Compression must not remove information necessary for the declared task without recording that loss.
9.9 No Fake Completeness
A context package must be allowed to declare:
text
INSUFFICIENT

9.10 Reproducibility
A context package must be reconstructable when reproducibility is required.

───

10. Ontology
The primary Context Assembly ontology consists of:
text
ContextRequirement
ContextSource
ContextCandidate
ContextSelection
ContextItem
ContextGroup
ContextDependency
ContextProjection
ContextPackage
ContextManifest
ContextConstraint
ContextPermission
ContextRedaction
ContextConflict
ContextGap
ContextSufficiencyAssessment
ContextFreshnessAssessment
ContextLineage
ContextVersion
ContextRefreshPolicy
ContextExpiration
ContextInvalidation
ContextAssemblyRun

Not every concept requires an independent physical table, service, or file.
They may be represented as typed records within a cohesive Context Assembly subsystem.

───

11. Object Model
11.1 Context Requirement
Defines what contextual information is needed.
Example:
text
requirement_id
purpose
mission_ref
operation_type
required_information_classes
required_objects
required_relationships
required_state
required_evidence
temporal_scope
spatial_scope
security_scope
freshness_requirement
sufficiency_criteria
exclusion_rules
budget
version


───

11.2 Context Source
Represents a potential source.
Examples:
• ARCHITECTURE.md
• registry record
• state record
• evidence record
• mission specification
• contract
• runtime observation
• external source
• blueprint
• implementation artifact.

───

11.3 Context Item
A selected unit of contextual information.
It must contain:
text
context_item_id
source_ref
source_version
content_ref
semantic_type
authority_class
provenance
effective_time
recorded_time
freshness
confidence
relevance_reason
access_decision
transformation_history


───

11.4 Context Package
The final bounded contextual projection.
text
context_package_id
purpose
subject
mission_ref
worker_ref
assembly_run_ref
requirements_ref
items
dependencies
conflicts
gaps
assumptions
limitations
freshness
security_class
version
created_at
expires_at
reproducibility_metadata
sufficiency_assessment


───

11.5 Context Manifest
Machine-readable description of the package.
It should answer:
text
What was included?
Why?
From where?
Under which authority?
At what version?
At what time?
What was excluded?
What was unavailable?
What conflicts existed?
What transformations occurred?


───

12. Identity
Context identities must be distinct from source identities.
For example:
text
architecture_object_id
≠
context_item_id

and:
text
state_record_id
≠
context_package_id

Recommended identifiers:
text
context_requirement_id
context_source_id
context_item_id
context_package_id
context_manifest_id
assembly_run_id
context_version

A context package should also carry:
text
subject_ref
mission_ref
worker_ref
operation_ref
tenant_ref
domain_ref

where applicable.

───

13. Lifecycle
A Context Assembly lifecycle:
text
REQUESTED
↓
REQUIREMENTS_RESOLVED
↓
SOURCES_DISCOVERED
↓
ACCESS_FILTERED
↓
CANDIDATES_SELECTED
↓
DEPENDENCIES_EXPANDED
↓
TEMPORALLY_RESOLVED
↓
CONFLICTS_IDENTIFIED
↓
PROJECTED
↓
VALIDATED
↓
SUFFICIENT
↓
RELEASED
↓
ACTIVE
↓
STALE
↓
REFRESHED / INVALIDATED
↓
EXPIRED
↓
ARCHIVED

A package may also become:
text
REJECTED
INCOMPLETE
QUARANTINED
SUPERSEDED

These are contextual package lifecycle states, not the lifecycle of the underlying source.

───

14. State Model
Context Assembly itself has state dimensions including:
Assembly state
text
REQUESTED
ASSEMBLING
VALIDATING
COMPLETED
FAILED

Sufficiency state
text
UNKNOWN
SUFFICIENT
PARTIALLY_SUFFICIENT
INSUFFICIENT

Freshness state
text
FRESH
AGING
STALE
EXPIRED
UNKNOWN

Integrity state
text
VALID
DEGRADED
CONFLICTED
CORRUPTED
QUARANTINED

Access state
text
AUTHORIZED
PARTIALLY_AUTHORIZED
REDACTED
DENIED

These dimensions must not be collapsed into one string.

───

15. State Transitions
A context package may transition:
text
REQUESTED
→ ASSEMBLING

when assembly begins.
text
ASSEMBLING
→ VALIDATING

when source selection and projection complete.
text
VALIDATING
→ SUFFICIENT

when declared requirements are satisfied.
text
VALIDATING
→ PARTIALLY_SUFFICIENT

when some required context is unavailable but execution may continue under policy.
text
VALIDATING
→ INSUFFICIENT

when critical context is missing.
text
ACTIVE
→ STALE

when freshness policy is exceeded.
text
ACTIVE
→ INVALIDATED

when a source becomes invalid or authority changes.
text
ACTIVE
→ SUPERSEDED

when a newer valid context package replaces it.
Critical transition:
Context Assembly must never silently convert INSUFFICIENT into SUFFICIENT merely because an AI worker believes the missing information is unnecessary.

───

16. Commands
Core commands include:
text
create_context_requirement
assemble_context
refresh_context
validate_context
release_context
invalidate_context
expire_context
supersede_context
rebuild_context
compare_context_versions
request_missing_context
resolve_context_conflict
redact_context
revoke_context_access

Commands must be authorized.

───

17. Queries
Core queries include:
text
get_context_package
get_context_manifest
get_context_requirement
get_context_item
get_context_lineage
get_context_sources
get_context_conflicts
get_context_gaps
get_context_freshness
get_context_sufficiency
get_context_at_time
compare_context_packages
explain_context_selection
find_context_for_mission
find_context_for_worker

Important query:
text
explain_context_selection(context_package_id)

must be able to explain:
text
WHY INCLUDED
WHY EXCLUDED
WHO AUTHORIZED
WHICH POLICY APPLIED
WHAT VERSION
WHAT SOURCE
WHAT TRANSFORMATION
WHAT LIMITATION


───

18. Events
Context events include:
text
context_requirement_created
context_assembly_started
context_source_discovered
context_source_rejected
context_item_selected
context_item_excluded
context_dependency_added
context_conflict_detected
context_gap_detected
context_projected
context_validated
context_sufficiency_assessed
context_released
context_became_stale
context_invalidated
context_refreshed
context_superseded
context_expired
context_redacted
context_access_denied
context_integrity_failed
context_rebuild_completed

Events report contextualization activity.
They do not become authority merely by existing.

───

19. Contracts
Context Assembly requires explicit contracts for:
Context Requirement Contract
Defines required context.
Source Contract
Defines how a source can be accessed and interpreted.
Context Item Contract
Defines normalized contextual information.
Context Package Contract
Defines the final package.
Provenance Contract
Defines lineage requirements.
Access Contract
Defines permissions.
Freshness Contract
Defines temporal validity.
Sufficiency Contract
Defines what constitutes sufficient context.
Redaction Contract
Defines information that must be removed or transformed.
Reproducibility Contract
Defines whether and how a package can be reconstructed.

───

20. Dependencies
Primary dependencies:
text
Registry
Schema System
State System
Evidence System
Governance
Architecture
Reality Model

Secondary dependencies:
text
Mission Orchestration
Workforce Delegation
Execution System
Verification
Conformance
Progress
Drift & Evolution

Context Assembly should not directly depend on every runtime subsystem merely because contextual information may eventually originate there.
Prefer stable interfaces.

───

21. Inputs
Inputs include:
• mission requirements,
• operation requirements,
• worker capability requirements,
• subject identifiers,
• object identifiers,
• phase references,
• architecture references,
• state references,
• evidence references,
• contract references,
• dependency references,
• security scope,
• tenant scope,
• domain scope,
• temporal scope,
• spatial scope,
• freshness requirement,
• context budget,
• policy constraints,
• user-provided information,
• external observations where authorized.

───

22. Outputs
Primary output:
text
Mission Context Package

Supporting outputs:
text
Context Manifest
Context Lineage
Context Sufficiency Assessment
Context Gap Report
Context Conflict Manifest
Context Access Decisions
Context Assembly Evidence
Context Refresh Metadata


───

23. Data Flow
The canonical flow:
text
INPUT REQUEST
↓
REQUIREMENT NORMALIZATION
↓
IDENTITY RESOLUTION
↓
SOURCE DISCOVERY
↓
AUTHORIZATION
↓
SOURCE VALIDATION
↓
RELEVANCE EVALUATION
↓
DEPENDENCY EXPANSION
↓
TEMPORAL FILTERING
↓
CONFLICT DETECTION
↓
PROJECTION
↓
REDUCTION / COMPRESSION
↓
SUFFICIENCY EVALUATION
↓
PACKAGE CREATION
↓
MANIFEST CREATION
↓
RELEASE

Data classes:
Authoritative
References to mother surfaces, governance, architecture.
Structured
Registry/schema definitions.
Current condition
State.
Proof
Evidence.
Derived
Context projections and summaries.
Ephemeral
Assembly scratch data.
Sensitive
Secrets, personal information, restricted architecture, security data.
Sensitive data must not be included simply because it is technically retrievable.

───

24. Control Flow
Control flow is:
text
REQUEST
→ CLASSIFY
→ DETERMINE REQUIREMENTS
→ DISCOVER
→ AUTHORIZE
→ SELECT
→ RESOLVE DEPENDENCIES
→ CHECK TEMPORAL VALIDITY
→ DETECT CONFLICTS
→ PROJECT
→ VALIDATE
→ ASSESS SUFFICIENCY
→ RELEASE / BLOCK / ESCALATE

Context Assembly must fail closed when a critical security or authority boundary cannot be evaluated.

───

25. Authority Flow
Authority flows from:
text
COREGRID CONSTITUTION
↓
GOVERNANCE
↓
ARCHITECTURE
↓
RELEVANT PHASE
↓
MISSION
↓
CONTRACT / POLICY
↓
CONTEXT REQUIREMENT
↓
CONTEXT ACCESS

Context Assembly may use authority information.
It cannot create authority.

───

26. Evidence Flow
Evidence enters Context Assembly through the Evidence System.
Context Assembly records:
text
evidence_ref
evidence_version
evidence_time
evidence_scope
evidence_relevance

It may project evidence into a worker-readable representation.
It must not silently convert:
text
evidence
→ truth

or:
text
evidence summary
→ authority


───

27. Verification Flow
Verification may consume the exact Context Package used during execution.
This is important because verification sometimes depends on knowing:
What did the worker actually know when it made the decision?
Context Assembly therefore supports reproducibility of execution context.
Verification can ask:
text
Was required context available?
Was forbidden context exposed?
Was stale context used?
Was critical evidence omitted?
Was context manipulated?
Was the worker's output consistent with its declared context?


───

28. Conformance Flow
Conformance evaluates whether Context Assembly behaves according to:
• context policies,
• context schemas,
• architecture,
• permissions,
• source ownership,
• provenance requirements,
• context budgets,
• temporal rules,
• security constraints.
A conformant context package means:
text
declared context requirements
        ↓
implemented assembly behavior
        ↓
observed assembly behavior

are aligned.

───

29. Progress Flow
Context Assembly provides signals to Progress Reconciliation such as:
• context subsystem implemented,
• required interfaces integrated,
• context package generation tested,
• context sufficiency verified,
• source coverage verified,
• security controls verified,
• reproducibility verified.
It does not calculate overall CoreGrid progress.

───

30. Evolution Flow
Context requirements evolve as:
text
new requirement
↓
new context dependency
↓
gap detected
↓
context architecture analysis
↓
decision
↓
schema/contract update
↓
assembly mechanism update
↓
verification
↓
conformance

A new context requirement must not automatically create a new CoreGrid component.

───

31. Control-Plane Integration
The Control Plane coordinates Context Assembly but does not own contextual content.
Conceptually:
text
MISSION
↓
CONTROL PLANE
↓
CONTEXT REQUIREMENT
↓
CONTEXT ASSEMBLY
↓
CONTEXT PACKAGE
↓
WORKFORCE
↓
EXECUTION

The Control Plane may enforce:
• authority,
• permission,
• lifecycle,
• deadlines,
• policy,
• criticality,
• escalation.
Context Assembly decides how authorized information becomes contextualized.

───

32. Cross-Component Integration
Registry ↔ Context
Registry identifies objects and relationships.
Context Assembly resolves those identities.
Registry does not store the final context package.

───

Schema ↔ Context
Schemas validate:
• context requirements,
• context items,
• manifests,
• packages,
• provenance,
• permissions.
Schema does not decide relevance.

───

State ↔ Context
State supplies current and historical conditions.
Context Assembly selects state based on:
• subject,
• mission,
• time,
• freshness,
• relevance,
• permissions.
State remains authoritative for state.

───

Evidence ↔ Context
Evidence provides supporting material.
Context Assembly selects relevant evidence.
Evidence remains authoritative for provenance.

───

Mission ↔ Context
Mission defines what contextual information is necessary for successful execution.
Context Assembly converts those requirements into a package.
Mission lifecycle remains owned by Mission Orchestration.

───

Workforce ↔ Context
Workforce specifies worker capability and authority.
Context Assembly produces context appropriate to that worker.
Receiving context does not grant worker permissions.

───

Execution ↔ Context
Execution consumes a context package.
Execution must identify the context package used for consequential operations.

───

Verification ↔ Context
Verification can reconstruct execution context.

───

Conformance ↔ Context
Conformance checks whether context construction followed declared rules.

───

Progress ↔ Context
Progress consumes verified context-system status.

───

Drift ↔ Context
Drift detection identifies:
• stale context rules,
• source mapping drift,
• unauthorized context exposure,
• context contract divergence,
• context package reproducibility failure.

───

33. Context Requirements
Every significant context request should specify:
text
PURPOSE
SUBJECT
MISSION
OPERATION
REQUIRED KNOWLEDGE
REQUIRED STATE
REQUIRED EVIDENCE
REQUIRED CONTRACTS
REQUIRED DEPENDENCIES
TEMPORAL WINDOW
SPATIAL SCOPE
DOMAIN SCOPE
SECURITY SCOPE
FRESHNESS
SUFFICIENCY CRITERIA
EXCLUSIONS
BUDGET

This prevents:
“Give the AI everything.”
from becoming CoreGrid's default architecture.

───

34. Workforce Interaction
A worker should receive:
text
WORK ASSIGNMENT
+
AUTHORIZED CONTEXT PACKAGE
+
AUTHORITY BOUNDARY
+
TOOLS
+
CONTRACTS
+
EXPECTED OUTPUTS

Not:
text
entire repository
+
all state
+
all evidence
+
all secrets
+
all architecture

Context Assembly therefore becomes one of the primary mechanisms enforcing Context Sovereignty.

───

35. Execution Model
Execution receives a context reference:
text
context_package_id
context_version
context_manifest_hash

For critical operations, execution should be able to reproduce or retrieve the exact package.
This enables:
text
Decision
↓
Context Used
↓
Worker
↓
Model
↓
Tool
↓
Action
↓
Outcome

to become traceable.

───

36. Security Architecture
Context is itself a security boundary.
The primary threat is not only:
“Can someone access the database?”
but:
“Can an authorized worker receive information that it should not have received for this operation?”
Security controls include:
• identity-aware source access,
• mission-scoped permissions,
• worker-scoped permissions,
• tenant isolation,
• domain isolation,
• field-level restrictions where required,
• sensitive-data classification,
• secret exclusion,
• redaction,
• policy enforcement,
• provenance,
• access logging,
• package integrity,
• context expiration,
• revocation,
• anti-exfiltration controls,
• output monitoring where applicable.

───

37. Failure Architecture
Critical failures include:
Source unavailable
Context becomes incomplete.
Registry unavailable
Identity resolution fails.
State unavailable
Current-condition context cannot be safely established.
Evidence unavailable
Evidence-dependent context may become insufficient.
Schema mismatch
Context assembly must reject or quarantine incompatible data.
Permission service unavailable
Critical access decisions fail closed.
Conflicting sources
Conflict must be represented.
Stale source
Freshness state must be recorded.
Context explosion
Assembly exceeds declared budget.
Malicious source
Source must be quarantined or excluded.
Prompt injection inside retrieved content
Retrieved content must remain data, not automatically become instruction.
Context poisoning
A malicious or incorrect source must not silently influence high-authority context.
Package corruption
Integrity verification must fail.

───

38. Recovery Architecture
Recovery mechanisms include:
text
DETECT
↓
CLASSIFY
↓
CONTAIN
↓
PRESERVE FAILURE EVIDENCE
↓
RETRY / FALLBACK
↓
REBUILD
↓
VALIDATE
↓
RELEASE

Possible fallback levels:
text
primary source
↓
authorized secondary source
↓
verified cached projection
↓
historical snapshot
↓
human escalation
↓
BLOCK

Fallback must never silently lower assurance.

───

39. Idempotency
Context assembly must be idempotent where practical.
The same:
text
requirement
+
source versions
+
policies
+
time boundary

should produce the same semantic context package, subject to explicitly nondeterministic sources.
Use:
text
assembly_run_id
idempotency_key
source_version_set
policy_version
schema_version
context_algorithm_version

For reproducible packages, compute a content/provenance fingerprint.

───

40. Concurrency
Multiple workers may request context simultaneously.
The architecture should avoid global locks.
Safe mechanisms include:
• immutable source versions,
• snapshot references,
• optimistic concurrency,
• deterministic selection,
• package-level versioning,
• cached projections,
• source-specific concurrency control.
If source state changes during assembly, the system must record which source version was actually used.

───

41. Temporal Semantics
Context is inherently temporal.
A context package must distinguish:
text
source effective time
source observation time
source recording time
assembly time
context validity window
context expiration time

Example:
A worker investigating a historical incident in 2025 must not automatically receive the organization's current 2026 configuration as if it existed during the incident.
Context Assembly therefore supports:
text
CONTEXT AT TIME T

and:
text
CONTEXT OVER INTERVAL [T1,T2]

where the underlying systems support the required temporal truth.

───

42. Observability
Context observability must answer:
• Which context was requested?
• Why?
• By whom?
• For which mission?
• Which worker?
• Which sources were considered?
• Which sources were selected?
• Which were rejected?
• Why were they rejected?
• Which policies applied?
• What was redacted?
• What conflicts existed?
• What was missing?
• How fresh was the package?
• What version was assembled?
• How long did assembly take?
• How large was the package?
• Was it sufficient?
• Was it later invalidated?
Important metrics:
text
context_assembly_latency
context_package_size
context_source_count
context_rejection_rate
context_gap_rate
context_conflict_rate
context_staleness_rate
context_redaction_rate
context_access_denial_rate
context_rebuild_rate
context_reproducibility_rate
context_budget_exceedance


───

43. Auditability
For consequential operations:
text
ACTOR
→ AUTHORITY
→ MISSION
→ CONTEXT REQUIREMENT
→ SOURCES CONSIDERED
→ SOURCES SELECTED
→ POLICIES APPLIED
→ REDACTIONS
→ CONTEXT PACKAGE
→ WORKER
→ EXECUTION

must be traceable.
This is particularly important when investigating:
“Why did the worker know this?”
or:
“Why did the worker not know this?”

───

44. Provenance
Every material Context Item should retain:
text
source_id
source_version
source_owner
source_authority
source_timestamp
retrieval_timestamp
transformation
selection_reason
policy_version
schema_version
context_version

If an AI model summarizes information, the system should preserve:
text
source references
model/provider adapter
model version
transformation purpose
transformation timestamp

where reproducibility requirements justify it.
The summary is not a replacement for the underlying source.

───

45. Versioning
Context packages must be versioned.
Relevant versions include:
text
context_package_version
context_requirement_version
schema_version
source_versions
policy_version
selection_algorithm_version
projection_version
redaction_policy_version

A package must therefore be understood as:
A versioned projection of other versioned information under a specific assembly policy and temporal scope.

───

46. Migration
Context migration becomes necessary when:
• package schema changes,
• context requirement changes,
• source contracts change,
• authority structures change,
• redaction rules change,
• projection semantics change.
Historical packages should not be silently rewritten.
Where migration is required:
text
OLD PACKAGE
↓
MIGRATION RULE
↓
NEW PACKAGE
↓
VALIDATION
↓
PROVENANCE

If semantic equivalence cannot be established, the migration must explicitly report:
text
MIGRATION_UNRESOLVED

rather than inventing equivalence.

───

47. Performance
Context Assembly must avoid repeatedly traversing the entire CoreGrid architecture.
Performance mechanisms:
• indexed source discovery,
• registry-assisted lookup,
• cached authorized projections,
• immutable source versions,
• relevance indexes,
• dependency indexes,
• temporal indexes,
• package caching,
• incremental refresh,
• selective retrieval,
• bounded expansion,
• deterministic filtering.
The architecture should optimize for:
text
minimum sufficient context

rather than maximum retrieval throughput.

───

48. Scalability
CoreGrid may eventually require context assembly across:
• millions of objects,
• thousands of domains,
• many concurrent missions,
• large evidence collections,
• large runtime histories,
• geographically distributed systems.
Scale through:
• partitioning,
• indexed retrieval,
• domain-aware boundaries,
• tenant-aware boundaries,
• asynchronous precomputation,
• materialized projections,
• package caching,
• incremental updates,
• bounded dependency traversal.
Do not solve scale by creating a permanent context microservice for every domain.

───

49. Reliability
Reliability requirements include:
• deterministic source resolution where possible,
• reproducible package construction,
• provenance preservation,
• package integrity,
• graceful degradation,
• stale detection,
• dependency failure handling,
• authorization failure handling,
• recovery,
• audit completeness.
Critical context failures must not silently degrade into successful execution.

───

50. Runtime Architecture
The smallest coherent runtime architecture is likely:
text
Context Requirement Resolver
        ↓
Source Resolver
        ↓
Access/Policy Adapter
        ↓
Context Selector
        ↓
Dependency Resolver
        ↓
Temporal Resolver
        ↓
Projection Engine
        ↓
Sufficiency Validator
        ↓
Context Package Store
        ↓
Context Manifest / Lineage

This does not require eight separate services.
These may be modules within one cohesive Context Assembly subsystem.
Adapters may connect to:
text
Registry
Schema System
State System
Evidence System
Mission System
Runtime Sources
External Sources


───

51. Machine Interfaces
Core interfaces should include:
text
ContextRequirementService
ContextSourceResolver
ContextAccessEvaluator
ContextSelectionEngine
ContextDependencyResolver
ContextProjectionEngine
ContextTemporalResolver
ContextSufficiencyEvaluator
ContextPackageService
ContextLineageService
ContextRefreshService
ContextInvalidationService

Conceptual API:
text
assembleContext(requirement)
→ ContextPackage

text
validateContext(package)
→ SufficiencyAssessment

text
refreshContext(package)
→ NewContextPackage

text
explainContext(package)
→ ContextExplanation

text
reproduceContext(manifest)
→ ContextPackage


───

52. Storage / Persistence
Context Assembly should persist:
text
context_requirements
context_packages
context_manifests
context_lineage
context_assembly_runs
context_conflicts
context_gaps
context_access_decisions

However, source truth remains elsewhere.
For example:
text
state data → State System
evidence → Evidence System
architecture → mother surfaces / architecture structures
identity → Registry

Context persistence stores the projection and its lineage, not a second authoritative copy of every source.
A relational/transactional store is a viable implementation option, but the architecture does not require a specific database technology.

───

53. Implementation Boundaries
Implementation should remain cohesive.
Do not prematurely create:
text
context-microservice
context-search-service
context-memory-service
context-relevance-service
context-security-service
context-compression-service

as separate permanent services.
Prefer:
text
Context Assembly Kernel
+
Source Adapters
+
Policy Adapters
+
Projection Mechanisms
+
Persistence

with external service separation introduced only when justified by:
• scale,
• security isolation,
• deployment independence,
• reliability,
• organizational ownership,
• or runtime constraints.

───

54. Verification Strategy
Verification must test:
Selection
Does the system select required sources?
Exclusion
Does it correctly exclude irrelevant or unauthorized sources?
Authorization
Can forbidden information enter context?
Provenance
Can every material item be traced?
Temporal correctness
Does context reflect the requested time?
Sufficiency
Can missing required information be detected?
Conflict
Are conflicting sources preserved?
Reproducibility
Can the same package be reconstructed?
Redaction
Are sensitive fields removed correctly?
Injection resistance
Can hostile retrieved content alter assembly policy?
Context budget
Does the system enforce declared bounds?
Dependency resolution
Does required context bring required supporting context?
Drift
Does context detect changed source contracts?

───

55. Evidence Requirements
Context Assembly must produce evidence for:
text
context requirement
source selection
source rejection
authorization decision
redaction
dependency resolution
temporal resolution
conflict detection
sufficiency assessment
package creation
package integrity
reproduction
refresh
invalidation

Example evidence:
text
Context Assembly Run Record
Context Manifest
Source Selection Record
Access Decision Record
Sufficiency Report
Context Fingerprint
Reproduction Test
Security Test
Temporal Test


───

56. Conformance Requirements
Conformance must verify:
1. Context requirements are schema-valid.
2. Source ownership is respected.
3. Permissions are enforced.
4. Unauthorized information cannot enter packages.
5. Provenance is preserved.
6. Temporal rules are honored.
7. Context conflicts are represented.
8. Missing critical context can block execution.
9. Context package versions are traceable.
10. Context manifests are reproducible where required.
11. Redaction rules are enforced.
12. Context does not grant authority.
13. Context Assembly does not mutate canonical architecture.
14. Context selection conforms to declared policy.
15. Context packages correspond to actual assembly behavior.

───

57. Drift Detection
Context drift includes:
Source drift
The source schema or meaning changes.
Authority drift
The authority governing a source changes.
Permission drift
A worker's access changes.
Requirement drift
Mission requirements change.
Temporal drift
Previously valid context becomes stale.
Projection drift
Context representation no longer matches source semantics.
Policy drift
Selection/redaction policy changes.
Contract drift
Source interfaces change.
Semantic drift
A field retains its name but changes meaning.
Context reproducibility drift
The same manifest no longer reconstructs equivalent context.
These must feed the Drift & Evolution system.

───

58. Evolution Mechanism
Context Assembly evolves through:
text
OBSERVED FAILURE / NEW REQUIREMENT
↓
CONTEXT GAP
↓
IMPACT ANALYSIS
↓
ARCHITECTURAL DECISION
↓
REQUIREMENT / CONTRACT UPDATE
↓
SCHEMA UPDATE
↓
IMPLEMENTATION
↓
VERIFICATION
↓
CONFORMANCE

Important principle:
A missing context capability does not automatically justify a new component.
It may instead require:
• a new source adapter,
• a new context requirement type,
• a new projection,
• a new policy,
• a new schema,
• a new registry relationship,
• or an evolution of an existing component.

───

59. Risks
Risk 1 — Context Explosion
Too much information enters packages.
Mitigation: budgets, relevance filtering, bounded dependency traversal.

───

Risk 2 — Context Starvation
Workers receive insufficient information.
Mitigation: explicit sufficiency requirements and gap detection.

───

Risk 3 — Context Poisoning
Malicious information influences a worker.
Mitigation: provenance, source trust classification, policy filtering, injection-aware handling.

───

Risk 4 — Authority Leakage
Context causes a worker to believe it has authority.
Mitigation: explicit separation of context and permissions.

───

Risk 5 — Stale Context
Workers operate on outdated information.
Mitigation: freshness contracts, expiration, refresh.

───

Risk 6 — Semantic Compression Loss
Summarization removes critical information.
Mitigation: source references, transformation lineage, critical-field preservation.

───

Risk 7 — Hidden Bias in Selection
A selection algorithm systematically excludes relevant information.
Mitigation: explainability, configurable selection policies, verification, conflict visibility, human review for critical contexts.

───

Risk 8 — Context Becomes a Second Truth Layer
Context packages begin to override their sources.
Mitigation: source references, immutable provenance, explicit projection semantics.

───

Risk 9 — Excessive Coupling
Context Assembly directly depends on every CoreGrid subsystem.
Mitigation: stable machine contracts and adapters.

───

Risk 10 — Non-Reproducible Decisions
A worker cannot be shown what information it received.
Mitigation: versioned manifests and context fingerprints.

───
60. Architectural Debt
Potential initial debt:
• inconsistent source metadata,
• missing source versioning,
• incomplete provenance,
• legacy status fields without temporal semantics,
• inconsistent access-control metadata,
• undocumented dependencies,
• unstructured documents,
• insufficient semantic indexing,
• incomplete evidence references,
• inconsistent freshness definitions,
• weak source authority classification.
This debt should be explicitly tracked rather than hidden inside Context Assembly.

───

61. Open Questions
The following remain architectural questions rather than invented decisions:
1. Exact context schema language.
2. Exact context retrieval/index technology.
3. Whether semantic/vector retrieval is required and where it belongs.
4. Exact relevance algorithm.
5. Exact context-budget model.
6. Whether context compression requires specialized models.
7. Exact source trust taxonomy.
8. Exact field-level authorization model.
9. Exact package persistence strategy.
10. Which contexts require cryptographic integrity guarantees.
11. Which operations require full reproducibility.
12. Whether context packages should be immutable by default.
13. Exact integration with future knowledge/reasoning infrastructure.
14. How spatial context should be represented.
15. How causal context should be projected without reducing causality to summaries.
16. How external real-time feeds should participate.
17. Which context classes require human approval.
These must be resolved through architecture decisions rather than assumed.

───

62. Dependencies on Other Nervous-System Components
Primary:
text
01 Registry
02 Schema System
03 State System
04 Evidence System

Secondary:
text
06 Mission Orchestration
07 Workforce Delegation
08 Execution System
09 Verification System
10 Conformance System
11 Progress Reconciliation
12 Drift & Evolution

Context Assembly is therefore one of the first components that truly connects the foundational machine layer to execution.

───

63. Required Changes to Other Components
Registry
Must expose:
• stable identities,
• ownership,
• relationships,
• source references,
• capability relationships.
Registry must not begin storing context packages as authoritative object state.

───

Schema System
Must provide schemas for:
• context requirements,
• context items,
• context packages,
• manifests,
• lineage,
• sufficiency assessments.

───

State System
Must expose:
• temporal state,
• freshness,
• state versions,
• state provenance,
• current/historical queries.

───

Evidence System
Must support:
• evidence retrieval,
• provenance,
• versioning,
• temporal filtering,
• evidence relevance.

───

Mission Orchestration
Must express context requirements as part of executable missions.

───

Workforce Delegation
Must identify context requirements based on worker capability and authority.

───

Execution System
Must record which context package was used for consequential execution.

───

Verification System
Must be capable of verifying behavior against the actual context available during execution.

───

Conformance System
Must evaluate Context Assembly against declared context contracts and architecture.

───

Progress Reconciliation
Must consume verified Context Assembly implementation/evidence status.

───

Drift & Evolution
Must monitor context/source/contract/policy drift.

───

64. Completion Criteria
Context Assembly is architecturally complete only when:
• ownership is locked,
• non-scope is explicit,
• context ontology is defined,
• context requirements are defined,
• source resolution is defined,
• authorization is defined,
• relevance selection is defined,
• temporal semantics are defined,
• provenance is defined,
• context conflicts are defined,
• sufficiency is defined,
• package lifecycle is defined,
• context versioning is defined,
• reproducibility is defined where required,
• redaction is defined,
• failure behavior is defined,
• recovery is defined,
• idempotency is defined,
• concurrency is defined,
• security boundaries are defined,
• machine interfaces are defined,
• storage boundaries are defined,
• verification is defined,
• evidence requirements are defined,
• conformance is defined,
• drift detection is defined,
• evolution is defined,
• cross-component ownership is reconciled,
• no duplicate authoritative state exists,
• no context path grants authority,
• domain-agnosticity passes.
Implementation remains NOT CLAIMED until evidence exists.

───

65. Architectural Invariants
The following are permanent Context Assembly laws unless superseded through governed architectural evolution.
Invariant 1
Context is a projection, not truth.
Invariant 2
Context does not grant authority.
Invariant 3
Every material context item has provenance.
Invariant 4
Source ownership remains outside Context Assembly.
Invariant 5
Context requirements must be purpose-bound.
Invariant 6
Context selection must be authorization-aware.
Invariant 7
Context must preserve relevant temporal semantics.
Invariant 8
Conflicting relevant information must remain visible as conflict.
Invariant 9
Insufficient context must be representable.
Invariant 10
Stale context must not silently appear current.
Invariant 11
Sensitive information must not enter context merely because it exists.
Invariant 12
AI-generated summaries remain derived projections.
Invariant 13
Context packages must not silently mutate canonical sources.
Invariant 14
Context used for consequential execution must be traceable.
Invariant 15
Context selection must be explainable enough to support audit and reconciliation.
Invariant 16
Context Assembly must remain provider-neutral.
Invariant 17
Context Assembly must remain domain-agnostic.
Invariant 18
Context Assembly must prefer minimum sufficient context over maximum available context.
Invariant 19
Context access and execution authority are separate controls.
Invariant 20
No worker or model may alter its own context authority.

───

66. Final Reconciliation
66.1 Registry Ownership
Registry owns identity and relationships.
Context Assembly consumes them.
No duplication of authoritative identity.

───

66.2 Schema Ownership
Schema System owns structure.
Context Assembly follows schemas.
Context Assembly cannot redefine schema authority.

───

66.3 State Ownership
State System owns current condition.
Context Assembly projects relevant state.
It does not create competing state.

───

66.4 Evidence Ownership
Evidence System owns evidence.
Context Assembly selects and projects evidence.
It does not convert evidence into truth.

───

66.5 Mission Ownership
Mission Orchestration owns mission lifecycle.
Context Assembly fulfills mission context requirements.
It cannot create or redefine missions.

───

66.6 Workforce Ownership
Workforce Delegation owns worker selection and authority.
Context Assembly determines what information that authorized worker receives.
It cannot expand worker permissions.

───

66.7 Execution Ownership
Execution System owns execution.
Context Assembly provides contextual input.
It does not execute commands.

───

66.8 Verification Ownership
Verification System owns verification judgment.
Context Assembly provides reproducible execution context.
It does not certify its own correctness.

───

66.9 Conformance Ownership
Conformance System owns conformance judgment.
Context Assembly supplies implementation and runtime information required for evaluation.

───

66.10 Progress Ownership
Progress Reconciliation owns progress truth.
Context Assembly provides evidence and state signals.

───

66.11 Drift Ownership
Drift & Evolution owns drift detection and governed architectural evolution.
Context Assembly exposes contextual drift signals.
It does not silently change architecture.

───

FINAL ARCHITECTURAL DECISION
The Context Assembly System is established conceptually as:
text
COREGRID AUTHORITY
                         │
                         ▼
                CONTEXT REQUIREMENT
                         │
                         ▼
                 SOURCE DISCOVERY
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       REGISTRY        STATE         EVIDENCE
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                AUTHORIZATION
                         │
                         ▼
                 RELEVANCE FILTER
                         │
                         ▼
               DEPENDENCY RESOLUTION
                         │
                         ▼
                TEMPORAL RESOLUTION
                         │
                         ▼
                CONFLICT ANALYSIS
                         │
                         ▼
                 CONTEXT PROJECTION
                         │
                         ▼
               SUFFICIENCY ANALYSIS
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        INSUFFICIENT              SUFFICIENT
             │                       │
          ESCALATE                   ▼
             │                CONTEXT PACKAGE
             │                       │
             │                       ▼
             │                 WORKFORCE
             │                       │
             │                       ▼
             │                  EXECUTION
             │                       │
             │                       ▼
             │                  VERIFICATION
             │                       │
             └───────────────► CONFORMANCE
                                     │
                                     ▼
                                  PROGRESS
                                     │
                                     ▼
                                  DRIFT
                                     │
                                     ▼
                                 EVOLUTION

The architectural boundary can therefore be stated precisely:
CoreGrid's sources own information. Context Assembly owns the controlled projection of relevant information into an authorized, bounded, temporally valid, provenance-preserving working context.
The resulting fundamental machine primitive is:
text
SOURCE REALITY
      ↓
AUTHORITATIVE / STRUCTURED INFORMATION
      ↓
CONTEXT REQUIREMENT
      ↓
AUTHORIZED SELECTION
      ↓
TEMPORAL + DEPENDENCY + CONFLICT RESOLUTION
      ↓
CONTEXT PROJECTION
      ↓
SUFFICIENCY VALIDATION
      ↓
VERSIONED CONTEXT PACKAGE
      ↓
AUTHORIZED WORK

And the most important CoreGrid law introduced by this component is:
No CoreGrid worker should be forced to choose between ignorance and information overload. The nervous system must construct the smallest sufficient context required for the authorized operation, while preserving provenance, uncertainty, temporal truth, security boundaries, and the ability to reconstruct what the worker actually knew.
Architectural status: DESIGNED.
Implementation, testing, deployment, operational readiness, and conformance remain unclaimed until corresponding evidence exists.

<!-- campaign-52-wp02-receiving-record -->

## Campaign-52 WP-02 receiving record

Status: `SCOPE_RECORDED_IMPLEMENTATION_DENIED`
Source: `architecture/COREGRID_CAMPAIGN_52_WP_02_RECEIVING_RECONCILIATION.json`

These mapped Phase 52 extracts are received here as provenance. They do not authorize runtime implementation, a new phase, or a registry expansion.

- `CG-P52-GAP-010`: An organization switch verifies membership, role, authority, domain, and organization reality before experience loads. A client organization id is not access.
