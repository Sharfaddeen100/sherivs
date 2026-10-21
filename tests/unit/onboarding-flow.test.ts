/**
 * Sherivs — Phase 25 domain-neutral onboarding tests.
 * Any organization type (school/company/agency/community) flows through the
 * SAME governed pipeline; any future runtime can be activated.
 */
import { describe, expect, it } from "vitest";
import {
  ONBOARDING_STAGES,
  activeRuntimeContext,
  advanceOnboarding,
  createOrganizationOnboarding,
  isOnboardingComplete,
  type OrganizationOnboarding,
} from "@/lib/onboarding/onboarding-flow";

const NOW = "2026-09-04T10:00:00.000Z";

function created(orgType = "government_agency") {
  const result = createOrganizationOnboarding({
    onboardingId: "onb-1",
    organizationId: "org-1",
    orgType,
    actor: "ident-platform",
    createdAt: NOW,
  });
  if (!result.ok) throw new Error(result.issues.join("; "));
  return result.onboarding;
}

/** Drive an onboarding to 'active' step by step. */
function complete(
  onboarding: OrganizationOnboarding,
  runtimeId = "runtime:scholar",
): OrganizationOnboarding {
  let record = onboarding;
  const steps: Array<[string, Record<string, string>]> = [
    ["profile_configured", {}],
    ["tenant_provisioned", { tenantId: `tenant:org-1`, organizationIdentityId: "ident-org-1" }],
    ["admin_provisioned", { adminIdentityId: "ident-admin-1" }],
    ["policy_set_installed", { policySetId: "policy:default" }],
    ["workspace_provisioned", { workspaceId: "ws-org-1" }],
    ["runtime_activated", { runtimeId }],
    ["active", {}],
  ];
  for (const [stage, artifacts] of steps) {
    const advanced = advanceOnboarding(record, stage as never, artifacts, NOW);
    if (!advanced.ok) throw new Error(advanced.issue);
    record = advanced.onboarding;
  }
  return record;
}

describe("create (§D creation model)", () => {
  it("accepts every organization class through ONE pipeline", () => {
    for (const orgType of [
      "school",
      "university",
      "company",
      "government_agency",
      "community_institution",
      "non_profit",
    ]) {
      const result = createOrganizationOnboarding({
        onboardingId: `onb-${orgType}`,
        organizationId: "org-x",
        orgType,
        actor: "ident-platform",
        createdAt: NOW,
      });
      expect(result.ok).toBe(true);
    }
  });

  it("rejects blank ids, actors and invalid timestamps", () => {
    const issues = createOrganizationOnboarding({
      onboardingId: "",
      organizationId: "",
      orgType: "  ",
      actor: "",
      createdAt: "nope",
    });
    expect(issues.ok).toBe(false);
    if (!issues.ok) expect(issues.issues.length).toBeGreaterThanOrEqual(4);
  });
});

describe("lifecycle (§no-portals progression)", () => {
  it("advances sequentially with required artifacts", () => {
    const record = complete(created("company"));
    expect(record.stage).toBe("active");
    expect(isOnboardingComplete(record)).toBe(true);
    expect(record.activeRuntimeIds).toEqual(["runtime:scholar"]);
  });

  it("never jumps stages", () => {
    const record = created();
    const jump = advanceOnboarding(record, "active", {}, NOW);
    expect(jump.ok).toBe(false);
    if (!jump.ok) expect(jump.issue).toContain("cannot move");
  });

  it("requires the artifacts of each stage", () => {
    let record = created();
    record = (
      advanceOnboarding(record, "profile_configured", {}, NOW) as {
        ok: true;
        onboarding: OrganizationOnboarding;
      }
    ).onboarding;
    const missingTenant = advanceOnboarding(record, "tenant_provisioned", {}, NOW);
    expect(missingTenant.ok).toBe(false);
    if (!missingTenant.ok) expect(missingTenant.issue).toContain('"tenantId" is required');
  });

  it("never makes the organization identity the initial administrator", () => {
    let record = created();
    record = (
      advanceOnboarding(record, "profile_configured", {}, NOW) as {
        ok: true;
        onboarding: OrganizationOnboarding;
      }
    ).onboarding;
    const badAdmin = advanceOnboarding(
      record,
      "tenant_provisioned",
      { tenantId: "tenant:org-1", organizationIdentityId: "ident-org-1" },
      NOW,
    );
    if (!badAdmin.ok) throw new Error(badAdmin.issue);
    const result = advanceOnboarding(
      (badAdmin as { ok: true; onboarding: OrganizationOnboarding }).onboarding,
      "admin_provisioned",
      { adminIdentityId: "ident-org-1" },
      NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issue).toContain("cannot be the organization identity");
  });

  it("activates ANY runtime and treats 'active' as terminal", () => {
    const record = complete(created("university"));
    const beyond = advanceOnboarding(
      record,
      "runtime_activated" as never,
      { runtimeId: "runtime:scholar" },
      NOW,
    );
    expect(beyond.ok).toBe(false); // active is terminal

    const commerce = complete(created(), "runtime:commerce");
    expect(commerce.activeRuntimeIds).toEqual(["runtime:commerce"]);
  });
});

describe("dynamic workspace context (§P06 hand-off)", () => {
  it("exposes the derived surface context only after activation", () => {
    const record = created("government_agency");
    expect(activeRuntimeContext(record)).toBe(null);

    const done = complete(record, "runtime:education-scholar");
    const context = activeRuntimeContext(done);
    expect(context).not.toBe(null);
    expect(context?.orgType).toBe("government_agency");
    expect(context?.activeRuntimeIds).toContain("runtime:education-scholar");
    expect(context?.workspaceId).toBe("ws-org-1");
  });

  it("registers the exact stage set (single canonical progression)", () => {
    expect(ONBOARDING_STAGES).toHaveLength(8);
    expect(ONBOARDING_STAGES[0]).toBe("organization_created");
    expect(ONBOARDING_STAGES[ONBOARDING_STAGES.length - 1]).toBe("active");
  });
});
