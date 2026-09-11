/**
 * Phase 22 — Mobile Platform contract (seeded authoring).
 *
 * The mobile client capability: device profiles, offline behaviour, push and
 * client observability, so any runtime can reach people on a phone without
 * embedding a domain in the client.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_22_MOBILE_PLATFORM = definePhaseContractFromSeed({
  id: "22",
  name: "Mobile Platform",
  phaseDoc: "architecture/phase-22-mobile-platform.md",
  layer: "Global",
  stage: "S6",
  status: "implementing",
  owner: "22",
  capability: "mobile-client-platform",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "workspace-composition",
    "security-enforcement",
  ],
  purpose:
    "Own the mobile client capability: resolve device and capability profiles, behave correctly offline, deliver push through adapters and report client health.",
  ownership:
    "Single owner of client capability profiles, offline queueing semantics, push delivery records and client observability signals.",
  boundaryStatement:
    "The mobile platform owns how a client behaves, never what a domain means, and the client is never a security boundary — server enforcement remains mandatory.",
  excludes: [
    "domain-surfaces (consuming runtimes)",
    "web-client-behaviour (phase 23)",
    "authorization-decisions (phase 08)",
  ],
  principle:
    "The client is untrusted: it may cache and queue, but every queued action is re-authorized server-side and no client state is treated as canonical.",
  dependsOn: ["01", "02", "03", "05", "06", "08"],
  consumers: ["runtime:scholar"],
  substrates: ["client capability profiles", "offline queue records", "push delivery records"],
  tests: ["tests/unit/client-platform.test.ts"],
  provides: [
    { id: "mobile:resolve-capabilities", kind: "query", description: "resolve client profile" },
    { id: "mobile:queue-offline-action", kind: "command", description: "queue an offline action" },
    { id: "mobile:push-delivery-state", kind: "query", description: "read delivery state" },
  ],
  consumesContracts: [
    { id: "workspace:resolve-composition", kind: "query" },
    { id: "security:authorize", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["client capability profiles", "push delivery records (server side)"],
    derived: ["offline queue projections", "device health signals"],
  },
  requiresApprovalFor: ["push-credential-rotation", "offline-scope-expansion"],
  sections: {
    security:
      "Offline capability shrinks, never expands: queued actions re-run authorization on sync, and a revoked grant fails the queued action rather than being honoured from cache.",
  },
});
