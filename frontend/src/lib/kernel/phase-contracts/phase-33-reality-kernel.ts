/**
 * Phase 33 — Reality Intelligence Kernel (URIK) contract (seeded authoring).
 *
 * The universal substrate: entities, relationships, events, observations and
 * runtime registrations with provenance, temporal validity and classification,
 * deny-by-default RLS and no domain ontology. Domain reality (phase 04's
 * education ontology, and every future ontology) installs over this kernel as a
 * manifest — the kernel itself stays neutral.
 *
 * DUPLICATION GOVERNANCE: registry rows D2 (knowledge-graphs, owner 33/36/48,
 * ADR PLATFORM-003) and D4 (digital-twin, owner 16, ADR PLATFORM-005) constrain
 * this phase: the kernel owns the universal ontology and observation substrate,
 * never a graph or twin feature set.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_33_REALITY_KERNEL = definePhaseContractFromSeed({
  id: "33",
  name: "Reality Intelligence Kernel (URIK)",
  phaseDoc: "architecture/phase-33-reality-intelligence-kernel.md",
  layer: "Universal",
  stage: "S2",
  status: "architecture",
  owner: "33",
  capability: "universal-reality-ontology",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "runtime-primitives",
  ],
  purpose:
    "Own the universal reality substrate: a domain-agnostic model of entity, relationship, event and observation with provenance, temporal validity and classification, plus the runtime-registration contract through which any domain installs its ontology.",
  ownership:
    "Single owner of the universal ontology, the observation substrate, the domain-runtime registration contract and kernel purity rules.",
  boundaryStatement:
    "The kernel owns universality itself: it never embeds a domain's vocabulary, never grants access because information exists in a twin or graph, and never lets a runtime redefine the substrate.",
  excludes: [
    "domain-ontology-ownership (installed runtimes, e.g. phase 04)",
    "authorization-decisions (phase 08)",
    "civilization-knowledge-graph (phase 48)",
    "twin-feature-set (phase 16)",
  ],
  principle:
    "Universality is provable: no kernel module may name a domain concept, and a domain may be installed, suspended or retired without touching the kernel.",
  dependsOn: ["01", "02", "03", "05", "14"],
  consumers: ["34", "36", "48", "51"],
  substrates: ["cg_entity", "cg_relationship", "cg_event", "cg_observation", "cg_domain_runtime"],
  tests: ["tests/unit/kernel-purity.test.ts", "tests/unit/kernel-runtime-registry.test.ts"],
  provides: [
    { id: "kernel:register-runtime", kind: "command", description: "install a domain runtime" },
    { id: "kernel:record-observation", kind: "command", description: "record an observation" },
    { id: "kernel:resolve-entity", kind: "query", description: "resolve a universal entity" },
  ],
  consumesContracts: [
    { id: "security:authorize", kind: "api" },
    { id: "data:classify", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["cg_entity", "cg_relationship", "cg_event", "cg_observation"],
    derived: ["inferred relationships", "confidence scores", "embeddings"],
  },
  asiTier: "governed-autonomous",
  autonomyLevel: 2,
  selfImprovement: "governed",
  requiresApprovalFor: [
    "kernel-substrate-change",
    "runtime-installation",
    "provenance-law-relaxation",
    "canonical-record-overwrite",
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
    dataModel:
      "Owned substrate is the universal kernel tables created by migration 20260903000000_coregrid_universal_kernel_substrate.sql (cg_entity, cg_relationship, cg_event, cg_observation, cg_domain_runtime) with provenance, temporal validity, classification and deny-by-default RLS.",
    integration:
      "Consumed by phases 34, 36, 48 and 51; phase 04's education reality is reframed as one installed domain manifest over this kernel, never as kernel behaviour.",
    risk: "Duplication rows D2 (knowledge graphs, ADR PLATFORM-003) and D4 (digital twin, ADR PLATFORM-005) require that the kernel owns the substrate only; any feature-level overlap with phases 48 or 16 must be resolved by those ADRs before their contracts claim ownership.",
    aiSafety:
      "Kernel inference is derived intelligence: predictions and inferred relationships are stored as derived values with confidence and provenance, and they may never overwrite canonical entity, relationship, event or observation rows.",
  },
});
