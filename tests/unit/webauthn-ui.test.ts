import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("passkey UI integration", () => {
  it("adds passkey sign-in to app entry and /auth without replacing password or Google", () => {
    const entry = read("frontend/src/components/app-entry/app-entry-screen.tsx");
    const auth = read("frontend/src/routes/auth.tsx");
    for (const src of [entry, auth]) {
      expect(src).toContain("PasskeySignInButton");
      expect(src).toContain("Sign in with Google");
      expect(src).toContain("signInWithPassword");
      expect(src).toContain("PASSKEY_DEVICE_HELP");
    }
    expect(entry).toContain('data-testid="app-entry-submit"');
  });

  it("manages passkeys on the security screen and console account page", () => {
    const security = read("frontend/src/components/app-shell/account-screens.tsx");
    const consoleAccount = read("frontend/src/components/internal-console/module-screens.tsx");
    expect(security).toContain('<PasskeyManager variant="app-shell" />');
    expect(consoleAccount).toContain('<PasskeyManager variant="console" />');
    const manager = read("frontend/src/components/auth/passkey-manager.tsx");
    expect(manager).toContain("Register a passkey");
    expect(manager).toContain("Rename");
    expect(manager).toContain("Remove");
    expect(manager).toContain("PASSKEY_DEVICE_HELP");
    expect(manager.toLowerCase()).not.toContain("every device uses a fingerprint");
  });
});
