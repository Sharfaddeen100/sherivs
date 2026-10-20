import { describe, expect, it } from "vitest";
import { passwordPolicyError, PASSWORD_MIN_LENGTH } from "@/lib/security/password-policy";

describe("passwordPolicyError", () => {
  it("rejects short passwords", () => {
    expect(passwordPolicyError("Ab1")).toMatch(String(PASSWORD_MIN_LENGTH));
  });
  it("requires lower, upper and digit", () => {
    expect(passwordPolicyError("alllowercase1")).toMatch(/uppercase/);
    expect(passwordPolicyError("NoDigitsHereAtAll")).toMatch(/digit/);
  });
  it("rejects passwords containing the email name", () => {
    expect(passwordPolicyError("Sherivs12345", "sherivs@x.com")).toMatch(/email/);
  });
  it("accepts a strong password", () => {
    expect(passwordPolicyError("Correct-Horse-9", "info@sherivs.com")).toBeNull();
  });
});
