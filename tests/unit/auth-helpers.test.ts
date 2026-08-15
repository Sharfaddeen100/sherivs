import { describe, expect, it } from "vitest";
import {
  PASSWORD_RESET_RATE_LIMIT,
  formatDuration,
  passwordResetRetryAfterMs,
  tokenMsRemaining,
} from "../../frontend/src/lib/auth-helpers";

describe("passwordResetRetryAfterMs", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it("allows the first request immediately", () => {
    expect(passwordResetRetryAfterMs([], now)).toBe(0);
  });

  it("allows up to maxRequests within the window", () => {
    const attempts = Array.from({ length: PASSWORD_RESET_RATE_LIMIT.maxRequests - 1 }, () => ({
      created_at: new Date(now.getTime() - 60_000).toISOString(),
    }));
    expect(passwordResetRetryAfterMs(attempts, now)).toBe(0);
  });

  it("blocks once the limit is reached and returns positive retry-after", () => {
    const attempts = Array.from({ length: PASSWORD_RESET_RATE_LIMIT.maxRequests }, (_, i) => ({
      created_at: new Date(now.getTime() - (i + 1) * 60_000).toISOString(),
    }));
    const wait = passwordResetRetryAfterMs(attempts, now);
    expect(wait).toBeGreaterThan(0);
    expect(wait).toBeLessThanOrEqual(PASSWORD_RESET_RATE_LIMIT.windowMs);
  });

  it("ignores attempts outside the window", () => {
    const old = Array.from({ length: 10 }, () => ({
      created_at: new Date(now.getTime() - PASSWORD_RESET_RATE_LIMIT.windowMs - 1000).toISOString(),
    }));
    expect(passwordResetRetryAfterMs(old, now)).toBe(0);
  });
});

describe("tokenMsRemaining", () => {
  const now = new Date("2026-01-01T12:00:00Z");
  it("returns 0 for missing expiry", () => {
    expect(tokenMsRemaining(null, now)).toBe(0);
    expect(tokenMsRemaining(undefined, now)).toBe(0);
  });
  it("returns 0 when already expired", () => {
    expect(tokenMsRemaining(Math.floor(now.getTime() / 1000) - 60, now)).toBe(0);
  });
  it("returns ms until expiry", () => {
    const exp = Math.floor(now.getTime() / 1000) + 300; // 5 min ahead
    expect(tokenMsRemaining(exp, now)).toBe(300_000);
  });
});

describe("formatDuration", () => {
  it("formats seconds-only", () => {
    expect(formatDuration(5_000)).toBe("5s");
  });
  it("formats minutes + seconds", () => {
    expect(formatDuration(65_000)).toBe("1m 05s");
  });
  it("clamps at zero", () => {
    expect(formatDuration(-1)).toBe("0s");
  });
});
