/**
 * Phase 37 — Simulation & Future Intelligence Engine contract (seeded authoring).
 *
 * Simulation and foresight: model scenarios, run futures, compare outcomes and
 * feed decision support — always as derived intelligence with no write path to
 * canonical truth.
 *
 * DUPLICATION GOVERNANCE: D5 (simulation-sandbox, owner 37, ADR PLATFORM-006)
 * means this phase owns simulation and phase 41 owns sandbox execution.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_37_SIMULATION_ENGINE = definePhaseContractFromSeed({
  id: "37",
  name: "Simulation & Future Intelligence Engine",
  phaseDoc: "architecture/phase-37-simulation-future-intelligence-engine.md",
  layer: "Universal",
  stage: "S11",
  status: "architecture",
  owner: "37",
  capability: "simulation-engine",
  consumes: [
    "universal-reality-ontology",
    "cognitive-architecture",
    "live-digital-twin",
    "analytics-decision-intelligence",
  ],
  purpose:
    "Own scenario simulation and foresight: declare scenarios over twin and substrate state, run futures forward, compare outcomes and publish probabilistic insight with explicit assumptions.",
  ownership:
    "Single owner of scenario definitions, simulation runs, outcome comparisons and foresight contracts.",
  boundaryStatement:
    "Simulation owns hypotheticals, never reality: a simulated outcome may never be written to a canonical record, presented as a measurement, or acted upon without policy and approval.",
  excludes: [
    "canonical-record-ownership (kernel and owning phases)",
    "sandbox-execution (phase 41)",
    "twin-state-ownership (phase 16)",
    "decision-execution (phase 17)",
  ],
  principle:
    "Every simulated number is labelled, bounded and reproducible: assumptions, inputs and confidence travel with the result, and a simulation without declared bounds is invalid.",
  dependsOn: ["01", "05", "16", "33", "34"],
  consumers: ["41"],
  provides: [
    { id: "simulation:define-scenario", kind: "command", description: "declare a scenario" },
    { id: "simulation:run", kind: "api", description: "run a bounded simulation" },
    { id: "simulation:compare", kind: "query", description: "compare outcomes" },
  ],
  consumesContracts: [
    { id: "twin:read-state", kind: "query" },
    { id: "cognition:explain", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["scenario definitions", "simulation run records"],
    derived: ["simulated outcomes", "probability estimates", "recommendations"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "scenario-reality-writeback",
    "long-horizon-run-activation",
    "assumption-set-change",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "commerce", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "logistics", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    risk: "D5 (simulation-sandbox, OPEN, owner 37, ADR PLATFORM-006) requires simulation (37) and sandbox execution (41) to share one vocabulary and resolved ownership; the standing risk is simulated output being read as observed fact, mitigated by mandatory derived-labelling and the no-writeback rule.",
    aiSafety:
      "Foresight is untrusted by default: results are proposals with assumptions and confidence, they never enter canonical records, and any action they inform passes through policy, approval and an audit trail.",
  },
});
