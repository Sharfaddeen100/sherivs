/**
 * Phase 28 — Developer Platform contract (seeded authoring).
 *
 * The platform for building on Sherivs: APIs, environments, build pipelines
 * and developer governance, so extension happens through contracts and
 * verification rather than through forking the kernel.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_28_DEVELOPER_PLATFORM = definePhaseContractFromSeed({
  id: "28",
  name: "Developer Platform",
  phaseDoc: "architecture/phase-28-developer-platform.md",
  layer: "Runtime",
  stage: "S7",
  status: "implementing",
  owner: "28",
  capability: "developer-platform",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "data-platform",
    "security-enforcement",
  ],
  purpose:
    "Own extension of the platform: developer identities and grants, API surface contracts, environments, build and verification pipelines, and developer governance.",
  ownership:
    "Single owner of the developer API surface registry, environment definitions, build/verification pipeline contracts and developer governance rules.",
  boundaryStatement:
    "The developer platform owns how capability is extended, never authorization: extension code runs under its own grant, and no developer surface may bypass the security engine.",
  excludes: [
    "authorization-decisions (phase 08)",
    "kernel-architecture (governance documents)",
    "autonomous-engineering-self-improvement (phase 47)",
  ],
  principle:
    "Extensions follow the same law as the platform: typed contracts, tests, security checks and review — a change that violates architecture is incorrect even if it compiles.",
  dependsOn: ["01", "02", "03", "05", "08", "14"],
  consumers: ["27", "51"],
  substrates: [
    "developer identities and grants",
    "API surface registry",
    "environment definitions",
  ],
  tests: ["tests/unit/dev-platform.test.ts"],
  provides: [
    { id: "developer:register-surface", kind: "command", description: "register an API surface" },
    { id: "developer:package-manifest", kind: "query", description: "resolve a package manifest" },
    { id: "developer:pipeline-status", kind: "query", description: "read pipeline state" },
  ],
  consumesContracts: [
    { id: "security:authorize", kind: "api" },
    { id: "data:catalog-read", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["API surface registry", "environment definitions", "grant records"],
    derived: ["build metrics", "usage analytics"],
  },
  requiresApprovalFor: [
    "new-api-surface-activation",
    "developer-grant-escalation",
    "environment-provisioning",
  ],
  sections: {
    aiSafety:
      "AI may generate code, tests and documentation for developers, but generated artifacts are untrusted until verified: agents cannot self-approve, self-deploy or widen a grant.",
  },
});
