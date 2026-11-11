import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without type declarations
import { buildPlan } from "../../scripts/governance/apply-github-governance.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const WF = join(ROOT, ".github", "workflows");
const manifest = JSON.parse(
  readFileSync(join(ROOT, ".github/governance/environments.json"), "utf8"),
) as {
  environments: Record<
    string,
    {
      workflows: string[];
      reviewers: string[];
      canAdminsBypass: boolean;
      deploymentBranchPolicy: { branches: string[] } | null;
    }
  >;
};
const lower = (s: string) => s.toLowerCase();

function referencedEnvironments(): Map<string, Set<string>> {
  const refs = new Map<string, Set<string>>();
  for (const file of readdirSync(WF).filter((f) => f.endsWith(".yml"))) {
    for (const line of readFileSync(join(WF, file), "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s{4}environment:\s*["']?([A-Za-z0-9_-]+)["']?\s*$/);
      if (m) {
        const key = lower(m[1]);
        refs.set(key, (refs.get(key) ?? new Set()).add(file));
      }
    }
  }
  return refs;
}

describe("deployment governance manifest (M0.2-C)", () => {
  const byLower = new Map(Object.entries(manifest.environments).map(([k, v]) => [lower(k), v]));

  it("covers every environment that workflows actually reference (case-insensitive)", () => {
    for (const env of referencedEnvironments().keys()) expect(byLower.has(env), env).toBe(true);
  });

  it("lists exactly the workflows that reference each environment", () => {
    const refs = referencedEnvironments();
    for (const [name, env] of byLower) {
      expect([...(refs.get(name) ?? [])].sort(), name).toEqual([...env.workflows].sort());
    }
  });

  it("requires human reviewers, master-only deployment and no admin bypass for production-class environments", () => {
    for (const name of ["production", "infrastructure-apply", "security-batteries"]) {
      const env = byLower.get(name)!;
      expect(env.reviewers.length, name).toBeGreaterThan(0);
      expect(env.deploymentBranchPolicy?.branches, name).toEqual(["master"]);
      expect(env.canAdminsBypass, name).toBe(false);
    }
  });

  it("planner is pure and emits one environment PUT plus branch policies", () => {
    const plan = buildPlan("owner/repo", { environments: manifest }, "environments");
    expect(plan.filter((s: { method: string }) => s.method === "PUT")).toHaveLength(
      Object.keys(manifest.environments).length,
    );
    expect(plan.every((s: { path: string }) => s.path.startsWith("repos/owner/repo/"))).toBe(true);
  });
});
