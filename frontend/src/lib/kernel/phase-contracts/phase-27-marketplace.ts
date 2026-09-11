/**
 * Phase 27 — Marketplace contract (seeded authoring).
 *
 * Packages, vendors and entitlements: how capability is published, licensed and
 * granted to tenants, with governance over what may be installed.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_27_MARKETPLACE = definePhaseContractFromSeed({
  id: "27",
  name: "Marketplace",
  phaseDoc: "architecture/phase-27-marketplace.md",
  layer: "Commerce",
  stage: "S7",
  status: "implementing",
  owner: "27",
  capability: "marketplace",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "tenancy-isolation-rls",
    "financial-ledger",
    "developer-platform",
  ],
  purpose:
    "Own capability distribution: publish vendor packages, resolve entitlements per tenant, and govern installation so new capability arrives as data under policy rather than as uncontrolled code.",
  ownership:
    "Single owner of the package catalog, vendor records, entitlement resolution and marketplace governance rules.",
  boundaryStatement:
    "The marketplace owns distribution and entitlement, never the behaviour of what it distributes: a package may not expand a tenant's permissions, and installation is always policy-gated.",
  excludes: [
    "runtime-ontology (installing runtimes own their ontology)",
    "autonomous-economy (phase 49)",
    "billing-ledger-ownership (phase 13)",
  ],
  principle:
    "Nothing installs itself: every package is reviewed, every entitlement is explicit, and an expired entitlement fails closed.",
  dependsOn: ["01", "02", "03", "05", "13", "28"],
  consumers: ["49", "51"],
  substrates: ["package catalog", "vendor records", "entitlement records"],
  tests: ["tests/unit/marketplace.test.ts"],
  provides: [
    { id: "marketplace:publish", kind: "command", description: "publish a package" },
    { id: "marketplace:resolve-entitlement", kind: "query", description: "resolve entitlement" },
    { id: "marketplace:install", kind: "api", description: "governed installation" },
  ],
  consumesContracts: [
    { id: "financial:record-payment", kind: "command" },
    { id: "developer:package-manifest", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["package catalog", "entitlement records", "vendor records"],
    derived: ["popularity signals", "recommendation rankings"],
  },
  requiresApprovalFor: [
    "package-publication",
    "entitlement-override",
    "vendor-verification-waiver",
  ],
  sections: {
    security:
      "Installation is privileged and audited; packages are versioned and signed where available; a package can never escalate tenant permissions or reach another tenant's data.",
  },
});
