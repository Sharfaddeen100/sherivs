/**
 * Phase 46 — Universal Digital Twin Civilization Layer (seeded authoring).
 *
 * Federation of twins across organizations and jurisdictions: how twins
 * discover, relate and share permitted state — never how they grant access.
 *
 * DUPLICATION GOVERNANCE: D4 (digital-twin, OPEN, owner 16, ADR PLATFORM-005) —
 * phase 16 owns twin identity, state and governance; this layer federates them.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_46_TWIN_CIVILIZATION = definePhaseContractFromSeed({
  id: "46",
  name: "Universal Digital Twin Civilization Layer",
  phaseDoc: "architecture/phase-46-universal-digital-twin-civilization-layer.md",
  layer: "Civilization",
  stage: "S11",
  status: "architecture",
  owner: "46",
  capability: "twin-civilization-federation",
  consumes: [
    "live-digital-twin",
    "universal-reality-ontology",
    "memory-knowledge-civilization",
    "tenancy-isolation-rls",
  ],
  purpose:
    "Own federation between twins: discovery across organizations and jurisdictions, relationship mapping, permitted shared state and federation governance.",
  ownership:
    "Single owner of twin federation agreements, cross-organization twin relationships and federated state exchange rules.",
  boundaryStatement:
    "Federation relates twins; it never grants access. Holding data in a federated twin is not a permission, and a federation agreement may never widen a tenant's visibility beyond its own policy.",
  excludes: [
    "twin-identity-and-state (phase 16)",
    "authorization-decisions (phase 08)",
    "canonical-record-ownership (kernel and owning phases)",
    "planetary-topology (phase 44)",
  ],
  principle:
    "Federate by agreement, not by convenience: every federation is explicit, scoped, recorded with provenance on both sides, and revocable without corrupting either twin.",
  dependsOn: ["01", "03", "05", "16", "33", "36"],
  consumers: ["16"],
  provides: [
    { id: "federation:agree", kind: "command", description: "record a federation agreement" },
    { id: "federation:share-state", kind: "api", description: "exchange permitted state" },
    { id: "federation:revoke", kind: "command", description: "revoke a federation" },
  ],
  consumesContracts: [
    { id: "twin:read-state", kind: "query" },
    { id: "tenant:resolve-context", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["federation agreements", "federated exchange records"],
    derived: ["cross-twin insights", "relationship suggestions"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "federation-agreement",
    "state-exchange-widening",
    "cross-jurisdiction-federation",
    "federation-revocation",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "logistics", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "transport", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    tenancy:
      "Federation spans tenants without merging them: each side keeps its own isolation boundary, and exchanged state is minimised, redacted and attributed to the agreement that permitted it.",
    risk: "D4 (digital-twin, OPEN, owner 16, ADR PLATFORM-005) keeps twin features with phase 16; the standing risk is federated visibility being mistaken for access, mitigated by the no-grant boundary and per-agreement minimization.",
  },
});
