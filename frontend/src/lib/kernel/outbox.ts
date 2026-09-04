/**
 * CoreGrid — Phase 33 Universal Kernel: event outbox delivery state machine.
 *
 * Pure logic over the `cg_event` delivery states (`kernel/reality.ts`). A
 * server function records an event with `state = 'pending'`; this module
 * governs every later transition so delivery intent is explicit, idempotency-
 * aware and bounded (phase-01 §51 idempotency / §63 retry). It performs no
 * persistence and owns no state.
 */

import type { EventDeliveryState } from "./reality";

export type OutboxAction =
  | "enqueue" // initial record -> pending
  | "publish" // attempt delivery -> published
  | "acknowledge" // delivered successfully -> acknowledged
  | "fail" // delivery failed -> failed (or dead when retries exhausted)
  | "requeue" // retry -> pending (when attempts remain)
  | "retire"; // give up -> dead

export const TERMINAL_EVENT_STATES: readonly EventDeliveryState[] = [
  "acknowledged",
  "dead",
] as const;

export function isTerminalEventState(state: EventDeliveryState): boolean {
  return (TERMINAL_EVENT_STATES as readonly EventDeliveryState[]).includes(state);
}

/**
 * Next state for an action, or null when the action is invalid for the state.
 * A failed delivery becomes `dead` when `attempts >= maxAttempts`; otherwise
 * the caller requeues to `pending` and increments attempts.
 */
export function nextEventState(
  state: EventDeliveryState,
  action: OutboxAction,
  attempts: number,
  maxAttempts: number,
): EventDeliveryState | null {
  switch (state) {
    case "pending":
      if (action === "publish") return "published";
      if (action === "fail") return attempts + 1 >= maxAttempts ? "dead" : "failed";
      return null;
    case "published":
      if (action === "acknowledge") return "acknowledged";
      if (action === "fail") return attempts + 1 >= maxAttempts ? "dead" : "failed";
      return null;
    case "failed":
      if (action === "requeue") return "pending";
      if (action === "retire") return "dead";
      if (action === "fail") return attempts + 1 >= maxAttempts ? "dead" : "failed";
      return null;
    default:
      // acknowledged/dead are terminal: no further transitions.
      return null;
  }
}

/** Whether a failed delivery may be retried (attempts remaining). */
export function canRequeue(
  state: EventDeliveryState,
  attempts: number,
  maxAttempts: number,
): boolean {
  if (state !== "failed") return false;
  if (maxAttempts <= 0) return false;
  return attempts < maxAttempts;
}

/** Bounded, observable retry decision with an explicit reason. */
export type RetryDecision =
  | { retry: true; nextAttempts: number }
  | { retry: false; reason: "max_attempts_reached" | "not_failed" | "terminal" };

export function decideRetry(
  state: EventDeliveryState,
  attempts: number,
  maxAttempts: number,
): RetryDecision {
  if (isTerminalEventState(state)) {
    return { retry: false, reason: "terminal" };
  }
  if (state !== "failed") {
    return { retry: false, reason: "not_failed" };
  }
  if (!canRequeue(state, attempts, maxAttempts)) {
    return { retry: false, reason: "max_attempts_reached" };
  }
  return { retry: true, nextAttempts: attempts + 1 };
}
