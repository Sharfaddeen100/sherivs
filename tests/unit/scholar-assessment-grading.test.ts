/**
 * Sherivs Scholar — Cluster H tests (Phase-04 §40–43).
 * Assessment model, configurable grading, promotion/progression.
 */
import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_KINDS,
  scoredPercentage,
  validateAssessmentRecords,
  validateAssessments,
} from "@/lib/scholar/assessment-model";
import {
  gradeForDescriptor,
  gradeForPercentage,
  validateGradingModel,
  type GradingModel,
} from "@/lib/scholar/grading";
import {
  evaluateProgression,
  type ProgressionPolicy,
  type StudentProgressionEvidence,
} from "@/lib/scholar/progression";

describe("assessment-model (§40)", () => {
  it("accepts every assessment kind plus records", () => {
    const assessments = validateAssessments(
      ASSESSMENT_KINDS.map((kind, index) => ({
        id: `a-${index}`,
        kind,
        name: `${kind} assessment`,
        subjectCode: "MATH",
      })),
    );
    expect(assessments.ok).toBe(true);
  });

  it("validates scored/competency records and ranges", () => {
    const records = validateAssessmentRecords([
      {
        assessmentId: "a-1",
        studentId: "l-1",
        outcome: { kind: "scored", obtained: 17, total: 20 },
      },
      {
        assessmentId: "a-2",
        studentId: "l-1",
        outcome: { kind: "competency", level: "proficient" },
      },
    ]);
    expect(records.ok).toBe(true);

    const outOfRange = validateAssessmentRecords([
      {
        assessmentId: "a-1",
        studentId: "l-1",
        outcome: { kind: "scored", obtained: 25, total: 20 },
      },
    ]);
    expect(outOfRange.ok).toBe(false);
  });

  it("derives percentages from scored records", () => {
    const record = {
      assessmentId: "a-1",
      studentId: "l-1",
      outcome: { kind: "scored" as const, obtained: 15, total: 20 },
    };
    expect(scoredPercentage(record)).toBe(75);
  });
});

describe("grading (§41)", () => {
  const letters: GradingModel = {
    code: "GRD-LTR",
    name: "A–F Letters",
    kind: "letter",
    scale: [
      { label: "A", minPercentage: 70, maxPercentage: 100, passed: true },
      { label: "B", minPercentage: 60, maxPercentage: 69, passed: true },
      { label: "C", minPercentage: 50, maxPercentage: 59, passed: true },
      { label: "D", minPercentage: 40, maxPercentage: 49, passed: false },
      { label: "F", minPercentage: 0, maxPercentage: 39, passed: false },
    ],
  };

  it("validates and resolves letter scales", () => {
    expect(validateGradingModel(letters).ok).toBe(true);
    expect(gradeForPercentage(letters, 74).label).toBe("A");
    expect(gradeForPercentage(letters, 44).passed).toBe(false);
    expect(gradeForPercentage(letters, 55).label).toBe("C");
  });

  it("supports numerical, percentage, pass/fail and competency models", () => {
    const numerical: GradingModel = {
      code: "GRD-NUM",
      name: "20",
      kind: "numerical",
      scale: [],
      numericalPassMark: 50,
    };
    expect(validateGradingModel(numerical).ok).toBe(true);
    expect(gradeForPercentage(numerical, 60).passed).toBe(true);

    const competency: GradingModel = {
      code: "GRD-COMP",
      name: "Competency",
      kind: "competency",
      scale: [
        { label: "exemplary", minPercentage: 0, maxPercentage: 100, passed: true },
        { label: "developing", minPercentage: 0, maxPercentage: 100, passed: false },
      ],
    };
    expect(validateGradingModel(competency).ok).toBe(true);
    expect(gradeForDescriptor(competency, "exemplary").passed).toBe(true);
    expect(gradeForDescriptor(competency, "missing").label).toBe("unscored");
  });

  it("rejects overlapping and inverted scales", () => {
    const overlap: GradingModel = {
      ...letters,
      scale: [
        { label: "A", minPercentage: 60, maxPercentage: 100, passed: true },
        { label: "B", minPercentage: 50, maxPercentage: 70, passed: true },
      ],
    };
    expect(validateGradingModel(overlap).ok).toBe(false);

    const inverted: GradingModel = {
      ...letters,
      scale: [{ label: "A", minPercentage: 100, maxPercentage: 60, passed: true }],
    };
    expect(validateGradingModel(inverted).ok).toBe(false);
  });
});

describe("progression (§42–43)", () => {
  const policy: ProgressionPolicy = {
    id: "POL-PROMO",
    name: "Level promotion",
    requiredSubjectCodes: ["MATH", "ENGLISH"],
    minPassedRate: 0.6,
    minAttendancePct: 75,
    requiredCompetencies: ["literacy_basic"],
  };

  const passingEvidence: StudentProgressionEvidence = {
    studentId: "l-1",
    currentLevelCode: "lower",
    subjectResults: [
      { subjectCode: "MATH", passed: true },
      { subjectCode: "ENGLISH", passed: true },
      { subjectCode: "SCIENCE", passed: true },
      { subjectCode: "HISTORY", passed: false },
    ],
    competenciesAchieved: ["literacy_basic"],
    attendancePct: 88,
  };

  it("promotes when all policy requirements are met", () => {
    const result = evaluateProgression(passingEvidence, policy);
    expect(result.decision).toBe("promote");
    expect(result.unmet).toEqual([]);
  });

  it("retains when required subjects or attendance fail", () => {
    const failedSubject = evaluateProgression(
      { ...passingEvidence, subjectResults: [{ subjectCode: "MATH", passed: false }] },
      policy,
    );
    expect(failedSubject.decision).toBe("retain");
    expect(failedSubject.unmet.join(" ")).toContain("required subject");

    const lowAttendance = evaluateProgression({ ...passingEvidence, attendancePct: 60 }, policy);
    expect(lowAttendance.decision).toBe("retain");
    expect(lowAttendance.unmet.join(" ")).toContain("attendance");
  });

  it("never assumes attendance is acceptable when it is unknown", () => {
    const unknownAttendance = evaluateProgression(
      { ...passingEvidence, attendancePct: null },
      policy,
    );
    expect(unknownAttendance.decision).toBe("retain");
    expect(unknownAttendance.unmet.join(" ")).toContain("no assumption");
  });

  it("routes unmet requirements to review when institutional policy says so", () => {
    const reviewPolicy: ProgressionPolicy = { ...policy, reviewInsteadOfRetain: true };
    const result = evaluateProgression({ ...passingEvidence, attendancePct: 40 }, reviewPolicy);
    expect(result.decision).toBe("review");
  });

  it("maps a clean decision to an institution-defined state (§43)", () => {
    const customPolicy: ProgressionPolicy = {
      ...policy,
      institutionStateLabel: "advanced_candidate",
    };
    const result = evaluateProgression(passingEvidence, customPolicy);
    expect(result.decision).toBe("institution_defined");
    expect(result.stateLabel).toBe("advanced_candidate");
  });
});
