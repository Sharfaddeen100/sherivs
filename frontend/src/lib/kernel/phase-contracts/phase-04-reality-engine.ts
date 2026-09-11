/**
 * Phase 04 — Reality Engine contract (seeded authoring).
 *
 * Hosts installed reality ontologies. Scholar's education ontology is the first
 * installation; health, government and logistics install theirs through the same
 * registration contract, so the host stays domain-neutral while the first domain
 * is fully served.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_04_REALITY_ENGINE = definePhaseContractFromSeed({
  id: "04",
  name: "Education Reality Engine",
  phaseDoc: "architecture/phase-04-education-reality-engine.md",
  layer: "Foundations",
  stage: "S2",
  status: "implemented",
  owner: "04",
  capability: "education-reality-ontology",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
  ],
  purpose:
    "Host installed reality ontologies: give each runtime a governed way to declare entities, relationships, assessments and events over the shared substrate, beginning with the education ontology Scholar consumes.",
  ownership:
    "Single owner of ontology hosting, entity/relationship validation and runtime domain-event vocabulary registration.",
  boundaryStatement:
    "The reality engine owns ontology hosting and validation. It never hardcodes one domain's vocabulary into kernel behaviour and never owns identity, tenancy or authorization.",
  excludes: [
    "identity-ownership (phase 02)",
    "tenancy-ownership (phase 03)",
    "universal-ontology-ownership (phase 33)",
    "authorization-decisions (phase 08)",
  ],
  principle:
    "Canonical reality is recorded, never inferred: an ontology declares what exists, and intelligence derives from it without overwriting it.",
  dependsOn: ["01", "02", "03"],
  consumers: ["11", "12", "13", "25"],
  substrates: ["ontology registrations", "runtime canonical entity records", "runtime event rows"],
  tests: ["tests/unit/education.test.ts", "tests/unit/kernel-phase-contract.test.ts"],
  provides: [
    { id: "reality:register-ontology", kind: "command", description: "install an ontology" },
    { id: "reality:resolve-entity", kind: "query", description: "resolve a hosted entity" },
    { id: "reality:record-event", kind: "api", description: "record an ontology event" },
  ],
  consumesContracts: [
    { id: "identity:resolve-actor", kind: "query" },
    { id: "tenant:resolve-context", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["ontology-registrations", "runtime-canonical-records"],
    derived: ["ontology-insights", "predicted-outcomes"],
  },
  requiresApprovalFor: [
    "ontology-installation",
    "canonical-record-mutation",
    "cross-domain-ontology-link",
  ],
  sections: {
    boundary:
      "The host accepts any domain manifest and rejects none for being non-educational; the education ontology is simply the first installation registered over frontend/src/lib/kernel/domain-manifest.ts.",
    integration:
      "Consumed by phases 11, 12, 13 and 25; Scholar is the first installed ontology while healthcare, government and logistics hold reserved seats on the same registration contract.",
  },
});
