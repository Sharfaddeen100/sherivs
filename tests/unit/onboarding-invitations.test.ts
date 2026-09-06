/**
 * CoreGrid — Phase 25 wave-2 tests: domain-neutral invitations/activation
 * + onboarding progress/resume.
 */
import { describe, expect, it } from "vitest";
import {
  acceptInvitation,
  activeInvitationRole,
  createInvitation,
  isInvitationExpired,
  revokeInvitation,
  type OrganizationInvitation,
} from "@/lib/onboarding/invitations";
import {
  createOrganizationOnboarding,
  onboardingProgress,
  requiredArtifactsForStage,
} from "@/lib/onboarding/onboarding-flow";

const NOW = "2026-09-04T10:00:00.000Z";

function invite(overrides: Partial<OrganizationInvitation> = {}): OrganizationInvitation {
  return {
    id: "inv-1",
    organizationId: "org-1",
    workspaceId: "ws-1",
    inviterId: "ident-admin-1",
    intendedRole: "org_administrator",
    channelRef: "email:ref-1",
    inviteeRef: "person@example.com",
    expiresAt: "2026-12-31T00:00:00.000Z",
    status: "pending",
    acceptedAt: null,
    acceptedByIdentity: null,
    createdAt: NOW,
    ...overrides,
  };
}

describe("invitations (§AN–AR)", () => {
  it("creates pending invitations for any organization with a role CODE", () => {
    const result = createInvitation({
      id: "inv-2",
      organizationId: "org-2",
      workspaceId: "ws-2",
      inviterId: "ident-platform",
      intendedRole: "agency_officer",
      channelRef: "sms:ref-2",
      expiresAt: "2026-11-01T00:00:00.000Z",
      createdAt: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.invitation.status).toBe("pending");
  });

  it("rejects malformed invitations", () => {
    const result = createInvitation({
      id: "",
      organizationId: "",
      workspaceId: "",
      inviterId: "",
      intendedRole: "",
      expiresAt: "bad",
      createdAt: "bad",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.length).toBeGreaterThanOrEqual(5);
  });

  it("accepts pending invitations and records the accepting identity", () => {
    const accepted = acceptInvitation(invite(), "ident-new-admin", NOW);
    expect(accepted.ok).toBe(true);
    if (accepted.ok) {
      expect(accepted.invitation.status).toBe("accepted");
      expect(accepted.invitation.acceptedByIdentity).toBe("ident-new-admin");
      expect(activeInvitationRole(accepted.invitation)).toBe("org_administrator");
    }
  });

  it("expired access FAILS (§170)", () => {
    const expired = invite({ expiresAt: "2026-09-01T00:00:00.000Z" });
    expect(isInvitationExpired(expired, NOW)).toBe(true);
    const result = acceptInvitation(expired, "ident-x", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issue).toContain("expired");
  });

  it("revoked invitations FAIL and accepted ones cannot be revoked", () => {
    const revoked = revokeInvitation(invite());
    expect(revoked.ok).toBe(true);
    if (revoked.ok) expect(revoked.invitation.status).toBe("revoked");
    const afterRevoke = acceptInvitation(
      revoked.ok ? revoked.invitation : invite(),
      "ident-x",
      NOW,
    );
    expect(afterRevoke.ok).toBe(false);

    const accepted = acceptInvitation(invite(), "ident-x", NOW);
    if (!accepted.ok) throw new Error(accepted.issue);
    const cannotRevoke = revokeInvitation(accepted.invitation);
    expect(cannotRevoke.ok).toBe(false);
  });
});

describe("progress/resume (§BA–BB)", () => {
  it("reports stages, ratio and next resume point", () => {
    const created = createOrganizationOnboarding({
      onboardingId: "onb-1",
      organizationId: "org-1",
      orgType: "government_agency",
      actor: "ident-platform",
      createdAt: NOW,
    });
    if (!created.ok) throw new Error(created.issues.join("; "));
    const progress = onboardingProgress(created.onboarding);
    expect(progress.index).toBe(0);
    expect(progress.nextStage).toBe("profile_configured");
    expect(progress.complete).toBe(false);
    expect(requiredArtifactsForStage("tenant_provisioned")).toEqual([
      "tenantId",
      "organizationIdentityId",
    ]);
    expect(requiredArtifactsForStage("profile_configured")).toEqual([]);
  });

  it("declares complete once active", () => {
    const created = createOrganizationOnboarding({
      onboardingId: "onb-2",
      organizationId: "org-2",
      orgType: "company",
      actor: "ident-platform",
      createdAt: NOW,
    });
    if (!created.ok) throw new Error(created.issues.join("; "));
    const done = { ...created.onboarding, stage: "active" as const };
    const progress = onboardingProgress(done);
    expect(progress.complete).toBe(true);
    expect(progress.nextStage).toBe(null);
    expect(progress.ratio).toBe(1);
  });
});
