/**
 * Phase 26 — AI Intelligence Layer contract (seeded authoring).
 *
 * The single sanctioned path to model providers: routing, context assembly,
 * privacy minimisation, cost tracking, safety and observability. No other phase
 * may call a provider directly (AGENTS §20).
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_26_AI_INTELLIGENCE = definePhaseContractFromSeed({
  id: "26",
  name: "AI Intelligence Layer",
  phaseDoc: "architecture/phase-26-ai-intelligence-layer.md",
  layer: "Intelligence",
  stage: "S8",
  status: "implementing",
  owner: "26",
  capability: "ai-intelligence-gateway",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "data-platform",
    "agent-runtime",
  ],
  purpose:
    "Own all model interaction: assemble authorized context, apply privacy minimisation and redaction, route across providers behind adapters, track cost, enforce safety limits and record every call.",
  ownership:
    "Single owner of the AI gateway: provider adapters, context assembly, prompt and output policy, routing, rate limits, cost records and AI observability.",
  boundaryStatement:
    "The gateway owns model access, never domain decisions or authorization: it cannot widen access to data, and no phase may bypass it with a direct provider call.",
  excludes: [
    "domain-intelligence (phases 11, 18, 34)",
    "agent-lifecycle-and-grants (phase 07)",
    "provider-sdks-outside-adapters",
  ],
  principle:
    "AI receives only authorized information: identity → authorization → classification → purpose check → minimisation → redaction → context → model, and output is untrusted until validated.",
  dependsOn: ["01", "02", "03", "05", "07", "14"],
  consumers: ["07", "34", "35"],
  substrates: [
    "provider registrations",
    "context assembly records",
    "cost records",
    "call audit trail",
  ],
  tests: ["tests/unit/ai.test.ts", "tests/unit/scholar-ai-operations.test.ts"],
  provides: [
    { id: "ai:invoke", kind: "api", description: "single governed model invocation" },
    { id: "ai:cost-report", kind: "query", description: "read usage and cost" },
    { id: "ai:call-audit", kind: "query", description: "read the call trail" },
  ],
  consumesContracts: [
    { id: "security:authorize", kind: "api" },
    { id: "data:classify", kind: "api" },
  ],
  canonicalTruth: {
    owners: ["cost records", "call audit trail", "provider registrations"],
    derived: ["model outputs", "summaries", "embeddings"],
  },
  asiTier: "supervised-autonomous",
  autonomyLevel: 2,
  requiresApprovalFor: [
    "provider-registration",
    "privacy-policy-relaxation",
    "cost-limit-override",
    "safety-filter-disable",
  ],
  sections: {
    aiSafety:
      "Prompts and completions are logged without secrets or unnecessary personal data; safety filters and rate limits are enforced at the gateway; output is never treated as canonical truth.",
    observability:
      "Every invocation records acting identity or agent, grant, tenant, purpose, provider, model, tokens, cost and outcome — enough to explain and audit any AI action.",
  },
});
