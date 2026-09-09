/**
 * CoreGrid Scholar — fee lifecycle adapter tests (Phase 13 consumption).
 */
import { describe, expect, it } from "vitest";
import {
  feeAccountBalance,
  feeRollForTerm,
  type SchoolFeeAccount,
} from "../../frontend/src/lib/runtime/scholar-fee-lifecycle";

const account = (overrides: Partial<SchoolFeeAccount> = {}): SchoolFeeAccount => ({
  id: "f1",
  name: "First term tuition",
  term: "2026/2027 · First",
  amountMinor: 150000,
  currency: "NGN",
  paidMinor: 0,
  dueDate: null,
  ...overrides,
});

describe("fee lifecycle (kernel money + obligation status)", () => {
  it("marks unpaid open, partial and paid accounts", () => {
    expect(feeAccountBalance(account()).status).toBe("open");
    expect(feeAccountBalance(account({ paidMinor: 60000 })).status).toBe("partial");
    expect(feeAccountBalance(account({ paidMinor: 150000 })).status).toBe("paid");
  });

  it("marks overdue after the due date and keeps partial before it", () => {
    const due = account({ dueDate: "2026-01-15", paidMinor: 30000 });
    expect(feeAccountBalance(due, "2026-01-10T10:00:00Z").status).toBe("partial");
    expect(feeAccountBalance(due, "2026-01-20T10:00:00Z").status).toBe("overdue");
  });

  it("reports the correct remaining balance in minor units", () => {
    expect(feeAccountBalance(account({ paidMinor: 45000 })).balanceMinor).toBe(105000);
    expect(feeAccountBalance(account({ paidMinor: 150000 })).balanceMinor).toBe(0);
  });

  it("rejects invalid accounts (no currency, overpayment)", () => {
    expect(() => feeAccountBalance(account({ currency: "" }))).toThrow();
    expect(() => feeAccountBalance(account({ paidMinor: 200000 }))).toThrow();
  });

  it("rolls a term with per-account statuses", () => {
    const roll = feeRollForTerm(
      [
        account({ id: "a", paidMinor: 150000 }),
        account({ id: "b", paidMinor: 0, dueDate: "2026-01-01" }),
      ],
      "2026-06-01T00:00:00Z",
    );
    expect(roll.find((row) => row.id === "a")?.status).toBe("paid");
    expect(roll.find((row) => row.id === "b")?.status).toBe("overdue");
  });
});
