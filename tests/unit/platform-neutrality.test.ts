/**
 * CoreGrid — platform neutrality and no-hand-written-role-lists guard.
 *
 * Two laws are enforced here, both learned from real defects found in this
 * repository's own closures:
 *
 * 1. RUNTIME NEUTRALITY (AGENTS.md §33, phase-01 contract, BOUNDARIES.md): a
 *    domain-neutral platform module must not import a runtime/vertical. Scholar
 *    (runtime-001) reaches the neutral engine through an adapter in the runtime
 *    layer, so adding a second vertical never touches the engine.
 *
 * 2. NO HAND-WRITTEN ROLE LISTS. The Scholar catalog defines hundreds of reality
 *    roles and grows with the institution. A surface that enumerates roles by hand
 *    ("admin", "principal", "bursar", …) is stale the day the catalog grows, and a
 *    page-level role guard is not a security boundary anyway (AGENTS.md §34 — the UI
 *    is never the security boundary; Phase 08/RLS enforce).
 *
 * These are structural tests: they read the files and fail on the pattern, which is
 * what makes the rule survive future phases.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (ref: string) => readFileSync(join(ROOT, ref), "utf8");

/** Platform modules that must stay runtime-neutral (no vertical may be imported). */
const NEUTRAL_MODULES = [
  "frontend/src/lib/foundation-standards.ts",
  "frontend/src/lib/runtime-self-report.ts",
  "frontend/src/lib/agent-governance-report.ts",
  "frontend/src/lib/workspace-projection.ts",
  "frontend/src/lib/workspace-core.ts",
  "frontend/src/lib/workspace-composition.ts",
  "frontend/src/lib/workspace-governance.ts",
  "frontend/src/lib/workspace-membership.ts",
  "frontend/src/lib/workspace-engine/navigation.ts",
];

/** Platform/super-admin surfaces: control-plane UI, never a vertical's portal. */
const PLATFORM_SURFACES = [
  "frontend/src/routes/platform.tsx",
  "frontend/src/routes/_authenticated/super-admin/runtime-contracts.tsx",
  "frontend/src/routes/_authenticated/super-admin/agent-governance.tsx",
  "frontend/src/routes/_authenticated/super-admin/workspace-projection.tsx",
  "frontend/src/routes/_authenticated/super-admin/tenants.tsx",
];

/** Imports that would couple a neutral module to one vertical's ontology. */
const VERTICAL_IMPORT_PATTERNS = [
  /from\s+"@\/lib\/runtime\/scholar/,
  /from\s+"@\/lib\/scholar\//,
  /from\s+"@\/lib\/scholar-/,
  /from\s+"@\/lib\/education-/,
];

/** A literal role array: `allow={["admin", "principal"]}` or `ROLES = [...]`. */
const HAND_WRITTEN_ROLE_LIST = /allow=\{\[\s*"|const\s+\w*ROLES?\w*\s*(?::[^=]+)?=\s*\[/;

describe("Platform neutrality — no vertical leaks into the neutral engine", () => {
  for (const moduleRef of NEUTRAL_MODULES) {
    it(`${moduleRef} imports no runtime/vertical`, () => {
      const source = read(moduleRef);
      for (const pattern of VERTICAL_IMPORT_PATTERNS) {
        expect(source, `${moduleRef} must not match ${pattern}`).not.toMatch(pattern);
      }
    });
  }

  it("keeps the Scholar projection adapter in the runtime layer", () => {
    const adapter = read("frontend/src/lib/runtime/scholar-workspace-projection.ts");
    // The adapter is the only bridge, and it must be catalog-driven.
    expect(adapter).toContain("@/lib/workspace-engine/nav-catalog");
    expect(adapter).toContain("Object.keys(");
    expect(adapter).toContain("EDUCATION_REALITY_ROLES");

    // The neutral engine may *say* it is neutral; it must not import a vertical.
    const projection = read("frontend/src/lib/workspace-projection.ts");
    for (const pattern of VERTICAL_IMPORT_PATTERNS) {
      expect(projection, `workspace-projection.ts must not match ${pattern}`).not.toMatch(pattern);
    }
    expect(projection).not.toMatch(/from\s+"@\/lib\/runtime\//);
  });
});

describe("No hand-written role lists in platform surfaces", () => {
  for (const surfaceRef of PLATFORM_SURFACES) {
    it(`${surfaceRef} declares no role list of its own`, () => {
      const source = read(surfaceRef);
      expect(source, `${surfaceRef} must not hardcode roles`).not.toMatch(HAND_WRITTEN_ROLE_LIST);
    });
  }

  it("derives the workspace projection from the catalog instead of a role list", () => {
    const surface = read("frontend/src/routes/_authenticated/super-admin/workspace-projection.tsx");

    expect(surface).toContain("@/lib/runtime/scholar-workspace-projection");
    expect(surface).toContain("scholarRoleWorkspaceCoverage");
    expect(surface).not.toMatch(/"(admin|principal|bursar|driver|hq|super_admin)"/);
  });

  it("enumerates workspace kinds from the catalog, never from a typed-out list", () => {
    const adapter = read("frontend/src/lib/runtime/scholar-workspace-projection.ts");

    expect(adapter).toContain("Object.keys(");
    expect(adapter).toContain("SCHOLAR_WORKSPACE_LABELS");
    expect(adapter).not.toMatch(/SCHOLAR_WORKSPACE_KINDS\s*=\s*\[/);
  });
});
