/**
 * Phase 05 — Core Application Runtime contract (seeded authoring).
 *
 * Runtime primitives: commands, queries, events, outbox, jobs, webhooks,
 * feature flags, resilience and observability. Every phase publishes through
 * this transport; Scholar consumes it like any other runtime would.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_05_APPLICATION_RUNTIME = definePhaseContractFromSeed({
  id: "05",
  name: "Core Application Runtime",
  phaseDoc: "architecture/phase-05-core-application-runtime.md",
  layer: "Foundations",
  stage: "S2",
  status: "implemented",
  owner: "05",
  capability: "runtime-primitives",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "tenancy-isolation-rls",
    "universal-identity",
  ],
  purpose:
    "Own the shared application runtime: command and query dispatch, event transport with an outbox, job execution, webhooks, feature flags, resilience policy and runtime observability.",
  ownership:
    "Single owner of the runtime primitives every phase uses to dispatch, publish, retry and observe work.",
  boundaryStatement:
    "The runtime owns transport and execution mechanics. It never owns domain logic, never decides authorization and never becomes the place where a domain's rules live.",
  excludes: [
    "domain-logic-ownership (consuming phases)",
    "authorization-decisions (phase 08)",
    "workflow-orchestration (phase 17)",
    "ai-gateway (phase 26)",
  ],
  principle:
    "Every side effect is dispatched, recorded and observable: no phase may write outside its contract or publish an event it cannot trace.",
  dependsOn: ["01", "02", "03"],
  substrates: ["command/query dispatch records", "event outbox", "jobs", "webhook subscriptions"],
  tests: [
    "tests/unit/kernel-outbox.test.ts",
    "tests/unit/kernel-runtime-registry.test.ts",
    "tests/unit/runtime.test.ts",
    "tests/unit/runtime-extended.test.ts",
  ],
  provides: [
    { id: "runtime:dispatch-command", kind: "command", description: "dispatch a command" },
    { id: "runtime:record-event", kind: "event", description: "append to the outbox" },
    { id: "runtime:schedule-job", kind: "api", description: "schedule background work" },
  ],
  consumesContracts: [{ id: "tenant:resolve-context", kind: "query" }],
  canonicalTruth: {
    owners: ["outbox rows", "dispatch records", "job runs"],
    derived: ["runtime-metrics", "retry projections"],
  },
  requiresApprovalFor: ["outbox-purge", "feature-flag-removal", "delivery-guarantee-downgrade"],
  sections: {
    event:
      "The outbox is the single event append point: producers write drafts, the runtime delivers them at least once, and consumers are idempotent.",
    security:
      "Dispatch resolves identity and tenant context before execution; webhook signatures are verified and replay-protected; no transport path bypasses phase 08.",
  },
});
