/**
 * Sherivs Scholar — fee lifecycle adapter (Phase 13 consumption, R-21).
 *
 * Scholar CONSUMES the domain-neutral Phase-13 financial core. This module
 * computes a school fee account's balance and obligation status using only the
 * kernel money primitives (`money`, `subtractMoney`, `compareMoney`,
 * `isZeroMoney`) and the kernel `ObligationStatus` vocabulary. Scholar adds
 * its own terms/fields; it never re-implements money math.
 */
import {
  compareMoney,
  isZeroMoney,
  money,
  subtractMoney,
  type Money,
  type ObligationStatus,
} from "@/lib/financial-core";

export interface SchoolFeeAccount {
  id: string;
  name: string;
  term: string;
  amountMinor: number;
  currency: string;
  paidMinor: number;
  /** ISO date the fee falls due (optional). */
  dueDate?: string | null;
}

export interface FeeBalanceResult {
  accountId: string;
  balanceMinor: number;
  status: ObligationStatus;
}

function assertSameCurrency(account: SchoolFeeAccount): void {
  if (!account.currency || account.currency.trim() === "") {
    throw new Error("fee account requires a currency");
  }
}

/** Balance + kernel obligation status for a fee account (on a given day). */
export function feeAccountBalance(
  account: SchoolFeeAccount,
  today = new Date().toISOString(),
): FeeBalanceResult {
  assertSameCurrency(account);
  if (account.paidMinor > account.amountMinor) {
    throw new Error("paidMinor cannot exceed amountMinor on a fee account");
  }
  const amount = money(account.amountMinor, account.currency);
  const paid = money(account.paidMinor, account.currency);
  const balance = subtractMoney(amount, paid);

  let status: ObligationStatus;
  if (isZeroMoney(balance)) {
    status = "paid";
  } else if (account.dueDate && today.slice(0, 10) > account.dueDate.slice(0, 10)) {
    status = "overdue";
  } else if (compareMoney(paid, money(0, account.currency)) > 0) {
    status = "partial";
  } else {
    status = "open";
  }

  return { accountId: account.id, balanceMinor: balance.amountMinor, status };
}

/** Convenience per-term rollup (status per account). */
export function feeRollForTerm(
  accounts: readonly SchoolFeeAccount[],
  today?: string,
): Array<{ id: string; name: string; status: ObligationStatus; balanceMinor: number }> {
  return accounts.map((account) => {
    const balance = feeAccountBalance(account, today);
    return {
      id: account.id,
      name: account.name,
      status: balance.status,
      balanceMinor: balance.balanceMinor,
    };
  });
}
