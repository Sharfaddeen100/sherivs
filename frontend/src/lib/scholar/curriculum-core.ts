/**
 * CoreGrid Scholar — curriculum core (Phase-04 §7–10, upgrade target of the
 * legacy education-curriculum domain layer).
 *
 * A curriculum framework carries versions (with effective/expiry dates,
 * revision history, authority, source, applicability and migration rules),
 * countries are CONFIGURATION (never one hard-coded national model), and an
 * institution may operate MULTIPLE curricula simultaneously. History is never
 * destroyed: a framework's versions array is its revision history (§178).
 */

import { isValidIsoDate } from "./academic-period";

export interface CurriculumVersion {
  version: string;
  effectiveDate: string;
  expiryDate?: string | null;
  authority: string;
  source: string;
  applicability?: string | null;
  migrationRules?: string[];
  notes?: string | null;
}

export interface CurriculumFramework {
  id: string;
  name: string;
  /** Optional country/region the framework belongs to — pure configuration. */
  country?: string | null;
  versions: CurriculumVersion[];
}

export type CurriculumValidation =
  { ok: true; frameworks: CurriculumFramework[] } | { ok: false; issues: string[] };

export function validateCurricula(input: readonly CurriculumFramework[]): CurriculumValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const framework of input) {
    const id = framework.id.trim();
    if (!id) {
      issues.push("a curriculum framework requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate curriculum id "${id}"`);
    ids.add(id);
    if (!framework.name.trim()) issues.push(`curriculum "${id}": name is required`);

    const ranges: Array<{ version: string; effective: string; expiry: string | null }> = [];
    for (const v of framework.versions) {
      if (!v.version.trim()) issues.push(`curriculum "${id}": a version label is required`);
      if (!v.authority.trim())
        issues.push(`curriculum "${id}" v"${v.version}": authority is required`);
      if (!v.source.trim()) issues.push(`curriculum "${id}" v"${v.version}": source is required`);
      if (!isValidIsoDate(v.effectiveDate)) {
        issues.push(`curriculum "${id}" v"${v.version}": effectiveDate must be YYYY-MM-DD`);
      }
      if (v.expiryDate != null) {
        if (!isValidIsoDate(v.expiryDate)) {
          issues.push(`curriculum "${id}" v"${v.version}": expiryDate must be YYYY-MM-DD`);
        } else if (isValidIsoDate(v.effectiveDate) && v.expiryDate < v.effectiveDate) {
          issues.push(`curriculum "${id}" v"${v.version}": expiryDate precedes effectiveDate`);
        }
      }
      ranges.push({ version: v.version, effective: v.effectiveDate, expiry: v.expiryDate ?? null });
    }

    // Versions of one framework must not overlap (distinct frameworks may).
    for (let i = 0; i < ranges.length; i += 1) {
      for (let j = i + 1; j < ranges.length; j += 1) {
        const a = ranges[i];
        const b = ranges[j];
        if (a.version === b.version) {
          issues.push(`curriculum "${id}": duplicate version label "${a.version}"`);
          continue;
        }
        if (!isValidIsoDate(a.effective) || !isValidIsoDate(b.effective)) continue;
        const aEnd = a.expiry ?? "9999-12-31";
        const bEnd = b.expiry ?? "9999-12-31";
        if (a.effective <= bEnd && b.effective <= aEnd) {
          issues.push(
            `curriculum "${id}": versions "${a.version}" and "${b.version}" overlap in time`,
          );
        }
      }
    }
  }

  return issues.length === 0 ? { ok: true, frameworks: [...input] } : { ok: false, issues };
}

/** The version of a framework in force on a date, or null when none. */
export function activeVersionOf(
  framework: CurriculumFramework,
  onDate: string,
): CurriculumVersion | null {
  for (const v of framework.versions) {
    if (!isValidIsoDate(v.effectiveDate) || v.effectiveDate > onDate) continue;
    if (v.expiryDate && v.expiryDate < onDate) continue;
    return v;
  }
  return null;
}
