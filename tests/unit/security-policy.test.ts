/**
 * Sherivs Scholar — Phase 08 Security Engine unit tests (security-policy).
 *
 * Validates:
 * - Policy creation validation (Section J.2).
 * - Policy lifecycle transitions (Section J.3).
 * - Publication requires an approver; publication sets immutability marker.
 * - Policy rollback (Section J.4).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import {
  createSecurityPolicy,
  isPolicyTransitionAllowed,
  transitionSecurityPolicy,
  approveSecurityPolicy,
  rollbackSecurityPolicy,
  type SecurityPolicy,
} from "@/lib/security-policy";

const TENANT_A = tenantId("tenant-a");
const NOW = "2026-01-01T00:00:00Z";

describe("createSecurityPolicy (Section J.2)", () => {
  it("creates a draft policy", () => {
    const result = createSecurityPolicy({
      name: "Deny cross tenant",
      tenantId: TENANT_A,
      environment: "production",
      rules: { deny: "cross_tenant" },
      authorId: "engineer-1",
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.policy.lifecycleState).toBe("draft");
      expect(result.policy.publishedAt).toBeNull();
    }
  });

  it("rejects an empty name", () => {
    const result = createSecurityPolicy({
      name: "",
      tenantId: TENANT_A,
      environment: "production",
      rules: { deny: "x" },
      authorId: "engineer-1",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a policy with no rules", () => {
    const result = createSecurityPolicy({
      name: "Empty",
      tenantId: TENANT_A,
      environment: "production",
      rules: {},
      authorId: "engineer-1",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing author (attributability)", () => {
    const result = createSecurityPolicy({
      name: "Policy",
      tenantId: TENANT_A,
      environment: "production",
      rules: { deny: "x" },
      authorId: "",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});

function makePolicy(overrides: Partial<SecurityPolicy> = {}): SecurityPolicy {
  const created = createSecurityPolicy({
    name: "Policy",
    tenantId: TENANT_A,
    environment: "production",
    rules: { deny: "x" },
    authorId: "engineer-1",
    now: NOW,
  });
  if (!created.ok) throw new Error("fixture failed");
  return { ...created.policy, ...overrides };
}

describe("isPolicyTransitionAllowed (Section J.3)", () => {
  it("allows draft -> validating", () => {
    expect(isPolicyTransitionAllowed("draft", "validating")).toBe(true);
  });

  it("rejects draft -> published (skipping lifecycle)", () => {
    expect(isPolicyTransitionAllowed("draft", "published")).toBe(false);
  });

  it("rejects archived -> anything", () => {
    expect(isPolicyTransitionAllowed("archived", "draft")).toBe(false);
  });
});

describe("transitionSecurityPolicy", () => {
  it("rejects transitioning an archived policy", () => {
    const policy = makePolicy({ lifecycleState: "archived" });
    const result = transitionSecurityPolicy(policy, "draft", NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid transition", () => {
    const policy = makePolicy({ lifecycleState: "draft" });
    const result = transitionSecurityPolicy(policy, "active", NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects publication without an approver (Section J.2)", () => {
    const policy = makePolicy({ lifecycleState: "approved", approvedBy: null });
    const result = transitionSecurityPolicy(policy, "published", NOW);
    expect(result.ok).toBe(false);
  });

  it("publishes an approved policy and stamps publishedAt", () => {
    const policy = makePolicy({ lifecycleState: "approved", approvedBy: "lead-1" });
    const result = transitionSecurityPolicy(policy, "published", NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.policy.publishedAt).toBe(NOW);
      expect(result.policy.lifecycleState).toBe("published");
    }
  });
});

describe("approveSecurityPolicy", () => {
  it("rejects approval before testing", () => {
    const policy = makePolicy({ lifecycleState: "draft" });
    const result = approveSecurityPolicy(policy, "lead-1", NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty approver id", () => {
    const policy = makePolicy({ lifecycleState: "testing" });
    const result = approveSecurityPolicy(policy, "", NOW);
    expect(result.ok).toBe(false);
  });

  it("approves a policy that completed testing", () => {
    const policy = makePolicy({ lifecycleState: "testing" });
    const result = approveSecurityPolicy(policy, "lead-1", NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.policy.approvedBy).toBe("lead-1");
    }
  });
});

describe("rollbackSecurityPolicy (Section J.4)", () => {
  it("rejects rollback of a non-active/monitoring policy", () => {
    const current = makePolicy({ lifecycleState: "draft" });
    const previous = makePolicy({ lifecycleState: "superseded", publishedAt: NOW });
    const result = rollbackSecurityPolicy(current, previous, "engineer-1", NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects rollback to a never-published target", () => {
    const current = makePolicy({ lifecycleState: "active" });
    const previous = makePolicy({ lifecycleState: "draft", publishedAt: null });
    const result = rollbackSecurityPolicy(current, previous, "engineer-1", NOW);
    expect(result.ok).toBe(false);
  });

  it("supersedes the current policy and reactivates the previous one", () => {
    const current = makePolicy({ id: "policy-v2", lifecycleState: "active" });
    const previous = makePolicy({ id: "policy-v1", publishedAt: "2025-12-01T00:00:00Z" });
    const result = rollbackSecurityPolicy(current, previous, "engineer-1", NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.supersededPolicy.lifecycleState).toBe("superseded");
      expect(result.supersededPolicy.supersededByPolicyId).toBe("policy-v1");
      expect(result.rolledBackTo.lifecycleState).toBe("active");
    }
  });
});
