/**
 * Phase 36 — Universal Memory & Knowledge Engine contract (seeded authoring).
 *
 * Canonical memory and knowledge: what the platform remembers, how it is
 * scoped, versioned, forgotten and governed — the single owner of memory per
 * duplication rows D1 and D2.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_36_MEMORY_KNOWLEDGE = definePhaseContractFromSeed({
  id: "36",
  name: "Universal Memory & Knowledge Engine",
  phaseDoc: "architecture/phase-36-universal-memory-knowledge-civilization-engine.md",
  layer: "Universal",
  stage: "S8",
  status: "architecture",
  owner: "36",
  capability: "memory-knowledge-civilization",
  consumes: [
    "universal-reality-ontology",
    "agent-runtime",
    "ai-intelligence-gateway",
    "data-platform",
  ],
  purpose:
    "Own memory and knowledge: scoped memory stores (agent, actor, tenant, global), knowledge structures over the universal substrate, retention and forgetting rules, and governed recall.",
  ownership:
    "Single owner of memory scopes and stores, knowledge structures derived from the substrate, retention/forgetting policy and recall contracts.",
  boundaryStatement:
    "Memory owns recall, never access: remembering something never grants the right to read it, and memory may not become a second canonical store for records owned elsewhere.",
  excludes: [
    "canonical-record-ownership (kernel and owning phases)",
    "authorization-decisions (phase 08)",
    "civilization-knowledge-graph (phase 48)",
    "data-catalog-and-lineage (phase 14)",
  ],
  principle:
    "Memory is scoped and expirable: every memory has an owner scope, provenance and a retention rule, and anything forgotten is genuinely unreachable.",
  dependsOn: ["01", "02", "03", "05", "07", "33"],
  consumers: ["34", "35", "07"],
  substrates: [
    "memory stores by scope",
    "knowledge structures",
    "retention and forgetting records",
  ],
  provides: [
    { id: "memory:write", kind: "command", description: "write a scoped memory" },
    { id: "memory:recall", kind: "query", description: "recall within scope" },
    { id: "memory:forget", kind: "api", description: "execute governed forgetting" },
  ],
  consumesContracts: [
    { id: "kernel:resolve-entity", kind: "query" },
    { id: "ai:invoke", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["memory stores", "retention and forgetting records"],
    derived: ["knowledge structures", "summaries", "embeddings", "associations"],
  },
  asiTier: "governed-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "memory-scope-expansion",
    "retention-policy-change",
    "forgetting-execution",
    "cross-tenant-recall",
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
      "Single owner of memory and knowledge per duplication rows D1 (memory, owner 36) and D2 (knowledge graphs, owner 33/36/48), both under ADR PLATFORM-003; phases 07, 14 and 26 consume this contract instead of keeping private memory.",
    risk: "D1 (memory cluster, ADR PLATFORM-003) and D2 (knowledge-graph cluster, ADR PLATFORM-003) remain OPEN until phases 14, 34 and 48 consume this contract; until then duplicate memory stores are tolerated only where the ADR records them.",
    aiSafety:
      "Recall is an authorized action: AI may only read memory within its declared scope, memory writes by agents are proposals bound to that scope, and no recall may cross a tenant boundary or expose another actor's private memory.",
    tenancy:
      "Memory scopes resolve to tenants, organizations or actors; the tenant boundary is absolute, and cross-tenant recall requires an explicit federation policy with recorded approval.",
  },
});
