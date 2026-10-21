/**
 * Sherivs Scholar — student grouping (Phase-04 §52).
 *
 * Dynamic grouping may consider subject, level, ability, practical
 * requirements, language, support requirements and schedule — all through
 * configuration. A group declares its criterion; memberships bind learners to
 * groups. The invariant this module guards is that a learner has at most one
 * ACTIVE membership per group.
 */

export type GroupingCriterion =
  "subject" | "level" | "ability" | "practical" | "language" | "support" | "schedule" | "custom";

export const GROUPING_CRITERIA: readonly GroupingCriterion[] = [
  "subject",
  "level",
  "ability",
  "practical",
  "language",
  "support",
  "schedule",
  "custom",
] as const;

export interface StudentGroupDefinition {
  id: string;
  name: string;
  criterion: GroupingCriterion;
  levelCode?: string | null;
  subjectCode?: string | null;
  scheduleRef?: string | null;
  note?: string | null;
}

export interface StudentGroupMembership {
  groupId: string;
  studentId: string;
  active?: boolean;
  role?: string | null;
}

export type StudentGroupsValidation =
  { ok: true; groups: StudentGroupDefinition[] } | { ok: false; issues: string[] };

export function validateStudentGroups(
  input: readonly StudentGroupDefinition[],
): StudentGroupsValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const group of input) {
    const id = group.id.trim();
    if (!id) {
      issues.push("a group requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate group id "${id}"`);
    ids.add(id);
    if (!group.name.trim()) issues.push(`group "${id}": name is required`);
    if (!GROUPING_CRITERIA.includes(group.criterion)) {
      issues.push(`group "${id}": criterion must be one of ${GROUPING_CRITERIA.join(", ")}`);
    }
  }

  return issues.length === 0 ? { ok: true, groups: [...input] } : { ok: false, issues };
}

export function validateStudentGroupMemberships(
  memberships: readonly StudentGroupMembership[],
  knownGroupIds?: ReadonlySet<string> | null,
): string[] {
  const issues: string[] = [];
  const activePerGroup = new Set<string>();

  for (const membership of memberships) {
    if (!membership.groupId.trim()) issues.push("a membership requires a groupId");
    if (!membership.studentId.trim()) issues.push("a membership requires a studentId");
    if (knownGroupIds && !knownGroupIds.has(membership.groupId)) {
      issues.push(`membership references unknown group "${membership.groupId}"`);
    }
    if (membership.active !== false) {
      const key = `${membership.groupId}::${membership.studentId}`;
      if (activePerGroup.has(key)) {
        issues.push(
          `student "${membership.studentId}" has more than one active membership in group "${membership.groupId}"`,
        );
      }
      activePerGroup.add(key);
    }
  }
  return issues;
}

/** Which groups is this learner in, keyed by criterion + group id. */
export function groupingsForLearner(
  groups: readonly StudentGroupDefinition[],
  memberships: readonly StudentGroupMembership[],
  learnerId: string,
): Array<{ group: StudentGroupDefinition; criterion: GroupingCriterion }> {
  const byId = new Map(groups.map((g) => [g.id, g]));
  const result: Array<{ group: StudentGroupDefinition; criterion: GroupingCriterion }> = [];
  for (const membership of memberships) {
    if (membership.studentId !== learnerId || membership.active === false) continue;
    const group = byId.get(membership.groupId);
    if (group) result.push({ group, criterion: group.criterion });
  }
  return result;
}
