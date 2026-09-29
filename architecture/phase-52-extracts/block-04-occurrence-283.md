---
mission: COREGRID-MISSION-0001
artifact_id: p52-block-04-occurrence-283
source: architecture/phase-52-cross domain and engineering sections
source_sha256: A69A3E74FAA88B78B6FB33C36A499E764F7DE04A2C4B33B20C5795D1084CE286
source_lines: 105586-106225
content_sha256: 58532DB94C7E1E83287152D36E8CFD078DFD8078D12C091B1B16DB983FCFF24B
inferred_title: REALITY GRAPH + TEMPORAL + CAUSALITY
primary_mother_surface: REALITY.md
canonical_phase_owner: 16
classification: DUPLICATE_OR_CONFLICT
status: DESIGNED
candidate_boundary: false
duplicate_group: NONE
duplicate_count: 1
---
BLOCK 04 — REALITY GRAPH + TEMPORAL + CAUSALITY
ALIEN ENGINEERING FORMULA v1.0
Construction position: Block 04 of 18
Depends on: Block 01 Core Object Model + Block 02 Identity/Authority/Tenant Isolation + Block 03 Universal Entity/Ontology/Compiler
Feeds: Block 05 Event Fabric, Block 06 Knowledge & Evidence, Block 07 Intelligence & Model Fabric, Block 08 Dynamic Agent Fabric, Block 12 Simulation & Digital Twins
Status:Architecture scope-locked
Important distinction: this is a complete architectural specification for Block 04. It does not mean the software has already been implemented in production. Implementation comes after the architecture is frozen.

───

0. THE ALIEN QUESTION
Normal engineering asks:
“How do we store relationships between records?”
CoreGrid asks something much deeper:
“How can a machine represent a changing portion of reality, preserve its history, understand what caused what, distinguish observation from belief, and reason about possible futures without confusing any of them with reality itself?”
That produces the fundamental Block 04 equation:
text
REALITY
   ↓
OBSERVATION
   ↓
ENTITY
   ↓
RELATIONSHIP
   ↓
STATE
   ↓
TIME
   ↓
CAUSAL STRUCTURE
   ↓
REALITY GRAPH
   ↓
KNOWLEDGE / REASONING
   ↓
PREDICTION / SIMULATION
   ↓
ACTION
   ↓
NEW REALITY

Block 04 therefore creates CoreGrid's computational reality layer.
Block 03 answers:
What exists and what does it mean?
Block 04 answers:
How do those things exist together, change through time, and influence one another?

───

1. BLOCK 04 CORE LAW
THE REALITY REPRESENTATION LAW
CoreGrid shall never treat reality as merely a collection of database rows.
Instead:
text
Reality
=
Entities
+
Relationships
+
States
+
Events
+
Observations
+
Temporal Context
+
Spatial Context
+
Causal Structure
+
Provenance
+
Uncertainty
+
Hypotheses
+
Predictions
+
Simulation States

The graph is therefore not merely:
text
A → B

It must be capable of representing:
text
A
│
├── relates_to → B
│
├── observed_at → T1
│
├── changed_at → T2
│
├── caused → C
│
├── supported_by → Evidence
│
├── predicted → FutureState
│
└── simulated_under → Scenario


───

2. BLOCK 04 MISSION
Block 04 owns the machinery required to represent:
2.1 Reality topology
What entities are connected to what other entities?
2.2 Temporal reality
What was true before?
What is true now?
What may become true later?
2.3 State evolution
How does an entity or relationship change?
2.4 Causality
What mechanisms or conditions contribute to an outcome?
2.5 Provenance
Where did a graph assertion come from?
2.6 Uncertainty
How certain are we?
2.7 Observations
What was actually observed versus inferred?
2.8 Counterfactual structure
What would happen if a condition changed?
2.9 Graph projections
How can the same semantic reality be represented efficiently for different workloads?
2.10 Reality reconstruction
Can CoreGrid reconstruct the state of a system at a previous point in time?
That final capability is extremely important.

───

3. THE REALITY GRAPH IS NOT THE DATABASE
This distinction is foundational.
text
DATABASE
    ↓
storage projection

GRAPH DATABASE
    ↓
relationship-oriented storage projection

REALITY GRAPH
    ↓
semantic computational model of reality

CoreGrid may use PostgreSQL, graph databases, indexes, vector stores, object storage, streams, etc.
But none of those is the semantic truth.
The ontology from Block 03 defines meaning.
The Reality Graph defines connected existence and change.
Storage systems are projections.
Therefore:
text
ONTOLOGY
     ↓
SEMANTIC MODEL
     ↓
REALITY GRAPH
     ↓
STORAGE PROJECTIONS

Not:
text
DATABASE
     ↓
pretend it is reality


───

4. UNIVERSAL GRAPH PRIMITIVES
Block 04 establishes a small set of universal primitives.
4.1 Node
A node represents an entity, observation, state, event, hypothesis, prediction, scenario, or other graph-addressable object.
text
Node

4.2 Edge
An edge represents a typed relationship.
text
Edge

4.3 State
A state represents the condition of something at a particular temporal boundary.
text
State

4.4 Observation
An observation represents an externally obtained or explicitly recorded perception.
text
Observation

4.5 Causal Link
A causal link represents a claimed causal dependency.
text
Cause → Effect

4.6 Temporal Interval
Represents when something is valid, observed, active, or applicable.
text
[T_start, T_end]

4.7 Provenance
Represents how an assertion entered the graph.
4.8 Uncertainty
Represents confidence, probability, interval, ambiguity, or incomplete knowledge.

───

5. UNIVERSAL REALITY GRAPH OBJECT
text
RealityGraphObject {
    id
    object_type
    tenant_id
    organization_id?
    entity_id?
    ontology_version

    semantic_type

    temporal_scope?
    spatial_scope?

    provenance

    confidence?

    uncertainty?

    security_context

    lifecycle_status

    created_at
    updated_at
}

The object may specialize into:
text
GraphNode
GraphEdge
GraphState
Observation
CausalRelation
Prediction
Hypothesis
Scenario


───

6. GRAPH NODE CONTRACT
text
GraphNode {
    id
    node_type
    entity_id?
    semantic_type

    tenant_id
    organization_id?

    labels[]

    attributes

    current_state_ref?

    temporal_scope?

    spatial_scope?

    provenance

    confidence?

    uncertainty?

    security_classification

    lifecycle_status

    created_at
    updated_at
}

A node can therefore represent:
text
Student
School
Teacher
Mineral Deposit
Satellite
Company
Agent
Machine
Planet
Disease
Document
Transaction
Building
Road
Sensor
Research Hypothesis
Simulation Scenario

The domain changes.
The primitive does not.

───

7. GRAPH EDGE CONTRACT
Relationships from Block 03 become graph edges.
text
GraphEdge {
    id

    relationship_type

    source_node_id
    target_node_id

    tenant_id

    attributes

    valid_time
    transaction_time

    provenance

    confidence?

    uncertainty?

    causal_metadata?

    security_context

    lifecycle_status

    created_at
    updated_at
}

Example:
text
Teacher
   │
   └── teaches ──→ Classroom

But CoreGrid can also represent:
text
MineralDeposit
   │
   ├── located_in → GeologicalFormation
   ├── intersected_by → DrillHole
   ├── supported_by → GeophysicalObservation
   ├── predicted_by → ModelPrediction
   └── estimated_as → ResourceEstimate


───

8. THE TEMPORAL ENGINE
This is one of the most important components of Block 04.
Normal systems frequently ask:
“What is the value?”
CoreGrid must ask:
“What was the value, when was it true, when did CoreGrid learn it, and what changed it?”
Therefore CoreGrid requires multiple notions of time.

───

9. MULTI-TIME MODEL
CoreGrid should not collapse every timestamp into created_at.
At minimum:
9.1 Valid Time
When something was true in the represented reality.
text
valid_from
valid_to

9.2 Transaction Time
When CoreGrid recorded the information.
text
recorded_at

9.3 Observation Time
When an observation occurred.
text
observed_at

9.4 Inference Time
When a conclusion was generated.
text
inferred_at

9.5 Effective Time
When a policy, relationship, state, or rule becomes operational.
text
effective_from
effective_to

9.6 Simulation Time
Time inside a simulated world.
text
simulation_time

This produces:
text
REALITY TIME
      +
KNOWLEDGE TIME
      +
OBSERVATION TIME
      +
INFERENCE TIME
      +
SIMULATION TIME

These must never be silently conflated.

───

10. TEMPORAL INTERVAL CONTRACT
text
TemporalInterval {
    start
    end?
    start_inclusive
    end_inclusive

    precision

    timezone?

    certainty

    temporal_type
}

Temporal types:
text
INSTANT
INTERVAL
OPEN_INTERVAL
UNKNOWN
APPROXIMATE_INTERVAL
RECURRING_INTERVAL
SIMULATION_INTERVAL


───

11. BI-TEMPORAL / MULTI-TEMPORAL GRAPH
A graph assertion can therefore have:
text
Valid Time:
2026-01-01 → 2026-06-30

Recorded Time:
2026-09-21

Observed Time:
2026-06-15

This allows CoreGrid to answer:
What did we believe on March 1?
and separately:
What do we now know about what was true on March 1?
That distinction is fundamental to serious intelligence infrastructure.

───

12. TEMPORAL STATE MODEL
An entity's state becomes a sequence:
text
S0
 ↓
S1
 ↓
S2
 ↓
S3

with transitions:
text
S0 --Event--> S1
S1 --Event--> S2
S2 --Event--> S3

CoreGrid should preserve the transition history.
It must not simply overwrite the previous state when historical reconstruction is required.

───

13. STATE CONTRACT
text
GraphState {
    id

    subject_id

    semantic_type

    state_values

    valid_time

    observed_time?

    recorded_time

    predecessor_state_id?

    transition_event_id?

    provenance

    confidence?

    uncertainty?

    state_hash

    version

    created_at
}


───

14. STATE RECONSTRUCTION ENGINE
CoreGrid must be able to compute:
text
STATE(entity, time)

Conceptually:
text
StateAt(entity, T)

Example:
text
Student X
    ↓
StateAt(2025-09-01)

or:
text
MiningSite Y
    ↓
StateAt(2024-06-14)

or:
text
Organization Z
    ↓
StateAt(T)

The engine reconstructs the valid graph state from temporal information.

───

15. TEMPORAL QUERY MODEL
CoreGrid must support concepts equivalent to:
text
AS_OF(T)
BETWEEN(T1,T2)
BEFORE(T)
AFTER(T)
DURING(interval)
OVERLAPS(interval)
STARTED_AT(T)
ENDED_AT(T)
CHANGED_BETWEEN(T1,T2)
STATE_AT(T)
HISTORY(entity)

These are semantic operations rather than database-specific syntax.

───

16. GRAPH SNAPSHOTS
CoreGrid should support:
text
RealitySnapshot {
    id
    graph_id
    snapshot_time
    snapshot_type
    state_hash
    included_entities
    included_relationships
    provenance
}

Snapshots provide efficient reconstruction for very large graphs.
But:
Snapshot ≠ history.
History remains authoritative.
Snapshots are acceleration structures.

───

17. GRAPH VERSIONING
CoreGrid requires multiple levels of versioning:
text
Entity Version
Relationship Version
State Version
Ontology Version
Graph Version
Reality Model Version
Simulation Version

A graph query must be able to specify the semantic version when necessary.

───

18. TEMPORAL CONSISTENCY
The Temporal Engine must detect contradictions such as:
text
Relationship:
A employed_by B
valid: Jan → Dec

Relationship:
A employed_by C
valid: Feb → Nov

This may or may not be contradictory depending on ontology cardinality.
Therefore temporal validation consumes:
text
