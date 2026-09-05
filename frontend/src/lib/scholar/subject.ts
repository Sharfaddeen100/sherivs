/**
 * CoreGrid Scholar — subject model (Phase-04 §19, upgrade target).
 *
 * Subjects are not hard-coded. Each subject may carry identity, code,
 * description, curriculum relationship, department, level applicability,
 * learning objectives, competencies, assessments, required facilities,
 * required equipment and required teachers — all configuration.
 */

export interface SubjectDefinition {
  code: string;
  name: string;
  description?: string | null;
  curriculumId?: string | null;
  department?: string | null;
  levelCodes?: string[];
  learningObjectives?: string[];
  competencies?: string[];
  assessmentRefs?: string[];
  requiredFacilities?: string[];
  requiredEquipment?: string[];
  requiredTeachers?: number | null;
}

export interface SubjectReferenceIndex {
  levelCodes?: ReadonlySet<string>;
  curriculumIds?: ReadonlySet<string>;
}

export type SubjectsValidation =
  { ok: true; subjects: SubjectDefinition[] } | { ok: false; issues: string[] };

export function validateSubjects(
  input: readonly SubjectDefinition[],
  refs: SubjectReferenceIndex = {},
): SubjectsValidation {
  const issues: string[] = [];
  const codes = new Set<string>();

  for (const subject of input) {
    const code = subject.code.trim();
    if (!code) {
      issues.push("a subject requires a code");
      continue;
    }
    if (codes.has(code)) issues.push(`duplicate subject code "${code}"`);
    codes.add(code);
    if (!subject.name.trim()) issues.push(`subject "${code}": name is required`);
    if (
      subject.curriculumId &&
      refs.curriculumIds &&
      !refs.curriculumIds.has(subject.curriculumId)
    ) {
      issues.push(`subject "${code}": unknown curriculum "${subject.curriculumId}"`);
    }
    for (const level of subject.levelCodes ?? []) {
      if (refs.levelCodes && !refs.levelCodes.has(level))
        issues.push(`subject "${code}": unknown level "${level}"`);
    }
    if (subject.requiredTeachers != null && subject.requiredTeachers < 0) {
      issues.push(`subject "${code}": requiredTeachers must not be negative`);
    }
  }

  return issues.length === 0 ? { ok: true, subjects: [...input] } : { ok: false, issues };
}

/** Convenience summary for catalogs and timetables. */
export function subjectFacilityDemand(subject: SubjectDefinition): string[] {
  return [...(subject.requiredFacilities ?? []), ...(subject.requiredEquipment ?? [])];
}
