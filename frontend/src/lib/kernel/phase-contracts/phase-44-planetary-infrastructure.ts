/**
 * Phase 44 — Planetary Distributed Infrastructure Engine (seeded authoring).
 *
 * Physical and geographic infrastructure at planetary scale: regions, edge
 * presence, hardware fleets and their governance, so reality wherever it is
 * served stays under the same law.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_44_PLANETARY_INFRASTRUCTURE = definePhaseContractFromSeed({
  id: "44",
  name: "Planetary Distributed Infrastructure Engine",
  phaseDoc: "architecture/phase-44-planetary-distributed-infrastructure-engine.md",
  layer: "Civilization",
  stage: "S11",
  status: "architecture",
  owner: "44",
  capability: "planetary-infrastructure",
  consumes: [
    "cloud-fabric-byoc",
    "hardware-device-telemetry",
    "government-sovereign-deployments",
    "enterprise-scale",
  ],
  purpose:
    "Own planetary infrastructure: model regions, edge presence and hardware fleets, place physical capacity under residency and resilience policy, and govern infrastructure lifecycle.",
  ownership:
    "Single owner of planetary topology, edge and region capacity records, fleet lifecycle and infrastructure governance rules.",
  boundaryStatement:
    "Infrastructure owns physical placement and availability, never data or its meaning, and it never overrides residency, isolation or sovereignty policy to keep a site running.",
  excludes: [
    "cloud-fabric-byoc-registration (phase 21)",
    "device-identity (phase 15)",
    "domain-data-ownership (owning phases)",
    "ai-compute-markets (phase 45)",
  ],
  principle:
    "Infrastructure is governed physically and logically: every site, fleet and edge node is registered with an owner and a policy, and failure is planned for rather than discovered.",
  dependsOn: ["01", "03", "05", "15", "21", "31"],
  consumers: ["15", "21"],
  substrates: ["topology records", "edge and region capacity", "fleet lifecycle records"],
  provides: [
    { id: "planetary:topology", kind: "query", description: "read planetary topology" },
    { id: "planetary:place-capacity", kind: "command", description: "place physical capacity" },
    { id: "planetary:fleet-lifecycle", kind: "api", description: "govern a fleet" },
  ],
  consumesContracts: [
    { id: "cloud:resolve-placement", kind: "query" },
    { id: "hardware:register-device", kind: "command" },
  ],
  canonicalTruth: {
    owners: ["topology records", "capacity records", "fleet lifecycle records"],
    derived: ["resilience projections", "capacity forecasts"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "site-activation",
    "resilience-policy-change",
    "fleet-decommission",
    "residency-exception",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "logistics", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "energy", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "transport", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    tenancy:
      "Infrastructure is shared, data is not: capacity is multi-tenant by design while every tenant's data remains inside its permitted boundary, and residency rules beat availability preferences.",
    security:
      "Physical sites and fleets are registered assets with owners and audit; decommissioning destroys keys and evidence rather than leaving orphaned access, and infrastructure change never relaxes logical isolation.",
  },
});
