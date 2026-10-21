/**
 * Sherivs — Phase 25: domain-neutral organization invitations & activation.
 *
 * Implements the phase-25 invitation + activation semantics for the ENTIRE
 * ecosystem: an organization invites a human identity into its workspace with
 * an intended role (role code is DATA — school_admin, org_administrator,
 * agency_officer, … are all just codes), the invitation expires unless
 * accepted, and expired/revoked access ALWAYS fails (§170 property).
 *
 * Platform laws:
 * - No delivery here (P10 owns communication; channels are references).
 * - Intended role never grants anything until P08 authorization resolves it.
 * - Expired access fails; revoked access fails.
 */

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export const INVITATION_STATUSES: readonly InvitationStatus[] = [
  "pending",
  "accepted",
  "expired",
  "revoked",
] as const;

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  /** Destination workspace (P06) — may be the initial admin workspace. */
  workspaceId: string;
  /** Server-resolved identity of the inviter. */
  inviterId: string;
  /** Intended role CODE — authorization is always resolved by P08. */
  intendedRole: string;
  /** Delivery channel ref (P10 owns delivery). */
  channelRef?: string | null;
  /** Invitee reference (email/identity ref) — may be pre-identity. */
  inviteeRef?: string | null;
  expiresAt: string;
  status: InvitationStatus;
  acceptedAt?: string | null;
  acceptedByIdentity?: string | null;
  createdAt: string;
}

export type InvitationValidation =
  { ok: true; invitation: OrganizationInvitation } | { ok: false; issues: string[] };

export interface CreateInvitationInput {
  id: string;
  organizationId: string;
  workspaceId: string;
  inviterId: string;
  intendedRole: string;
  channelRef?: string | null;
  inviteeRef?: string | null;
  expiresAt: string;
  createdAt: string;
}

export function createInvitation(input: CreateInvitationInput): InvitationValidation {
  const issues: string[] = [];
  if (!input.id.trim()) issues.push("an invitation requires an id");
  if (!input.organizationId.trim()) issues.push("an invitation requires an organizationId");
  if (!input.workspaceId.trim()) issues.push("an invitation requires a workspaceId");
  if (!input.inviterId.trim()) issues.push("an invitation requires an inviter");
  const role = input.intendedRole.trim();
  if (role.length < 1 || role.length > 80) issues.push("intendedRole must be 1–80 characters");
  if (!Number.isFinite(Date.parse(input.expiresAt)))
    issues.push("expiresAt must be a valid ISO timestamp");
  if (!Number.isFinite(Date.parse(input.createdAt)))
    issues.push("createdAt must be a valid ISO timestamp");
  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    invitation: {
      id: input.id.trim(),
      organizationId: input.organizationId.trim(),
      workspaceId: input.workspaceId.trim(),
      inviterId: input.inviterId.trim(),
      intendedRole: role,
      channelRef: input.channelRef ?? null,
      inviteeRef: input.inviteeRef ?? null,
      expiresAt: input.expiresAt,
      status: "pending",
      acceptedAt: null,
      acceptedByIdentity: null,
      createdAt: input.createdAt,
    },
  };
}

/** Expired access fails: an invitation past its expiry is no longer valid. */
export function isInvitationExpired(invitation: OrganizationInvitation, now: string): boolean {
  return now > invitation.expiresAt;
}

export type InvitationActionResult =
  { ok: true; invitation: OrganizationInvitation } | { ok: false; issue: string };

export function acceptInvitation(
  invitation: OrganizationInvitation,
  acceptingIdentityId: string,
  now: string,
): InvitationActionResult {
  if (invitation.status !== "pending") {
    return {
      ok: false,
      issue: `invitation "${invitation.id}" is ${invitation.status}, not pending`,
    };
  }
  if (isInvitationExpired(invitation, now)) {
    return { ok: false, issue: `invitation "${invitation.id}" has expired` };
  }
  if (!acceptingIdentityId.trim()) {
    return { ok: false, issue: "acceptingIdentityId is required" };
  }
  return {
    ok: true,
    invitation: {
      ...invitation,
      status: "accepted",
      acceptedAt: now,
      acceptedByIdentity: acceptingIdentityId.trim(),
    },
  };
}

export function revokeInvitation(invitation: OrganizationInvitation): InvitationActionResult {
  if (invitation.status === "accepted") {
    return {
      ok: false,
      issue: `invitation "${invitation.id}" was already accepted and cannot be revoked`,
    };
  }
  return {
    ok: true,
    invitation: { ...invitation, status: "revoked", acceptedAt: invitation.acceptedAt ?? null },
  };
}

/** After acceptance the role code must still pass P08 authorization to grant. */
export function activeInvitationRole(invitation: OrganizationInvitation): string | null {
  if (invitation.status !== "accepted") return null;
  return invitation.intendedRole;
}
