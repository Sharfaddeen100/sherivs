/**
 * CoreGrid Scholar — examination engine (Phase-04 §49).
 *
 * Internal examinations, continuous assessment, practical examinations, oral
 * examinations, external examination events and institution-defined
 * examinations are all configuration. This module owns the examination
 * DEFINITION surface; security (§50) and practical venues (§51) build on it.
 */

import { isValidIsoDate } from "./academic-period";

export type ExaminationKind =
  "internal" | "continuous_assessment" | "practical" | "oral" | "external" | "institution_defined";

export const EXAMINATION_KINDS: readonly ExaminationKind[] = [
  "internal",
  "continuous_assessment",
  "practical",
  "oral",
  "external",
  "institution_defined",
] as const;

export interface ExaminationDefinition {
  id: string;
  kind: ExaminationKind;
  name: string;
  subjectCode?: string | null;
  classCohortId?: string | null;
  date?: string | null;
  /** Optional exam window end date (inclusive). */
  endDate?: string | null;
  session?: string | null;
  notes?: string | null;
}

export type ExaminationsValidation =
  { ok: true; examinations: ExaminationDefinition[] } | { ok: false; issues: string[] };

export function validateExaminations(
  input: readonly ExaminationDefinition[],
): ExaminationsValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const examination of input) {
    const id = examination.id.trim();
    if (!id) {
      issues.push("an examination requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate examination id "${id}"`);
    ids.add(id);
    if (!examination.name.trim()) issues.push(`examination "${id}": name is required`);
    if (!EXAMINATION_KINDS.includes(examination.kind)) {
      issues.push(`examination "${id}": kind must be one of ${EXAMINATION_KINDS.join(", ")}`);
    }
    if (examination.date != null && !isValidIsoDate(examination.date)) {
      issues.push(`examination "${id}": date must be YYYY-MM-DD`);
    }
    if (examination.endDate != null) {
      if (!isValidIsoDate(examination.endDate)) {
        issues.push(`examination "${id}": endDate must be YYYY-MM-DD`);
      } else if (
        examination.date &&
        isValidIsoDate(examination.date) &&
        examination.endDate < examination.date
      ) {
        issues.push(`examination "${id}": endDate precedes date`);
      }
    }
  }

  return issues.length === 0 ? { ok: true, examinations: [...input] } : { ok: false, issues };
}
