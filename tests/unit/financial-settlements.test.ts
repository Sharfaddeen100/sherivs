/**
 * CoreGrid Scholar — Phase 13 Financial Operating System unit tests
 * (financial-settlements).
 *
 * Validates:
 * - Reconciliation: discrepancies detected explicitly (AG, AH).
 * - Settlements with provider fees recorded separately (AI, AJ).
 * - Payment allocation: partial payments and overpayments (FF).
 * - Product creation and price versioning (G, I, J).
 * - Billing plans and subscriptions (K, L).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import { money } from "@/lib/financial-core";
import {
  reconcile,
  createSettlement,
  allocatePayment,
  createFinancialProduct,
  versionProductPrice,
  createBillingPlan,
  createSubscription,
  isSubscriptionActive,
} from "@/lib/financial-settlements";

const TENANT_A = tenantId("tenant-a");
const NOW = "2026-01-01T00:00:00Z";

describe("Reconciliation (AG, AH)", () => {
  it("matches identical provider and internal amounts", () => {
    const output = reconcile({
      tenantId: TENANT_A,
      provider: "paystack",
      providerAmount: money(107_500, "NGN"),
      internalAmount: money(107_500, "NGN"),
      now: NOW,
    });
    expect(output.matched).toBe(true);
    expect(output.record.state).toBe("matched");
  });

  it("detects discrepancies explicitly — never silently absorbed", () => {
    const output = reconcile({
      tenantId: TENANT_A,
      provider: "paystack",
      providerAmount: money(100_000, "NGN"),
      internalAmount: money(107_500, "NGN"),
      now: NOW,
    });
    expect(output.discrepancyDetected).toBe(true);
    expect(output.record.state).toBe("discrepancy");
    expect(output.record.discrepancyAmount.amountMinor).toBe(7_500);
  });
});

describe("Settlement (AI) and provider fees (AJ)", () => {
  it("records fees separately from the gross payment and computes net", () => {
    const result = createSettlement({
      tenantId: TENANT_A,
      provider: "paystack",
      grossAmount: money(100_000, "NGN"),
      fees: money(1_500, "NGN"),
      settlementDate: NOW,
      reference: "settle-1",
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.settlement.netAmount.amountMinor).toBe(98_500);
      expect(result.settlement.reconciliationState).toBe("pending");
    }
  });

  it("rejects fees exceeding the gross amount", () => {
    const result = createSettlement({
      tenantId: TENANT_A,
      provider: "paystack",
      grossAmount: money(100_000, "NGN"),
      fees: money(150_000, "NGN"),
      settlementDate: NOW,
      reference: "settle-1",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});

describe("Payment allocation (FF)", () => {
  it("allocates a partial payment", () => {
    const output = allocatePayment({
      paymentAmount: money(50_000, "NGN"),
      outstandingAmount: money(107_500, "NGN"),
    });
    if (!output.ok) throw new Error("fixture failed");
    expect(output.allocated.amountMinor).toBe(50_000);
    expect(output.overpayment.amountMinor).toBe(0);
  });

  it("reports overpayment explicitly — never silently discarded", () => {
    const output = allocatePayment({
      paymentAmount: money(120_000, "NGN"),
      outstandingAmount: money(107_500, "NGN"),
    });
    if (!output.ok) throw new Error("fixture failed");
    expect(output.allocated.amountMinor).toBe(107_500);
    expect(output.overpayment.amountMinor).toBe(12_500);
  });
});

describe("Products and pricing (G, I, J)", () => {
  it("creates a versioned product", () => {
    const result = createFinancialProduct({
      id: "product-tuition",
      tenantId: TENANT_A,
      name: "Term Tuition",
      version: 1,
      pricingModel: "fixed",
      basePrice: money(250_000, "NGN"),
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.product.version).toBe(1);
    }
  });

  it("rejects a negative price", () => {
    const result = createFinancialProduct({
      id: "product-x",
      tenantId: TENANT_A,
      name: "X",
      version: 1,
      pricingModel: "fixed",
      basePrice: money(-1, "NGN"),
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("versions a price change without rewriting the historical product (J)", () => {
    const result = createFinancialProduct({
      id: "product-tuition",
      tenantId: TENANT_A,
      name: "Term Tuition",
      version: 1,
      pricingModel: "fixed",
      basePrice: money(250_000, "NGN"),
      now: NOW,
    });
    if (!result.ok) throw new Error("fixture failed");
    const v2 = versionProductPrice(result.product, money(280_000, "NGN"), NOW);
    expect(v2.version).toBe(2);
    expect(v2.basePrice.amountMinor).toBe(280_000);
    // Historical v1 is untouched:
    expect(result.product.version).toBe(1);
    expect(result.product.basePrice.amountMinor).toBe(250_000);
  });
});

describe("Billing plans and subscriptions (K, L)", () => {
  it("creates a billing plan with an interval", () => {
    const result = createBillingPlan({
      id: "plan-1",
      tenantId: TENANT_A,
      name: "Term Plan",
      price: money(250_000, "NGN"),
      billingInterval: "academic_term",
      gracePeriodDays: 7,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.billingInterval).toBe("academic_term");
    }
  });

  it("rejects a plan without a name", () => {
    const result = createBillingPlan({
      id: "plan-1",
      tenantId: TENANT_A,
      name: "",
      price: money(100, "NGN"),
      billingInterval: "monthly",
    });
    expect(result.ok).toBe(false);
  });

  it("creates an active subscription within its period", () => {
    const result = createSubscription({
      tenantId: TENANT_A,
      customerId: "student-1",
      planId: "plan-1",
      currentPeriodStart: "2026-01-01T00:00:00Z",
      currentPeriodEnd: "2026-03-31T00:00:00Z",
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(isSubscriptionActive(result.subscription, NOW)).toBe(true);
    }
  });

  it("rejects a subscription whose period is inverted", () => {
    const result = createSubscription({
      tenantId: TENANT_A,
      customerId: "student-1",
      planId: "plan-1",
      currentPeriodStart: "2026-03-31T00:00:00Z",
      currentPeriodEnd: "2026-01-01T00:00:00Z",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});
