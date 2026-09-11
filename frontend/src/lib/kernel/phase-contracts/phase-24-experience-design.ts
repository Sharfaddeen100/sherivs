/**
 * Phase 24 — Experience & Design Intelligence contract (seeded authoring).
 *
 * Design system and experience intelligence: tokens, accessibility,
 * personalization and experience governance, so every runtime's surfaces share
 * one language without dictating what a domain shows.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_24_EXPERIENCE_DESIGN = definePhaseContractFromSeed({
  id: "24",
  name: "Experience & Design Intelligence",
  phaseDoc: "architecture/phase-24-coregrid-experience-design-intelligence.md",
  layer: "Intelligence",
  stage: "S6",
  status: "implementing",
  owner: "24",
  capability: "experience-design",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "workspace-composition",
    "communication-messaging",
    "web-client-platform",
  ],
  purpose:
    "Own the experience layer: design tokens and components, accessibility guarantees, personalization rules and experience governance across every runtime and channel.",
  ownership:
    "Single owner of the design token set, shared component contracts, accessibility standards, personalization rules and experience governance.",
  boundaryStatement:
    "Experience owns presentation language and accessibility, never domain content or its authorization, and personalization may never widen what a member can see.",
  excludes: [
    "domain-content (consuming runtimes)",
    "authorization-decisions (phase 08)",
    "human-interface-layer (phase 50)",
  ],
  principle:
    "The interface is honest: it renders real state or an explicit empty state, accessibly, and it never manufactures metrics or hides policy failures.",
  dependsOn: ["01", "05", "06", "23"],
  consumers: ["50"],
  substrates: [
    "design tokens",
    "component contracts",
    "accessibility rules",
    "personalization rules",
  ],
  tests: ["tests/unit/experience.test.ts", "tests/unit/experience-platform.test.ts"],
  provides: [
    { id: "experience:resolve-tokens", kind: "query", description: "resolve design tokens" },
    { id: "experience:apply-personalization", kind: "api", description: "apply personalization" },
    { id: "experience:accessibility-check", kind: "query", description: "check accessibility" },
  ],
  consumesContracts: [
    { id: "workspace:resolve-chrome", kind: "query" },
    { id: "communication:render-template", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["design tokens", "accessibility rules"],
    derived: ["personalization suggestions", "engagement insights"],
  },
  requiresApprovalFor: ["token-breaking-change", "personalization-rule-activation"],
  sections: {
    aiSafety:
      "Personalization and generated interface copy are proposals bounded by policy: no experience rule may expose data the member is not authorized to see, and AI-generated text is never presented as an official record.",
  },
});
