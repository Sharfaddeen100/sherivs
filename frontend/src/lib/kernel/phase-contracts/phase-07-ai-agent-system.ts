/**
 * Phase 07 — AI Agent System contract (seeded authoring).
 *
 * Auditable agents: identity, capability grants, tool permissions, memory
 * scope, task and plan execution, with human approval gates. Per AGENTS.md,
 * agents are untrusted by default and may never expand their own permissions.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_07_AI_AGENT_SYSTEM = definePhaseContractFromSeed({
  id: "07",
  name: "AI Agent System",
  phaseDoc: "architecture/phase-07-ai-agent-system.md",
  layer: "Intelligence",
  stage: "S3",
  status: "implemented",
  owner: "07",
  capability: "agent-runtime",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "runtime-primitives",
  ],
  purpose:
    "Run agents as governed identities: declare capabilities, tools, memory scope and approval gates; execute tasks and plans; record every action so autonomy remains observable and revocable.",
  ownership:
    "Single owner of the agent runtime: agent identity registration, capability and tool grants, memory scope, task/plan execution and agent audit.",
  boundaryStatement:
    "The agent runtime owns governed autonomy, never model access or domain rules. It never lets an agent expand its own permissions, reach another tenant or mutate canonical truth without approval.",
  excludes: [
    "model-gateway-ownership (phase 26)",
    "authorization-decisions (phase 08)",
    "domain-rules (consuming runtime)",
    "memory-civilization-ownership (phase 36)",
  ],
  principle:
    "Agents are identities with declared scopes: an agent may analyse, propose and execute within its grant — never beyond it, and never silently.",
  dependsOn: ["01", "02", "03", "05"],
  consumers: ["26", "35", "47", "50"],
  substrates: ["agent registry", "agent memory", "agent tasks", "agent plans"],
  tests: [
    "tests/unit/agent-core.test.ts",
    "tests/unit/agent-memory.test.ts",
    "tests/unit/agent-tasks.test.ts",
    "tests/unit/agent-plans.test.ts",
  ],
  provides: [
    { id: "agent:register", kind: "command", description: "register an agent identity" },
    { id: "agent:run-task", kind: "command", description: "execute a granted task" },
    { id: "agent:audit-trail", kind: "query", description: "read agent actions" },
  ],
  consumesContracts: [
    { id: "identity:register-actor", kind: "command" },
    { id: "runtime:schedule-job", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["agent registry", "agent grants", "agent audit trail"],
    derived: ["agent plans", "agent memory summaries", "agent recommendations"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "agent-permission-expansion",
    "tool-grant",
    "memory-scope-change",
    "irreversible-action",
  ],
  sections: {
    aiSafety:
      "Agent output is untrusted until validated: critical actions follow proposal → validation → policy check → approval → execution → audit, and permission expansion is impossible by construction.",
    observability:
      "Every agent action carries actor identity, grant, tool, tenant and outcome, so autonomy can be reviewed, suspended or retired at any time.",
  },
});
