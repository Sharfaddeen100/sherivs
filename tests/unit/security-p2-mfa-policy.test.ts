import { describe, expect, it } from "vitest";
import {
  assertAal2,
  INTERNAL_ABSOLUTE_SESSION_MS,
  INTERNAL_IDLE_TIMEOUT_MS,
  mfaRequiredFromEnv,
  satisfiesAal2,
  sessionExpiryReason,
} from "@/lib/security/mfa-policy";

describe("Security P2 MFA / session policy", () => {
  it("requires MFA by default; explicit opt-out only", () => {
    expect(mfaRequiredFromEnv(undefined)).toBe(true);
    expect(mfaRequiredFromEnv("")).toBe(true);
    expect(mfaRequiredFromEnv("true")).toBe(true);
    expect(mfaRequiredFromEnv("false")).toBe(false);
    expect(mfaRequiredFromEnv(" OFF ")).toBe(false);
  });
  it("accepts only aal2 when required", () => {
    expect(satisfiesAal2("aal2", true)).toBe(true);
    expect(satisfiesAal2("aal1", true)).toBe(false);
    expect(satisfiesAal2(undefined, true)).toBe(false);
    expect(satisfiesAal2("aal1", false)).toBe(true);
    expect(() => assertAal2({ aal: "aal1" }, true)).toThrow(/MFA required/);
    expect(() => assertAal2({ aal: "aal2" }, true)).not.toThrow();
  });
  it("expires idle and over-long sessions", () => {
    const t = 1_000_000_000;
    expect(sessionExpiryReason({ nowMs: t, lastActivityMs: t, sessionStartMs: t })).toBeNull();
    expect(
      sessionExpiryReason({
        nowMs: t + INTERNAL_IDLE_TIMEOUT_MS,
        lastActivityMs: t,
        sessionStartMs: t,
      }),
    ).toBe("idle");
    expect(
      sessionExpiryReason({
        nowMs: t + INTERNAL_ABSOLUTE_SESSION_MS,
        lastActivityMs: t + INTERNAL_ABSOLUTE_SESSION_MS,
        sessionStartMs: t,
      }),
    ).toBe("absolute");
  });
});
