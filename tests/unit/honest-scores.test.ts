import { describe, expect, it } from "vitest";
import {
  academicAverage,
  attendanceRate,
  composeWeightedScore,
  feeCollectionRate,
  parentEngagementRate,
  roundScore,
  staffAttendanceRate,
  studentRiskFromAvailable,
} from "@/lib/runtime/scholar/honest-scores";

describe("attendanceRate", () => {
  it("treats empty attendance as unavailable, not 100%", () => {
    expect(attendanceRate([])).toBeNull();
    expect(attendanceRate(undefined)).toBeNull();
    expect(attendanceRate(null)).toBeNull();
  });

  it("computes present+late over recorded rows", () => {
    expect(
      attendanceRate([
        { status: "present" },
        { status: "late" },
        { status: "absent" },
        { status: "absent" },
      ]),
    ).toBe(50);
  });
});

describe("feeCollectionRate", () => {
  it("does not treat missing billed fees as 100% collection", () => {
    expect(feeCollectionRate(0, 0)).toBeNull();
    expect(feeCollectionRate(0, 50)).toBeNull();
  });

  it("computes collection against billed amount when fees exist", () => {
    expect(feeCollectionRate(200, 50)).toBe(25);
    expect(feeCollectionRate(100, 100)).toBe(100);
  });
});

describe("parentEngagementRate and staffAttendanceRate", () => {
  it("returns unavailable when the denominator is missing", () => {
    expect(parentEngagementRate(0, 0)).toBeNull();
    expect(parentEngagementRate(0, 12)).toBeNull();
    expect(staffAttendanceRate(0, 0)).toBeNull();
  });

  it("computes rates from live counts when the population exists", () => {
    expect(parentEngagementRate(10, 4)).toBe(40);
    expect(staffAttendanceRate(4, 2)).toBe(50);
  });
});

describe("academicAverage", () => {
  it("returns unavailable when no grades exist", () => {
    expect(academicAverage([])).toBeNull();
  });

  it("averages published totals when grades exist", () => {
    expect(academicAverage([{ total_score: 80 }, { total_score: 60 }])).toBe(70);
  });
});

describe("composeWeightedScore", () => {
  it("does not invent an overall score when every component is unavailable", () => {
    const result = composeWeightedScore([
      { id: "attendance", label: "Attendance", weight: 25, score: null },
      { id: "fees", label: "Fees", weight: 20, score: null },
    ]);
    expect(result.overall).toBeNull();
    expect(result.appliedWeight).toBe(0);
  });

  it("reweights among available components instead of filling gaps with placeholders", () => {
    const result = composeWeightedScore([
      { id: "attendance", label: "Attendance", weight: 25, score: 80 },
      { id: "fees", label: "Fees", weight: 25, score: null },
    ]);
    expect(result.overall).toBe(80);
    expect(result.appliedWeight).toBe(25);
  });

  it("produces a populated weighted overall when all inputs exist", () => {
    const result = composeWeightedScore([
      { id: "a", label: "A", weight: 25, score: 100 },
      { id: "b", label: "B", weight: 25, score: 0 },
      { id: "c", label: "C", weight: 50, score: 50 },
    ]);
    expect(result.overall).toBe(50);
    expect(roundScore(result.overall)).toBe(50);
  });
});

describe("studentRiskFromAvailable", () => {
  it("does not fabricate risk from missing attendance, grades, or fees", () => {
    expect(studentRiskFromAvailable({ attendanceRate: null, gradeAverage: null }).risk).toBeNull();
  });

  it("does not treat empty attendance as a perfect 100 attendance score", () => {
    const missingAttendance = studentRiskFromAvailable({
      attendanceRate: null,
      gradeAverage: 80,
    });
    expect(missingAttendance.used).toEqual(["grades"]);
    expect(missingAttendance.risk).toBe(20);
  });

  it("omits fees so a missing fee book cannot force feeScore 100", () => {
    const both = studentRiskFromAvailable({ attendanceRate: 100, gradeAverage: 100 });
    expect(both.used).toEqual(["attendance", "grades"]);
    expect(both.risk).toBe(0);
  });

  it("computes risk from populated attendance and grades", () => {
    const result = studentRiskFromAvailable({ attendanceRate: 50, gradeAverage: 50 });
    expect(result.risk).toBe(50);
  });
});
