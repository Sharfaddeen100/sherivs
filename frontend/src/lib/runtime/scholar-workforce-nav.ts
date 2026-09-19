/**
 * CoreGrid Scholar (R-001) — workforce-kind → chrome resolution (advisory).
 *
 * Maps the workforce-kind authority groups (Phase 25 catalog) onto the R-001
 * workspace chrome kinds (Phase 06 nav data) so a staff member's real post can
 * drive their own workspace chrome and labels.
 *
 * SAFETY INVARIANT (tested): resolution is SHRINK-ONLY and never escalates.
 *   - A kind maps to at most one chrome kind (teacher-grade, finance, driver,
 *     org-admin) or to NO chrome (null) when R-001 ships none for that post.
 *   - Derived capability sets are always a subset of the coarse membership
 *     capability set they correspond to.
 *   - When the intersection of position-derived and membership capabilities is
 *     empty (a mis-assigned position), the membership set is returned
 *     unchanged — a position can never lock someone out or elevate them.
 * This module is display/chrome advisory data. Phase 08 remains the only
 * authorization authority; nothing here grants access.
 */
import { scholarWorkforceKind } from "./scholar-workforce";
import type { WorkforceAuthorityGroup } from "../workforce-kinds";
import { scholarCapabilitiesForKind, type ScholarNavKind } from "@/lib/runtime/nav-registry";

/** Advisory chrome kind per authority group (R-001 data; only where R-001 ships one). */
const AUTHORITY_CHROME: Readonly<Partial<Record<WorkforceAuthorityGroup, ScholarNavKind>>> = {
  org_admin: "org_admin",
  teaching_leadership: "teacher",
  teaching_staff: "teacher",
  finance_officer: "bursar",
  transport: "driver",
};

export function scholarChromeKindForAuthorityGroup(
  group: WorkforceAuthorityGroup,
): ScholarNavKind | null {
  return AUTHORITY_CHROME[group] ?? null;
}

/** Resolve the chrome kind a workforce position would occupy (null = none shipped). */
export function scholarChromeKindForWorkforceKindCode(code: string): ScholarNavKind | null {
  const kind = scholarWorkforceKind(code);
  if (!kind) return null;
  return scholarChromeKindForAuthorityGroup(kind.authorityGroup);
}

/** Capability set the position would occupy; null when R-001 ships no chrome for it. */
export function scholarCapabilitiesForWorkforceKindCode(code: string): ReadonlySet<string> | null {
  const chrome = scholarChromeKindForWorkforceKindCode(code);
  return chrome ? scholarCapabilitiesForKind(chrome) : null;
}

/**
 * Membership-safe capability resolution for a primary position.
 * Returns the intersection with the coarse membership set when the position
 * maps to a chrome kind AND the intersection is non-empty; otherwise returns
 * the membership set unchanged (no escalation, no lockout).
 */
export function scholarCapabilitiesForPrimaryPosition(
  code: string,
  membershipCapabilities: ReadonlySet<string>,
): ReadonlySet<string> {
  const positionCapabilities = scholarCapabilitiesForWorkforceKindCode(code);
  if (!positionCapabilities) return membershipCapabilities;

  const intersection = new Set<string>();
  for (const capability of membershipCapabilities) {
    if (positionCapabilities.has(capability)) intersection.add(capability);
  }
  return intersection.size > 0 ? intersection : membershipCapabilities;
}

/**
 * Header/workspace label: prefer the real post title when the member has a
 * primary position; fall back to the coarse membership label otherwise.
 */
export function scholarWorkspaceLabelForMember(
  positionKindCode: string | null | undefined,
  membershipLabel: string,
): string {
  if (!positionKindCode) return membershipLabel;
  const kind = scholarWorkforceKind(positionKindCode);
  return kind ? kind.title : membershipLabel;
}
