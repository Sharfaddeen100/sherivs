import { describe, expect, it } from "vitest";
import { captchaRequired } from "@/components/security/turnstile";
import { TURNSTILE_SITE_KEY, turnstileEnabled } from "@/lib/security/turnstile-config";

describe("Turnstile degrades gracefully", () => {
  it("is off when VITE_TURNSTILE_SITE_KEY is unset (test env)", () => {
    expect(TURNSTILE_SITE_KEY).toBeUndefined();
    expect(turnstileEnabled()).toBe(false);
  });
  it("never requires a token when not configured", () => {
    expect(captchaRequired(false, null, false)).toBe(false);
  });
  it("requires a token only while the widget is available", () => {
    expect(captchaRequired(true, null, false)).toBe(true);
    expect(captchaRequired(true, "tok", false)).toBe(false);
    expect(captchaRequired(true, null, true)).toBe(false);
  });
});
