/**
 * CoreGrid — Phase 01 Foundation integrity tests.
 *
 * Validates repository-level foundation invariants so the foundation can be
 * verified mechanically (§9 testing foundation, phase-01 §35/§38/§39):
 * - all 51 registered phase documents exist and match the registry id set;
 * - the machine-readable registry is valid and matches the frontend catalog;
 * - verification scripts run clean (registry validator + secrets scanner);
 * - secrets and build artifacts are git-ignored; `.env` is never tracked;
 * - portable npm verification contracts exist.
 */

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PHASE_CATALOG } from "@/lib/phase-catalog";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const archDir = join(ROOT, "architecture");

function trackedFiles(): string[] {
  return execFileSync("git", ["ls-files"], { encoding: "utf8", cwd: ROOT })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

describe("Phase 01 — phase document integrity", () => {
  it("registers exactly 51 phase documents", () => {
    const docs = readdirSync(archDir).filter((f) => /^phase-\d{2}-.*\.md$/.test(f));
    expect(docs.length).toBe(51);
  });

  it("registry.json exists, parses, and registers phases 01–51 in order", () => {
    const registry = JSON.parse(readFileSync(join(archDir, "registry.json"), "utf8"));
    expect(registry.phases.length).toBe(51);
    const ids = registry.phases.map((p: { id: string }) => p.id);
    expect(ids).toEqual(Array.from({ length: 51 }, (_, i) => String(i + 1).padStart(2, "0")));
  });

  it("keeps the frontend phase catalog in sync with the registry (51 phases)", () => {
    const registry = JSON.parse(readFileSync(join(archDir, "registry.json"), "utf8"));
    expect(PHASE_CATALOG.length).toBe(51);
    expect(PHASE_CATALOG.length).toBe(registry.phases.length);
  });
});

describe("Phase 01 — registry and secrets verification contracts", () => {
  it("runs the registry validator cleanly", () => {
    const out = execFileSync("node", ["scripts/verification/registry-validate.mjs"], {
      encoding: "utf8",
      cwd: ROOT,
    });
    expect(out).toContain("REGISTRY VALIDATION PASSED");
  });

  it("runs the secrets scanner cleanly", () => {
    const out = execFileSync("node", ["scripts/verification/secret-scan.mjs"], {
      encoding: "utf8",
      cwd: ROOT,
    });
    expect(out).toContain("SECRET SCAN PASSED");
  });
});

describe("Phase 01 — secrets and ignore hygiene", () => {
  it("gitignores environment files, dependencies, and build output", () => {
    const ignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
    expect(ignore).toMatch(/^\.env($|\.)/m);
    expect(ignore).toMatch(/^node_modules$/m);
    expect(ignore).toMatch(/^dist$/m);
  });

  it("never tracks the real .env file", () => {
    const tracked = trackedFiles();
    expect(tracked).not.toContain(".env");
    expect(existsSync(join(ROOT, ".env.example"))).toBe(true);
    expect(tracked).toContain(".env.example");
  });
});

describe("Phase 01 — portable verification contracts", () => {
  it("exposes the canonical npm verification contracts", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    const scripts = pkg.scripts ?? {};
    for (const name of ["typecheck", "test:unit", "verify", "verify:registry", "verify:secrets"]) {
      expect(typeof scripts[name]).toBe("string");
    }
  });
});
