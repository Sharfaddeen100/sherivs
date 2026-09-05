/**
 * CoreGrid Scholar — teacher workload (Phase-04 §29).
 *
 * Workload models teaching hours, preparation, assessment, supervision,
 * duties, meetings and extracurricular responsibilities as a transparent,
 * per-week summary per educator and academic period. No workload cap is
 * invented here — an institution may enforce its own via maxHours.
 */

export type WorkloadArea =
  | "teaching"
  | "preparation"
  | "assessment"
  | "supervision"
  | "duties"
  | "meetings"
  | "extracurricular";

export const WORKLOAD_AREAS: readonly WorkloadArea[] = [
  "teaching",
  "preparation",
  "assessment",
  "supervision",
  "duties",
  "meetings",
  "extracurricular",
] as const;

export interface WorkloadItem {
  area: WorkloadArea;
  description: string;
  hoursPerWeek: number;
}

export interface WeeklyWorkload {
  educatorId: string;
  academicPeriodCode?: string | null;
  items: WorkloadItem[];
}

export type WorkloadValidation =
  | { ok: true; workload: WeeklyWorkload; summary: WorkloadSummary }
  | { ok: false; issues: string[] };

export interface WorkloadSummary {
  totalHoursPerWeek: number;
  byArea: Record<WorkloadArea, number>;
}

export function summarizeWorkload(items: readonly WorkloadItem[]): WorkloadSummary {
  const byArea: Record<WorkloadArea, number> = {
    teaching: 0,
    preparation: 0,
    assessment: 0,
    supervision: 0,
    duties: 0,
    meetings: 0,
    extracurricular: 0,
  };
  let total = 0;
  for (const item of items) {
    byArea[item.area] += item.hoursPerWeek;
    total += item.hoursPerWeek;
  }
  return { totalHoursPerWeek: total, byArea };
}

export function validateWeeklyWorkload(
  workload: WeeklyWorkload,
  maxHoursPerWeek?: number,
): WorkloadValidation {
  const issues: string[] = [];

  if (!workload.educatorId.trim()) issues.push("educatorId is required");
  if (maxHoursPerWeek != null && (!Number.isFinite(maxHoursPerWeek) || maxHoursPerWeek <= 0)) {
    issues.push("maxHoursPerWeek must be a positive number when provided");
  }
  for (const item of workload.items) {
    if (!WORKLOAD_AREAS.includes(item.area)) {
      issues.push(`area must be one of ${WORKLOAD_AREAS.join(", ")}`);
    }
    if (!item.description.trim()) issues.push("a workload item requires a description");
    if (!Number.isFinite(item.hoursPerWeek) || item.hoursPerWeek < 0) {
      issues.push(`item "${item.description}": hoursPerWeek must be a non-negative number`);
    }
  }

  const summary = summarizeWorkload(workload.items);
  if (maxHoursPerWeek != null && summary.totalHoursPerWeek > maxHoursPerWeek) {
    issues.push(
      `total weekly workload ${summary.totalHoursPerWeek}h exceeds the configured limit of ${maxHoursPerWeek}h`,
    );
  }

  return issues.length === 0 ? { ok: true, workload, summary } : { ok: false, issues };
}
