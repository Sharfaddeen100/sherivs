/**
 * Sherivs — Phase 25 wave-3 tests: domain-neutral organization membership
 * lifecycle, role change, transfer, separation of duties, offboarding.
 */
import { describe, expect, it } from "vitest";
import {
  MEMBER_LIFECYCLE_STATES,
  OFFBOARDING_STEPS,
  assertDualControl,
  assertDutiesDistinct,
  beginRoleChangeReconciliation,
  canCompleteOffboarding,
  canTransitionMemberLifecycle,
  changeMemberRoles,
  completeMemberTransferReconciliation,
  completeOffboardingStep,
  createMemberTransfer,
  createOrganizationMembership,
  isMembershipAccessActive,
  isMembershipExpired,
  startMemberOffboarding,
  transitionMemberLifecycle,
  type OrganizationMembership,
} from "@/lib/onboarding/workforce-lifecycle";

const NOW = "2026-09-04T10:00:00.000Z";

function membership(overrides: Partial<OrganizationMembership> = {}): OrganizationMembership {
  return createOrganizationMembership({
    membershipId: "mem-1",
    tenantId: "tenant:org-1",
    organizationId: "org-1",
    workspaceId: "ws-1",
    identityId: "ident-1",
    roleCodes: ["org_administrator"],
    createdAt: NOW,
    ...overrides,
  });
}

function transition(
  record: OrganizationMembership,
  to: Parameters<typeof transitionMemberLifecycle>[1],
) {
  return transitionMemberLifecycle(record, to, {
    actorId: "ident-admin-1",
    tenantId: record.tenantId,
    organizationId: record.organizationId,
    reason: "test transition",
    now: NOW,
  });
}

/** Hop list toward each target (invited is the entry state). */
const ROUTES: Record<string, readonly string[]> = {
  activating: ["activating"],
  active: ["activating", "active"],
  suspended: ["activating", "active", "suspended"],
  on_leave: ["activating", "active", "on_leave"],
  transferred: ["activating", "active", "transferred"],
  deactivated: ["activating", "active", "deactivated"],
  archived: ["activating", "active", "deactivated", "archived"],
};

/** Drive membership from its current state to the target via legal hops. */
function driveTo(record: OrganizationMembership, target: string): OrganizationMembership {
  let current = record;
  const fromIndex = MEMBER_LIFECYCLE_STATES.indexOf(current.state);
  for (const hop of ROUTES[target] ?? []) {
    const hopIndex = MEMBER_LIFECYCLE_STATES.indexOf(hop as never);
    if (hopIndex <= fromIndex) continue;
    if (!canTransitionMemberLifecycle(current.state, hop as never))
      throw new Error(`no path ${current.state}->${hop}`);
    const result = transition(current, hop as never);
    if (!result.ok) throw new Error(result.issue);
    current = result.membership;
  }
  return current;
}

describe("member lifecycle (BD)", () => {
  it("declares the canonical 8-state progression", () => {
    expect(MEMBER_LIFECYCLE_STATES).toEqual([
      "invited",
      "activating",
      "active",
      "suspended",
      "on_leave",
      "transferred",
      "deactivated",
      "archived",
    ]);
    expect(canTransitionMemberLifecycle("invited", "activating")).toBe(true);
    expect(canTransitionMemberLifecycle("active", "archived")).toBe(false);
    expect(canTransitionMemberLifecycle("deactivated", "archived")).toBe(true);
  });

  it("records an immutable audit trail on every transition", () => {
    const active = driveTo(membership(), "active");
    expect(active.state).toBe("active");
    expect(active.audit.length).toBe(2);
    expect(active.audit[1]).toMatchObject({
      from: "activating",
      to: "active",
      actorId: "ident-admin-1",
    });
  });

  it("denies cross-tenant and cross-organization transitions", () => {
    const record = membership();
    const otherTenant = transitionMemberLifecycle(record, "activating", {
      actorId: "ident-admin-1",
      tenantId: "tenant:org-9",
      organizationId: record.organizationId,
      reason: "sneak",
      now: NOW,
    });
    expect(otherTenant.ok).toBe(false);
    const otherOrg = transitionMemberLifecycle(record, "activating", {
      actorId: "ident-admin-1",
      tenantId: record.tenantId,
      organizationId: "org-9",
      reason: "sneak",
      now: NOW,
    });
    expect(otherOrg.ok).toBe(false);
  });

  it("activation requires at least one role code; deactivation requires a reason", () => {
    const noRoles = { ...membership(), roleCodes: [] };
    const activated = transition(noRoles, "activating");
    if (!activated.ok) throw new Error(activated.issue);
    const blocked = transition(activated.membership, "active");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.issue).toContain("role code");

    const active = driveTo(membership(), "active");
    const noReason = transitionMemberLifecycle(active, "deactivated", {
      actorId: "ident-admin-1",
      tenantId: active.tenantId,
      organizationId: active.organizationId,
      reason: "  ",
      now: NOW,
    });
    expect(noReason.ok).toBe(false);
    if (!noReason.ok) expect(noReason.issue).toContain("reason");
  });

  it("expired access FAILS; archived is terminal and audit survives", () => {
    const active = driveTo(membership(), "active");
    const expired = { ...active, accessExpiresAt: "2026-09-01T00:00:00.000Z" };
    expect(isMembershipExpired(expired, NOW)).toBe(true);
    expect(isMembershipAccessActive(expired, NOW)).toBe(false);
    expect(isMembershipAccessActive(active, NOW)).toBe(true);

    const deactivated = driveTo(active, "deactivated");
    const archived = driveTo(deactivated, "archived");
    expect(archived.audit.length).toBeGreaterThanOrEqual(4);
    expect(isMembershipAccessActive(archived, NOW)).toBe(false);
  });
});

describe("role change + transfer (BF/BE)", () => {
  it("role change requires recalculation of permissions/policies/workspace", () => {
    const plan = beginRoleChangeReconciliation();
    expect(plan.recalculate).toMatchObject({
      permissions: true,
      policies: true,
      workspace: true,
      audit: true,
    });
  });

  it("changes role codes only for grant-bearing or recoverable states", () => {
    const active = driveTo(membership(), "active");
    const changed = changeMemberRoles(
      active,
      ["org_administrator", "hr_officer"],
      "ident-admin-1",
      NOW,
    );
    expect(changed.ok).toBe(true);
    if (changed.ok) expect(changed.membership.roleCodes).toContain("hr_officer");

    const empty = changeMemberRoles(active, [], "ident-admin-1", NOW);
    expect(empty.ok).toBe(false);
  });

  it("transfer auto-triggers recalculation, completed explicitly", () => {
    const transfer = createMemberTransfer({
      id: "t-1",
      tenantId: "tenant:org-1",
      organizationId: "org-1",
      membershipId: "mem-1",
      identityId: "ident-1",
      kind: "organization",
      fromRef: "org-1",
      toRef: "org-2",
      performedBy: "ident-admin-1",
      now: NOW,
    });
    expect(transfer.recalculationStatus).toBe("pending");
    expect(completeMemberTransferReconciliation(transfer).recalculationStatus).toBe("completed");
  });
});

describe("separation of duties + offboarding (BL/BM/BI)", () => {
  it("Requester ≠ Approver ≠ Executor; dual control needs two distinct named actors", () => {
    expect(assertDutiesDistinct(["r-1", "a-1", "e-1"]).ok).toBe(true);
    const dup = assertDutiesDistinct(["r-1", "r-1", "e-1"], ["Requester", "Approver", "Executor"]);
    expect(dup.ok).toBe(false);
    expect(assertDualControl("ident-a", "ident-b").ok).toBe(true);
    expect(assertDualControl("ident-a", "ident-a").ok).toBe(false);
  });

  it("offboarding completes only after access revocation and every step", () => {
    const plan = startMemberOffboarding({
      offboardingId: "off-1",
      membershipId: "mem-1",
      organizationId: "org-1",
      tenantId: "tenant:org-1",
      startedAt: NOW,
    });
    const partial = completeOffboardingStep(plan, "deviceRevocation");
    const cannotYet = canCompleteOffboarding(partial);
    expect(cannotYet.ok).toBe(false);

    let done = plan;
    for (const step of OFFBOARDING_STEPS) done = completeOffboardingStep(done, step);
    expect(done.status).toBe("completed");
    expect(canCompleteOffboarding(done).ok).toBe(true);
  });
});
