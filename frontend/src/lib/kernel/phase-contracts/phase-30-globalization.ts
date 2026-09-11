/**
 * Phase 30 — Globalization contract (seeded authoring).
 *
 * Language, region and format intelligence: locales, regional context, content
 * localization and format rules so one platform serves many jurisdictions.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_30_GLOBALIZATION = definePhaseContractFromSeed({
  id: "30",
  name: "Globalization",
  phaseDoc: "architecture/phase-30-globalization.md",
  layer: "Global",
  stage: "S6",
  status: "implementing",
  owner: "30",
  capability: "globalization",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "tenancy-isolation-rls",
    "runtime-primitives",
  ],
  purpose:
    "Own localization and regional correctness: resolve locale and region, format dates, numbers and currency correctly, localize content and expose translation governance.",
  ownership:
    "Single owner of the locale registry, regional context resolution, format rules and content localization records.",
  boundaryStatement:
    "Globalization owns presentation of language and format, never domain semantics or policy: a translation never changes what a record means, and a locale never relaxes a rule.",
  excludes: [
    "domain-terminology-ownership (owning phases)",
    "human-interface-layer (phase 50)",
    "sovereign-policy-packs (phase 20)",
  ],
  principle:
    "Regional correctness is data-driven: formats, calendars and currencies come from declared locale rules rather than hardcoded assumptions.",
  dependsOn: ["01", "02", "03", "05"],
  consumers: ["04", "50"],
  substrates: ["locale registry", "regional context", "format rules", "localized content"],
  tests: ["tests/unit/globalization.test.ts", "tests/unit/locale.test.ts"],
  provides: [
    { id: "globalization:resolve-locale", kind: "query", description: "resolve locale and region" },
    { id: "globalization:format-value", kind: "api", description: "format a value regionally" },
    { id: "globalization:translate", kind: "query", description: "resolve localized content" },
  ],
  consumesContracts: [{ id: "runtime:dispatch-command", kind: "command" }],
  canonicalTruth: {
    owners: ["locale registry", "format rules", "localized content"],
    derived: ["translation suggestions", "coverage reports"],
  },
  requiresApprovalFor: [
    "locale-registry-change",
    "format-rule-override",
    "machine-translation-publish",
  ],
  sections: {
    aiSafety:
      "Machine translation is a proposal: it is stored as a draft with provenance, never presented as an approved translation, and publishing requires a human reviewer.",
  },
});
