/**
 * CoreGrid Scholar — lesson model (Phase-04 §45, upgrade target of the legacy
 * academic lesson layer).
 *
 * A lesson contains subject, teacher, class, time, location, learning
 * objectives, resources, activities, attendance and evidence references — all
 * typed configuration validated against the institution's declared index.
 * Optimisation of lesson scheduling stays owned by Phase 12 (§35).
 */

export interface LessonDefinition {
  id: string;
  name: string;
  subjectCode?: string | null;
  teacherIds?: string[];
  classCohortId?: string | null;
  /** Inclusive HH:MM window on a lesson date (YYYY-MM-DD). */
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  campus?: string | null;
  location?: string | null;
  learningObjectives?: string[];
  resourceRefs?: string[];
  activityIds?: string[];
  attendanceRef?: string | null;
  evidenceRefs?: string[];
  notes?: string | null;
}

export interface LessonReferenceIndex {
  subjectCodes?: ReadonlySet<string>;
  classCohortIds?: ReadonlySet<string>;
  campusNames?: ReadonlySet<string>;
  activityIds?: ReadonlySet<string>;
}

export type LessonsValidation =
  { ok: true; lessons: LessonDefinition[] } | { ok: false; issues: string[] };

export function validateLessons(
  input: readonly LessonDefinition[],
  refs: LessonReferenceIndex = {},
): LessonsValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const lesson of input) {
    const id = lesson.id.trim();
    if (!id) {
      issues.push("a lesson requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate lesson id "${id}"`);
    ids.add(id);
    if (!lesson.name.trim()) issues.push(`lesson "${id}": name is required`);
    if (lesson.subjectCode && refs.subjectCodes && !refs.subjectCodes.has(lesson.subjectCode)) {
      issues.push(`lesson "${id}": unknown subject "${lesson.subjectCode}"`);
    }
    if (
      lesson.classCohortId &&
      refs.classCohortIds &&
      !refs.classCohortIds.has(lesson.classCohortId)
    ) {
      issues.push(`lesson "${id}": unknown class/cohort "${lesson.classCohortId}"`);
    }
    if (lesson.campus && refs.campusNames && !refs.campusNames.has(lesson.campus)) {
      issues.push(`lesson "${id}": unknown campus "${lesson.campus}"`);
    }
    if (Array.isArray(lesson.activityIds)) {
      for (const activityId of lesson.activityIds) {
        if (refs.activityIds && !refs.activityIds.has(activityId)) {
          issues.push(`lesson "${id}": unknown activity "${activityId}"`);
        }
      }
    }
    if (lesson.teacherIds?.some((t) => !t.trim())) {
      issues.push(`lesson "${id}": teacher ids must not be blank`);
    }
    if (lesson.startTime && lesson.endTime && lesson.endTime <= lesson.startTime) {
      issues.push(`lesson "${id}": endTime must be after startTime`);
    }
  }

  return issues.length === 0 ? { ok: true, lessons: [...input] } : { ok: false, issues };
}
