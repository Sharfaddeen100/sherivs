import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACCOUNT_INVITATION_COPY,
  SIGN_IN_IDENTIFIER_PLACEHOLDER,
} from "../../frontend/src/lib/auth/organization-access";
import { shouldShowCompactPasskeyAction } from "../../frontend/src/lib/auth/webauthn-policy";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("enterprise login layout", () => {
  it("uses one identity field and the administrator invitation line", () => {
    const fields = read("frontend/src/components/auth/enterprise-login-fields.tsx");
    const entry = read("frontend/src/components/app-entry/app-entry-screen.tsx");
    const auth = read("frontend/src/routes/auth.tsx");
    expect(fields).toContain(SIGN_IN_IDENTIFIER_PLACEHOLDER);
    expect(fields).toContain("username webauthn");
    expect(fields).toContain("Forgot password?");
    expect(fields).toContain("Remember for 30 days");
    expect(fields).toContain("login-passkey-row");
    expect(entry).toContain("EnterpriseLoginFields");
    expect(entry).toContain("ACCOUNT_INVITATION_COPY");
    expect(entry).not.toContain("PASSKEY_DEVICE_HELP");
    expect(entry).not.toContain("Sign in to Sherivs");
    expect(auth).toContain("EnterpriseLoginFields");
    expect(auth).not.toContain("PASSKEY_DEVICE_HELP");
    expect(auth).not.toContain("{experience.subtext}");
    expect(ACCOUNT_INVITATION_COPY).toBe("Don't have an account? Contact your administrator.");
  });

  it("shows the compact passkey control only with a device hint, not mere WebAuthn support", () => {
    expect(
      shouldShowCompactPasskeyAction({ webauthnSupported: true, devicePasskeyHint: true }),
    ).toBe(true);
    expect(
      shouldShowCompactPasskeyAction({ webauthnSupported: true, devicePasskeyHint: false }),
    ).toBe(false);
    expect(
      shouldShowCompactPasskeyAction({ webauthnSupported: false, devicePasskeyHint: true }),
    ).toBe(false);
  });

  it("keeps remember-for-30-days out of the passkey-eligible row", () => {
    const fields = read("frontend/src/components/auth/enterprise-login-fields.tsx");
    expect(fields).toMatch(/passkeyEligible \? null : \(/);
    expect(fields).toContain("Remember for 30 days");
  });
});
