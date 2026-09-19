/**
 * Phase 40 — Universal Runtime Fabric contract (seeded authoring).
 *
 * The fabric that composes and runs domain runtimes: installation, isolation,
 * lifecycle, resource governance and health across every runtime installed on
 * CoreGrid — every runtime included, and every future domain as an equal citizen.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_40_RUNTIME_FABRIC = definePhaseContractFromSeed({
  id: "40",
  name: "Universal Runtime Fabric",
  phaseDoc: "architecture/phase-40-universal-runtime-fabric.md",
  layer: "Universal",
  stage: "S10",
  status: "architecture",
  owner: "40",
  capability: "universal-runtime-fabric",
  consumes: [
    "universal-reality-ontology",
    "enterprise-scale",
    "data-platform",
    "security-enforcement",
  ],
  purpose:
    "Own runtime composition: install, isolate, govern and monitor domain runtimes so a new domain joins the platform as a manifest and a grant rather than as a kernel change.",
  ownership:
    "Single owner of runtime installation and isolation, runtime lifecycle across the fabric, resource and quota governance per runtime, and runtime health contracts.",
  boundaryStatement:
    "The fabric owns composition and isolation, never the runtimes themselves and never the kernel: no runtime may be installed by rewriting the kernel, and no fabric decision may bypass authorization or tenancy.",
  excludes: [
    "domain-ontology-ownership (installed runtimes)",
    "kernel-substrate-ownership (phase 33)",
    "planetary-infrastructure (phase 44)",
    "orchestration-closure (phase 51)",
  ],
  principle:
    "Runtime installation is a data operation over a stable contract: installing, suspending or retiring a runtime never requires kernel changes, and every runtime is isolated by tenant, capability and policy.",
  dependsOn: ["01", "02", "03", "05", "14", "31"],
  consumers: ["51"],
  provides: [
    { id: "fabric:install-runtime", kind: "command", description: "install a domain runtime" },
    { id: "fabric:runtime-health", kind: "query", description: "read runtime health" },
    { id: "fabric:govern-runtime", kind: "api", description: "suspend or retire a runtime" },
  ],
  consumesContracts: [
    { id: "kernel:register-runtime", kind: "command" },
    { id: "security:authorize", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["runtime installation records", "runtime quota and policy records"],
    derived: ["runtime health scores", "capacity recommendations"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "runtime-installation",
    "runtime-retirement",
    "runtime-quota-expansion",
    "isolation-policy-change",
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
    extension:
      "The fabric is the extension mechanism itself: a runtime is installed as runtime:<id> and every future domain installs the same way through frontend/src/lib/kernel/domain-manifest.ts — no kernel rewrite, no privileged runtime.",
    integration:
      "Consumed by the closure phase 51; no runtime holds special status in the fabric — the first installed runtime is one among equals, which is what keeps the kernel domain-neutral.",
    risk: "The standing risk is a runtime acquiring implicit privileges through the fabric; mitigated by manifest validation, per-runtime quota and policy records, and by the rule that installation never changes the kernel or another runtime's authority.",
    security:
      "Runtime isolation is enforced, not assumed: each runtime runs under its own grants and tenant scope, and the fabric fails closed when a runtime's policy or quota context is missing.",
  },
});
