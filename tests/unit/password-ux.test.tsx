import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import {
  isCommonPassword,
  newPasswordError,
  passwordRules,
  passwordStrength,
} from "@/lib/security/password-strength";
import {
  backoffMs,
  createLoginBackoff,
  formatSeconds,
  GENERIC_LOGIN_ERROR,
  loginErrorMessage,
  NEUTRAL_SENT_MESSAGE,
  newPasswordServerMessage,
  recoveryLinkError,
} from "@/lib/security/auth-feedback";
import { PasswordInput } from "@/components/security/password-input";
import { PasswordStrengthMeter } from "@/components/security/password-strength-meter";
import { captchaRequired } from "@/components/security/turnstile";

class MemStore {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

describe("password strength", () => {
  it("rejects common passwords even when they meet the character rules", () => {
    expect(isCommonPassword("Password123")).toBe(true);
    expect(isCommonPassword("Welcome1!")).toBe(true);
    expect(newPasswordError("Password1234")).toMatch(/common/);
  });
  it("checklist reflects each rule", () => {
    const r = Object.fromEntries(passwordRules("abc", "x@y.z").map((x) => [x.id, x.ok]));
    expect(r).toMatchObject({ length: false, lower: true, upper: false, digit: false });
  });
  it("scores weak, fair, good, strong", () => {
    expect(passwordStrength("").score).toBe(0);
    expect(passwordStrength("short").acceptable).toBe(false);
    expect(passwordStrength("Blue-Kettle7").label).toBe("Good");
    expect(passwordStrength("BlueKettle7x").label).toBe("Fair");
    expect(passwordStrength("Blue-Kettle-Morning-7").label).toBe("Strong");
  });
});

describe("auth feedback", () => {
  it("login errors are generic (no enumeration)", () => {
    expect(loginErrorMessage({ message: "Invalid login credentials", status: 400 })).toBe(GENERIC_LOGIN_ERROR);
    expect(loginErrorMessage({ message: "User not found", status: 400 })).toBe(GENERIC_LOGIN_ERROR);
    expect(loginErrorMessage({ status: 429, message: "x" })).toMatch(/Too many/);
    expect(loginErrorMessage({ code: "captcha_failed" })).toMatch(/security check/);
  });
  it("maps breached-password rejection", () => {
    expect(newPasswordServerMessage({ code: "weak_password", reasons: ["pwned"] })).toMatch(/breach/);
    expect(newPasswordServerMessage({ code: "same_password" })).toMatch(/different/);
  });
  it("backs off after repeated failures, capped", () => {
    expect(backoffMs(2)).toBe(0);
    expect(backoffMs(3)).toBe(15_000);
    expect(backoffMs(4)).toBe(30_000);
    expect(backoffMs(20)).toBe(300_000);
    let t = 1_000;
    const b = createLoginBackoff(new MemStore() as unknown as Storage, () => t);
    b.recordFailure();
    b.recordFailure();
    expect(b.remainingMs()).toBe(0);
    b.recordFailure();
    expect(b.remainingMs()).toBe(15_000);
    t += 15_000;
    expect(b.remainingMs()).toBe(0);
    b.reset();
    expect(b.failures()).toBe(0);
    expect(formatSeconds(90_000)).toBe("1m 30s");
  });
  it("detects expired / invalid recovery links", () => {
    expect(recoveryLinkError("#error=access_denied&error_code=otp_expired")).toMatch(/expired/);
    expect(recoveryLinkError("", "?error=access_denied")).toMatch(/invalid/);
    expect(recoveryLinkError("#access_token=abc&type=recovery")).toBeNull();
  });
  it("neutral sent message never confirms the account exists", () => {
    expect(NEUTRAL_SENT_MESSAGE).toMatch(/^If an account exists/);
  });
});

describe("captcha degrades gracefully", () => {
  it("never requires a token when Turnstile is not configured", () => {
    expect(captchaRequired(false, null, false)).toBe(false);
  });
  it("requires a token only while the widget is available", () => {
    expect(captchaRequired(true, null, false)).toBe(true);
    expect(captchaRequired(true, "tok", false)).toBe(false);
    expect(captchaRequired(true, null, true)).toBe(false);
  });
});

describe("PasswordInput", () => {
  const html = renderToStaticMarkup(
    createElement(PasswordInput, { autoComplete: "current-password", value: "x", onChange: () => {}, fieldLabel: "password" }),
  );
  it("renders a masked input with the password-manager hint", () => {
    expect(html).toMatch(/type="password"/);
    expect(html).toMatch(/autoComplete="current-password"|autocomplete="current-password"/);
  });
  it("renders an accessible, keyboard-focusable eye toggle", () => {
    expect(html).toMatch(/<button[^>]*type="button"/);
    expect(html).toMatch(/aria-label="Show password"/);
    expect(html).toMatch(/aria-pressed="false"/);
  });
});

describe("PasswordStrengthMeter", () => {
  it("renders a meter and the rules checklist", () => {
    const html = renderToStaticMarkup(createElement(PasswordStrengthMeter, { password: "Blue-Kettle7" }));
    expect(html).toMatch(/role="meter"/);
    expect(html).toMatch(/aria-valuetext="Good"/);
    expect((html.match(/data-ok="true"/g) ?? []).length).toBe(6);
  });
});
