/**
 * Phase 20 — Government Education Cloud contract (seeded authoring).
 *
 * Sovereign deployment: data residency, policy packs and reporting obligations
 * for a government tenant, delivered over the same kernel contracts.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_20_GOVERNMENT_CLOUD = definePhaseContractFromSeed({
  id: "20",
  name: "Government Education Cloud",
  phaseDoc: "architecture/phase-20-government-education-cloud.md",
  layer: "Global",
  stage: "S6",
  status: "implemented",
  owner: "20",
  capability: "government-sovereign-deployments",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "tenancy-isolation-rls",
    "data-platform",
    "security-enforcement",
  ],
  purpose:
    "Own sovereign operation: deploy tenant data under residency rules, apply jurisdiction policy packs and produce statutory reporting from canonical records.",
  ownership:
    "Single owner of residency configuration, jurisdiction policy packs and statutory report definitions.",
  boundaryStatement:
    "Sovereignty owns placement, policy packs and reporting obligations, never the underlying domain data or its meaning, and it never weakens isolation to satisfy a reporting demand.",
  excludes: [
    "domain-record-ownership (owning phases)",
    "planetary-infrastructure-ownership (phase 44)",
    "globalization-content (phase 30)",
  ],
  principle:
    "Sovereignty is enforced, not promised: residency, policy packs and reporting are configuration with evidence, and a jurisdiction may never relax core security invariants.",
  dependsOn: ["01", "02", "03", "05", "14"],
  consumers: ["44"],
  substrates: ["residency configuration", "policy packs", "report definitions"],
  tests: [
    "tests/unit/government-core.test.ts",
    "tests/unit/government-data.test.ts",
    "tests/unit/government-policy.test.ts",
    "tests/unit/government-governance.test.ts",
  ],
  provides: [
    { id: "government:residency-status", kind: "query", description: "read residency state" },
    {
      id: "government:apply-policy-pack",
      kind: "command",
      description: "apply a jurisdiction pack",
    },
    { id: "government:statutory-report", kind: "query", description: "produce a statutory report" },
  ],
  consumesContracts: [
    { id: "data:catalog-read", kind: "query" },
    { id: "security:authorize", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["residency configuration", "policy packs", "generated reports"],
    derived: ["compliance scores", "residency-risk signals"],
  },
  requiresApprovalFor: [
    "policy-pack-activation",
    "residency-change",
    "cross-jurisdiction-transfer",
    "report-publication",
  ],
  sections: {
    tenancy:
      "Sovereignty configuration is attached to tenants and jurisdictions; no residency rule may cause data to leave its required boundary, and cross-jurisdiction transfer is gated.",
  },
});
