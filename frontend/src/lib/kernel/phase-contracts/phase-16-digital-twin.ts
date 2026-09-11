/**
 * Phase 16 — Digital Twin contract (seeded authoring).
 *
 * Twins as governed models of reality: entities, state, relationships and
 * governance, fed by device telemetry and consumed by automation and analytics.
 * Scholar's facility twin is one consumer; any other domain twins its own.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_16_DIGITAL_TWIN = definePhaseContractFromSeed({
  id: "16",
  name: "Digital Twin",
  phaseDoc: "architecture/phase-16-digital-twin.md",
  layer: "Runtime",
  stage: "S5",
  status: "implemented",
  owner: "16",
  capability: "live-digital-twin",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "runtime-primitives",
    "hardware-device-telemetry",
  ],
  purpose:
    "Own twin state: model real entities and their relationships, hold current state with history, accept observations and expose governed reads for automation, analytics and surfaces.",
  ownership:
    "Single owner of twin identity, twin state, twin graph relationships, twin observations and twin governance rules.",
  boundaryStatement:
    "A twin models reality, it never replaces it: twin state is a projection of canonical records and device telemetry, and holding data in a twin is never a permission bypass.",
  excludes: [
    "canonical-record-ownership (owning phases)",
    "authorization-decisions (phase 08)",
    "twin-civilization-federation (phase 46)",
  ],
  principle:
    "Every twin value carries owner, tenant, source and timestamp; a twin never invents state it did not observe or derive, and derived values are labelled.",
  dependsOn: ["01", "02", "03", "05", "15"],
  consumers: ["17", "18", "46"],
  substrates: ["twin identity records", "twin state", "twin relationships", "observations"],
  tests: [
    "tests/unit/twin-core.test.ts",
    "tests/unit/twin-state.test.ts",
    "tests/unit/twin-graph.test.ts",
    "tests/unit/twin-governance.test.ts",
  ],
  provides: [
    { id: "twin:read-state", kind: "query", description: "read current twin state" },
    { id: "twin:observe", kind: "command", description: "record an observation" },
    { id: "twin:resolve-kind", kind: "query", description: "resolve the twin kind" },
  ],
  consumesContracts: [
    { id: "hardware:telemetry-read", kind: "query" },
    { id: "runtime:record-event", kind: "event" },
  ],
  canonicalTruth: {
    owners: ["twin state derived from canonical records and telemetry"],
    derived: ["twin predictions", "occupancy forecasts", "health indices"],
  },
  requiresApprovalFor: ["twin-retirement", "cross-tenant-twin-link", "state-override"],
  sections: {
    aiSafety:
      "Twin predictions are derived intelligence: they may be surfaced with confidence and inputs, but they may never be written back as canonical state without validation and approval.",
  },
});
