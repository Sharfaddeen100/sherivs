/**
 * Phase 17 — Automation Engine contract (seeded authoring).
 *
 * Workflow orchestration above the runtime transport: triggers, conditions,
 * actions and governance, so events across Sherivs produce governed work.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_17_AUTOMATION_ENGINE = definePhaseContractFromSeed({
  id: "17",
  name: "Automation Engine",
  phaseDoc: "architecture/phase-17-automation-engine.md",
  layer: "Runtime",
  stage: "S5",
  status: "implemented",
  owner: "17",
  capability: "automation-workflow-runtime",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "runtime-primitives",
    "security-enforcement",
    "live-digital-twin",
  ],
  purpose:
    "Own workflow orchestration: declare triggers over the event fabric, evaluate conditions, execute governed actions and keep an auditable run history.",
  ownership:
    "Single owner of workflow definitions, trigger bindings, run history, action governance and escalation policy.",
  boundaryStatement:
    "Automation owns orchestration, never domain rules: actions call owning-phase contracts, and no workflow may perform an action its author is not authorized to perform.",
  excludes: [
    "transport-delivery (phase 05)",
    "domain-business-rules (owning phases)",
    "autonomous-engineering-self-improvement (phase 47)",
  ],
  principle:
    "Every workflow run is attributable: it records trigger, actor or agent, inputs, actions taken and outcome, and it can be paused or revoked at any time.",
  dependsOn: ["01", "02", "03", "05", "08", "16"],
  substrates: ["workflow definitions", "trigger bindings", "run history", "escalation policy"],
  tests: [
    "tests/unit/automation-core.test.ts",
    "tests/unit/automation-actions.test.ts",
    "tests/unit/automation-workflow.test.ts",
    "tests/unit/automation-governance.test.ts",
  ],
  provides: [
    { id: "automation:define-workflow", kind: "command", description: "declare a workflow" },
    { id: "automation:run", kind: "command", description: "execute a governed run" },
    { id: "automation:run-history", kind: "query", description: "read run history" },
  ],
  consumesContracts: [
    { id: "runtime:record-event", kind: "event" },
    { id: "twin:read-state", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["workflow definitions", "run history"],
    derived: ["optimisation suggestions", "predicted bottlenecks"],
  },
  requiresApprovalFor: [
    "workflow-activation",
    "privileged-action-binding",
    "cross-tenant-workflow",
    "escalation-policy-change",
  ],
  sections: {
    aiSafety:
      "An agent may propose or edit a workflow within its grant, but activation and any privileged action binding require human approval, and every run is attributable to an actor or agent identity.",
  },
});
