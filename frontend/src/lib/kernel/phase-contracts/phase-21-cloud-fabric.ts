/**
 * Phase 21 — Global Cloud Fabric contract (seeded authoring).
 *
 * Deployment fabric: BYOC and region topology, capacity placement and cloud
 * governance, so a tenant's reality runs where policy says it must.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_21_CLOUD_FABRIC = definePhaseContractFromSeed({
  id: "21",
  name: "Global Cloud Fabric",
  phaseDoc: "architecture/phase-21-global-cloud-fabric.md",
  layer: "Global",
  stage: "S6",
  status: "implementing",
  owner: "21",
  capability: "cloud-fabric-byoc",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "tenancy-isolation-rls",
    "data-platform",
    "security-enforcement",
  ],
  purpose:
    "Own placement of reality: describe regions and bring-your-own-cloud environments, place tenant workloads under residency and capacity policy, and keep the fabric observable and reversible.",
  ownership:
    "Single owner of the fabric topology (regions, environments, BYOC registrations), placement policy and cloud governance rules.",
  boundaryStatement:
    "The fabric owns where computation and storage run, never the data model or its meaning, and it never weakens isolation or residency to gain capacity.",
  excludes: [
    "domain-data-ownership (owning phases)",
    "planetary-infrastructure-ownership (phase 44)",
    "sovereign-policy-packs (phase 20)",
  ],
  principle:
    "Placement is policy-driven and evidenced: every environment is registered, every placement is explainable, and a failed placement fails closed rather than degrading isolation.",
  dependsOn: ["01", "02", "03", "05", "14"],
  consumers: ["44"],
  substrates: [
    "region records",
    "environment registrations",
    "placement policy",
    "infrastructure-as-code (cloud-fabric-iac: terraform providers, cluster baseline, production composition)",
  ],
  tests: [
    "tests/unit/cloud-core.test.ts",
    "tests/unit/cloud-byoc.test.ts",
    "tests/unit/cloud-governance.test.ts",
    "tests/unit/infrastructure-fabric.test.ts",
  ],
  provides: [
    {
      id: "cloud:register-environment",
      kind: "command",
      description: "register a BYOC environment",
    },
    { id: "cloud:resolve-placement", kind: "query", description: "resolve placement for a tenant" },
    { id: "cloud:fabric-health", kind: "query", description: "read fabric health" },
    {
      id: "cloud:provision-fabric",
      kind: "command",
      description:
        "provision the fabric for an environment through IaC (plan reviewed, apply approved)",
    },
    {
      id: "cloud:cluster-baseline",
      kind: "api",
      description: "the cluster baseline every workload lands on (namespaces, policy, quotas)",
    },
  ],
  consumesContracts: [
    { id: "data:catalog-read", kind: "query" },
    { id: "security:authorize", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["environment registrations", "placement policy"],
    derived: ["capacity forecasts", "cost projections"],
  },
  requiresApprovalFor: ["environment-registration", "placement-policy-change", "region-failover"],
  sections: {
    security:
      "Provider credentials never leave the adapter; environment registration is privileged and audited; a tenant's data never leaves its permitted boundary for capacity reasons.",
  },
});
