/**
 * Sherivs Scholar — academic periods (Phase-04 §30, §35 boundary).
 *
 * Academic periods are CONFIGURABLE (never fixed): annual, semester, term,
 * trimester, quarter or a custom period, organised in nested ranges. The
 * timetable optimisation intelligence remains owned by Phase 12 (§35) — this
 * module only keeps period structure honest: non-blank identities, valid
 * inclusive date ranges, nesting inside a parent range, and no overlapping
 * ranges among siblings.
 */

export type AcademicPeriodKind =
  "annual" | "semester" | "term" | "trimester" | "quarter" | "custom";

export const ACADEMIC_PERIOD_KINDS: readonly AcademicPeriodKind[] = [
  "annual",
  "semester",
  "term",
  "trimester",
  "quarter",
  "custom",
] as const;

export interface AcademicPeriod {
  kind: AcademicPeriodKind;
  name: string;
  code: string;
  /** Inclusive ISO date range (YYYY-MM-DD). */
  startDate: string;
  endDate: string;
  parentId?: string | null;
  sortOrder?: number;
}

export interface AcademicPeriodNode extends AcademicPeriod {
  id: string;
}

export type AcademicPeriodsValidation =
  { ok: true; periods: AcademicPeriodNode[] } | { ok: false; issues: string[] };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Inclusive range overlap for ISO dates. */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Does `child` fall entirely inside the inclusive range of `parent`? */
export function containsRange(parent: AcademicPeriod, child: AcademicPeriod): boolean {
  return parent.startDate <= child.startDate && child.endDate <= parent.endDate;
}

export function validateAcademicPeriods(
  input: readonly AcademicPeriod[],
): AcademicPeriodsValidation {
  const issues: string[] = [];
  const nodes = input.map((p, index) => ({ ...p, id: p.code || `period-${index}` }));

  const byCode = new Map<string, AcademicPeriodNode>();
  for (const period of nodes) {
    if (!ACADEMIC_PERIOD_KINDS.includes(period.kind)) {
      issues.push(
        `period "${period.code}": kind must be one of ${ACADEMIC_PERIOD_KINDS.join(", ")}`,
      );
    }
    if (!period.name.trim()) issues.push(`period "${period.code}": name is required`);
    if (!period.code.trim()) issues.push("a period code is required");
    if (byCode.has(period.code)) issues.push(`duplicate period code "${period.code}"`);
    else if (period.code.trim()) byCode.set(period.code, period);
    if (!isValidIsoDate(period.startDate))
      issues.push(`period "${period.code}": startDate must be YYYY-MM-DD`);
    if (!isValidIsoDate(period.endDate))
      issues.push(`period "${period.code}": endDate must be YYYY-MM-DD`);
    if (
      isValidIsoDate(period.startDate) &&
      isValidIsoDate(period.endDate) &&
      period.endDate < period.startDate
    ) {
      issues.push(`period "${period.code}": endDate precedes startDate`);
    }
  }

  // Parent containment + cycle guard + sibling overlap (same-level conflict-free).
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string, trail: string[]): void => {
    if (visiting.has(id)) {
      issues.push(`period hierarchy cycle detected: ${[...trail, id].join(" → ")}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const period = byCode.get(id);
    if (period) {
      if (period.parentId != null) {
        const parent = byCode.get(period.parentId);
        if (!parent) {
          issues.push(`period "${period.code}": parent "${period.parentId}" does not exist`);
        } else {
          visit(parent.id, [...trail, id]);
          if (!containsRange(parent, period)) {
            issues.push(`period "${period.code}": range must nest inside parent "${parent.code}"`);
          }
        }
      }
    }
    visiting.delete(id);
    visited.add(id);
  };
  for (const period of nodes) {
    if (period.code.trim()) visit(period.code, []);
  }

  // Sibling overlap: two periods with the same parent must not overlap.
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const sameParent = (a.parentId ?? null) === (b.parentId ?? null);
      if (
        sameParent &&
        a.code !== b.code &&
        isValidIsoDate(a.startDate) &&
        isValidIsoDate(a.endDate) &&
        isValidIsoDate(b.startDate) &&
        isValidIsoDate(b.endDate) &&
        rangesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)
      ) {
        issues.push(`periods "${a.code}" and "${b.code}" overlap at the same level`);
      }
    }
  }

  return issues.length === 0 ? { ok: true, periods: nodes } : { ok: false, issues };
}

/** Depth of a period in its hierarchy (0 = root). */
export function periodDepth(period: AcademicPeriodNode): number {
  return period.parentId ? 1 : 0;
}
