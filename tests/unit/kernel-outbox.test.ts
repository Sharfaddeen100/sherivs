/**
 * Sherivs — Phase 33 Universal Kernel: event outbox state-machine tests.
 */

import { describe, expect, it } from "vitest";
import { canRequeue, decideRetry, isTerminalEventState, nextEventState } from "@/lib/kernel/outbox";

describe("kernel outbox — transitions", () => {
  it("moves pending → published on publish", () => {
    expect(nextEventState("pending", "publish", 0, 3)).toBe("published");
  });

  it("acknowledges a published event on success", () => {
    expect(nextEventState("published", "acknowledge", 0, 3)).toBe("acknowledged");
  });

  it("moves a failed delivery back to pending when attempts remain", () => {
    expect(nextEventState("failed", "requeue", 1, 3)).toBe("pending");
  });

  it("moves a failed delivery to dead when attempts are exhausted", () => {
    expect(nextEventState("published", "fail", 2, 3)).toBe("dead");
    expect(nextEventState("failed", "fail", 3, 3)).toBe("dead");
  });

  it("never transitions terminal states", () => {
    expect(nextEventState("acknowledged", "requeue", 0, 3)).toBeNull();
    expect(nextEventState("dead", "retire", 0, 3)).toBeNull();
    expect(isTerminalEventState("acknowledged")).toBe(true);
    expect(isTerminalEventState("dead")).toBe(true);
    expect(isTerminalEventState("pending")).toBe(false);
  });

  it("rejects invalid actions for the current state", () => {
    expect(nextEventState("pending", "acknowledge", 0, 3)).toBeNull();
    expect(nextEventState("published", "requeue", 0, 3)).toBeNull();
  });
});

describe("kernel outbox — bounded retry", () => {
  it("requeues only failed events with attempts remaining", () => {
    expect(canRequeue("failed", 1, 3)).toBe(true);
    expect(canRequeue("failed", 3, 3)).toBe(false);
    expect(canRequeue("published", 1, 3)).toBe(false);
    expect(canRequeue("dead", 0, 3)).toBe(false);
  });

  it("decides retry with explicit reasons", () => {
    expect(decideRetry("failed", 1, 3)).toEqual({ retry: true, nextAttempts: 2 });
    expect(decideRetry("failed", 3, 3)).toEqual({ retry: false, reason: "max_attempts_reached" });
    expect(decideRetry("pending", 0, 3)).toEqual({ retry: false, reason: "not_failed" });
    expect(decideRetry("dead", 0, 3)).toEqual({ retry: false, reason: "terminal" });
  });
});
