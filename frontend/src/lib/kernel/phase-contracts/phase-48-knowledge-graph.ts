/**
 * Phase 48 — Civilization Knowledge Graph (seeded authoring).
 *
 * Relationships at civilization scale: entities and edges across organizations,
 * jurisdictions and domains, each carrying provenance, ownership, authorization
 * and confidence (AGENTS §11).
 *
 * DUPLICATION GOVERNANCE: D2 (knowledge-graphs, OPEN, owner 33/36/48, ADR
 * PLATFORM-003) — phase 33 owns the universal ontology, phase 36 owns memory,
 * this phase owns the civilization-scale graph over them.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_48_KNOWLEDGE_GRAPH = definePhaseContractFromSeed({
  id: "48",
  name: "Civilization Knowledge Graph",
  phaseDoc: "architecture/phase-48-civilization-knowledge-graph.md",
  layer: "Civilization",
  stage: "S5",
  status: "architecture",
  owner: "48",
  capability: "civilization-knowledge-graph",
  consumes: [
    "universal-reality-ontology",
    "memory-knowledge-civilization",
    "data-platform",
    "security-enforcement",
  ],
  purpose:
    "Own the civilization-scale knowledge graph: relate entities across organizations and domains, preserve provenance and confidence per relationship, and expose governed graph queries.",
  ownership:
    "Single owner of graph-wide relationship structures, traversal contracts and graph governance rules across organizations.",
  boundaryStatement:
    "The graph records relationships, never permissions: an edge existing between two entities never implies that either party may read the other, and the graph may not become a shadow copy of domain records.",
  excludes: [
    "universal-ontology-ownership (phase 33)",
    "memory-and-retention (phase 36)",
    "canonical-record-ownership (owning phases)",
    "twin-state (phase 16)",
  ],
  principle:
    "Every relationship answers provenance, ownership, authorization and confidence: an edge without all four is not published to consumers.",
  dependsOn: ["01", "02", "05", "14", "33", "36"],
  consumers: ["33", "36"],
  provides: [
    { id: "graph:relate", kind: "command", description: "record a governed relationship" },
    { id: "graph:traverse", kind: "query", description: "traverse within authorization" },
    { id: "graph:confidence", kind: "query", description: "read edge confidence and provenance" },
  ],
  consumesContracts: [
    { id: "kernel:resolve-entity", kind: "query" },
    { id: "memory:recall", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["graph relationship records", "graph governance rules"],
    derived: ["inferred edges", "centrality and influence measures", "clusters"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "graph-wide-relationship-publish",
    "cross-tenant-edge-creation",
    "inference-threshold-change",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "commerce", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "logistics", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "energy", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    ownership:
      "Single owner of the civilization-scale graph structure per D2 (knowledge-graphs, owner 33/36/48, ADR PLATFORM-003): phase 33 supplies the universal ontology, phase 36 scopes memory, and this phase relates entities across boundaries without owning their records.",
    security:
      "Traversal is filtered by authorization at query time, never by hiding edges after the fact: a user sees only the subgraph their policy permits, and cross-tenant edges are invisible unless a federation agreement says otherwise.",
    aiSafety:
      "Inferred relationships are derived values with confidence and method; they are labelled as inferred, never presented as facts, and no inference may create a cross-tenant edge without approval.",
    risk: "D2 (knowledge-graphs, OPEN, ADR PLATFORM-003) remains open until phases 33, 36 and 48 agree the boundary in the ADR; the standing risk is graph edges being mistaken for authorization, mitigated by the no-permission boundary and query-time filtering.",
  },
});
