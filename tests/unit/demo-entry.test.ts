import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEMO_ENTRY_SEARCH_PARAM,
  isDemoEntryRequested,
  shouldShowPublicDemoEntry,
} from "@/lib/runtime/scholar/demo-entry";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

describe("public demo entry — default hidden, explicit opt-in only", () => {
  it("hides the demo entry when search is empty, missing, or unrelated", () => {
    expect(shouldShowPublicDemoEntry(undefined)).toBe(false);
    expect(shouldShowPublicDemoEntry(null)).toBe(false);
    expect(shouldShowPublicDemoEntry("")).toBe(false);
    expect(shouldShowPublicDemoEntry("?")).toBe(false);
    expect(shouldShowPublicDemoEntry("?school=demo")).toBe(false);
    expect(shouldShowPublicDemoEntry(new URLSearchParams())).toBe(false);
    expect(shouldShowPublicDemoEntry({})).toBe(false);
  });

  it("does not treat NODE_ENV-like or loose truthy values as enablement", () => {
    expect(isDemoEntryRequested("?demoEntry=1")).toBe(false);
    expect(isDemoEntryRequested("?demoEntry=TRUE")).toBe(false);
    expect(isDemoEntryRequested("?demoEntry=yes")).toBe(false);
    expect(isDemoEntryRequested("?production=false")).toBe(false);
    expect(isDemoEntryRequested({ NODE_ENV: "development" })).toBe(false);
    expect(isDemoEntryRequested({ demoEntry: "true " })).toBe(false);
  });

  it("shows the labelled demo entry only when demoEntry=true is explicit", () => {
    expect(shouldShowPublicDemoEntry("?demoEntry=true")).toBe(true);
    expect(shouldShowPublicDemoEntry("demoEntry=true")).toBe(true);
    expect(shouldShowPublicDemoEntry(new URLSearchParams("demoEntry=true"))).toBe(true);
    expect(shouldShowPublicDemoEntry({ [DEMO_ENTRY_SEARCH_PARAM]: "true" })).toBe(true);
    expect(shouldShowPublicDemoEntry({ demoEntry: true })).toBe(true);
  });

  it("does not read NODE_ENV or ALLOW_DEMO_PROVISIONING for UI visibility", () => {
    const helper = readFileSync(
      join(ROOT, "frontend/src/lib/runtime/scholar/demo-entry.ts"),
      "utf8",
    );
    const executable = helper
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(executable).not.toMatch(/process\.env/);
    expect(executable).not.toMatch(/NODE_ENV/);
    expect(executable).not.toMatch(/ALLOW_DEMO_PROVISIONING/);
    expect(executable).not.toMatch(/import\.meta\.env/);
  });
});

describe("auth route wiring", () => {
  const auth = readFileSync(join(ROOT, "frontend/src/routes/auth.tsx"), "utf8");
  const provisioner = readFileSync(
    join(ROOT, "frontend/src/lib/runtime/scholar/demo-provision.functions.ts"),
    "utf8",
  );

  it("keeps sign-in, sign-up, and password recovery on /auth", () => {
    expect(auth).toContain('type Mode = "signin" | "signup" | "forgot"');
    expect(auth).toContain("signInWithPassword");
    expect(auth).toContain("signUp");
    expect(auth).toContain("resetPasswordForEmail");
    expect(auth).toContain("Forgot password?");
    expect(auth).toContain("Need an account? Create one");
  });

  it("hides the demo CTA unless shouldShowPublicDemoEntry is true", () => {
    expect(auth).toContain("shouldShowPublicDemoEntry");
    expect(auth).toContain("showDemoEntry");
    expect(auth).toMatch(/showDemoEntry \? \(/);
    expect(auth).toContain("Isolated demo mode");
    expect(auth).toContain('data-demo-entry="explicit"');
  });

  it("does not use NODE_ENV as production identity for the demo CTA", () => {
    expect(auth).not.toMatch(/NODE_ENV/);
    expect(auth).not.toMatch(/import\.meta\.env\.DEV/);
    expect(auth).not.toMatch(/import\.meta\.env\.PROD/);
    expect(auth).not.toMatch(/import\.meta\.env\.MODE/);
  });

  it("leaves the server provisioner fail-closed on ALLOW_DEMO_PROVISIONING", () => {
    expect(provisioner).toMatch(/ALLOW_DEMO_PROVISIONING\s*!==\s*["']true["']/);
    expect(provisioner).toContain("throw new Error");
    const gateIndex = provisioner.indexOf("ALLOW_DEMO_PROVISIONING");
    const substrateIndex = provisioner.indexOf('import("@/integrations/supabase/client.server")');
    expect(gateIndex).toBeGreaterThan(-1);
    expect(substrateIndex).toBeGreaterThan(gateIndex);
  });
});
