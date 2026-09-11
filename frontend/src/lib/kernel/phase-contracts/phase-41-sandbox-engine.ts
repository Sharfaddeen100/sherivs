/**
 * Phase 41 — Reality Simulation & Autonomous Sandbox Engine (seeded authoring).
 *
 * Sandbox execution: run whole realities in isolation, let agents act there and
 * compare outcomes before anything touches production.
 *
 * DUPLICATION GOVERNANCE: D5 (simulation-sandbox, OPEN, owner 37, ADR
 * PLATFORM-006) — phase 37 owns simulation vocabulary, this phase owns isolated
 * execution.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_41_SANDBOX_ENGINE = definePhaseContractFromSeed({
  id: "41",
  name: "Reality Simulation & Autonomous Sandbox Engine",
  phaseDoc: "architecture/phase-41-reality-simulation-autonomous-sandbox-civilization-engine.md",
  layer: "Civilization",
  stage: "S11",
  status: "architecture",
  owner: "41",
  capability: "sandbox-runtime",
  consumes: [
    "simulation-engine",
    "universal-reality-ontology",
    "cognitive-architecture",
    "live-digital-twin",
  ],
  purpose:
    "Own isolated execution of simulated realities: provision a sandbox that mirrors permitted canonical state, let agents and workflows act inside it, and compare outcomes before any production change is proposed.",
  ownership:
    "Single owner of sandbox provisioning and isolation, sandbox execution runs, sandbox agent and workflow grants, and promotion proposals.",
  boundaryStatement:
    "A sandbox is a copy, never an authority: sandbox actions can never write to canonical records, cannot inherit production credentials, and promotion out of a sandbox is a proposal requiring approval.",
  excludes: [
    "scenario-definition (phase 37)",
    "canonical-record-ownership (kernel and owning phases)",
    "production-execution (owning phases)",
    "planetary-infrastructure (phase 44)",
  ],
  principle:
    "Isolation is absolute: sandbox state is derived from permitted canonical state at provisioning time, and nothing created inside a sandbox becomes real without an explicit, audited promotion.",
  dependsOn: ["01", "05", "16", "33", "34", "37"],
  consumers: ["37", "47"],
  provides: [
    { id: "sandbox:provision", kind: "command", description: "provision an isolated sandbox" },
    { id: "sandbox:execute", kind: "api", description: "run actions inside a sandbox" },
    { id: "sandbox:promote", kind: "command", description: "propose promotion to production" },
  ],
  consumesContracts: [
    { id: "simulation:run", kind: "api" },
    { id: "security:authorize", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["sandbox provisioning records", "sandbox run records"],
    derived: ["sandbox outcomes", "promotion proposals"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "sandbox-provisioning",
    "promotion-to-production",
    "grant-to-sandbox-agent",
    "canonical-mirror-expansion",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "commerce", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "logistics", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    security:
      "Sandboxes run with scoped, non-production credentials; canonical mirroring is minimized and redacted per policy; escape attempts fail closed and are recorded.",
    risk: "D5 (simulation-sandbox, OPEN, owner 37, ADR PLATFORM-006) requires shared vocabulary with phase 37; the standing risk is sandbox output being promoted without review, mitigated by the proposal-only promotion path and mandatory approval.",
    aiSafety:
      "Agents may act freely INSIDE a sandbox within their grants, but sandbox results are untrusted: promotion to production is a proposal that passes validation, policy and human approval before execution.",
  },
});
