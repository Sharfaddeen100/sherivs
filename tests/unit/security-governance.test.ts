import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without type declarations
import { buildPlan } from "../../scripts/governance/apply-github-governance.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("security governance (M0.2-E)", () => {
  it("CODEOWNERS assigns an owner to every security-critical path", () => {
    const rules = read(".github/CODEOWNERS")
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => l.trim().split(/\s+/));
    for (const path of [
      "/.github/workflows/",
      "/.github/governance/",
      "/database/",
      "/infrastructure/",
      "/architecture/",
      "/docs/security/",
      "/AGENTS.md",
    ]) {
      const rule = rules.find(([p]) => p === path);
      expect(rule, path).toBeDefined();
      expect(rule!.slice(1).every((o) => o.startsWith("@"))).toBe(true);
    }
  });

  it("PR template enforces version target, secret and PR-secret checks", () => {
    expect(existsSync(join(ROOT, ".github/PULL_REQUEST_TEMPLATE.md"))).toBe(true);
    const t = read(".github/PULL_REQUEST_TEMPLATE.md");
    for (const s of ["Version target", "No secrets", "pull_request_target", "verify:local"])
      expect(t).toContain(s);
  });

  it("settings manifest only tightens controls", () => {
    const s = JSON.parse(read(".github/governance/repo-settings.json"));
    expect(s.security_and_analysis.secret_scanning.status).toBe("enabled");
    expect(s.security_and_analysis.secret_scanning_push_protection.status).toBe("enabled");
    expect(s.vulnerability_alerts).toBe(true);
    expect(s.workflow_permissions).toEqual({
      default_workflow_permissions: "read",
      can_approve_pull_request_reviews: false,
    });
    const plan = buildPlan("o/r", { settings: s }, "settings");
    expect(plan.map((p: { step: string }) => p.step)).toContain("settings:workflow-token");
  });

  it("every workflow declares least-privilege top-level permissions", () => {
    const dir = join(ROOT, ".github/workflows");
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".yml"))) {
      expect(/^permissions:/m.test(read(`.github/workflows/${f}`)), f).toBe(true);
    }
  });

  it("dependabot covers npm, mobile and github-actions", () => {
    const d = read(".github/dependabot.yml");
    for (const e of [
      "package-ecosystem: npm",
      'directory: "/mobile"',
      "package-ecosystem: github-actions",
    ])
      expect(d).toContain(e);
  });
});
