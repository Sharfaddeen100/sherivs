/**
 * Phase 18 — Analytics Intelligence contract (seeded authoring).
 *
 * Measurement and decision intelligence: models, metrics, decisions and
 * governance computed from governed data and twin state.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_18_ANALYTICS_INTELLIGENCE = definePhaseContractFromSeed({
  id: "18",
  name: "Analytics Intelligence",
  phaseDoc: "architecture/phase-18-analytics-intelligence.md",
  layer: "Intelligence",
  stage: "S5",
  status: "implemented",
  owner: "18",
  capability: "analytics-decision-intelligence",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "tenancy-isolation-rls",
    "data-platform",
    "live-digital-twin",
    "academic-intelligence",
  ],
  purpose:
    "Own measurement and decision support: define models and metrics over governed data, evaluate them, and expose decision intelligence with provenance and governance.",
  ownership:
    "Single owner of analytical models, metric definitions, decision records and analytics governance rules.",
  boundaryStatement:
    "Analytics owns measurement and derived decisions, never canonical records and never autonomous execution: insight informs, policy and approval act.",
  excludes: [
    "canonical-record-ownership (owning phases)",
    "workflow-execution (phase 17)",
    "cognitive-architecture (phase 34)",
  ],
  principle:
    "No fabricated metric: every analytical value is computed from a named dataset with a recorded definition, and derived output is labelled as derived.",
  dependsOn: ["01", "02", "03", "05", "14", "16"],
  consumers: ["19", "34"],
  substrates: ["model definitions", "metric definitions", "decision records"],
  tests: [
    "tests/unit/analytics-core.test.ts",
    "tests/unit/analytics-models.test.ts",
    "tests/unit/analytics-decisions.test.ts",
    "tests/unit/analytics-governance.test.ts",
  ],
  provides: [
    { id: "analytics:evaluate", kind: "query", description: "evaluate a model or metric" },
    { id: "analytics:record-decision", kind: "command", description: "record a decision" },
    { id: "analytics:lineage", kind: "query", description: "resolve metric lineage" },
  ],
  consumesContracts: [
    { id: "data:lineage", kind: "query" },
    { id: "twin:read-state", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["metric definitions", "decision records"],
    derived: ["model outputs", "forecasts", "recommendations"],
  },
  requiresApprovalFor: ["metric-definition-change", "model-activation", "cross-tenant-aggregation"],
  sections: {
    aiSafety:
      "Model output is untrusted by default: it carries inputs, method and confidence, is never presented as canonical fact, and any action it informs passes through policy and approval.",
  },
});
