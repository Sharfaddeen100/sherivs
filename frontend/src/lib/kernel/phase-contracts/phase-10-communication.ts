/**
 * Phase 10 — Communication Platform contract (seeded authoring).
 *
 * Conversations, channels, templates and delivery: the messaging substrate every
 * runtime uses to reach people, with policy on who may address whom.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_10_COMMUNICATION = definePhaseContractFromSeed({
  id: "10",
  name: "Communication Platform",
  phaseDoc: "architecture/phase-10-communication-platform.md",
  layer: "Runtime",
  stage: "S4",
  status: "implemented",
  owner: "10",
  capability: "communication-messaging",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "runtime-primitives",
    "security-enforcement",
  ],
  purpose:
    "Own messaging: conversations and participants, channels and broadcasts, templates, delivery state and read tracking, with policy on audience reach.",
  ownership:
    "Single owner of conversation state, channel definitions, message templates, delivery records and unread/read semantics.",
  boundaryStatement:
    "Communication owns how messages are composed and delivered, never the domain reason for them, and it never broadcasts across tenants or beyond an authorized audience.",
  excludes: [
    "notification-policy-of-domains (consuming phases)",
    "provider-sdks (adapters only)",
    "human-interface-layer (phase 50)",
  ],
  principle:
    "Every message has an authorized audience, a recorded sender and an auditable delivery path; no broadcast bypasses audience resolution.",
  dependsOn: ["01", "02", "03", "05", "08"],
  consumers: ["24", "43"],
  substrates: ["conversations", "participants", "channels", "templates", "delivery records"],
  tests: [
    "tests/unit/communication-core.test.ts",
    "tests/unit/communication-conversation.test.ts",
    "tests/unit/communication-channels.test.ts",
    "tests/unit/communication-templates.test.ts",
  ],
  provides: [
    { id: "communication:send", kind: "command", description: "send to an audience" },
    { id: "communication:resolve-thread", kind: "query", description: "read a conversation" },
    { id: "communication:render-template", kind: "api", description: "render a message" },
  ],
  consumesContracts: [
    { id: "identity:resolve-actor", kind: "query" },
    { id: "security:authorize", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["conversations", "messages", "delivery records"],
    derived: ["engagement summaries", "recommended audiences"],
  },
  requiresApprovalFor: ["platform-wide-broadcast", "template-policy-change", "audience-export"],
  sections: {
    tenancy:
      "Audience resolution is tenant-scoped and RLS-backed; a channel cannot reach another tenant's members, and cross-tenant messaging requires an explicit federation policy.",
  },
});
