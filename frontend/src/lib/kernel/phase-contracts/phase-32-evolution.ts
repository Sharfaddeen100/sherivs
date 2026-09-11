/**
 * Phase 32 — Future Evolution contract (seeded authoring).
 *
 * Managed change over time: experiments, migrations, intelligence and lifecycle
 * governance so the platform can evolve without breaking the invariants it
 * promises.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_32_FUTURE_EVOLUTION = definePhaseContractFromSeed({
  id: "32",
  name: "Future Evolution",
  phaseDoc: "architecture/phase-32-future-evolution.md",
  layer: "Intelligence",
  stage: "S9",
  status: "implementing",
  owner: "32",
  capability: "evolution-lifecycle",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "runtime-primitives",
    "data-platform",
    "enterprise-scale",
  ],
  purpose:
    "Own controlled evolution: run bounded experiments, plan and execute migrations, derive evolution intelligence and govern capability lifecycle from proposal to retirement.",
  ownership:
    "Single owner of experiment records, migration plans, lifecycle stage definitions and evolution governance rules.",
  boundaryStatement:
    "Evolution owns how the platform changes, never what it is allowed to become: it cannot alter architecture, permissions or governance rules, and every change is reversible or explicitly ratified.",
  excludes: [
    "architecture-authority (governance documents)",
    "autonomous-engineering-self-improvement (phase 47)",
    "catalog-module-naming-duplication (ADR path)",
  ],
  principle:
    "Change is governed: an experiment has bounds and a kill switch, a migration has a rollback plan, and no evolution step may silently widen access or rewrite canonical truth.",
  dependsOn: ["01", "05", "14", "31"],
  consumers: ["47"],
  substrates: ["experiment records", "migration plans", "lifecycle stage records"],
  tests: ["tests/unit/evolution.test.ts"],
  provides: [
    { id: "evolution:experiment-lifecycle", kind: "api", description: "run a bounded experiment" },
    { id: "evolution:plan-migration", kind: "command", description: "plan a reversible migration" },
    { id: "evolution:lifecycle-status", kind: "query", description: "read capability lifecycle" },
  ],
  consumesContracts: [
    { id: "enterprise:objective-status", kind: "query" },
    { id: "data:lineage", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["experiment records", "migration plans", "lifecycle stages"],
    derived: ["evolution recommendations", "adoption forecasts"],
  },
  asiTier: "governed-autonomous",
  autonomyLevel: 2,
  selfImprovement: "governed",
  requiresApprovalFor: [
    "experiment-activation",
    "migration-execution",
    "lifecycle-stage-transition",
    "rollback-decision",
  ],
  sections: {
    aiSafety:
      "Self-improvement is never permission expansion: proposals affecting security, identity, data access or production behaviour require review and validation, and autonomous changes stay inside declared bounds with a kill switch.",
    security:
      "An evolution step may never remove a security boundary, relax authorization or change production policy on its own; such changes are proposals that humans ratify through governance.",
  },
});
