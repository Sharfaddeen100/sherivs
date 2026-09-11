/**
 * Phase 45 — AI Compute Civilization Engine (seeded authoring).
 *
 * Compute for intelligence: model hosting, serving, optimisation and compute
 * governance — capacity and scheduling only, never a second path to models.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_45_AI_COMPUTE = definePhaseContractFromSeed({
  id: "45",
  name: "AI Compute Civilization Engine",
  phaseDoc: "architecture/phase-45-ai-compute-civilization-engine.md",
  layer: "Civilization",
  stage: "S11",
  status: "architecture",
  owner: "45",
  capability: "ai-compute",
  consumes: ["ai-intelligence-gateway", "data-platform", "enterprise-scale", "runtime-primitives"],
  purpose:
    "Own intelligence compute: register and schedule compute for models, optimise serving efficiency and govern compute allocation under tenant, residency and cost policy.",
  ownership:
    "Single owner of compute registration, serving capacity, scheduling and optimisation records, and compute governance rules.",
  boundaryStatement:
    "Compute owns capacity and scheduling, never model access: every model call still goes through the phase 26 gateway, and compute allocation never becomes an authorization shortcut.",
  excludes: [
    "model-access (phase 26 gateway)",
    "cognitive-architecture (phase 34)",
    "planetary-topology (phase 44)",
  ],
  principle:
    "Compute is metered and governed: every workload declares its tenant, purpose, budget and residency, and unmetered or undeclared compute is refused.",
  dependsOn: ["01", "05", "14", "26", "31"],
  consumers: ["26"],
  substrates: ["compute registration records", "serving capacity", "scheduling records"],
  provides: [
    { id: "aicompute:allocate", kind: "command", description: "allocate governed compute" },
    { id: "aicompute:capacity-status", kind: "query", description: "read serving capacity" },
    { id: "aicompute:optimise", kind: "api", description: "apply a serving optimisation" },
  ],
  consumesContracts: [
    { id: "ai:cost-report", kind: "query" },
    { id: "enterprise:capacity-status", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["compute registrations", "scheduling records", "cost and metering records"],
    derived: ["utilisation forecasts", "optimisation recommendations"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "compute-allocation-change",
    "residency-exception",
    "serving-model-replacement",
    "budget-override",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "commerce", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "energy", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    security:
      "Compute is isolated per workload and tenant with no shared model state; provider keys stay in the gateway boundary, and allocation changes are audited.",
    aiSafety:
      "More compute never means more autonomy: training and serving budgets are policy-limited, and a model produced here is still reachable only through the gateway's privacy pipeline and safety controls.",
  },
});
