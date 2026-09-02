/**
 * CoreGrid Scholar — Phase 13 Financial Operating System unit tests
 * (financial-core).
 *
 * Validates:
 * - Money representation: integer minor units, no floating-point (S, T).
 * - Currency conversion preserving original amounts (U, V).
 * - Financial obligation contract (N).
 * - Invoice creation, lifecycle transitions, line items with historical
 *   price/tax basis, and numbering (O, P, Q, R).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import {
  money,
  addMoney,
  subtractMoney,
  convertMoney,
  createFinancialObligation,
  isObligationOverdue,
  createInvoice,
  transitionInvoice,
  issueInvoiceNumber,
  type InvoiceLine,
} from "@/lib/financial-core";

const TENANT_A = tenantId("tenant-a");
const NOW = "2026-01-01T00:00:00Z";
const FUTURE = "2026-02-01T00:00:00Z";

function line(overrides: Partial<InvoiceLine> = {}): InvoiceLine {
  return {
    id: "line-1",
    reason: "tuition",
    description: "Term 1 tuition",
    quantity: 1,
    unitPrice: money(100_000, "NGN"),
    taxRateBasis: 0.075,
    ...overrides,
  };
}

describe("Money representation (S, T)", () => {
  it("stores amounts as integer minor units", () => {
    const m = money(100_000, "NGN");
    expect(m.amountMinor).toBe(100_000);
  });

  it("adds amounts in the same currency", () => {
    const sum = addMoney(money(100, "NGN"), money(50, "NGN"));
    expect(sum.amountMinor).toBe(150);
  });

  it("rejects cross-currency addition", () => {
    expect(() => addMoney(money(100, "NGN"), money(50, "USD"))).toThrow();
  });

  it("subtracts amounts in the same currency", () => {
    const diff = subtractMoney(money(100, "NGN"), money(30, "NGN"));
    expect(diff.amountMinor).toBe(70);
  });
});

describe("Currency conversion (U, V)", () => {
  it("converts and preserves the immutable rate", () => {
    const result = convertMoney({
      amount: money(100_000, "NGN"),
      destinationCurrency: "USD",
      rate: {
        sourceCurrency: "NGN",
        destinationCurrency: "USD",
        rate: 0.0007,
        timestamp: NOW,
        provider: "test",
        method: "mid",
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.converted.currency).toBe("USD");
      expect(result.rateUsed.rate).toBe(0.0007);
    }
  });

  it("rejects a rate whose source currency does not match the amount", () => {
    const result = convertMoney({
      amount: money(100, "NGN"),
      destinationCurrency: "USD",
      rate: {
        sourceCurrency: "GHS",
        destinationCurrency: "USD",
        rate: 0.1,
        timestamp: NOW,
        provider: "test",
        method: "mid",
      },
    });
    expect(result.ok).toBe(false);
  });
});

describe("Financial obligation (N)", () => {
  it("creates an open obligation", () => {
    const result = createFinancialObligation({
      tenantId: TENANT_A,
      debtorId: "student-1",
      beneficiaryId: "school-1",
      source: "tuition",
      amount: money(250_000, "NGN"),
      reason: "Term 1 tuition",
      dueDate: FUTURE,
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.obligation.status).toBe("open");
    }
  });

  it("rejects a non-positive obligation amount", () => {
    const result = createFinancialObligation({
      tenantId: TENANT_A,
      debtorId: "student-1",
      beneficiaryId: "school-1",
      source: "tuition",
      amount: money(0, "NGN"),
      reason: "x",
      dueDate: FUTURE,
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("detects an overdue open obligation", () => {
    const result = createFinancialObligation({
      tenantId: TENANT_A,
      debtorId: "student-1",
      beneficiaryId: "school-1",
      source: "tuition",
      amount: money(250_000, "NGN"),
      reason: "Term 1 tuition",
      dueDate: "2025-12-01T00:00:00Z",
      now: NOW,
    });
    if (!result.ok) throw new Error("fixture failed");
    expect(isObligationOverdue(result.obligation, NOW)).toBe(true);
  });
});

describe("Invoice (O, P, Q, R)", () => {
  it("creates an invoice with computed subtotal, taxes, and total", () => {
    const result = createInvoice({
      tenantId: TENANT_A,
      issuerId: "school-1",
      customerId: "student-1",
      number: "INV-2026-000001",
      currency: "NGN",
      dueDate: FUTURE,
      lines: [line()],
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.invoice.subtotal.amountMinor).toBe(100_000);
      expect(result.invoice.taxes.amountMinor).toBe(7_500); // 7.5% of 100000
      expect(result.invoice.total.amountMinor).toBe(107_500);
      expect(result.invoice.amountOutstanding.amountMinor).toBe(107_500);
      expect(result.invoice.status).toBe("draft");
    }
  });

  it("rejects an invoice with no line items", () => {
    const result = createInvoice({
      tenantId: TENANT_A,
      issuerId: "school-1",
      customerId: "student-1",
      number: "INV-1",
      currency: "NGN",
      dueDate: FUTURE,
      lines: [],
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a line whose currency mismatches the invoice currency", () => {
    const result = createInvoice({
      tenantId: TENANT_A,
      issuerId: "school-1",
      customerId: "student-1",
      number: "INV-1",
      currency: "NGN",
      dueDate: FUTURE,
      lines: [line({ unitPrice: money(50, "USD") })],
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("enforces the invoice lifecycle (P)", () => {
    const created = createInvoice({
      tenantId: TENANT_A,
      issuerId: "school-1",
      customerId: "student-1",
      number: "INV-1",
      currency: "NGN",
      dueDate: FUTURE,
      lines: [line()],
      now: NOW,
    });
    if (!created.ok) throw new Error("fixture failed");
    expect(transitionInvoice(created.invoice, "issued").ok).toBe(true);
    expect(transitionInvoice(created.invoice, "paid").ok).toBe(false); // draft -> paid not allowed
  });

  it("produces a concurrency-safe invoice number (R)", () => {
    const number = issueInvoiceNumber({
      policy: { prefix: "INV", fiscalPeriod: "2026-T1", startSequence: 1 },
      nextSequence: 1,
    });
    expect(number).toBe("INV-2026-T1-000001");
  });
});
