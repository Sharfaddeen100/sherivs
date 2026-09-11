/**
 * Phase 43 — Universal Interface & Connectivity Intelligence (seeded authoring).
 *
 * How everything connects: protocols, devices, multimodal interfaces and
 * connectivity governance, so any runtime can be reached and can reach its
 * environment without bespoke coupling.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_43_INTERFACE_CONNECTIVITY = definePhaseContractFromSeed({
  id: "43",
  name: "Universal Interface & Connectivity Intelligence",
  phaseDoc: "architecture/phase-43-universal-interface-connectivity-intelligence.md",
  layer: "Civilization",
  stage: "S7",
  status: "architecture",
  owner: "43",
  capability: "universal-interface-connectivity",
  consumes: [
    "integration-adapters",
    "communication-messaging",
    "data-platform",
    "runtime-primitives",
  ],
  purpose:
    "Own interfaces and connectivity: declare protocols and device classes, resolve multimodal access paths and govern who and what may connect to the platform.",
  ownership:
    "Single owner of the protocol registry, interface capability resolution, multimodal access contracts and connectivity governance.",
  boundaryStatement:
    "Connectivity carries traffic, never authority: a new interface, device class or protocol may never bypass authentication, tenant resolution or authorization.",
  excludes: [
    "authorization-decisions (phase 08)",
    "device-telemetry-ownership (phase 15)",
    "human-interface-layer (phase 50)",
    "integration-transform-ownership (phase 29)",
  ],
  principle:
    "Every connection is declared and governed: unknown protocols are rejected rather than negotiated, and connectivity options never widen data exposure.",
  dependsOn: ["01", "02", "03", "05", "14", "29"],
  consumers: ["50", "51"],
  provides: [
    { id: "interface:register-protocol", kind: "command", description: "register a protocol" },
    { id: "interface:resolve-path", kind: "query", description: "resolve an access path" },
    { id: "interface:connection-audit", kind: "query", description: "audit connections" },
  ],
  consumesContracts: [
    { id: "integration:transform", kind: "api" },
    { id: "security:authorize", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["protocol registry", "connection audit records"],
    derived: ["interface usage insights", "latency projections"],
  },
  requiresApprovalFor: [
    "protocol-registration",
    "device-class-activation",
    "connectivity-policy-change",
  ],
  neutralSeats: [
    { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "commerce", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
    { domain: "energy", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  ],
  sections: {
    security:
      "Protocols are registered with explicit capabilities and limits; connections are authenticated, tenant-resolved and authorized before any payload is accepted, and unknown or unsigned traffic is rejected.",
    integration:
      "Consumed by phases 50 and 51; existing integrations (phase 29) and device telemetry (phase 15) keep their ownership, with connectivity adding reach rather than replacing either.",
  },
});
