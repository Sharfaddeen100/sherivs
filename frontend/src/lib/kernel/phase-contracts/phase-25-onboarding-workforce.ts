/**
 * Phase 25 — Institutional Onboarding, Administration & Workforce Identity.
 *
 * The institution lifecycle: onboarding a tenant's structures, the governed
 * workforce-kind catalog, positions and administration surfaces, so any domain
 * can describe its people with its own vocabulary over neutral governance.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_25_ONBOARDING_WORKFORCE = definePhaseContractFromSeed({
  id: "25",
  name: "Institutional Onboarding & Workforce",
  phaseDoc:
    "architecture/phase-25-institutional-onboarding-administration-workforce-identity-platform.md",
  layer: "Foundations",
  stage: "S6",
  status: "implementing",
  owner: "25",
  capability: "onboarding-workforce-identity",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "runtime-primitives",
    "workspace-composition",
  ],
  purpose:
    "Own institution setup and workforce identity: onboard a tenant's structures, maintain a governed catalog of workforce kinds and positions, and administer people without hardcoding one domain's org chart.",
  ownership:
    "Single owner of the workforce-kind catalog, position model, onboarding records, invitation lifecycle and institution administration contracts.",
  boundaryStatement:
    "Onboarding and workforce own institutional structure, never domain roles or permissions: a workforce kind describes what someone does, and authority still comes only from the security engine.",
  excludes: [
    "authorization-decisions (phase 08)",
    "identity-registry-ownership (phase 02)",
    "domain-role-semantics (consuming runtimes)",
  ],
  principle:
    "Structure is governed data: workforce kinds and positions are catalog entries with lifecycle states, not code branches, and no kind implies privilege.",
  dependsOn: ["01", "02", "03", "05", "06"],
  consumers: ["runtime:scholar"],
  substrates: [
    "workforce kind catalog",
    "position records",
    "onboarding records",
    "invitation records",
    "institution configuration",
  ],
  tests: [
    "tests/unit/workforce-kinds.test.ts",
    "tests/unit/workforce-lifecycle.test.ts",
    "tests/unit/workforce-positions.test.ts",
    "tests/unit/onboarding-flow.test.ts",
    "tests/unit/onboarding-invitations.test.ts",
    "tests/unit/institution.test.ts",
  ],
  provides: [
    { id: "workforce:resolve-kinds", kind: "query", description: "resolve the kind catalog" },
    { id: "workforce:assign-position", kind: "command", description: "assign a position" },
    { id: "onboarding:invite", kind: "command", description: "issue an invitation" },
  ],
  consumesContracts: [
    { id: "identity:register-actor", kind: "command" },
    { id: "workspace:resolve-chrome", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["workforce kinds", "positions", "onboarding and invitation records"],
    derived: ["staffing suggestions", "coverage forecasts"],
  },
  requiresApprovalFor: ["kind-catalog-change", "position-assignment-override", "bulk-invitation"],
  sections: {
    aiSafety:
      "AI may classify or suggest a workforce kind from free text, but the assignment is a proposal recorded with confidence; a person's authority is never inferred from a generated label.",
  },
});
