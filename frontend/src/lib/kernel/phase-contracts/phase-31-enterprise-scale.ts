/**
 * Phase 31 — Enterprise Scale contract (seeded authoring).
 *
 * Capacity, reliability and operations at scale: how the platform stays correct
 * and observable as tenants, data and traffic grow.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_31_ENTERPRISE_SCALE = definePhaseContractFromSeed({
  id: "31",
  name: "Enterprise Scale",
  phaseDoc: "architecture/phase-31-enterprise-scale.md",
  layer: "Global",
  stage: "S6",
  status: "implementing",
  owner: "31",
  capability: "enterprise-scale",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "tenancy-isolation-rls",
    "data-platform",
    "cloud-fabric-byoc",
  ],
  purpose:
    "Own scale: model capacity and headroom, define reliability objectives, run operations procedures and provide the evidence that the platform behaves under load.",
  ownership:
    "Single owner of capacity models, reliability objectives and error budgets, operations runbooks and scale-readiness evidence.",
  boundaryStatement:
    "Enterprise scale owns non-functional guarantees, never domain behaviour: it may not change what a capability does to make it faster, and it never trades isolation for throughput.",
  excludes: [
    "domain-performance-tuning (owning phases)",
    "planetary-infrastructure (phase 44)",
    "ai-compute (phase 45)",
  ],
  principle:
    "Scale is proven, not assumed: capacity and reliability claims are backed by measured evidence and declared budgets, and degradation is explicit rather than silent.",
  dependsOn: ["01", "02", "03", "05", "14", "21"],
  consumers: ["40"],
  substrates: ["capacity models", "reliability objectives", "runbook records"],
  tests: ["tests/unit/enterprise-scale.test.ts"],
  provides: [
    { id: "enterprise:capacity-status", kind: "query", description: "read capacity state" },
    {
      id: "enterprise:objective-status",
      kind: "query",
      description: "read reliability objectives",
    },
    { id: "enterprise:runbook", kind: "api", description: "execute a governed runbook" },
  ],
  consumesContracts: [
    { id: "cloud:resolve-placement", kind: "query" },
    { id: "analytics:evaluate", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["capacity models", "reliability objectives", "runbook records"],
    derived: ["load forecasts", "degradation predictions"],
  },
  requiresApprovalFor: ["objective-relaxation", "runbook-execution", "capacity-quota-override"],
  sections: {
    observability:
      "Scale claims cite real metrics: latency, saturation, error budget and queue depth are collected and retained, and no scale indicator is displayed without a measurement behind it.",
  },
});
