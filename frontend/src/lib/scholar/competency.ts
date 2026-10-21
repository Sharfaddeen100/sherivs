/**
 * Sherivs Scholar — competency model + mastery (Phase-04 §102–103).
 *
 * Competencies may be academic, technical, practical, vocational, behavioural
 * or professional (plus institution-defined domains). Mastery supports
 * not-started, developing, competent, proficient and mastered — or
 * institution-defined states (§103). Never a Western-fixed scale: states are
 * declared configuration.
 */

export type CompetencyDomain =
  "academic" | "technical" | "practical" | "vocational" | "behavioural" | "professional" | "custom";

export const COMPETENCY_DOMAINS: readonly CompetencyDomain[] = [
  "academic",
  "technical",
  "practical",
  "vocational",
  "behavioural",
  "professional",
  "custom",
] as const;

export type MasteryLevel =
  "not_started" | "developing" | "competent" | "proficient" | "mastered" | "institution_defined";

export const MASTERY_LEVELS: readonly MasteryLevel[] = [
  "not_started",
  "developing",
  "competent",
  "proficient",
  "mastered",
  "institution_defined",
] as const;

export interface Competency {
  code: string;
  name: string;
  domain: CompetencyDomain;
  description?: string | null;
}

export interface MasteryRecord {
  studentId: string;
  competencyCode: string;
  level: MasteryLevel;
  assessedAt: string;
  assessorId?: string | null;
}

export function validateCompetencies(input: readonly Competency[]): string[] {
  const issues: string[] = [];
  const codes = new Set<string>();
  for (const competency of input) {
    const code = competency.code.trim();
    if (!code) {
      issues.push("a competency requires a code");
      continue;
    }
    if (codes.has(code)) issues.push(`duplicate competency code "${code}"`);
    codes.add(code);
    if (!competency.name.trim()) issues.push(`competency "${code}": name is required`);
    if (!COMPETENCY_DOMAINS.includes(competency.domain)) {
      issues.push(`competency "${code}": domain must be one of ${COMPETENCY_DOMAINS.join(", ")}`);
    }
  }
  return issues;
}

export function validateMasteryRecords(input: readonly MasteryRecord[]): string[] {
  const issues: string[] = [];
  for (const record of input) {
    if (!record.studentId.trim() || !record.competencyCode.trim()) {
      issues.push("a mastery record requires studentId and competencyCode");
      continue;
    }
    if (!MASTERY_LEVELS.includes(record.level)) {
      issues.push(
        `mastery record for "${record.studentId}": level must be one of ${MASTERY_LEVELS.join(", ")}`,
      );
    }
    if (!Number.isFinite(Date.parse(record.assessedAt))) {
      issues.push(`mastery record for "${record.studentId}": assessedAt must be a valid timestamp`);
    }
  }
  return issues;
}

/** The most recent mastery level per learner+competency (by assessedAt). */
export function latestMastery(
  records: readonly MasteryRecord[],
  studentId: string,
  competencyCode: string,
): MasteryLevel | null {
  let latest: MasteryRecord | null = null;
  for (const record of records) {
    if (record.studentId !== studentId || record.competencyCode !== competencyCode) continue;
    if (!latest || record.assessedAt > latest.assessedAt) latest = record;
  }
  return latest?.level ?? null;
}
