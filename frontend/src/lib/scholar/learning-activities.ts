/**
 * CoreGrid Scholar — learning activities (Phase-04 §44).
 *
 * Activities may include classroom lessons, practicals, laboratories,
 * workshops, field trips, farm activities, community activities, religious
 * activities, sports, clubs, examinations and projects — configuration, never
 * a fixed activity catalogue.
 */

export type LearningActivityKind =
  | "lesson"
  | "practical"
  | "laboratory"
  | "workshop"
  | "field_trip"
  | "farm_activity"
  | "community_activity"
  | "religious_activity"
  | "sports"
  | "club"
  | "examination"
  | "project"
  | "custom";

export const LEARNING_ACTIVITY_KINDS: readonly LearningActivityKind[] = [
  "lesson",
  "practical",
  "laboratory",
  "workshop",
  "field_trip",
  "farm_activity",
  "community_activity",
  "religious_activity",
  "sports",
  "club",
  "examination",
  "project",
  "custom",
] as const;

export interface LearningActivity {
  id: string;
  kind: LearningActivityKind;
  name: string;
  subjectCode?: string | null;
  classCohortId?: string | null;
  locationType?: string | null;
  scheduleRef?: string | null;
  facilitatorIds?: string[];
}

export type LearningActivitiesValidation =
  { ok: true; activities: LearningActivity[] } | { ok: false; issues: string[] };

export function validateLearningActivities(
  input: readonly LearningActivity[],
): LearningActivitiesValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const activity of input) {
    const id = activity.id.trim();
    if (!id) {
      issues.push("an activity requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate activity id "${id}"`);
    ids.add(id);
    if (!activity.name.trim()) issues.push(`activity "${id}": name is required`);
    if (!LEARNING_ACTIVITY_KINDS.includes(activity.kind)) {
      issues.push(`activity "${id}": kind must be one of ${LEARNING_ACTIVITY_KINDS.join(", ")}`);
    }
    if (activity.facilitatorIds?.some((f) => !f.trim())) {
      issues.push(`activity "${id}": facilitator ids must not be blank`);
    }
  }

  return issues.length === 0 ? { ok: true, activities: [...input] } : { ok: false, issues };
}
