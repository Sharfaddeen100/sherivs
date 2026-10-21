/**
 * Sherivs Scholar — assessment model (Phase-04 §40, upgrade target of the
 * legacy education-assessment domain layer).
 *
 * Assessment kinds — assignment, quiz, test, examination, practical, oral,
 * project, presentation, competency and institution-defined — are typed
 * configuration. A definition names the assessment; a record binds a learner
 * to scored (or competency/outcome) evidence owned by this runtime.
 */

export type AssessmentKind =
  | "assignment"
  | "quiz"
  | "test"
  | "examination"
  | "practical"
  | "oral"
  | "project"
  | "presentation"
  | "competency"
  | "institution_defined";

export const ASSESSMENT_KINDS: readonly AssessmentKind[] = [
  "assignment",
  "quiz",
  "test",
  "examination",
  "practical",
  "oral",
  "project",
  "presentation",
  "competency",
  "institution_defined",
] as const;

export interface AssessmentDefinition {
  id: string;
  kind: AssessmentKind;
  name: string;
  subjectCode?: string | null;
  classCohortId?: string | null;
  /** Optional contribution weight (0–100) when the institution uses weights. */
  weight?: number | null;
  notes?: string | null;
}

export type AssessmentsValidation =
  { ok: true; assessments: AssessmentDefinition[] } | { ok: false; issues: string[] };

export function validateAssessments(input: readonly AssessmentDefinition[]): AssessmentsValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const assessment of input) {
    const id = assessment.id.trim();
    if (!id) {
      issues.push("an assessment requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate assessment id "${id}"`);
    ids.add(id);
    if (!assessment.name.trim()) issues.push(`assessment "${id}": name is required`);
    if (!ASSESSMENT_KINDS.includes(assessment.kind)) {
      issues.push(`assessment "${id}": kind must be one of ${ASSESSMENT_KINDS.join(", ")}`);
    }
    if (
      assessment.weight != null &&
      (!Number.isFinite(assessment.weight) || assessment.weight < 0 || assessment.weight > 100)
    ) {
      issues.push(`assessment "${id}": weight must be between 0 and 100 when provided`);
    }
  }

  return issues.length === 0 ? { ok: true, assessments: [...input] } : { ok: false, issues };
}

export type AssessmentOutcome =
  | { kind: "scored"; obtained: number; total: number }
  | { kind: "competency"; level: string }
  | { kind: "outcome"; passed: boolean };

export interface AssessmentRecord {
  assessmentId: string;
  studentId: string;
  outcome: AssessmentOutcome;
  recordedBy?: string | null;
}

export type AssessmentRecordsValidation =
  { ok: true; records: AssessmentRecord[] } | { ok: false; issues: string[] };

export function validateAssessmentRecords(
  input: readonly AssessmentRecord[],
): AssessmentRecordsValidation {
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const record of input) {
    if (!record.assessmentId.trim() || !record.studentId.trim()) {
      issues.push("an assessment record requires assessmentId and studentId");
      continue;
    }
    const key = `${record.assessmentId}::${record.studentId}`;
    if (seen.has(key))
      issues.push(
        `duplicate record for assessment "${record.assessmentId}" of student "${record.studentId}"`,
      );
    seen.add(key);
    if (record.outcome.kind === "scored") {
      if (record.outcome.total <= 0) issues.push("scored outcomes require a positive total");
      if (record.outcome.obtained < 0 || record.outcome.obtained > record.outcome.total) {
        issues.push(`scored outcome for "${record.studentId}" is outside the possible range`);
      }
    } else if (record.outcome.kind === "competency") {
      if (!record.outcome.level.trim()) issues.push("competency outcomes require a level");
    }
  }

  return issues.length === 0 ? { ok: true, records: [...input] } : { ok: false, issues };
}

/** Percentage for a scored record (0–100) or null for other outcome kinds. */
export function scoredPercentage(record: AssessmentRecord): number | null {
  if (record.outcome.kind !== "scored") return null;
  return (record.outcome.obtained / record.outcome.total) * 100;
}
