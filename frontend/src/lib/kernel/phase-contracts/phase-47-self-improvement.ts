/**
 * Phase 47 — Autonomous Engineering Self-Improvement (seeded authoring).
 *
 * The engineering loop that improves the platform: detect defects and drift,
 * propose changes, verify them and stage them — while never ratifying its own
 * changes or widening its own permissions (AGENTS §8).
 *
 * DUPLICATION GOVERNANCE: D3 (evolution, OPEN, owner 32, ADR PLATFORM-004), D6
 * (agents, CLOSED, owner 07), D11 (workflow-automation, CLOSED, owner 17).
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_47_SELF_IMPROVEMENT = definePhaseContractFromSeed({
  id: "47",
  name: "Autonomous Engineering Self-Improvement Engine",
  phaseDoc: "architecture/phase-47-autonomous-engineering-self-improvement-engine.md",
  layer: "Civilization",
  stage: "S9",
  status: "architecture",
  owner: "47",
  capability: "autonomous-engineering-self-improvement",
  consumes: [
    "agent-runtime",
    "developer-platform",
    "governance-alignment",
    "evolution-lifecycle",
    "data-platform",
  ],
  purpose:
    "Own the self-improvement loop: detect defects, drift and opportunities from real evidence, generate proposals and tests, verify them against the verification chain, and stage changes for human ratification.",
  ownership:
    "Single owner of improvement proposals, automated verification runs, remediation staging and the self-improvement audit trail.",
  boundaryStatement:
    "The engine proposes and stages; it never ratifies, deploys or expands its own permissions. Self-improvement is not permission expansion — a change touching security, identity, data access or production behaviour needs review and validation.",
  excludes: [
    "architecture-authority (governance documents)",
    "deployment-authority (human release path)",
    "capability-ownership (phase 32 owns evolution-lifecycle)",
    "enforcement-change (phases 08/09/42)",
  ],
  principle:
    "Every improvement is evidenced and reversible: a proposal names the defect, the evidence, the change and the rollback, and an agent may never approve its own work.",
  dependsOn: ["01", "02", "05", "07", "14", "28", "32", "38", "39"],
  consumers: ["32", "38", "39"],
  substrates: ["improvement proposals", "verification runs", "staging records", "audit trail"],
  provides: [
    { id: "selfimprove:propose", kind: "command", description: "raise an improvement proposal" },
    { id: "selfimprove:verify", kind: "api", description: "run the verification chain" },
    { id: "selfimprove:stage", kind: "command", description: "stage a verified change" },
  ],
  consumesContracts: [
    { id: "developer:pipeline-status", kind: "query" },
    { id: "alignment:evaluate", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["improvement proposals", "verification run records", "staging records"],
    derived: ["defect hypotheses", "impact estimates", "remediation options"],
  },
  asiTier: "governed-autonomous",
  autonomyLevel: 2,
  selfImprovement: "governed",
  requiresApprovalFor: [
    "proposal-ratification",
    "deployment",
    "permission-change",
    "verification-gate-modification",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "commerce", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "energy", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "transport", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    aiSafety:
      "The engine is the strictest test of the AI sovereignty boundary: agents may inspect, propose, generate code and tests, and verify — they may not ratify, deploy, disable security, expose secrets or change governance, and every staged change passes the same verification chain a human change would.",
    risk: "D3 (evolution, OPEN, ADR PLATFORM-004) keeps evolution ownership with phase 32; D6 (agents, CLOSED) and D11 (workflow-automation, CLOSED) mean the engine consumes the agent runtime and automation rather than duplicating them. Standing risk: automation of the loop turning into self-authorization, mitigated by separation of proposal and ratification.",
    observability:
      "Every proposal records the detecting evidence, the agent identity, the verification results and the human decision, so the improvement history is fully explainable after the fact.",
  },
});
