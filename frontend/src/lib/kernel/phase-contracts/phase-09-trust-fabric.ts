/**
 * Phase 09 — Security Trust Fabric contract (seeded authoring).
 *
 * Trust as data: entities, assertions, verification and governance, so a claim
 * about an actor, school, device or document carries provenance and confidence
 * instead of being assumed.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_09_TRUST_FABRIC = definePhaseContractFromSeed({
  id: "09",
  name: "Security Trust Fabric",
  phaseDoc: "architecture/phase-09-security-trust-fabric.md",
  layer: "Foundations",
  stage: "S4",
  status: "implemented",
  owner: "09",
  capability: "trust-fabric",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "security-enforcement",
  ],
  purpose:
    "Own trust as recorded data: register trust entities, record verifiable assertions about them, verify assertions with provenance, and govern confidence and expiry.",
  ownership:
    "Single owner of trust entities, trust assertions, verification records, confidence scoring and trust governance rules.",
  boundaryStatement:
    "The trust fabric owns evidence and confidence, never policy outcomes. It never grants access by itself and never replaces authorization decisions.",
  excludes: [
    "authorization-decisions (phase 08)",
    "adversarial-defense (phase 42)",
    "identity-registry-ownership (phase 02)",
  ],
  principle:
    "Trust is earned and expires: an assertion carries provenance, a verifier and a validity window, and no consumer may treat unverified trust as fact.",
  dependsOn: ["01", "02", "03", "08"],
  consumers: ["08", "42"],
  substrates: ["trust entities", "trust assertions", "verification records"],
  tests: [
    "tests/unit/trust-core.test.ts",
    "tests/unit/trust-entities.test.ts",
    "tests/unit/trust-assertions.test.ts",
    "tests/unit/trust-governance.test.ts",
    "tests/unit/trust-fabric-report.test.ts",
  ],
  provides: [
    { id: "trust:record-assertion", kind: "command", description: "record an assertion" },
    { id: "trust:resolve-confidence", kind: "query", description: "resolve trust confidence" },
    { id: "trust:verify", kind: "api", description: "verify with provenance" },
  ],
  consumesContracts: [{ id: "security:authorize", kind: "api" }],
  canonicalTruth: {
    owners: ["trust entities", "trust assertions", "verification records"],
    derived: ["confidence scores", "trust graph projections"],
  },
  requiresApprovalFor: ["assertion-override", "trust-entity-merge", "verifier-change"],
  sections: {
    aiSafety:
      "AI may propose and corroborate assertions, but a model claim is never treated as a verification; the verifying actor and evidence are recorded.",
  },
});
