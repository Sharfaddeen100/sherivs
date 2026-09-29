---
mission: COREGRID-MISSION-0001
artifact_id: p52-block-05-occurrence-177
source: architecture/phase-52-cross domain and engineering sections
source_sha256: A69A3E74FAA88B78B6FB33C36A499E764F7DE04A2C4B33B20C5795D1084CE286
source_lines: 79495-80936
content_sha256: DB05E907B43D145E59C35E856500FC891400927DF96EACAA0CA76AB4F6C60140
inferred_title: CoreGrid continuously detects and processes reality changing.
primary_mother_surface: COREGRID.md
canonical_phase_owner: 26
classification: DUPLICATE_OR_CONFLICT
status: DESIGNED
candidate_boundary: false
duplicate_group: NONE
duplicate_count: 1
---
Block 05 — CoreGrid continuously detects and processes reality changing.



That is the architectural foundation required before the next layer—Block 06: Knowledge, Evidence & Provenance—can turn the enormous stream of observations, events, state transitions, and causal information into trustworthy, queryable knowledge.
COREGRID — BLOCK 06

KNOWLEDGE, EVIDENCE & PROVENANCE FABRIC

Architecture status: SCOPE LOCKED

Block 06 is the layer that answers:

> “What does CoreGrid actually know, why does it believe it, what evidence supports it, where did that evidence come from, and how confident should CoreGrid be?”



This is deliberately not just a vector database, document store, RAG layer, or knowledge graph.

CoreGrid needs a deeper distinction:

REALITY
   ↓
OBSERVATION
   ↓
EVENT
   ↓
EVIDENCE
   ↓
CLAIM
   ↓
KNOWLEDGE
   ↓
UNDERSTANDING
   ↓
INTELLIGENCE

And critically:

KNOWLEDGE ≠ FACT

Knowledge must retain its supporting evidence, provenance, confidence, temporal validity, source authority, contradictions, and derivation history.


---

01. CORE AXIOM

A conventional AI system might store:

"Restaurant X closes at 10 PM."

CoreGrid should store something closer to:

CLAIM:
Restaurant X closes at 10 PM

SUPPORTED BY:
Official organization schedule

SOURCE:
Organization account

OBSERVED:
2026-09-26

VALID FROM:
2026-09-01

VALID UNTIL:
Unknown

SOURCE AUTHORITY:
Organization-authoritative

CONFIDENCE:
0.98

PROVENANCE:
...

CONTRADICTING EVIDENCE:
...

DERIVATION:
...

STATUS:
VALIDATED

This distinction becomes fundamental when CoreGrid operates across millions or billions of entities.


---

02. KNOWLEDGE FABRIC

The architecture:

REALITY
                    │
                    ▼
              OBSERVATIONS
                    │
                    ▼
                 EVENTS
                    │
                    ▼
                 EVIDENCE
                    │
                    ▼
                  CLAIMS
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
      SUPPORTS   CONTRADICTS  QUALIFIES
          │         │         │
          └─────────┼─────────┘
                    ▼
                 KNOWLEDGE
                    │
                    ▼
              KNOWLEDGE GRAPH
                    │
                    ▼
               INTELLIGENCE


---

03. WHAT IS KNOWLEDGE?

CoreGrid should distinguish:

Data

Raw values.

temperature = 42

Observation

A source observed something.

Sensor reported 42°C.

Event

Something happened.

Temperature crossed threshold.

Evidence

Something that supports or challenges a proposition.

Sensor reading at 14:02.

Claim

A proposition that can be evaluated.

Machine temperature exceeded safe operating range.

Knowledge

A sufficiently supported claim with context and provenance.

Machine M exceeded the organization's configured
temperature threshold at approximately 14:02.

Intelligence

Reasoning derived from knowledge.

The machine may require inspection because the
temperature anomaly resembles previous failure precursors.

These must never be collapsed into one object.


---

04. KNOWLEDGE OBJECT MODEL

The central object:

KnowledgeObject {
  id

  type
  schema_version

  subject
  predicate
  object

  claim

  temporal_scope
  spatial_scope

  evidence[]
  sources[]

  provenance

  confidence
  certainty

  epistemic_status

  validity_status

  contradictions[]

  qualifications[]

  assumptions[]

  derivation[]

  ontology_version

  knowledge_version

  security_context

  created_at
  updated_at
}


---

05. THE KNOWLEDGE LAYER

CoreGrid should maintain several epistemic classes:

OBSERVED
VERIFIED
ASSERTED
INFERRED
DERIVED
ESTIMATED
PREDICTED
HYPOTHESIZED
SIMULATED
COUNTERFACTUAL
DISPUTED
CONTRADICTED
UNKNOWN

This prevents AI-generated reasoning from silently becoming “truth.”


---

06. EPISTEMIC STATUS

Every knowledge object should have an explicit status.

Example:

VALIDATED

means sufficiently supported under the applicable validation policy.

Whereas:

HYPOTHESIZED

means:

> plausible proposition requiring additional evidence.



And:

DISPUTED

means:

> meaningful evidence exists on multiple sides.




---

07. THE UNKNOWN IS FIRST-CLASS

CoreGrid must be able to represent:

UNKNOWN

without forcing an answer.

For example:

Why did production decline?

CoreGrid might return:

Known:
Inventory declined.

Known:
Two machines experienced downtime.

Unknown:
Whether machine downtime was the primary cause.

Possible:
Supply disruption contributed.

This is vastly safer than hallucinating a cause.


---

08. CLAIM MODEL

A claim:

Claim {
  id

  subject
  predicate
  object

  qualifiers[]

  temporal_scope
  spatial_scope

  asserted_by
  observed_by

  evidence[]
  supporting_claims[]
  contradicting_claims[]

  confidence

  status

  provenance

  created_at
  updated_at
}

Example:

Subject:
Factory A

Predicate:
experienced_production_decline

Object:
March 2026

Evidence:
Production records

Status:
VALIDATED


---

09. KNOWLEDGE GRAPH

Block 03 gives CoreGrid semantic entities.

Block 04 gives reality relationships.

Block 05 gives events.

Block 06 creates the evidence-backed knowledge layer connecting them.

Conceptually:

ENTITY
   │
   ├── has state
   ├── participates in event
   ├── has claim
   ├── supported by evidence
   ├── related to knowledge
   └── connected to source


---

10. KNOWLEDGE GRAPH NODE TYPES

CoreGrid should support:

Entity
Claim
Fact
Evidence
Source
Document
Observation
Event
Concept
Definition
Rule
Hypothesis
Prediction
Explanation
Dataset
Measurement
Study
Decision
Policy
Model


---

11. KNOWLEDGE GRAPH RELATIONSHIPS

Examples:

SUPPORTED_BY
DERIVED_FROM
OBSERVED_IN
ASSERTED_BY
CONTRADICTS
QUALIFIES
DEPENDS_ON
EXPLAINS
IMPLIES
GENERALIZES
SPECIALIZES
INSTANCE_OF
ABOUT
REFERENCES
SUPERSEDES
VALID_DURING
LOCATED_IN
CAUSED_BY
RESULTS_IN


---

12. EVIDENCE

Evidence is one of the most important concepts in CoreGrid.

Evidence can include:

documents
images
videos
sensor measurements
transactions
events
database records
scientific observations
satellite imagery
human testimony
organizational assertions
government records
contracts
logs
agent observations
models
experiments


---

13. EVIDENCE OBJECT

Evidence {
  id

  type

  source_id
  source_type

  content_reference

  observed_at
  acquired_at

  location?

  subject?

  claims_supported[]
  claims_challenged[]

  extraction_method

  transformation_history[]

  integrity_hash

  confidence

  quality

  authority

  provenance

  security_classification

  retention_policy
}


---

14. EVIDENCE ≠ SOURCE

A source is:

Organization X's official database

Evidence is:

Record #8472 from that database.

The distinction allows one source to provide thousands or millions of evidence objects.


---

15. SOURCE MODEL

KnowledgeSource {
  id

  type

  name

  owner

  authority_level

  jurisdiction?

  domain?

  access_method

  reliability_profile

  historical_reliability

  provenance

  trust_policy

  temporal_scope

  status
}


---

16. SOURCE TYPES

CoreGrid may encounter:

FIRST_PARTY
SECOND_PARTY
THIRD_PARTY
PUBLIC
GOVERNMENT
SCIENTIFIC
COMMERCIAL
SENSOR
HUMAN
AI_GENERATED
DERIVED
UNKNOWN

But source type does not automatically determine truth.


---

17. SOURCE AUTHORITY

A source may have authority over a particular subject.

For example:

Organization

may be authoritative for:

its opening hours

but not necessarily:

regional weather

Authority must therefore be:

source × domain × claim type × jurisdiction × time

rather than one universal trust score.


---

18. PROVENANCE

Provenance answers:

> Where did this information come from and what happened to it before CoreGrid used it?



Example:

Source
 ↓
Retrieved
 ↓
Parsed
 ↓
Extracted
 ↓
Normalized
 ↓
Linked to entity
 ↓
Claim generated
 ↓
Validated
 ↓
Knowledge published

Every transformation should be traceable.


---

19. PROVENANCE GRAPH

SOURCE
  ↓
DOCUMENT
  ↓
PASSAGE
  ↓
EXTRACTION
  ↓
OBSERVATION
  ↓
CLAIM
  ↓
KNOWLEDGE
  ↓
INTELLIGENCE
  ↓
DECISION
  ↓
ACTION

This creates a complete reasoning lineage.


---

20. PROVENANCE OBJECT

Provenance {
  origin
  source
  actor
  process
  model?
  transformation
  timestamp
  inputs[]
  outputs[]
  version
  integrity
}


---

21. PROVENANCE TYPES

DIRECT
EXTRACTED
TRANSFORMED
INFERRED
AGGREGATED
DERIVED
IMPORTED
OBSERVED
GENERATED
HUMAN_ASSERTED
MODEL_GENERATED


---

22. KNOWLEDGE DERIVATION

Suppose:

Evidence A:
Inventory = 100

Evidence B:
Orders = 80

Evidence C:
Supplier delivery delayed

CoreGrid may derive:

Potential inventory pressure

That derived knowledge must retain:

A
B
C
+
derivation rule/model
+
timestamp
+
version


---

23. KNOWLEDGE LINEAGE

Therefore:

Knowledge K
   ↓
Derived from
   ↓
Claim A
Claim B
Claim C
   ↓
Evidence 1
Evidence 2
Evidence 3
   ↓
Original sources

A user can traverse the entire chain.


---

24. KNOWLEDGE CONFIDENCE

Confidence must not be one magical AI number.

CoreGrid should decompose it.

Confidence =
source reliability
+
evidence quality
+
independence
+
temporal relevance
+
semantic consistency
+
model uncertainty
+
measurement uncertainty
+
contradiction level

The actual aggregation method is policy/model dependent.


---

25. EVIDENCE QUALITY

Evidence quality can consider:

accuracy
completeness
freshness
resolution
consistency
independence
integrity
relevance
measurement quality
collection method


---

26. EVIDENCE FRESHNESS

Knowledge can decay.

For example:

Restaurant opening hours

from five years ago should not be treated like:

Opening hours
updated yesterday.

Therefore knowledge may have:

freshness
valid_from
valid_until
verification_due


---

27. TEMPORAL KNOWLEDGE

Knowledge itself exists through time.

Example:

CEO of Organization X

may be:

Person A
2020–2024

and:

Person B
2024–present

Historical knowledge must remain recoverable.


---

28. BITEMPORAL KNOWLEDGE

CoreGrid should distinguish:

VALID TIME

from:

RECORD TIME

Example:

A policy became effective:
January 1

CoreGrid learned about it:
January 7

Those dates are different.


---

29. KNOWLEDGE VERSIONING

Knowledge should not simply be overwritten.

Instead:

Knowledge v1
Knowledge v2
Knowledge v3

with:

supersedes
corrects
refines
contradicts

relationships.


---

30. KNOWLEDGE CORRECTION

If:

Claim A:
Factory has 5 machines.

is later found wrong:

Claim B:
Factory has 7 machines.

CoreGrid should retain the original claim and establish:

Claim B
CORRECTS
Claim A

with provenance.


---

31. CONTRADICTION ENGINE

CoreGrid will frequently encounter:

Source A:
100 units

Source B:
120 units

The system should not silently choose one.

Instead:

Conflict
 ├── Claim A
 └── Claim B

with:

source authority
timestamp
evidence quality
context


---

32. KNOWLEDGE CONFLICT TYPES

DIRECT_CONTRADICTION
TEMPORAL_CONFLICT
SPATIAL_CONFLICT
DEFINITION_CONFLICT
MEASUREMENT_CONFLICT
SOURCE_CONFLICT
MODEL_CONFLICT
PARTIAL_CONFLICT
APPARENT_CONFLICT

Some contradictions disappear when context is added.


---

33. KNOWLEDGE RECONCILIATION

The system should attempt:

detect
→ classify
→ contextualize
→ compare sources
→ identify temporal differences
→ identify semantic differences
→ evaluate authority
→ seek additional evidence
→ reconcile

If reconciliation is impossible:

DISPUTED

remains a valid state.


---

34. INDEPENDENT EVIDENCE

Ten websites copying the same source are not ten independent sources.

CoreGrid should model:

source lineage

to detect shared origin.

This prevents artificial confidence inflation.


---

35. EVIDENCE CORROBORATION

Independent evidence streams can strengthen a claim:

Sensor
+
Transaction
+
Human report
+
Image

When they independently converge:

confidence increases

according to the applicable evidence model.


---

36. EVIDENCE NEGATION

Evidence can support or challenge a claim.

SUPPORTS

and:

CHALLENGES

must both be first-class relationships.


---

37. ABSENCE OF EVIDENCE

CoreGrid must distinguish:

No evidence found

from:

Evidence that something did not happen

These are radically different.


---

38. KNOWLEDGE NEGATION

A claim can explicitly represent:

NOT_TRUE

when there is sufficient evidence.

This is different from:

UNKNOWN


---

39. KNOWLEDGE QUALIFIERS

A claim may require conditions.

Example:

"Restaurant accepts reservations."

could actually be:

accepts reservations
IF
party size ≤ 8
AND
booking made ≥ 2 hours ahead

Therefore claims need qualifiers.


---

40. KNOWLEDGE RULES

CoreGrid can represent:

IF
condition A
AND
condition B
THEN
relationship C

But rules must be distinguished from empirical observations.


---

41. DOMAIN KNOWLEDGE

Each domain can have reusable knowledge structures.

Example:

Agriculture

soil
crop
weather
yield
pest
irrigation

Mining

formation
mineralization
geochemistry
geophysics
deposit
sample
drill hole

Education

student
curriculum
assessment
attendance
learning progression

Domain Packages can provide these structures.


---

42. UNIVERSAL KNOWLEDGE + DOMAIN KNOWLEDGE

Architecture:

CORE KNOWLEDGE
      +
DOMAIN KNOWLEDGE
      +
ORGANIZATION KNOWLEDGE
      +
USER-SPECIFIC AUTHORIZED KNOWLEDGE
      ↓
CONTEXTUAL KNOWLEDGE


---

43. ORGANIZATION KNOWLEDGE

An organization can have:

policies
procedures
employees
customers
services
locations
assets
financial records
documents
workflows
operational history

CoreGrid can build a knowledge layer over these authorized sources.


---

44. PERSONAL KNOWLEDGE

A user can optionally maintain authorized personal knowledge:

preferences
saved places
appointments
devices
household entities
personal projects

Personal knowledge remains separately governed from organizational knowledge.


---

45. KNOWLEDGE SCOPES

CoreGrid should support:

GLOBAL
DOMAIN
ORGANIZATION
TEAM
PROJECT
PERSONAL
SESSION
AGENT
WORKFLOW

Access is policy-controlled.


---

46. KNOWLEDGE PARTITIONING

A user's organization knowledge must not automatically become available to another organization.

Likewise:

Organization A

must not receive:

Organization B's private knowledge

merely because both use CoreGrid.


---

47. KNOWLEDGE FEDERATION

CoreGrid can still allow controlled cross-domain knowledge.

Example:

Public weather data

can be shared broadly.

But:

Private customer transaction history

remains restricted.


---

48. KNOWLEDGE ACCESS

Every knowledge request passes:

identity
+
membership
+
resource permissions
+
purpose
+
policy
+
data classification
+
jurisdiction/context

before retrieval.


---

49. KNOWLEDGE QUERY

CoreGrid should not only support:

semantic search

but:

WHAT_DO_WE_KNOW?
WHY_DO_WE_KNOW_IT?
WHAT_SUPPORTS_IT?
WHAT_CONTRADICTS_IT?
WHEN_WAS_IT_TRUE?
WHO_ASSERTED_IT?
HOW_CONFIDENT_ARE_WE?
WHAT_CHANGED?


---

50. KNOWLEDGE QUERY LANGUAGE

A future CoreGrid Knowledge Query Language can support:

KNOW(subject)

WHY_KNOW(claim)

EVIDENCE_FOR(claim)

EVIDENCE_AGAINST(claim)

SOURCE_OF(claim)

HISTORY_OF(claim)

CONTRADICTIONS(claim)

WHAT_CHANGED(subject)

UNKNOWN(subject)


---

51. SEMANTIC RETRIEVAL

A query such as:

> “Why are sales declining?”



should not simply retrieve documents containing:

sales declining

It should traverse:

Sales
 ↓
events
 ↓
state changes
 ↓
evidence
 ↓
causal relationships
 ↓
knowledge
 ↓
supporting sources

This connects Blocks 04, 05 and 06.


---

52. KNOWLEDGE RETRIEVAL PIPELINE

USER QUERY
    ↓
SEMANTIC INTERPRETATION
    ↓
IDENTITY / AUTHORIZATION
    ↓
ONTOLOGY RESOLUTION
    ↓
KNOWLEDGE GRAPH QUERY
    ↓
EVIDENCE RETRIEVAL
    ↓
PROVENANCE VALIDATION
    ↓
CONTRADICTION CHECK
    ↓
TEMPORAL FILTER
    ↓
RANKING
    ↓
ANSWER / KNOWLEDGE RESULT


---

53. KNOWLEDGE ANSWER CONTRACT

An intelligent answer should potentially expose:

Answer
Confidence
Evidence
Sources
Time
Assumptions
Contradictions
Unknowns
Derivation

This allows CoreGrid to explain itself.


---

54. EXPLANATION GRAPH

For any important conclusion:

CONCLUSION
   ↓
SUPPORTING CLAIMS
   ↓
EVIDENCE
   ↓
SOURCES

and separately:

CONCLUSION
   ↓
ASSUMPTIONS
   ↓
MODELS

This creates transparent reasoning lineage.


---

55. KNOWLEDGE VS REASONING

Important boundary:
