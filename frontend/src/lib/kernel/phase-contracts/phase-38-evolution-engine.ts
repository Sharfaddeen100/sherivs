/**
 * Phase 38 — Evolution Engine contract (seeded authoring).
 *
 * Managed evolution of the platform itself: experiments, migrations and
 * lifecycle transitions, composed over the evolution capability that phase 32
 * owns.
 *
 * REGISTRY TRUTH: the capability registry assigns `evolution-lifecycle` to phase
 * 32, so phase 38 owns no capability and declares that explicitly rather than
 * claiming one.
 * DUPLICATION GOVERNANCE: D3 (evolution, owner 32, ADR PLATFORM-004) and D14
 * (catalog-module-naming, 32/38, CLOSED, ADR PLATFORM-004).
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_38_EVOLUTION_ENGINE = definePhaseContractFromSeed({
  id: "38",
  name: "Evolution Engine",
  phaseDoc: "architecture/phase-38-evolution-engine.md",
  layer: "Universal",
  stage: "S9",
  status: "architecture",
  owner: "38",
  ownershipNote:
    "it composes the evolution-lifecycle capability owned by phase 32 and the governance-alignment capability owned by phase 39, adding no competing capability of its own",
  consumes: ["evolution-lifecycle", "governance-alignment", "universal-reality-ontology"],
  purpose:
    "Own managed transformation at platform scale: run bounded evolution programs, stage migrations across the substrate, verify invariants after each step and retire superseded capability deliberately.",
  ownership:
    "Single owner of evolution programs, staged migration execution and post-change invariant verification; it owns no capability in the kernel registry of its own.",
  boundaryStatement:
    "The evolution engine changes how the platform is built, never what it is allowed to become: it cannot alter architecture, permissions or governance rules, and it has no authority to approve its own proposals.",
  excludes: [
    "capability-ownership (phase 32 owns evolution-lifecycle)",
    "governance-authority (phase 39 and the governance documents)",
    "self-improvement-ratification (phase 47)",
    "lifecycle-experiments (phase 32)",
  ],
  principle:
    "Evolution is staged and reversible: every transformation has a rollback path, invariant checks run after each step, and no step may silently widen access or rewrite canonical truth.",
  dependsOn: ["01", "05", "14", "32", "37"],
  consumers: ["47"],
  provides: [
    { id: "evolution38:program", kind: "command", description: "define an evolution program" },
    { id: "evolution38:stage-migration", kind: "api", description: "stage a substrate migration" },
    {
      id: "evolution38:verify-invariants",
      kind: "query",
      description: "verify invariants post-change",
    },
  ],
  consumesContracts: [
    { id: "evolution:plan-migration", kind: "command" },
    { id: "simulation:run", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["evolution program records", "migration staging records"],
    derived: ["transformation impact estimates", "rollback recommendations"],
  },
  asiTier: "governed-autonomous",
  autonomyLevel: 2,
  selfImprovement: "governed",
  requiresApprovalFor: [
    "program-activation",
    "migration-execution",
    "invariant-exception",
    "rollback-execution",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "logistics", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    risk: "D3 (evolution cluster, OPEN, owner 32, ADR PLATFORM-004) and D14 (catalog-module-naming, CLOSED, ADR PLATFORM-004) bound this phase: it composes phase 32's capability and must not create a second evolution module family. The standing risk is an evolution step quietly becoming a governance change, mitigated by human approval gates and invariant verification.",
    aiSafety:
      "Self-improvement here is governed, never permission-expanding: proposals that touch security, identity, data access or production behaviour require review and validation, and the engine can only stage changes — it cannot ratify them.",
  },
});
