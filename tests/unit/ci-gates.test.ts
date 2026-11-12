import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), "utf8").replace(/\r\n/g, "\n");
const ruleset = JSON.parse(read(".github/governance/ruleset-master.json"));
const requiredChecks: string[] = ruleset.rules
  .find((r: { type: string }) => r.type === "required_status_checks")
  .parameters.required_status_checks.map((c: { context: string }) => c.context);

function jobs(file: string) {
  const out = new Map<string, { ifExpr: string }>();
  const src = read(file);
  const body = src.slice(src.search(/^jobs:/m));
  const blocks = body.split(/^ {2}[A-Za-z0-9_-]+:\s*$/m).slice(1);
  for (const b of blocks) {
    const name = b.match(/^ {4}name:\s*(.+)$/m)?.[1].trim();
    if (name) out.set(name, { ifExpr: b.match(/^ {4}if:\s*(.+)$/m)?.[1] ?? "" });
  }
  return out;
}

describe("merge-gate ruleset (M0.2-D)", () => {
  const verify = jobs(".github/workflows/verify.yml");

  it("requires only checks that verify.yml really emits", () => {
    for (const c of requiredChecks) expect(verify.has(c), c).toBe(true);
  });

  it("never requires path-scoped or deploy jobs that would block unrelated PRs", () => {
    for (const c of requiredChecks) {
      expect(c).not.toMatch(
        /Vercel|E2E|screenshots|RLS isolation|Fabric source|Workflow secret-boundary/i,
      );
      expect(verify.get(c)!.ifExpr, c).not.toMatch(/push|head\.repo/);
    }
  });

  it("requires human review, code-owner review and no bypass", () => {
    const pr = ruleset.rules.find((r: { type: string }) => r.type === "pull_request").parameters;
    expect(pr.required_approving_review_count).toBeGreaterThanOrEqual(1);
    expect(pr.require_code_owner_review).toBe(true);
    expect(ruleset.bypass_actors).toEqual([]);
    expect(ruleset.rules.map((r: { type: string }) => r.type)).toEqual(
      expect.arrayContaining(["deletion", "non_fast_forward"]),
    );
  });

  it("exposes the local gate as npm run verify:local", () => {
    expect(JSON.parse(read("package.json")).scripts["verify:local"]).toBe(
      "node scripts/verification/local-gate.mjs",
    );
  });
});
