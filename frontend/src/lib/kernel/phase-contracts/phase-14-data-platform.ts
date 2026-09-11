/**
 * Phase 14 — Data Platform contract (seeded authoring).
 *
 * Data as a platform capability: catalog, quality, lineage and governance, so
 * every phase's data is discoverable, classified and provenance-tracked.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_14_DATA_PLATFORM = definePhaseContractFromSeed({
  id: "14",
  name: "Data Platform",
  phaseDoc: "architecture/phase-14-data-platform.md",
  layer: "Foundations",
  stage: "S4",
  status: "implemented",
  owner: "14",
  capability: "data-platform",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "tenancy-isolation-rls",
    "runtime-primitives",
    "security-enforcement",
  ],
  purpose:
    "Own data governance mechanics: catalog datasets and fields, classify sensitivity, measure quality, record lineage and expose governed access contracts.",
  ownership:
    "Single owner of the catalog, classification rules, quality checks, lineage records and governed data access contracts.",
  boundaryStatement:
    "The data platform owns metadata and governance, never the domain tables themselves; it never becomes a second copy of reality or a bypass around authorization.",
  excludes: [
    "domain-table-ownership (owning phases)",
    "memory-knowledge-civilization (phase 36)",
    "civilization-knowledge-graph (phase 48)",
  ],
  principle:
    "Every dataset answers who owns it, what class it is, where it came from and who may read it; unclassified data is not exposed.",
  dependsOn: ["01", "02", "03", "05", "08"],
  substrates: ["catalog entries", "classification labels", "quality results", "lineage records"],
  tests: [
    "tests/unit/data-core.test.ts",
    "tests/unit/data-catalog.test.ts",
    "tests/unit/data-quality.test.ts",
    "tests/unit/data-governance.test.ts",
  ],
  provides: [
    { id: "data:catalog-read", kind: "query", description: "read the catalog" },
    { id: "data:classify", kind: "api", description: "classify a dataset" },
    { id: "data:lineage", kind: "query", description: "resolve provenance" },
  ],
  consumesContracts: [{ id: "security:authorize", kind: "api" }],
  canonicalTruth: {
    owners: ["catalog entries", "classification labels", "lineage records"],
    derived: ["quality scores", "usage recommendations"],
  },
  requiresApprovalFor: ["classification-downgrade", "lineage-record-deletion", "raw-export"],
  sections: {
    tenancy:
      "Catalog entries are platform-scoped metadata; the DATA they describe stays tenant-scoped and inherits phase 03 isolation without exception.",
  },
});
