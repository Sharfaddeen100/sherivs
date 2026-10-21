/**
 * Sherivs Scholar — class flexibility (Phase-04 §25).
 *
 * A learner may belong to DIFFERENT groups for DIFFERENT activities: the
 * mathematics set, the football team, the examination room and the boarding
 * house are separate memberships. This module validates the constraint that
 * really matters — one learner cannot be in two groups for the SAME activity —
 * and answers "which group is this learner in, per activity?".
 */

export interface ActivityGroupMembership {
  learnerId: string;
  activityCode: string;
  groupId: string;
  role?: string | null;
}

export type ClassFlexibilityValidation =
  { ok: true; memberships: ActivityGroupMembership[] } | { ok: false; issues: string[] };

export function validateClassFlexibility(
  input: readonly ActivityGroupMembership[],
  knownGroups?: ReadonlySet<string> | null,
): ClassFlexibilityValidation {
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const membership of input) {
    if (!membership.learnerId.trim()) issues.push("a membership requires a learnerId");
    if (!membership.activityCode.trim()) issues.push("a membership requires an activityCode");
    if (!membership.groupId.trim()) issues.push("a membership requires a groupId");
    if (knownGroups && !knownGroups.has(membership.groupId)) {
      issues.push(`membership references unknown group "${membership.groupId}"`);
    }
    const key = `${membership.learnerId}::${membership.activityCode}`;
    if (seen.has(key)) {
      issues.push(
        `learner "${membership.learnerId}" is assigned to more than one group for activity "${membership.activityCode}"`,
      );
    }
    seen.add(key);
  }

  return issues.length === 0 ? { ok: true, memberships: [...input] } : { ok: false, issues };
}

/** Per-activity group for one learner (Map activity → group). */
export function groupsForLearner(
  memberships: readonly ActivityGroupMembership[],
  learnerId: string,
): Map<string, string> {
  const result = new Map<string, string>();
  for (const membership of memberships) {
    if (membership.learnerId !== learnerId) continue;
    result.set(membership.activityCode, membership.groupId);
  }
  return result;
}
