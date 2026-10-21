/**
 * Honest school/student score composition.
 *
 * Missing inputs stay unavailable. Empty attendance is not 100%. Missing
 * fees are not 100% collection. No silent numeric placeholders.
 */

export type AttendanceStatusRow = { status: string };
export type GradeScoreRow = { total_score?: number | null };

export type ScoreComponent = {
  id: string;
  label: string;
  weight: number;
  score: number | null;
  note?: string;
};

export type ComposedScore = {
  overall: number | null;
  appliedWeight: number;
  components: ScoreComponent[];
};

const PRESENT_STATUSES = new Set(["present", "late"]);

export function attendanceRate(rows: readonly AttendanceStatusRow[] | null | undefined): number | null {
  if (!rows || rows.length === 0) return null;
  const present = rows.filter((row) => PRESENT_STATUSES.has(row.status)).length;
  return (present / rows.length) * 100;
}

export function academicAverage(rows: readonly GradeScoreRow[] | null | undefined): number | null {
  if (!rows || rows.length === 0) return null;
  const total = rows.reduce((sum, row) => sum + (Number(row.total_score) || 0), 0);
  return total / rows.length;
}

export function feeCollectionRate(totalBilled: number, totalCollected: number): number | null {
  if (!(totalBilled > 0)) return null;
  return (totalCollected / totalBilled) * 100;
}

export function staffAttendanceRate(totalTeachers: number, uniquePresent: number): number | null {
  if (!(totalTeachers > 0)) return null;
  return (uniquePresent / totalTeachers) * 100;
}

export function parentEngagementRate(activeStudents: number, uniqueReaders: number): number | null {
  if (!(activeStudents > 0)) return null;
  return (uniqueReaders / activeStudents) * 100;
}

export function composeWeightedScore(components: readonly ScoreComponent[]): ComposedScore {
  let appliedWeight = 0;
  let accumulator = 0;
  for (const component of components) {
    if (component.score === null || !Number.isFinite(component.score)) continue;
    appliedWeight += component.weight;
    accumulator += component.score * component.weight;
  }
  if (appliedWeight <= 0) {
    return { overall: null, appliedWeight: 0, components: [...components] };
  }
  return {
    overall: accumulator / appliedWeight,
    appliedWeight,
    components: [...components],
  };
}

export type StudentRiskInput = {
  attendanceRate: number | null;
  gradeAverage: number | null;
};

export type StudentRiskResult = {
  risk: number | null;
  used: readonly string[];
};

/**
 * Risk is 100 minus the weighted average of *available* inputs.
 * Fees are omitted unless a caller supplies them — this page's data model
 * does not currently load fee rows, so they must not default to 100.
 */
export function studentRiskFromAvailable(input: StudentRiskInput): StudentRiskResult {
  const parts: { id: string; score: number; weight: number }[] = [];
  if (input.attendanceRate !== null && Number.isFinite(input.attendanceRate)) {
    parts.push({ id: "attendance", score: input.attendanceRate, weight: 0.4 });
  }
  if (input.gradeAverage !== null && Number.isFinite(input.gradeAverage)) {
    parts.push({ id: "grades", score: input.gradeAverage, weight: 0.35 });
  }
  if (parts.length === 0) return { risk: null, used: [] };
  const weight = parts.reduce((sum, part) => sum + part.weight, 0);
  const composite = parts.reduce((sum, part) => sum + part.score * part.weight, 0) / weight;
  return {
    risk: Math.max(0, Math.min(100, 100 - composite)),
    used: parts.map((part) => part.id),
  };
}

export function roundScore(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.round(value);
}

export function unavailableNote(kind: "attendance" | "academics" | "fees" | "staff" | "parents"): string {
  switch (kind) {
    case "attendance":
      return "No attendance records in this period — score unavailable";
    case "academics":
      return "No published grades in this period — score unavailable";
    case "fees":
      return "No billed fees — collection rate unavailable";
    case "staff":
      return "No teachers on record — staff attendance unavailable";
    case "parents":
      return "No active students — parent engagement unavailable";
  }
}
