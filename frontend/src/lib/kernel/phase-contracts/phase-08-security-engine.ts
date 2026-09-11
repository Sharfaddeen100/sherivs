/**
 * Phase 08 — Security Engine contract (seeded authoring).
 *
 * Layered authorization: RBAC, ABAC, PBAC, ReBAC plus contextual checks,
 * producing ALLOW / DENY / REDACT / ESCALATE / REQUIRE_APPROVAL decisions that
 * every other phase consumes. Scholar's role gates are one consumer.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_08_SECURITY_ENGINE = definePhaseContractFromSeed({
  id: "08",
  name: "Security Engine",
  phaseDoc: "architecture/phase-08-security-engine.md",
  layer: "Foundations",
  stage: "S4",
  status: "implemented",
  owner: "08",
  capability: "security-enforcement",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "runtime-primitives",
  ],
  purpose:
    "Own authorization for the platform: evaluate identity, tenant, role, relationship, resource, action, policy, context and risk into one decision, and enforce it on every server surface.",
  ownership:
    "Single owner of authorization evaluation, policy sets, role gates, session and agent controls, and the security audit trail.",
  boundaryStatement:
    "The security engine owns decisions, never domain rules or surface visibility. It never trusts client-supplied roles or tenant identifiers, and the UI is never treated as enforcement.",
  excludes: [
    "domain-rules (consuming phases)",
    "tenancy-model-ownership (phase 03)",
    "zero-trust-adversarial-defense (phase 42)",
    "ai-gateway-ownership (phase 26)",
  ],
  principle:
    "Every server function authenticates, resolves tenant, authorizes, validates, executes and audits — a failure at any step denies the request.",
  dependsOn: ["01", "02", "03", "05"],
  substrates: ["policy sets", "role gates", "session records", "security audit trail"],
  tests: [
    "tests/unit/security-core.test.ts",
    "tests/unit/security-policy.test.ts",
    "tests/unit/security-risk.test.ts",
    "tests/unit/security-session.test.ts",
    "tests/unit/security-agent-controls.test.ts",
  ],
  provides: [
    { id: "security:authorize", kind: "api", description: "evaluate one decision" },
    { id: "security:require-role", kind: "api", description: "gate a server function" },
    { id: "security:audit-query", kind: "query", description: "read decisions" },
  ],
  consumesContracts: [{ id: "identity:resolve-actor", kind: "query" }],
  canonicalTruth: {
    owners: ["policy sets", "decision records", "security audit trail"],
    derived: ["risk scores", "anomaly signals"],
  },
  requiresApprovalFor: [
    "policy-relaxation",
    "role-definition-change",
    "agent-control-change",
    "audit-trail-purge",
  ],
  sections: {
    security:
      "Enforcement is layered — RLS in the database, gates in server functions, policy in the engine — and no layer may be treated as optional; the frontend is never an enforcement layer.",
  },
});
