#!/usr/bin/env node
// M0.2 governance applier. DRY-RUN BY DEFAULT: prints the GitHub REST requests that
// would realise .github/governance/*.json and touches nothing. Applying needs an
// admin-scoped `gh` login on the TARGET repository and an explicit --apply.
// Never run it against Sherivs/sherivs without the organization owner's approval.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const load = (name) => {
  const file = join(ROOT, ".github", "governance", name);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
};

/** Returns reasons applying would lock out a single-approver repo. */
export function lockoutRisks(manifests) {
  const risks = [];
  for (const [name, env] of Object.entries(manifests.environments?.environments ?? {})) {
    if (env.preventSelfReview && new Set(env.reviewers ?? []).size < 2)
      risks.push(`environment ${name}: preventSelfReview with fewer than 2 reviewers`);
  }
  const rule = manifests.ruleset?.rules?.find((r) => r.type === "pull_request");
  if (rule && rule.parameters?.required_approving_review_count >= 1)
    risks.push("ruleset: required approvals need a second reviewer who is not the PR author");
  return risks;
}

/** Pure planner: returns [{ step, method, path, body?, resolveReviewers? }]. */
export function buildPlan(repo, manifests, only) {
  const plan = [];
  const want = (k) => !only || only === k;

  if (want("environments") && manifests.environments) {
    for (const [name, env] of Object.entries(manifests.environments.environments)) {
      const policy = env.deploymentBranchPolicy;
      plan.push({
        step: `environment:${name}`,
        method: "PUT",
        path: `repos/${repo}/environments/${encodeURIComponent(name)}`,
        reviewers: env.reviewers,
        body: {
          wait_timer: env.waitTimerMinutes,
          prevent_self_review: env.preventSelfReview,
          can_admins_bypass: env.canAdminsBypass,
          deployment_branch_policy: policy
            ? {
                protected_branches: policy.protectedBranches,
                custom_branch_policies: policy.customBranchPolicies,
              }
            : null,
        },
      });
      for (const branch of policy?.branches ?? []) {
        plan.push({
          step: `environment:${name}:branch:${branch}`,
          method: "POST",
          path: `repos/${repo}/environments/${encodeURIComponent(name)}/deployment-branch-policies`,
          body: { name: branch, type: "branch" },
        });
      }
    }
  }

  if (want("ruleset") && manifests.ruleset) {
    plan.push({
      step: "ruleset:master",
      method: "UPSERT",
      path: `repos/${repo}/rulesets`,
      body: manifests.ruleset,
    });
  }

  if (want("settings") && manifests.settings) {
    const s = manifests.settings;
    plan.push({
      step: "settings:security_and_analysis",
      method: "PATCH",
      path: `repos/${repo}`,
      body: { security_and_analysis: s.security_and_analysis },
    });
    if (s.vulnerability_alerts)
      plan.push({
        step: "settings:dependabot-alerts",
        method: "PUT",
        path: `repos/${repo}/vulnerability-alerts`,
      });
    if (s.automated_security_fixes)
      plan.push({
        step: "settings:dependabot-security-updates",
        method: "PUT",
        path: `repos/${repo}/automated-security-fixes`,
      });
    plan.push({
      step: "settings:workflow-token",
      method: "PUT",
      path: `repos/${repo}/actions/permissions/workflow`,
      body: s.workflow_permissions,
    });
    if (s.code_scanning_default_setup)
      plan.push({
        step: "settings:codeql-default-setup",
        method: "PATCH",
        path: `repos/${repo}/code-scanning/default-setup`,
        body: s.code_scanning_default_setup,
      });
  }
  return plan;
}

function gh(args, body) {
  const full = ["api", ...args];
  if (body !== undefined) full.push("--input", "-");
  return execFileSync("gh", full, {
    input: body === undefined ? undefined : JSON.stringify(body),
    encoding: "utf8",
  });
}

function apply(step) {
  if (step.method === "UPSERT") {
    const existing = JSON.parse(gh([step.path])).find((r) => r.name === step.body.name);
    return existing
      ? gh(["-X", "PUT", `${step.path}/${existing.id}`], step.body)
      : gh(["-X", "POST", step.path], step.body);
  }
  if (step.method === "POST" && step.path.endsWith("/deployment-branch-policies")) {
    const existing = JSON.parse(gh([step.path])).branch_policies ?? [];
    if (existing.some((p) => p.name === step.body.name)) return "exists";
  }
  const body = { ...step.body };
  if (step.reviewers?.length) {
    body.reviewers = step.reviewers.map((login) => ({
      type: "User",
      id: JSON.parse(gh([`users/${login}`])).id,
    }));
  }
  return gh(["-X", step.method, step.path], step.body === undefined ? undefined : body);
}

function main(argv) {
  const arg = (n) => {
    const i = argv.indexOf(n);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const repo = arg("--repo");
  const only = arg("--only");
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    console.error(
      "usage: apply-github-governance.mjs --repo <owner/name> [--only environments|ruleset|settings] [--apply]",
    );
    process.exit(2);
  }
  const plan = buildPlan(
    repo,
    {
      environments: load("environments.json"),
      ruleset: load("ruleset-master.json"),
      settings: load("repo-settings.json"),
    },
    only,
  );
  const doApply = argv.includes("--apply");
  const risks = lockoutRisks({
    environments: load("environments.json"),
    ruleset: load("ruleset-master.json"),
  });
  if (doApply && risks.length && !argv.includes("--allow-single-approver")) {
    console.error(`Refusing to apply (lockout risk):\n- ${risks.join("\n- ")}`);
    console.error("Name a second approver in the manifests, or pass --allow-single-approver.");
    process.exit(2);
  }
  console.log(`${doApply ? "APPLYING" : "DRY-RUN"} ${plan.length} step(s) against ${repo}`);
  for (const step of plan) {
    console.log(`- ${step.method} ${step.path}  [${step.step}]`);
    if (doApply) {
      try {
        apply(step);
        console.log("  ok");
      } catch (e) {
        console.error(`  FAILED: ${String(e.message).split("\n")[0]}`);
        process.exitCode = 1;
      }
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  main(process.argv.slice(2));
