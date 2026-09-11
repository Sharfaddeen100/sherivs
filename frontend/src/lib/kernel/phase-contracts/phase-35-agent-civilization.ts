/**
 * Phase 35 — Autonomous Agent Civilization OS contract (seeded authoring).
 *
 * Societies of agents: how many agents coordinate, negotiate and are governed at
 * scale — always inside the grants phase 07 issues and the policy phase 08
 * enforces.
 *
 * DUPLICATION GOVERNANCE: D6 (agents, CLOSED, owner 07) means this phase
 * governs agent SOCIETIES and never becomes a second agent runtime.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_35_AGENT_CIVILIZATION = definePhaseContractFromSeed({
  id: "35",
  name: "Autonomous Agent Civilization OS",
  phaseDoc: "architecture/phase-35-autonomous-agent-civilization-os.md",
  layer: "Universal",
  stage: "S8",
  status: "architecture",
  owner: "35",
  capability: "multi-agent-society-governance",
  consumes: [
    "agent-runtime",
    "cognitive-architecture",
    "memory-knowledge-civilization",
    "ai-intelligence-gateway",
  ],
  purpose:
    "Own coordination between agents: societies, roles, negotiation and collective decision rules, so many agents can work together under the same governance that constrains a single agent.",
  ownership:
    "Single owner of agent-society structure, inter-agent coordination protocols, collective decision rules and society-level audit.",
  boundaryStatement:
    "The civilization OS governs cooperation, never permission: it cannot create an agent, widen a grant or bypass phase 08, and a society rule never overrides a kernel or tenant rule.",
  excludes: [
    "agent-identity-and-grants (phase 07)",
    "authorization-decisions (phase 08)",
    "model-provider-access (phase 26)",
    "self-improvement-engine (phase 47)",
  ],
  principle:
    "Collective autonomy is still governed autonomy: every society action is attributable to the individual agents and grants that produced it, and it can be suspended as a unit or per agent.",
  dependsOn: ["01", "02", "03", "05", "07", "34", "36"],
  consumers: ["07"],
  provides: [
    { id: "society:form", kind: "command", description: "form an agent society" },
    { id: "society:coordinate", kind: "api", description: "run governed coordination" },
    { id: "society:audit", kind: "query", description: "read the society audit trail" },
  ],
  consumesContracts: [
    { id: "agent:run-task", kind: "command" },
    { id: "cognition:reason", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["society definitions", "society audit trail"],
    derived: ["negotiation outcomes", "collective plans", "emergent role suggestions"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "society-formation",
    "collective-action-execution",
    "society-rule-change",
    "agent-count-expansion",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "logistics", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "energy", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    aiSafety:
      "No society may aggregate itself into authority: permissions remain the intersection of its members' grants, collective output is untrusted until validated, and a society can be suspended without touching individual agents.",
    risk: "D6 (agents, CLOSED, owner 07) requires this phase to consume the agent runtime rather than duplicate it; the standing risk is emergent coordination exceeding declared bounds, mitigated by explicit society formation approval and the intersection-of-grants rule.",
    observability:
      "Society-level actions decompose into per-agent audit entries, so coordination can be explained and attributed rather than reported as an anonymous collective action.",
  },
});
