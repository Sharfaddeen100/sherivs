/**
 * Phase 03 — Multi-Tenancy contract (seeded authoring).
 *
 * Tenant entity, hierarchy, lifecycle, quotas and the RLS isolation model that
 * makes tenant separation a database guarantee. Scholar consumes it as
 * school/campus tenancy; other domains consume the same contract through
 * neutral seats.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_03_MULTI_TENANCY = definePhaseContractFromSeed({
  id: "03",
  name: "Multi-Tenancy",
  phaseDoc: "architecture/phase-03-multi-tenancy.md",
  layer: "Foundations",
  stage: "S1",
  status: "implemented",
  owner: "03",
  capability: "tenancy-isolation-rls",
  consumes: ["foundation-standards-config-secrets-ci", "universal-identity"],
  purpose:
    "Own tenant scope for the whole platform: tenant entity and hierarchy, lifecycle and quotas, and the row-level-security model that guarantees isolation inside the database itself.",
  ownership:
    "Single owner of the tenant entity, hierarchy, lifecycle, quotas and the RLS policy vocabulary applied to tenant-sensitive tables.",
  boundaryStatement:
    "Tenancy owns scope, hierarchy and isolation guarantees. It never embeds actor identity, workspace surfaces or domain structure, and it never lets application code be the only isolation boundary.",
  excludes: [
    "identity-ownership (phase 02)",
    "workspace-surface-ownership (phase 06)",
    "domain-structure (consuming runtimes)",
    "authorization-decisions (phase 08)",
  ],
  principle:
    "No request without tenant context; no tenant-sensitive table without RLS; isolation failures fail closed.",
  dependsOn: ["01", "02"],
  substrates: ["cg_tenant", "tenant-quota records", "tenant-topology records", "RLS policies"],
  tests: ["tests/unit/tenant.test.ts", "tests/unit/tenant-registry.test.ts"],
  provides: [
    { id: "tenant:create", kind: "command", description: "provision a tenant" },
    { id: "tenant:resolve-context", kind: "query", description: "resolve tenant context" },
    { id: "tenant:hierarchy-link", kind: "api", description: "governed parent linkage" },
  ],
  consumesContracts: [{ id: "identity:resolve-actor", kind: "query" }],
  canonicalTruth: {
    owners: ["cg_tenant", "tenant-quotas", "rls-policies"],
    derived: ["tenant-health-signals", "capacity-forecasts"],
  },
  requiresApprovalFor: [
    "tenant-deletion",
    "cross-tenant-data-move",
    "rls-policy-removal",
    "quota-override",
  ],
  sections: {
    dataModel:
      "Owned state is cg_tenant (type, slug, status, parent, region, environment) plus quota and topology records, every one of them RLS-guarded; live tenant and hierarchy checks pass 8/8 on the dev project.",
    security:
      "RLS is mandatory for tenant-sensitive tables, client-supplied tenant identifiers are never trusted, and cross-tenant reads are impossible by construction; enforced by scripts/verify-tenant-isolation.mjs.",
  },
});
