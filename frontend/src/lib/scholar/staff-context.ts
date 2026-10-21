/**
 * Sherivs Scholar — staff educational context (Phase-04 §28).
 *
 * An educator's educational context (over their P02 human identity) may carry
 * subjects, classes, campuses, departments, shifts, programmes and academic
 * periods plus named responsibilities. Only configured anchors are present —
 * nothing is invented for a staff member the institution has not described.
 */

export type ResponsibilityArea =
  "teaching" | "assessment" | "supervision" | "duty" | "meeting" | "extracurricular" | "other";

export const RESPONSIBILITY_AREAS: readonly ResponsibilityArea[] = [
  "teaching",
  "assessment",
  "supervision",
  "duty",
  "meeting",
  "extracurricular",
  "other",
] as const;

export interface StaffResponsibility {
  area: ResponsibilityArea;
  description: string;
}

export interface StaffContext {
  educatorId: string;
  tenantId?: string | null;
  subjectCodes?: string[];
  classIds?: string[];
  campusNames?: string[];
  department?: string | null;
  shiftNames?: string[];
  programmeCodes?: string[];
  academicPeriodCodes?: string[];
  responsibilities?: StaffResponsibility[];
}

export interface StaffReferenceIndex {
  subjectCodes?: ReadonlySet<string>;
  classIds?: ReadonlySet<string>;
  campusNames?: ReadonlySet<string>;
  shiftNames?: ReadonlySet<string>;
  programmeCodes?: ReadonlySet<string>;
  academicPeriodCodes?: ReadonlySet<string>;
}

export type StaffContextValidation =
  { ok: true; context: StaffContext } | { ok: false; issues: string[] };

export function validateStaffContext(
  context: StaffContext,
  refs: StaffReferenceIndex = {},
): StaffContextValidation {
  const issues: string[] = [];

  if (!context.educatorId.trim()) issues.push("educatorId (P02 identity id) is required");
  for (const code of context.subjectCodes ?? []) {
    if (refs.subjectCodes && !refs.subjectCodes.has(code)) issues.push(`unknown subject "${code}"`);
  }
  for (const id of context.classIds ?? []) {
    if (refs.classIds && !refs.classIds.has(id)) issues.push(`unknown class "${id}"`);
  }
  for (const campus of context.campusNames ?? []) {
    if (refs.campusNames && !refs.campusNames.has(campus))
      issues.push(`unknown campus "${campus}"`);
  }
  for (const shift of context.shiftNames ?? []) {
    if (refs.shiftNames && !refs.shiftNames.has(shift)) issues.push(`unknown shift "${shift}"`);
  }
  for (const code of context.programmeCodes ?? []) {
    if (refs.programmeCodes && !refs.programmeCodes.has(code))
      issues.push(`unknown programme "${code}"`);
  }
  for (const code of context.academicPeriodCodes ?? []) {
    if (refs.academicPeriodCodes && !refs.academicPeriodCodes.has(code)) {
      issues.push(`unknown academic period "${code}"`);
    }
  }
  for (const responsibility of context.responsibilities ?? []) {
    if (!RESPONSIBILITY_AREAS.includes(responsibility.area)) {
      issues.push(`responsibility area must be one of ${RESPONSIBILITY_AREAS.join(", ")}`);
    }
    if (!responsibility.description.trim()) issues.push("a responsibility requires a description");
  }

  return issues.length === 0 ? { ok: true, context } : { ok: false, issues };
}
