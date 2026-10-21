/**
 * Sherivs Scholar — class model (Phase-04 §23).
 *
 * A class may define: identity, level, programme, academic period, campus,
 * room, teacher assignments, student membership (identity lives in Phase 02),
 * subjects, timetable and policies. All references are optional configuration —
 * validated against whatever the institution actually declared.
 */

export interface TeacherAssignment {
  teacherId: string;
  role?: string | null;
}

export interface ClassDefinition {
  id: string;
  name: string;
  levelCode?: string | null;
  programmeCode?: string | null;
  academicPeriodCode?: string | null;
  campus?: string | null;
  room?: string | null;
  teacherAssignments?: TeacherAssignment[];
  studentIds?: string[];
  subjectCodes?: string[];
  timetableId?: string | null;
  policies?: Record<string, unknown>;
}

export interface ClassReferenceIndex {
  levelCodes?: ReadonlySet<string>;
  programmeCodes?: ReadonlySet<string>;
  academicPeriodCodes?: ReadonlySet<string>;
  campusNames?: ReadonlySet<string>;
  subjectCodes?: ReadonlySet<string>;
  cohortIds?: ReadonlySet<string>;
}

export type ClassesValidation =
  { ok: true; classes: ClassDefinition[] } | { ok: false; issues: string[] };

export function validateClasses(
  input: readonly ClassDefinition[],
  refs: ClassReferenceIndex = {},
): ClassesValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const klass of input) {
    const id = klass.id.trim();
    if (!id) {
      issues.push("a class requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate class id "${id}"`);
    ids.add(id);
    if (!klass.name.trim()) issues.push(`class "${id}": name is required`);

    if (klass.levelCode && refs.levelCodes && !refs.levelCodes.has(klass.levelCode)) {
      issues.push(`class "${id}": unknown level "${klass.levelCode}"`);
    }
    if (
      klass.programmeCode &&
      refs.programmeCodes &&
      !refs.programmeCodes.has(klass.programmeCode)
    ) {
      issues.push(`class "${id}": unknown programme "${klass.programmeCode}"`);
    }
    if (
      klass.academicPeriodCode &&
      refs.academicPeriodCodes &&
      !refs.academicPeriodCodes.has(klass.academicPeriodCode)
    ) {
      issues.push(`class "${id}": unknown academic period "${klass.academicPeriodCode}"`);
    }
    if (klass.campus && refs.campusNames && !refs.campusNames.has(klass.campus)) {
      issues.push(`class "${id}": unknown campus "${klass.campus}"`);
    }
    if (Array.isArray(klass.subjectCodes)) {
      for (const code of klass.subjectCodes) {
        if (refs.subjectCodes && !refs.subjectCodes.has(code)) {
          issues.push(`class "${id}": unknown subject "${code}"`);
        }
      }
    }

    if (Array.isArray(klass.teacherAssignments)) {
      const seenTeachers = new Set<string>();
      for (const assignment of klass.teacherAssignments) {
        if (!assignment.teacherId.trim()) {
          issues.push(`class "${id}": a teacher assignment requires a teacher id`);
          continue;
        }
        if (seenTeachers.has(assignment.teacherId)) {
          issues.push(`class "${id}": duplicate teacher assignment "${assignment.teacherId}"`);
        }
        seenTeachers.add(assignment.teacherId);
        if (assignment.role === "") issues.push(`class "${id}": assignment role must not be blank`);
      }
    }
  }

  return issues.length === 0 ? { ok: true, classes: [...input] } : { ok: false, issues };
}

/** Compact view of a class's identity anchors (for rendering + projections). */
export function classAnchors(klass: ClassDefinition): {
  level: string | null;
  programme: string | null;
  period: string | null;
  campus: string | null;
  room: string | null;
} {
  return {
    level: klass.levelCode ?? null,
    programme: klass.programmeCode ?? null,
    period: klass.academicPeriodCode ?? null,
    campus: klass.campus ?? null,
    room: klass.room ?? null,
  };
}
