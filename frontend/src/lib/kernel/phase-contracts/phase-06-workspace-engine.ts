/**
 * Phase 06 — Workspace Engine contract (seeded authoring).
 *
 * Workspace composition: membership, composition, governance and resolution —
 * what a member sees and can do in a workspace, driven by data rather than by
 * hardcoded portals. Scholar's role dashboards are one composition; any other
 * runtime composes its own.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_06_WORKSPACE_ENGINE = definePhaseContractFromSeed({
  id: "06",
  name: "Workspace Engine",
  phaseDoc: "architecture/phase-06-workspace-engine.md",
  layer: "Foundations",
  stage: "S3",
  status: "implementing",
  owner: "06",
  capability: "workspace-composition",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
  ],
  purpose:
    "Compose workspaces from data: membership and capability resolution, composition rules, governance of layout and landing surfaces, so a runtime's chrome is configuration rather than code.",
  ownership:
    "Single owner of workspace membership, composition resolution, landing/chrome resolution and workspace governance rules.",
  boundaryStatement:
    "The workspace engine owns how surfaces are composed, never what a domain's surfaces mean, and it never becomes a second authorization engine.",
  excludes: [
    "authorization-decisions (phase 08)",
    "domain-surface-content (consuming runtimes)",
    "design-tokens-ownership (phase 24)",
    "communication-channels (phase 10)",
  ],
  principle:
    "Chrome shrinks, capability never expands: composition may only narrow what a member sees relative to their resolved capability.",
  dependsOn: ["01", "02", "03", "05"],
  consumers: ["19", "24", "50"],
  substrates: ["workspace membership", "composition records", "chrome/landing resolutions"],
  tests: [
    "tests/unit/workspace-navigation.test.ts",
    "tests/unit/scholar-workforce-nav.test.ts",
    "tests/unit/capability-gate.test.ts",
  ],
  provides: [
    { id: "workspace:resolve-composition", kind: "query", description: "resolve a composition" },
    { id: "workspace:resolve-chrome", kind: "query", description: "resolve chrome and landings" },
    { id: "workspace:govern-layout", kind: "api", description: "governed layout change" },
  ],
  consumesContracts: [{ id: "identity:resolve-actor", kind: "query" }],
  canonicalTruth: {
    owners: ["workspace-membership", "composition-records"],
    derived: ["recommended-layouts", "navigation-rankings"],
  },
  requiresApprovalFor: ["capability-expansion", "cross-tenant-workspace-link", "layout-publish"],
  sections: {
    purpose:
      "One composition engine so every runtime's surfaces are resolved from membership and capability data instead of duplicated portal code paths.",
    integration:
      "Consumed by phases 19, 24 and 50; Scholar resolves its staff/student/parent workspaces here while other runtimes compose theirs from the same contract.",
  },
});
