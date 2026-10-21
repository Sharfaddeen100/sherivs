/**
 * Sherivs Scholar — Phase 13 Financial Operating System unit tests
 * (financial-payments).
 *
 * Validates:
 * - Payment intent creation and lifecycle (W, Y).
 * - Payment attempts (X).
 * - Tokenized payment methods never store raw credentials (AC, AD).
 * - Webhook verification and idempotency (AE, AF).
 * - Refunds referencing the original payment (AK).
 * - Credits and adjustments (F).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import { money } from "@/lib/financial-core";
import {
  createPaymentIntent,
  transitionPaymentIntent,
  recordPaymentAttempt,
  createTokenizedPaymentMethod,
  verifyWebhook,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
  createRefund,
  transitionRefund,
  createFinancialCredit,
  applyCredit,
  createFinancialAdjustment,
  type PaymentIntent,
  type WebhookIdempotencyState,
  type Refund,
  type FinancialCredit,
} from "@/lib/financial-payments";

const TENANT_A = tenantId("tenant-a");
const NOW = "2026-01-01T00:00:00Z";

function makeIntent(overrides: Partial<PaymentIntent> = {}): PaymentIntent {
  const created = createPaymentIntent({
    tenantId: TENANT_A,
    invoiceId: "invoice-1",
    amount: money(107_500, "NGN"),
    customerId: "student-1",
    now: NOW,
  });
  if (!created.ok) throw new Error("fixture failed");
  return { ...created.intent, ...overrides };
}

describe("Payment intent (W, Y)", () => {
  it("creates a payment intent in the created state", () => {
    const intent = makeIntent();
    expect(intent.status).toBe("created");
    expect(intent.amount.amountMinor).toBe(107_500);
  });

  it("rejects a non-positive intent amount", () => {
    const result = createPaymentIntent({
      tenantId: TENANT_A,
      invoiceId: "invoice-1",
      amount: money(0, "NGN"),
      customerId: "student-1",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("moves created -> requires_payment_method -> processing -> succeeded", () => {
    const intent = makeIntent();
    const step1 = transitionPaymentIntent(intent, "requires_payment_method");
    if (!step1.ok) throw new Error("step1 failed");
    const step2 = transitionPaymentIntent(step1.intent, "processing");
    if (!step2.ok) throw new Error("step2 failed");
    const step3 = transitionPaymentIntent(step2.intent, "succeeded");
    expect(step3.ok).toBe(true);
  });

  it("rejects an invalid transition (created -> succeeded)", () => {
    const result = transitionPaymentIntent(makeIntent(), "succeeded");
    expect(result.ok).toBe(false);
  });

  it("a succeeded intent is terminal", () => {
    const intent = makeIntent({ status: "succeeded" });
    expect(transitionPaymentIntent(intent, "processing").ok).toBe(false);
  });
});

describe("Payment attempt (X)", () => {
  it("records an attempt with an attempt number and provider", () => {
    const result = recordPaymentAttempt({
      intentId: "intent-1",
      tenantId: TENANT_A,
      attemptNumber: 1,
      provider: "paystack",
      amount: money(107_500, "NGN"),
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.attempt.status).toBe("pending");
      expect(result.attempt.provider).toBe("paystack");
    }
  });

  it("rejects an attempt without a provider", () => {
    const result = recordPaymentAttempt({
      intentId: "intent-1",
      tenantId: TENANT_A,
      attemptNumber: 1,
      provider: "",
      amount: money(100, "NGN"),
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});

describe("Tokenized payment methods (AC, AD)", () => {
  it("stores only a provider token, never raw credentials", () => {
    const result = createTokenizedPaymentMethod({
      tenantId: TENANT_A,
      customerId: "student-1",
      kind: "card",
      provider: "paystack",
      token: "tok_abc123",
      maskedMetadata: "•••• 4242",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.method.token).toBe("tok_abc123");
      expect("cardNumber" in result.method).toBe(false);
      expect("cvv" in result.method).toBe(false);
    }
  });

  it("rejects a method without a token", () => {
    const result = createTokenizedPaymentMethod({
      tenantId: TENANT_A,
      customerId: "student-1",
      kind: "card",
      provider: "paystack",
      token: "",
    });
    expect(result.ok).toBe(false);
  });
});

describe("Webhook verification and idempotency (AE, AF)", () => {
  it("rejects a webhook with an invalid signature", () => {
    const result = verifyWebhook({ provider: "paystack", eventId: "evt-1", signatureValid: false });
    expect(result.ok).toBe(false);
  });

  it("verifies a webhook with a valid signature", () => {
    const result = verifyWebhook({ provider: "paystack", eventId: "evt-1", signatureValid: true });
    expect(result.ok).toBe(true);
  });

  it("never processes a duplicate webhook event (AF)", () => {
    const state: WebhookIdempotencyState = { processedEventIds: new Set() };
    markWebhookEventProcessed("evt-1", state);
    expect(isWebhookEventProcessed("evt-1", state)).toBe(true);
    expect(isWebhookEventProcessed("evt-2", state)).toBe(false);
  });
});

describe("Refunds (AK)", () => {
  function makeRefund(overrides: Partial<Refund> = {}): Refund {
    const created = createRefund({
      tenantId: TENANT_A,
      originalPaymentReference: "pay-ref-1",
      amount: money(50_000, "NGN"),
      reason: "Duplicate payment",
      now: NOW,
    });
    if (!created.ok) throw new Error("fixture failed");
    return { ...created.refund, ...overrides };
  }

  it("references the original payment", () => {
    const refund = makeRefund();
    expect(refund.originalPaymentReference).toBe("pay-ref-1");
    expect(refund.status).toBe("requested");
  });

  it("rejects a refund without the original payment reference", () => {
    const result = createRefund({
      tenantId: TENANT_A,
      originalPaymentReference: "",
      amount: money(100, "NGN"),
      reason: "x",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("processes a requested refund", () => {
    const result = transitionRefund(makeRefund(), "processed", NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.refund.processedAt).toBe(NOW);
    }
  });

  it("a processed refund is terminal", () => {
    const refund = makeRefund({ status: "processed" });
    expect(transitionRefund(refund, "cancelled", NOW).ok).toBe(false);
  });
});

describe("Credits and adjustments (F)", () => {
  function makeCredit(overrides: Partial<FinancialCredit> = {}): FinancialCredit {
    const created = createFinancialCredit({
      tenantId: TENANT_A,
      customerId: "student-1",
      amount: money(25_000, "NGN"),
      reason: "Refund credit",
      now: NOW,
    });
    if (!created.ok) throw new Error("fixture failed");
    return { ...created.credit, ...overrides };
  }

  it("creates a credit with a remaining balance equal to the amount", () => {
    const credit = makeCredit();
    expect(credit.remaining.amountMinor).toBe(25_000);
  });

  it("applies a credit partially and never over-applies", () => {
    const credit = makeCredit();
    const partial = applyCredit(credit, money(10_000, "NGN"));
    if (!partial.ok) throw new Error("partial failed");
    expect(partial.credit.remaining.amountMinor).toBe(15_000);

    const over = applyCredit(makeCredit(), money(50_000, "NGN"));
    expect(over.ok).toBe(false);
  });

  it("creates an adjustment with a reason", () => {
    const result = createFinancialAdjustment({
      tenantId: TENANT_A,
      invoiceId: "invoice-1",
      kind: "discount",
      amount: money(5_000, "NGN"),
      reason: "Early payment discount",
      createdBy: "admin-1",
      now: NOW,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a zero adjustment", () => {
    const result = createFinancialAdjustment({
      tenantId: TENANT_A,
      invoiceId: "invoice-1",
      kind: "correction",
      amount: money(0, "NGN"),
      reason: "x",
      createdBy: "admin-1",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});
