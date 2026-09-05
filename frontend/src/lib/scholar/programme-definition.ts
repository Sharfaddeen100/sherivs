/**
 * CoreGrid Scholar — programme definition (Phase-04 §21, upgrade target of the
 * legacy academic programme layer).
 *
 * A programme defines purpose, duration, curriculum, levels, required
 * subjects, optional subjects, competencies, assessments, progression rules
 * and certification requirements — every part is configuration and nothing is
 * presumed about the institution that defines it.
 */

export interface ProgressionRule {
  fromLevelCode?: string | null;
  toLevelCode?: string | null;
  rule: string;
}

export interface ProgrammeDefinition {
  code: string;
  name: string;
  purpose?: string | null;
  /** Duration in months (positive, configurable). */
  durationMonths?: number | null;
  curriculumId?: string | null;
  levelCodes?: string[];
  requiredSubjectCodes?: string[];
  optionalSubjectCodes?: string[];
  competencyRefs?: string[];
  assessmentRefs?: string[];
  progressionRules?: ProgressionRule[];
  certificationRequirement?: string | null;
}

export interface ProgrammeReferenceIndex {
  curriculumIds?: ReadonlySet<string>;
  levelCodes?: ReadonlySet<string>;
  subjectCodes?: ReadonlySet<string>;
}

export type ProgrammeDefinitionsValidation =
  { ok: true; programmes: ProgrammeDefinition[] } | { ok: false; issues: string[] };

export function validateProgrammeDefinitions(
  input: readonly ProgrammeDefinition[],
  refs: ProgrammeReferenceIndex = {},
): ProgrammeDefinitionsValidation {
  const issues: string[] = [];
  const codes = new Set<string>();

  for (const programme of input) {
    const code = programme.code.trim();
    if (!code) {
      issues.push("a programme requires a code");
      continue;
    }
    if (codes.has(code)) issues.push(`duplicate programme code "${code}"`);
    codes.add(code);
    if (!programme.name.trim()) issues.push(`programme "${code}": name is required`);
    if (programme.durationMonths != null && programme.durationMonths <= 0) {
      issues.push(`programme "${code}": durationMonths must be positive when provided`);
    }
    if (
      programme.curriculumId &&
      refs.curriculumIds &&
      !refs.curriculumIds.has(programme.curriculumId)
    ) {
      issues.push(`programme "${code}": unknown curriculum "${programme.curriculumId}"`);
    }
    for (const level of programme.levelCodes ?? []) {
      if (refs.levelCodes && !refs.levelCodes.has(level))
        issues.push(`programme "${code}": unknown level "${level}"`);
    }
    for (const subject of [
      ...(programme.requiredSubjectCodes ?? []),
      ...(programme.optionalSubjectCodes ?? []),
    ]) {
      if (refs.subjectCodes && !refs.subjectCodes.has(subject)) {
        issues.push(`programme "${code}": unknown subject "${subject}"`);
      }
    }
    const required = new Set(programme.requiredSubjectCodes ?? []);
    for (const optional of programme.optionalSubjectCodes ?? []) {
      if (required.has(optional)) {
        issues.push(
          `programme "${code}": subject "${optional}" cannot be both required and optional`,
        );
      }
    }
    for (const rule of programme.progressionRules ?? []) {
      if (!rule.rule.trim()) issues.push(`programme "${code}": a progression rule requires text`);
    }
  }

  return issues.length === 0 ? { ok: true, programmes: [...input] } : { ok: false, issues };
}
