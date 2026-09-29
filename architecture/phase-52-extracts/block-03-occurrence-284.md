---
mission: COREGRID-MISSION-0001
artifact_id: p52-block-03-occurrence-284
source: architecture/phase-52-cross domain and engineering sections
source_sha256: A69A3E74FAA88B78B6FB33C36A499E764F7DE04A2C4B33B20C5795D1084CE286
source_lines: 106226-107249
content_sha256: F451CD3CE98ADE9F49CB357FBC8ED8F7E8CF32C999456BF6555C61875071219B
inferred_title: Cardinality
primary_mother_surface: RUNTIME.md
canonical_phase_owner: 40
classification: DUPLICATE_OR_CONFLICT
status: DESIGNED
candidate_boundary: false
duplicate_group: NONE
duplicate_count: 1
---
Block 03
    ↓
Cardinality
Constraints
Lifecycle
Semantics

Then Block 04 evaluates temporal consistency.

───

19. THE CAUSALITY ENGINE
This is where CoreGrid moves beyond a relationship graph.
A relationship does not automatically imply causation.
text
A related_to B

does not mean:
text
A caused B

CoreGrid therefore establishes a strict separation:
text
CORRELATION
≠
CAUSATION


───

20. CAUSAL GRAPH
The causal layer represents:
text
Cause
  ↓
Mechanism
  ↓
Intermediate State
  ↓
Effect

Example:
text
Heavy rainfall
      ↓
River water level increases
      ↓
Flooding occurs
      ↓
Road becomes inaccessible

Each link can have evidence and uncertainty.

───

21. CAUSAL RELATION CONTRACT
text
CausalRelation {
    id

    cause_id
    effect_id

    mechanism?

    causal_type

    direction

    conditions[]

    temporal_constraint?

    spatial_constraint?

    strength?

    confidence?

    evidence_refs[]

    provenance

    assumptions[]

    counterfactual_definition?

    security_context

    lifecycle_status
}


───

22. CAUSAL TYPES
CoreGrid should support:
text
DIRECT_CAUSE
INDIRECT_CAUSE
CONTRIBUTING_FACTOR
NECESSARY_CONDITION
SUFFICIENT_CONDITION
ENABLING_CONDITION
INHIBITING_FACTOR
MEDIATOR
CONFOUNDER
FEEDBACK
PRECONDITION
TRIGGER
CORRELATION_ONLY
UNKNOWN

CORRELATION_ONLY is particularly important.
The graph must be able to explicitly say:
We know these variables are associated, but we do not have sufficient causal justification.

───

23. CAUSALITY IS CONDITIONAL
Causality should not be represented as an unconditional magical arrow.
Instead:
text
A causes B

becomes something closer to:
text
A
+
Condition C
+
Mechanism M
+
Temporal relationship T
+
Relevant background state S
→
B

Therefore:
text
CausalRelation
=
Cause
+
Conditions
+
Mechanism
+
Temporal Constraints
+
Evidence
+
Uncertainty


───

24. CAUSAL MECHANISM MODEL
text
CausalMechanism {
    id
    name

    inputs[]
    intermediate_states[]
    outputs[]

    preconditions[]

    postconditions[]

    domain_rules[]

    temporal_constraints[]

    spatial_constraints[]

    evidence_refs[]

    confidence

    provenance
}

This becomes extremely important later for simulation.

───

25. CAUSAL PATH
CoreGrid must be able to traverse:
text
A → B → C → D

and identify:
text
A
 ↓
B
 ↓
C
 ↓
D

while preserving:
• causal strength
• evidence
• conditions
• temporal ordering
• uncertainty
• provenance

───

26. CAUSAL PATH CONTRACT
text
CausalPath {
    id

    source
    target

    nodes[]
    causal_edges[]

    total_confidence?

    assumptions[]

    temporal_constraints[]

    spatial_constraints[]

    evidence_refs[]

    provenance
}

The system must not treat every path as equally valid.

───

27. CAUSAL CONFLICTS
Suppose the graph contains:
text
A → B

and another model proposes:
text
C → B

This is not automatically contradictory.
Multiple causes may exist.
But if one causal model says:
text
A prevents B

while another says:
text
A causes B

under identical conditions, CoreGrid must flag:
text
CAUSAL_CONFLICT

rather than silently selecting one.

───

28. CAUSAL HYPOTHESIS
Causal claims can begin as hypotheses.
text
CausalHypothesis {
    id

    proposed_cause
    proposed_effect

    mechanism?

    assumptions[]

    evidence_refs[]

    confidence

    status
}

Status:
text
PROPOSED
UNDER_TEST
SUPPORTED
WEAKLY_SUPPORTED
CONTRADICTED
REJECTED
SUPERSEDED

This is critical for scientific intelligence.

───

29. CAUSAL INFERENCE BOUNDARY
CoreGrid may use AI models to propose causal relationships.
But:
text
MODEL_OUTPUT
      ≠
ESTABLISHED CAUSAL FACT

The system must distinguish:
text
Observed
Derived
Inferred
Hypothesized
Predicted
Simulated
Verified

These semantic states must remain machine-readable.

───

30. COUNTERFACTUAL ENGINE
Causality becomes much more powerful when CoreGrid can ask:
What if this variable were different?
Represent:
text
Counterfactual {
    id

    base_world

    intervention

    target_variables[]

    assumptions[]

    predicted_effects[]

    causal_model_version

    result

    uncertainty

    provenance
}

Example:
text
BASE:
Rainfall = 100mm

COUNTERFACTUAL:
Rainfall = 50mm

QUESTION:
Would flooding still occur?

This is the bridge from:
text
Reality Graph

to:
text
Simulation Engine


───

31. INTERVENTION MODEL
An intervention is different from an observation.
text
Observation:
A happened.

Intervention:
Force A to a particular value.

Contract:
text
Intervention {
    id
    target
    operation
    value
    start_time?
    end_time?
    assumptions[]
    authority_context?
    provenance
}

Real-world interventions later require Block 11's action/authority machinery.
Block 04 merely represents the semantic structure.

───

32. FEEDBACK LOOPS
Reality is rarely a simple DAG.
CoreGrid must support cycles:
text
A → B
↑   ↓
D ← C

Example:
text
Economic activity
      ↓
Employment
      ↓
Consumer spending
      ↓
Business revenue
      ↓
Economic activity

Therefore:
The Reality Graph cannot be restricted to acyclic structures.
Causal analysis must explicitly detect and represent feedback loops.

───

33. CAUSAL LOOP CONTRACT
text
CausalLoop {
    id

    nodes[]
    edges[]

    loop_type

    feedback_sign?

    temporal_delay?

    stability_characteristics?

    evidence_refs[]

    provenance
}

Possible loop types:
text
POSITIVE_FEEDBACK
NEGATIVE_FEEDBACK
MIXED_FEEDBACK
UNKNOWN


───

34. TEMPORAL CAUSALITY
A causal relation should normally respect temporal ordering.
If:
text
A causes B

then the causal representation should encode the relevant temporal relationship.
CoreGrid must detect impossible structures such as:
text
Effect timestamp
    <
Cause timestamp

unless the domain explicitly permits retrospective/reference semantics.
This prevents many reasoning errors.

───

35. CAUSALITY + SPACE
Many causal systems are spatial.
Examples:
text
Pollution source
      ↓
Air movement
      ↓
Affected region

or:
text
Geological formation
      ↓
Mineralization
      ↓
Deposit location

Therefore causal relations can contain:
text
spatial_constraints

Block 04 does not become the full geospatial engine; it defines the semantic contracts consumed by it.

───

36. PROVENANCE GRAPH
Every significant graph assertion should answer:
text
WHO?
WHAT?
WHEN?
FROM WHERE?
USING WHAT?
UNDER WHICH MODEL?
WITH WHAT CONFIDENCE?

Example:
text
Claim
 ↓
generated_by → Model vX
 ↓
based_on → Observation
 ↓
collected_by → Sensor
 ↓
observed_at → Location/Time

This creates a provenance subgraph.

───

37. PROVENANCE CONTRACT
text
GraphProvenance {
    source_type
    source_id

    actor_id?

    model_id?
    agent_id?

    observation_id?

    method?

    timestamp

    transformation_chain[]

    confidence?

    integrity_hash?
}


───

38. OBSERVATION MODEL
Observation must remain distinct from the entity being observed.
text
Observation {
    id

    observer_id?

    subject_id

    observation_type

    observed_value

    observed_at

    location?

    instrument?

    method?

    raw_source_ref?

    processing_chain[]

    confidence?

    uncertainty?

    provenance

    security_context
}

Example:
text
Sensor observes:
Temperature = 31.4°C

The temperature measurement is an observation.
It is not automatically a permanent property of the entity.

───

39. OBSERVATION → STATE
Multiple observations can contribute to a state.
text
Observation 1
Observation 2
Observation 3
      ↓
Evidence aggregation
      ↓
State estimate

CoreGrid must preserve the distinction.

───

40. STATE ESTIMATION
text
StateEstimate {
    subject_id

    estimated_state

    supporting_observations[]

    estimation_method

    model_id?

    confidence

    uncertainty

    valid_time

    provenance
}

This allows CoreGrid to represent:
“We estimate that this was the state.”
rather than falsely representing it as direct observation.

───

41. UNCERTAINTY MODEL
CoreGrid cannot assume that every graph fact is binary.
Represent:
text
TRUE
FALSE
UNKNOWN
UNCERTAIN

with richer uncertainty metadata where appropriate.
text
Uncertainty {
    type
    value?
    lower_bound?
    upper_bound?
    distribution?
    confidence?
    source?
    method?
}

Potential uncertainty types:
text
UNKNOWN
INTERVAL
PROBABILISTIC
CONFIDENCE
AMBIGUITY
MODEL_UNCERTAINTY
MEASUREMENT_UNCERTAINTY
STRUCTURAL_UNCERTAINTY
TEMPORAL_UNCERTAINTY


───

42. REALITY VS KNOWLEDGE VS HYPOTHESIS
This boundary is non-negotiable.
text
REALITY
   ↓
OBSERVATION
   ↓
EVIDENCE
   ↓
INTERPRETATION
   ↓
HYPOTHESIS
   ↓
MODEL
   ↓
PREDICTION
   ↓
SIMULATION

These layers must not collapse into one another.
For example:
text
Prediction ≠ Reality
Simulation ≠ Reality
Hypothesis ≠ Fact
Model ≠ Observation
Correlation ≠ Causation

This is one of CoreGrid's deepest constitutional safeguards.

───

43. REALITY GRAPH LAYERS
The graph should conceptually contain several synchronized layers.
text
┌─────────────────────────────┐
│ REALITY / ENTITY LAYER      │
├─────────────────────────────┤
│ RELATIONSHIP LAYER          │
├─────────────────────────────┤
│ STATE LAYER                 │
├─────────────────────────────┤
│ TEMPORAL LAYER              │
├─────────────────────────────┤
│ OBSERVATION LAYER           │
├─────────────────────────────┤
│ PROVENANCE LAYER            │
├─────────────────────────────┤
│ CAUSAL LAYER                │
├─────────────────────────────┤
│ HYPOTHESIS LAYER            │
├─────────────────────────────┤
│ PREDICTION LAYER            │
├─────────────────────────────┤
│ SIMULATION LAYER            │
└─────────────────────────────┘

They are logically distinct but computationally connected.

───

44. GRAPH PROJECTION ARCHITECTURE
CoreGrid should not force every workload into one physical graph representation.
Instead:
text
Semantic Reality Graph
          ↓
      Graph IR
     ↙   ↓   ↘
Property Graph
Knowledge Graph
Temporal Index
Spatial Index
Search Projection
Vector Projection
Analytical Projection

The semantic graph remains canonical.
Physical projections optimize workloads.

───

45. GRAPH INDEXING FABRIC
The architecture must support indexing by:
text
Entity ID
Entity Type
Relationship Type
Tenant
Organization
Time
Spatial Region
Provenance
Confidence
State
Causal Relation
Observation
Ontology Version
Security Classification

This is essential for large-scale graph traversal.

───

46. GRAPH PARTITIONING
At CoreGrid scale, the graph cannot be assumed to fit into one machine.
Partitioning strategies may include:
text
Tenant
Organization
Domain
Geography
Entity Type
Relationship locality
Temporal locality
Hash partitioning
Hybrid partitioning

But partitioning must not alter semantic identity.
A cross-partition relationship remains one logical relationship.

───

47. CROSS-TENANT ISOLATION
From Block 02:
text
tenant_id
organization_id
authority_context
policy_context

must propagate into graph operations.
A graph traversal must not accidentally cross authorization boundaries.
Example:
text
Tenant A
   ↓
graph traversal
   ↓
Tenant B

must be blocked unless an explicit governed relationship and authority permit it.

───

48. GRAPH QUERY AUTHORIZATION
Authorization must occur before unrestricted graph expansion.
Conceptually:
text
QUERY
 ↓
IDENTITY
 ↓
TENANT
 ↓
AUTHORITY
 ↓
POLICY
 ↓
GRAPH SCOPE
 ↓
TRAVERSAL
 ↓
RESULT FILTER

Not:
text
retrieve everything
     ↓
filter afterward

The latter risks leakage.

───

49. GRAPH TRAVERSAL MODEL
CoreGrid must support semantic traversal:
text
TRAVERSE(
    source,
    relationship_types,
    direction,
    depth,
    temporal_scope,
    spatial_scope,
    policy_scope,
    confidence_threshold
)

Example:
text
School
 → teachers
 → assigned_classes
 → students
 → attendance_events

The same mechanism can traverse:
text
GeologicalRegion
 → formations
 → deposits
 → samples
 → observations
 → predictions


───

50. GRAPH PATH CONSTRAINTS
Traversal can be constrained by:
text
type
relationship
time
location
tenant
authority
confidence
provenance
state
ontology version

This transforms graph traversal into semantic reasoning infrastructure rather than simple database navigation.

───

51. GRAPH MATERIALIZATION
Some relationships may be expensive to calculate repeatedly.
CoreGrid can materialize derived relationships:
text
Raw Graph
   ↓
Inference
   ↓
Derived Edge

But derived edges must be marked:
text
DERIVED

and preserve:
text
derivation_rule
source_edges
model
timestamp
version
confidence

They must never masquerade as primary facts.

───

52. DERIVED EDGE CONTRACT
text
DerivedEdge {
    edge_id

    source_refs[]

    derivation_rule_id

    derivation_model_id?

    generated_by

    generated_at

    confidence

    valid_time

    expires_at?

    provenance
}


───

53. GRAPH DIFFERENCE ENGINE
CoreGrid needs to calculate:
text
Graph(T1)
        ↓
     DIFF
        ↓
Graph(T2)

Result:
text
added entities
removed entities
changed entities

added relationships
removed relationships
changed relationships

state transitions
causal changes
confidence changes
provenance changes

This becomes essential for monitoring reality.

───

54. GRAPH DELTA
text
GraphDelta {
    id

    base_snapshot
    target_snapshot

    added_nodes[]
    removed_nodes[]
    modified_nodes[]

    added_edges[]
    removed_edges[]
    modified_edges[]

    state_changes[]

    temporal_changes[]

    causal_changes[]

    provenance_changes[]
}


───

55. REALITY GRAPH EVENT BOUNDARY
Block 04 needs to represent change.
But Block 05 owns the Event Fabric.
Therefore:
text
