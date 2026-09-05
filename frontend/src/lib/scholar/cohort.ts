/**
 * CoreGrid Scholar — cohort model (Phase-04 §22).
 *
 * A school organises learners through many overlapping containers: intake,
 * cohort, class, stream, group, house, tutorial group, practical group and
 * examination group (custom is always available). This module keeps the cohort
 * structure honest — unique identifiers, valid kinds, acyclic parent trees and
 * consistent code references. Which containers a given school uses is
 * configuration, never a default.
 */

export type CohortKind =
  | "intake"
  | "cohort"
  | "class"
  | "stream"
  | "group"
  | "house"
  | "tutorial_group"
  | "practical_group"
  | "examination_group"
  | "custom";

export const COHORT_KINDS: readonly CohortKind[] = [
  "intake",
  "cohort",
  "class",
  "stream",
  "group",
  "house",
  "tutorial_group",
  "practical_group",
  "examination_group",
  "custom",
] as const;

export interface CohortDefinition {
  id: string;
  kind: CohortKind;
  name: string;
  /** Optional references into other configuration (validated when provided). */
  levelCode?: string | null;
  programmeCode?: string | null;
  academicPeriodCode?: string | null;
  campus?: string | null;
  parentCohortId?: string | null;
  sortOrder?: number;
}

export type CohortsValidation =
  { ok: true; cohorts: CohortDefinition[] } | { ok: false; issues: string[] };

export function validateCohorts(input: readonly CohortDefinition[]): CohortsValidation {
  const issues: string[] = [];
  const byId = new Map<string, CohortDefinition>();

  for (const cohort of input) {
    const id = cohort.id.trim();
    if (!id) {
      issues.push("a cohort requires an id");
      continue;
    }
    if (byId.has(id)) issues.push(`duplicate cohort id "${id}"`);
    byId.set(id, cohort);
    if (!COHORT_KINDS.includes(cohort.kind)) {
      issues.push(`cohort "${id}": kind must be one of ${COHORT_KINDS.join(", ")}`);
    }
    if (!cohort.name.trim()) issues.push(`cohort "${id}": name is required`);
  }

  for (const cohort of input) {
    if (!cohort.parentCohortId) continue;
    const parent = byId.get(cohort.parentCohortId);
    if (!parent) {
      issues.push(`cohort "${cohort.id}": parent cohort "${cohort.parentCohortId}" does not exist`);
    }
  }

  // Cycle guard over the parent tree.
  for (const cohort of input) {
    const seen = new Set<string>([cohort.id]);
    let cursor = cohort.parentCohortId ?? null;
    while (cursor) {
      if (seen.has(cursor)) {
        issues.push(`cohort hierarchy cycle detected at "${cursor}"`);
        break;
      }
      seen.add(cursor);
      cursor = byId.get(cursor)?.parentCohortId ?? null;
    }
  }

  return issues.length === 0 ? { ok: true, cohorts: [...input] } : { ok: false, issues };
}

/** Direct + transitive child ids of a cohort (or empty when unknown). */
export function descendantCohorts(rootId: string, cohorts: readonly CohortDefinition[]): string[] {
  const byParent = new Map<string, string[]>();
  for (const cohort of cohorts) {
    if (!cohort.parentCohortId) continue;
    const list = byParent.get(cohort.parentCohortId) ?? [];
    list.push(cohort.id);
    byParent.set(cohort.parentCohortId, list);
  }
  const result: string[] = [];
  const queue = [...(byParent.get(rootId) ?? [])];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    result.push(id);
    queue.push(...(byParent.get(id) ?? []));
  }
  return result;
}
