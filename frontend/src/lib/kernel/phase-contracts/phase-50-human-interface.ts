/**
 * Phase 50 — Human Civilization Interface Layer (seeded authoring).
 *
 * The human side of autonomy: consent, transparency, explanation and override
 * over everything the platform does with or without people in the loop.
 *
 * DUPLICATION GOVERNANCE: D12 (workspace-vs-surfaces, CLOSED, owner 06) and D15
 * (globalization-interface-human, CLOSED, owner 30/43/50) — the workspace
 * composes surfaces, globalization localizes them, this layer guarantees human
 * authority over autonomous behaviour.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_50_HUMAN_INTERFACE = definePhaseContractFromSeed({
  id: "50",
  name: "Human Civilization Interface Layer",
  phaseDoc: "architecture/phase-50-human-civilization-interface-layer.md",
  layer: "Civilization",
  stage: "S12",
  status: "architecture",
  owner: "50",
  capability: "human-civilization-interface",
  consumes: [
    "workspace-composition",
    "experience-design",
    "universal-interface-connectivity",
    "globalization",
    "security-enforcement",
  ],
  purpose:
    "Own human authority over autonomy: consent records, transparency and explanation surfaces, override paths and human-facing governance of agents and societies.",
  ownership:
    "Single owner of consent records, transparency and explanation contracts, override mechanisms and human-authority governance rules.",
  boundaryStatement:
    "This layer guarantees human authority; it never substitutes for authorization, never fabricates consent, and never becomes a second policy engine.",
  excludes: [
    "authorization-decisions (phase 08)",
    "workspace-composition (phase 06)",
    "design-system-ownership (phase 24)",
    "alignment-evaluation (phase 39)",
  ],
  principle:
    "A human can always see what was done in their name, why, and how to stop it: explanation, consent and override are contracts, not courtesies.",
  dependsOn: ["01", "02", "05", "06", "24", "30", "43"],
  consumers: ["06", "24"],
  provides: [
    { id: "human:record-consent", kind: "command", description: "record informed consent" },
    { id: "human:explain", kind: "query", description: "explain an autonomous action" },
    { id: "human:override", kind: "api", description: "exercise human override" },
  ],
  consumesContracts: [
    { id: "workspace:resolve-chrome", kind: "query" },
    { id: "security:authorize", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["consent records", "override records"],
    derived: ["explanation summaries", "transparency metrics"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "consent-scope-change",
    "override-path-removal",
    "explanation-redaction-policy",
    "agent-autonomy-expansion",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "commerce", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "logistics", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "energy", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "transport", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    aiSafety:
      "No autonomy without a human path out: every autonomous capability must expose explanation, consent where personal data is involved, and a working override — and removing any of those is itself a privileged, approved change.",
    integration:
      "Consumed by phases 06 and 24 so every composed surface inherits consent, explanation and override; D12 (workspace-vs-surfaces) and D15 (globalization-interface-human) stay CLOSED because this layer adds authority, not chrome.",
    risk: "Standing risk is override and explanation becoming symbolic; mitigated by recording overrides as first-class events, by requiring the paths to be tested, and by treating their removal as a privileged change.",
  },
});
