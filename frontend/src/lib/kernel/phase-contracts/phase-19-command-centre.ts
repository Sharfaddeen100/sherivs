/**
 * Phase 19 — Command Centre contract (seeded authoring).
 *
 * The operational surface: health, alerts and incidents for whoever operates the
 * platform or a tenant, composed by the workspace engine and fed by every phase.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_19_COMMAND_CENTRE = definePhaseContractFromSeed({
  id: "19",
  name: "Command Centre",
  phaseDoc: "architecture/phase-19-command-centre.md",
  layer: "Runtime",
  stage: "S5",
  status: "implemented",
  owner: "19",
  capability: "command-centre-surface",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "workspace-composition",
    "analytics-decision-intelligence",
    "security-enforcement",
  ],
  purpose:
    "Own operational situational awareness: compose system and tenant health, raise alerts from real signals, track incidents to closure and expose the surfaces operators use.",
  ownership:
    "Single owner of alert definitions and state, incident records and lifecycle, and the command-centre composition contract.",
  boundaryStatement:
    "The command centre owns the operational surface, never the data it displays: it renders state owned by other phases and fabricates nothing.",
  excludes: [
    "canonical-state-ownership (owning phases)",
    "design-system-ownership (phase 24)",
    "human-interface-layer (phase 50)",
  ],
  principle:
    "No fabricated alerts and no decorative metrics: every indicator resolves to real state, and an empty state is displayed as empty.",
  dependsOn: ["01", "02", "03", "05", "06", "18"],
  consumers: ["control-plane"],
  substrates: ["alert definitions", "alert state", "incidents"],
  tests: [
    "tests/unit/command-core.test.ts",
    "tests/unit/command-alerts.test.ts",
    "tests/unit/command-incidents.test.ts",
    "tests/unit/command-governance.test.ts",
  ],
  provides: [
    { id: "command:health-read", kind: "query", description: "read health signals" },
    { id: "command:raise-alert", kind: "command", description: "raise an alert" },
    { id: "command:incident-lifecycle", kind: "api", description: "track an incident" },
  ],
  consumesContracts: [
    { id: "workspace:resolve-composition", kind: "query" },
    { id: "analytics:evaluate", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["alert state", "incident records"],
    derived: ["health scores", "incident-risk projections"],
  },
  requiresApprovalFor: ["alert-threshold-change", "incident-closure", "control-plane-escalation"],
  sections: {
    integration:
      "The control plane consumes this surface to operate the platform, while tenants consume their own scoped view; both render the same contract with different authorization.",
  },
});
