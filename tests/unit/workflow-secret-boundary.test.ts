import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const DIR = join(ROOT, ".github", "workflows");
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".yml"));
const read = (f: string) => readFileSync(join(DIR, f), "utf8").replace(/\r\n/g, "\n");

interface Job {
  name: string;
  body: string;
}

function split(source: string): { head: string; jobs: Job[] } {
  const idx = source.search(/^jobs:\s*$/m);
  const head = source.slice(0, idx);
  const rest = source.slice(idx).split("\n").slice(1).join("\n");
  const jobs: Job[] = [];
  let current: Job | undefined;
  for (const line of rest.split("\n")) {
    const m = line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/);
    if (m) {
      current = { name: m[1], body: "" };
      jobs.push(current);
    } else if (current) {
      current.body += `${line}\n`;
    }
  }
  return { head, jobs };
}

const stripComments = (s: string) =>
  s
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");
const jobIf = (job: Job) => job.body.match(/^ {4}if:\s*(.+)$/m)?.[1] ?? "";
const triggersOnPr = (head: string) => /^\s{2}pull_request:/m.test(stripComments(head));
const SENSITIVE = /secrets\.(?:SUPABASE|[A-Z_]*SERVICE_ROLE|[A-Z_]*ACCESS_TOKEN)/;

describe("workflow secret boundary (M0.2-A)", () => {
  it("never uses pull_request_target or workflow_run", () => {
    const offenders = FILES.filter((f) =>
      /^\s{2}(pull_request_target|workflow_run):/m.test(stripComments(read(f))),
    );
    expect(offenders).toEqual([]);
  });

  it("does not expose database/management secrets to PR-capable jobs in any workflow", () => {
    const offenders: string[] = [];
    for (const f of FILES) {
      const { head, jobs } = split(read(f));
      if (!triggersOnPr(head)) continue;
      if (SENSITIVE.test(stripComments(head))) offenders.push(`${f}: workflow-level env`);
      for (const job of jobs) {
        if (SENSITIVE.test(stripComments(job.body)) && !jobIf(job).includes("!= 'pull_request'")) {
          offenders.push(`${f}: job ${job.name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  describe("security-batteries.yml", () => {
    const { head, jobs } = split(read("security-batteries.yml"));
    const code = stripComments(read("security-batteries.yml"));
    const byName = (n: string) => jobs.find((j) => j.name === n);

    it("keeps the PR job free of secrets and environments", () => {
      const pr = byName("pr-static-guard");
      expect(pr).toBeDefined();
      expect(jobIf(pr!)).toContain("github.event_name == 'pull_request'");
      expect(stripComments(pr!.body)).not.toMatch(/secrets\.|environment:/);
      expect(stripComments(pr!.body)).toContain("npm ci --ignore-scripts");
    });

    it("has no workflow-level secrets", () => {
      expect(stripComments(head)).not.toMatch(/secrets\./);
    });

    it("runs credentialed jobs only off-PR, from master, in the protected environment", () => {
      for (const name of ["rls-isolation-battery", "restore-recovery-drill"]) {
        const job = byName(name);
        expect(job, name).toBeDefined();
        expect(jobIf(job!), name).toContain("github.event_name != 'pull_request'");
        expect(jobIf(job!), name).toContain("github.ref == 'refs/heads/master'");
        expect(job!.body, name).toMatch(/^ {4}environment: security-batteries$/m);
      }
      const credentialed = jobs
        .filter((j) => SENSITIVE.test(stripComments(j.body)))
        .map((j) => j.name);
      expect(credentialed.sort()).toEqual(["restore-recovery-drill", "rls-isolation-battery"]);
    });

    it("does not map the service-role key", () => {
      expect(code).not.toMatch(/secrets\.[A-Z_]*SERVICE_ROLE/);
    });

    it("fails (never succeeds) when a battery is blocked on credentials", () => {
      const blocks = code.match(/^\s+2\)\n[\s\S]*?;;/gm) ?? [];
      expect(blocks.length).toBe(2);
      for (const b of blocks) expect(b).toMatch(/\n\s+exit 1\n/);
    });

    it("isolates PR concurrency from the canonical database lock", () => {
      expect(code).toContain("canonical-db-batteries");
      expect(code).toMatch(/event_name == 'pull_request' && format\('security-batteries-pr-/);
      expect(code).toMatch(/cancel-in-progress: false/);
    });
  });
});
