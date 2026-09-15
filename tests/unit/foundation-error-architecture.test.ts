/**
 * CoreGrid — Phase 01 Foundation: error architecture behaviour proofs (P01-2).
 *
 * The Phase 01 document requires errors to be structured, traceable, safe and
 * actionable, and to never leak secrets, SQL internals, private data or stack
 * traces to users (§49, AGENTS.md 35). The acceptance probe classified the area
 * DECLARED because the modules existed with nothing executable proving behaviour.
 *
 * These tests prove the two real implementations:
 *
 *  - `frontend/src/lib/error-capture.ts` — bounded, out-of-band capture so a
 *    swallowed h3 500 can still be diagnosed, consumed exactly once;
 *  - `frontend/src/lib/platform-error-reporting.ts` — the error-boundary bridge:
 *    a safe no-op off the browser, and a classified, route-tagged report on it.
 *
 * The unit environment is node (no browser), so the capture path is exercised
 * through a stubbed listener registrar and a freshly imported module instance —
 * the real code path, not a simulation.
 */
import { describe, expect, it, vi, afterEach } from "vitest";

import { reportPlatformError } from "@/lib/platform-error-reporting";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function loadErrorCapture() {
  const handlers = new Map<string, (event: unknown) => void>();
  vi.stubGlobal("addEventListener", (type: string, handler: (event: unknown) => void) => {
    handlers.set(type, handler);
  });
  vi.resetModules();
  const module = await import("@/lib/error-capture");
  return { module, handlers };
}

describe("Phase 01 — error architecture: bounded out-of-band capture (§49)", () => {
  it("captures a thrown error and consumes it exactly once", async () => {
    const error = new Error("database unavailable");
    const { module, handlers } = await loadErrorCapture();

    handlers.get("error")?.({ error });

    expect(module.consumeLastCapturedError()).toBe(error);
    // A consumed diagnostic must not be replayed: no stale leakage.
    expect(module.consumeLastCapturedError()).toBeUndefined();
  });

  it("captures unhandled rejections as well as thrown errors", async () => {
    const reason = new Error("promise rejected");
    const { module, handlers } = await loadErrorCapture();

    handlers.get("unhandledrejection")?.({ reason });

    expect(module.consumeLastCapturedError()).toBe(reason);
  });

  it("expires a stale diagnostic instead of reporting yesterday's fault", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T10:00:00.000Z"));
    const stale = new Error("stale fault");
    const { module, handlers } = await loadErrorCapture();

    handlers.get("error")?.({ error: stale });
    vi.advanceTimersByTime(5_001);

    expect(module.consumeLastCapturedError()).toBeUndefined();
  });

  it("returns undefined when nothing was captured", async () => {
    const { module } = await loadErrorCapture();

    expect(module.consumeLastCapturedError()).toBeUndefined();
  });
});

describe("Phase 01 — error architecture: the report bridge is safe and structured", () => {
  it("is a no-op when there is no browser at all (never throws)", () => {
    expect(() => reportPlatformError(new Error("boom"))).not.toThrow();
  });

  it("is a no-op when the platform error collector is absent (never throws)", () => {
    vi.stubGlobal("window", { location: { pathname: "/command" } });

    expect(() => reportPlatformError(new Error("boom"))).not.toThrow();
  });

  it("forwards a classified, route-tagged report to the collector", () => {
    const captureException = vi.fn();
    vi.stubGlobal("window", {
      location: { pathname: "/command" },
      __platformEvents: { captureException },
    });

    reportPlatformError(new Error("rubric failed"), { surface: "lesson-plan" });

    expect(captureException).toHaveBeenCalledTimes(1);
    const [error, context, options] = captureException.mock.calls[0] ?? [];
    expect(error).toBeInstanceOf(Error);
    expect(context).toMatchObject({
      source: "react_error_boundary",
      surface: "lesson-plan",
      route: "/command",
    });
    expect(options).toEqual({
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    });
  });
});
