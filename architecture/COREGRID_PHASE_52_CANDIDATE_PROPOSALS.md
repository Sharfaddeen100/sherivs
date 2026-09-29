# Phase 52 Candidate Capability Proposals

Mission: COREGRID-MISSION-0001  
Status: PROPOSALS ONLY / NOT REGISTERED / NOT IMPLEMENTED  
Date: 2026-09-27

## Gate

The following proposals are not new phases. They are candidate ownership
boundaries extracted from the Phase 52 corpus after reconciliation with the
existing registry and duplication map. No candidate may be added to
`architecture/registry.json` until its contract, security, failure, evidence,
verification, and conformance gates are approved.

## Candidate A — Physical Reality Identity and Spatial Intelligence

### Purpose

Represent physical entities, device identity, location, movement, environment,
and telemetry as governed extensions over the universal reality substrate.

### Existing ownership

- Phase 33 owns universal entity, relationship, event, and observation
  primitives.
- Phase 15 owns hardware and device telemetry.
- Phase 16 owns digital twin capability.
- Phase 30 and Phase 44 contain globalization/infrastructure concerns.

### Why a boundary may be necessary

The corpus combines physical identity, spatial topology, geofencing,
environmental observation, movement, and telemetry. Current ownership is
distributed and no single contract establishes the physical identity and
spatial boundary.

### Required proof before phase creation

- unique capability not covered by Phase 15/16/33;
- device enrollment, replacement, revocation, key rotation, spoofing, and
  tenant-scope contract;
- temporal and spatial model with stale/offline source handling;
- read/control separation and human approval for actuation;
- failure, replay, calibration, privacy, retention, and recovery model;
- schema, runtime adapter, tests, evidence, conformance, and operational
  telemetry plan.

### Current decision

`BLOCKED` pending Phase 15/16/33 ownership decision. No hardware or
geospatial infrastructure is authorized.

## Candidate B — Universal Evidence and Provenance Lifecycle

### Purpose

Represent evidence identity, source, provenance, confidence, classification,
freshness, supersession, revocation, and links to observations, decisions,
actions, and outcomes.

### Existing ownership

- Phase 09 owns trust-fabric concepts.
- Phase 14 owns data governance concepts.
- Phase 26 owns AI context/governance concepts.
- Phase 33 owns observation provenance fields.
- `architecture/proofs`, acceptance records, and archaeology provide file-based
  engineering evidence.

### Why a boundary may be necessary

The corpus describes epistemic distinctions and evidence memory, while current
implementation is split between domain evidence, kernel observations, and
engineering proof files. No single universal evidence lifecycle is verified.

### Required proof before phase creation

- evidence/artifact identity and immutable lineage;
- source, actor, tenant, purpose, classification, and minimization;
- freshness, staleness, supersession, revocation, and dispute states;
- policy-controlled access and model-context redaction;
- links from evidence to observation, claim, decision, action, outcome, and
  verification;
- persistence, RLS, audit, failure recovery, and independent verification.

### Current decision

`BLOCKED` pending Assurance/Trust/Data ownership decision. Do not create a new
evidence database or evidence service yet.

## Candidate C — Temporal, Causal, and Counterfactual Intelligence

### Purpose

Represent time-bounded states, causal relations, interventions, hypotheses,
scenarios, simulations, and counterfactual outcomes without overwriting
canonical reality.

### Existing ownership

- Phase 33 owns temporal validity and reality primitives.
- Phase 16 owns twin state.
- Phase 37 owns simulation.
- Phase 41 owns sandbox execution.
- Phase 46 owns twin civilization federation.

### Why a boundary may be necessary

The corpus describes a broad temporal/causal/simulation stack spanning several
phases, but the current ownership seams remain D4/D5 conflicts.

### Required proof before phase creation

- explicit distinction between observed, inferred, predicted, simulated, and
  counterfactual values;
- causal graph and intervention contracts;
- simulation isolation from canonical state;
- reproducible scenario inputs, model versions, assumptions, uncertainty, and
  outcome comparison;
- authorization, resource limits, sandboxing, rollback, evidence, and
  conformance.

### Current decision

`BLOCKED` pending D4/D5 resolution. Do not create a causal graph store or
simulation infrastructure.

## Candidate decision summary

| Candidate | Status | New phase authorized? |
| --- | --- | --- |
| Physical identity/spatial intelligence | BLOCKED | No |
| Evidence/provenance lifecycle | BLOCKED | No |
| Temporal/causal/counterfactual intelligence | BLOCKED | No |

The correct next action is to resolve ownership and produce contracts, not to
construct all three as new phases.
