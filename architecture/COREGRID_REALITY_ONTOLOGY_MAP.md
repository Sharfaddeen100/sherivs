# CoreGrid Reality Ontology Map

Mission: `COREGRID-MISSION-0001`  
Status: `OBSERVED / PARTIAL / UNVERIFIED`  
Authority: `REALITY.md`, Phase 33, kernel contracts, and database substrate

This map records the current semantic chain without treating persistence,
models, or worker output as reality authority.

## Canonical semantic chain

```text
REALITY
  ↓
OBSERVATION
  ↓
EVIDENCE
  ↓
REPRESENTATION
  ↓
KNOWLEDGE
  ↓
MEMORY
  ↓
REASONING
  ↓
DECISION
  ↓
AUTHORIZED ACTION
  ↓
OUTCOME
  ↓
VERIFICATION
  ↓
CONFORMANCE
```

The following distinctions are mandatory:

- `UNKNOWN` is not `FALSE`.
- Observation is not complete reality.
- Evidence is not truth, state, verification, or authority.
- Prediction and simulation are not observation.
- Model output and worker claims are not authority.
- Memory is contextual evidence, not canonical truth.

## Current ontology coverage

| Concept | Current representation | Status | Evidence boundary |
| --- | --- | --- | --- |
| Entity | `cg_entity`, `kernel/reality.ts` | implemented substrate / runtime partial | Phase 33 contract and migration |
| Identity | `cg_identity`, identity registry | implemented with acceptance evidence | Phase 02 |
| Tenant | `cg_tenant`, RLS and tenant modules | implemented substrate / hierarchy remains open | Phase 03 |
| Relationship | `cg_relationship`, typed relationship contract | implemented substrate / graph ownership open | Phase 33, D2 |
| State | domain tables, twin state, runtime state | split and partial | Phase 05/16 plus legacy school state |
| Event | `cg_event`, outbox, runtime events | partial with local idempotency | Phase 05 |
| Observation | `cg_observation`, `ObservationKind` | implemented substrate / broad write path partial | Phase 33 |
| Evidence | proofs, acceptance, archaeology, domain evidence | file-plane and domain fragments | Assurance/evidence ownership unresolved |
| Provenance | fields and audit notes | partial; no universal lifecycle/revocation plane | kernel and audit artifacts |
| Knowledge | domain reports and phase designs | fragmented / unowned across D1/D2 | Phases 14, 26, 34, 36, 48 |
| Memory | agent/domain memory modules and designs | fragmented / D1 open | Phases 07, 26, 36 |
| Time | validity intervals, timestamps, event history | partial | kernel and mission specifications |
| Space | hardware/geospatial designs | design only | Phases 15, 33, 44; no operational proof |
| Causality | blueprint and simulation proposals | design only | Phases 37, 41; D5 open |
| Uncertainty | observation confidence and unknown states | partial | kernel contracts and reality documents |
| Simulation | Scholar simulation fixtures and design corpus | simulation/test-only or design-only | not production reality |
| Intervention | action/command designs | partial and authorization-gated | Phase 05/08/17 |
| Outcome | local execution/domain results | fragmented | no unified durable execution record |
| Verification | tests, scripts, proofs, CI | tooling implemented | Assurance/control-plane verification |
| Conformance | purity/neutrality/contract/security guards | partial | no unified assessed conformance plane |

## Runtime boundary

Scholar (`runtime-001`) owns education reality and consumes universal
identity, tenancy, reality, runtime, workforce, security, and intelligence
capabilities. Student, teacher, parent, school, classroom, curriculum,
assessment, attendance, and grading semantics remain Scholar-specific unless
future evidence establishes universal ownership.

## Gaps that remain explicit

1. Spatial, causal, counterfactual, and broad epistemic persistence are not
   operationally established.
2. Evidence identity, revocation, supersession, and retention are not a
   universal durable lifecycle.
3. Mission, execution, and outcome records are not connected by one durable
   product contract.
4. Current state and historical event semantics remain distributed across
   universal and legacy schema eras.
5. D1 memory, D2 knowledge graph, D3 evolution, D4 twin, D5 simulation, and
   D7 security/trust ownership remain unresolved.

No gap in this map authorizes a new phase, store, service, or infrastructure
system. Each requires ownership, security, evidence, and verification gates.
