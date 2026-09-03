# COREGRID — DEPENDENCY GRAPH

Status: PLAN ARTIFACT (living document)
Authority: DEPENDENCY.md; REGISTRY.md §21–23; PROGRESS.md §9
Version: 2026-09-02
Purpose: The structural dependency graph of the 51 phases with typed edge semantics, cycle control, and the implementation order derived from it. Machine-auditable twin: `architecture/registry.json`.

---

## 1. Typed dependency semantics (§73)

Edges are typed, never generic: STRUCTURAL_DEPENDS_ON · RUNTIME_CALLS · PUBLISHES_EVENT_TO · SUBSCRIBES_TO · READS_DATA_FROM · WRITES_DATA_TO · POLICY_CONSUMES · DEPLOYED_ON · OPTIONAL_SIGNAL_FROM · COMPOSES.

Rules: structural edges must be acyclic (§74). Runtime interaction never implies structural ownership (§12 law / §73). Bidirectional runtime flows use events, contracts, projections, adapters — never structural cycles.

## 2. Layer topology

```
LAYER 01 Foundation & Reality Substrate:   P01 -> P02 -> P03 -> P08 -> P09
LAYER 02 Reality Representation:           P33 -> (P04 Scholar manifest, P16, P48)
LAYER 03 Intelligence Civilization:        P26 -> P34 -> P35 ; P36 ; P37 ; P38 ; P39
LAYER 04 Creation & Execution:              P05 -> P06 -> P19 ; P17 ; P40 -> P51
LAYER 05 Compute & Infrastructure:          P15 ; P21 -> P44 ; P45 ; P22/P23 clients
LAYER 06 Governance, Security & Alignment:  P08/P09 -> P42 -> P39 -> P51
LAYER 07 Civilization Interface & Economy:  P27/P28/P29 -> P43 ; P49 ; P50
```

## 3. Structural execution order (topological stages)

S1:  P01 → P02 → P03 → P08
S2:  P33 → P04
S3:  P05 → P06 → P19
S4:  P09 → P42
S5:  P14 ; P05-events → P48
S6:  P04 → {P11, P12, P13, P25} → {P10, P15, P16, P17, P18} → P20/P21 → P22/P23 ; P30/P31
S7:  P27 → P28 ; P29 → P43
S8:  P26 → P34 → P35 ; P36 (consumers: P07, P34, P35)
S9:  P32/P38 → P47 → P39
S10: P40 → P51
S11: P37 → P41 ; P44 ; P45 ; P46 → P16 ; P49 → P13/P27
S12: P50 → P06/P24 ; platform audits

## 4. Key dependency facts

1. P01–P03 are prerequisites of every phase.
2. P08 is a prerequisite of any phase exposing live server surfaces; enforcement precedes wiring.
3. P33 universal ontology precedes domain ontologies (P04, P16, P48) in the kernel; P04 is reframed as a P33 consumer manifest (backward refinement, not rewrite).
4. P05 owns transport (events/outbox/jobs/commands); P17 owns workflow orchestration above it; P14 owns data quality/governance.
5. P26 is the only sanctioned path to external model providers; P07/P11/P18/P34/P35 call the gateway.
6. P13 is the only money/ledger owner; P49 and P27 operate on its rails.
7. Before any phase in S8–S11 is implemented, its edges to implemented domain layers (P07–P32) are re-verified and its duplication rows (D1–D7) resolved by ADR.

## 5. Cycle control and forbidden edges

Forbidden (§83–§93 DEPENDENCY.md): database coupling by clients · client-owned backend state · agent framework authority · AI authority over actions · security bypass · hidden providers · circular ownership.
Necessary bidirectional runtime flows (e.g., twin ↔ automation, agent ↔ memory) are expressed as events/projections/adapters so the structural graph stays acyclic.
