/**
 * Phase 13 — Financial System contract (seeded authoring).
 *
 * Money, fees, payments, controls and settlements with provider adapters,
 * idempotency and audit. Scholar's fee lifecycle is one consumer.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_13_FINANCIAL_SYSTEM = definePhaseContractFromSeed({
  id: "13",
  name: "Financial System",
  phaseDoc: "architecture/phase-13-financial-system.md",
  layer: "Commerce",
  stage: "S4",
  status: "implemented",
  owner: "13",
  capability: "financial-ledger",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "universal-identity",
    "tenancy-isolation-rls",
    "runtime-primitives",
    "security-enforcement",
  ],
  purpose:
    "Own money movement records: fee structures and lifecycle, payment intake through adapters, financial controls, and settlements with idempotency and audit.",
  ownership:
    "Single owner of the ledger-adjacent money model: fee states, payment records, control totals, settlement records and reconciliation evidence.",
  boundaryStatement:
    "The financial system owns money records, never payment-provider internals or domain pricing policy; providers are reached only through adapters and frontend payment state is never trusted.",
  excludes: [
    "provider-sdks-and-secrets (adapters)",
    "pricing-policy-of-domains (consuming phases)",
    "autonomous-economy (phase 49)",
  ],
  principle:
    "Money is recorded once: every intake is idempotent, signature-verified where a provider is involved, and reconcilable from canonical records alone.",
  dependsOn: ["01", "02", "03", "05", "08"],
  consumers: ["27", "49"],
  substrates: ["fee records", "payment records", "control totals", "settlement records"],
  tests: [
    "tests/unit/financial-core.test.ts",
    "tests/unit/financial-payments.test.ts",
    "tests/unit/financial-controls.test.ts",
    "tests/unit/financial-settlements.test.ts",
  ],
  provides: [
    { id: "financial:record-payment", kind: "command", description: "record an intake" },
    { id: "financial:fee-state", kind: "query", description: "resolve fee lifecycle state" },
    { id: "financial:reconcile", kind: "api", description: "reconcile controls" },
  ],
  consumesContracts: [
    { id: "security:authorize", kind: "api" },
    { id: "runtime:dispatch-command", kind: "command" },
  ],
  canonicalTruth: {
    owners: ["payment records", "fee states", "settlement records"],
    derived: ["revenue projections", "collection forecasts"],
  },
  requiresApprovalFor: ["refund", "fee-write-off", "ledger-adjustment", "provider-key-rotation"],
  sections: {
    security:
      "Payment webhooks verify signatures, apply replay protection and are idempotent; ownership is validated against the tenant before any fee state changes.",
  },
});
