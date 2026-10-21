/**
 * Sherivs Scholar — promotion & student progression (Phase-04 §42–43).
 *
 * Progression rules may depend on grades, competencies, attendance, required
 * subjects, examination results and institutional policy (§42). Student
 * progression follows institution-specific states (§43). This module keeps the
 * decision honest: a promotion decision is DERIVED from evidence and policy —
 * it is never invented, and every unmet requirement is stated.
 */

export type ProgressionDecision = "promote" | "retain" | "review" | "institution_defined";

export interface SubjectResultEvidence {
  subjectCode: string;
  passed: boolean | null;
}

export interface StudentProgressionEvidence {
  studentId: string;
  currentLevelCode?: string | null;
  subjectResults: SubjectResultEvidence[];
  competenciesAchieved?: string[];
  attendancePct?: number | null;
  /** References to examination results owned by cluster I (§42). */
  examinationResultRefs?: string[];
}

export interface ProgressionPolicy {
  id: string;
  name: string;
  /** When set, a decision that is not default maps to this institution state. */
  institutionStateLabel?: string | null;
  requiredSubjectCodes?: string[];
  /** Fraction of taken subjects that must be passed (0–1). */
  minPassedRate?: number | null;
  minAttendancePct?: number | null;
  requiredCompetencies?: string[];
  /** Institutional policy flag: unmet requirements route to review, not retain. */
  reviewInsteadOfRetain?: boolean;
  notes?: string | null;
}

export interface ProgressionEvaluation {
  studentId: string;
  decision: ProgressionDecision;
  stateLabel: string | null;
  met: string[];
  unmet: string[];
}

export function evaluateProgression(
  evidence: StudentProgressionEvidence,
  policy: ProgressionPolicy,
): ProgressionEvaluation {
  const met: string[] = [];
  const unmet: string[] = [];
  const passedCount = evidence.subjectResults.filter((r) => r.passed === true).length;

  if (evidence.studentId.trim() === "") unmet.push("studentId is required");

  const required = policy.requiredSubjectCodes ?? [];
  if (required.length > 0) {
    const present = new Map(evidence.subjectResults.map((r) => [r.subjectCode, r]));
    for (const code of required) {
      const result = present.get(code);
      if (!result) {
        unmet.push(`required subject "${code}" has no result`);
      } else if (result.passed !== true) {
        unmet.push(`required subject "${code}" was not passed`);
      }
    }
    met.push(`all ${required.length} required subject(s) satisfied`);
  }

  const taken = evidence.subjectResults.length;
  if (policy.minPassedRate != null && taken > 0) {
    const rate = passedCount / taken;
    if (rate < policy.minPassedRate) {
      unmet.push(
        `passed rate ${rate.toFixed(2)} is below the required ${policy.minPassedRate.toFixed(2)}`,
      );
    } else {
      met.push(`passed rate ${rate.toFixed(2)} meets the requirement`);
    }
  }

  if (policy.minAttendancePct != null) {
    if (evidence.attendancePct == null) {
      unmet.push("attendance percentage is unknown — no assumption made");
    } else if (evidence.attendancePct < policy.minAttendancePct) {
      unmet.push(
        `attendance ${evidence.attendancePct}% is below the required ${policy.minAttendancePct}%`,
      );
    } else {
      met.push(`attendance ${evidence.attendancePct}% meets the requirement`);
    }
  }

  const competencies = new Set(evidence.competenciesAchieved ?? []);
  for (const competency of policy.requiredCompetencies ?? []) {
    if (competencies.has(competency)) met.push(`competency "${competency}" achieved`);
    else unmet.push(`competency "${competency}" not yet achieved`);
  }

  let decision: ProgressionDecision;
  if (unmet.length === 0) {
    decision = policy.institutionStateLabel ? "institution_defined" : "promote";
  } else if (policy.reviewInsteadOfRetain) {
    decision = "review";
  } else {
    decision = "retain";
  }

  return {
    studentId: evidence.studentId,
    decision,
    stateLabel:
      decision === "institution_defined"
        ? (policy.institutionStateLabel ?? "institution_defined")
        : decision,
    met,
    unmet,
  };
}
