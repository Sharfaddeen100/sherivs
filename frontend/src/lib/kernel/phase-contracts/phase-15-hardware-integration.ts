/**
 * Phase 15 — Hardware Integration contract (seeded authoring).
 *
 * Devices and telemetry: registration, lifecycle, command dispatch and
 * telemetry intake, so physical reality reaches CoreGrid through governed
 * adapters rather than bespoke integrations.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_15_HARDWARE_INTEGRATION = definePhaseContractFromSeed({
  id: "15",
  name: "Hardware Integration",
  phaseDoc: "architecture/phase-15-hardware-integration.md",
  layer: "Runtime",
  stage: "S5",
  status: "implemented",
  owner: "15",
  capability: "hardware-device-telemetry",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "runtime-primitives",
    "security-enforcement",
  ],
  purpose:
    "Own the device layer: register hardware, govern its lifecycle, dispatch commands to it and ingest its telemetry with provenance so physical facts become first-class records.",
  ownership:
    "Single owner of device registry, device lifecycle, command dispatch records and telemetry intake.",
  boundaryStatement:
    "Hardware integration owns device state and telemetry, never domain meaning: it never decides what a reading implies and never bypasses the twin or policy layers.",
  excludes: [
    "twin-state-interpretation (phase 16)",
    "provider-protocol-sdks (adapters)",
    "planetary-infrastructure (phase 44)",
  ],
  principle:
    "A device reading is canonical only when it carries device identity, tenant, timestamp and provenance; missing provenance means the reading is untrusted.",
  dependsOn: ["01", "02", "03", "05", "08"],
  consumers: ["16", "44"],
  substrates: [
    "device registry",
    "device lifecycle records",
    "command dispatch records",
    "telemetry rows",
  ],
  tests: [
    "tests/unit/hardware-core.test.ts",
    "tests/unit/hardware-commands.test.ts",
    "tests/unit/hardware-lifecycle.test.ts",
    "tests/unit/hardware-telemetry.test.ts",
  ],
  provides: [
    { id: "hardware:register-device", kind: "command", description: "register a device" },
    { id: "hardware:dispatch-command", kind: "command", description: "send a device command" },
    { id: "hardware:telemetry-read", kind: "query", description: "read telemetry" },
  ],
  consumesContracts: [
    { id: "runtime:dispatch-command", kind: "command" },
    { id: "security:authorize", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["device registry", "telemetry rows", "command dispatch records"],
    derived: ["device health scores", "anomaly signals"],
  },
  requiresApprovalFor: ["device-provisioning-key-rotation", "firmware-command", "telemetry-purge"],
  sections: {
    security:
      "Device identity is explicit: commands are authorized per device and tenant, telemetry ingestion rejects unsigned or unregistered sources, and no device may act outside its grant.",
  },
});
