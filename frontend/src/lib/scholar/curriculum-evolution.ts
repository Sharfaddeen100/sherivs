/**
 * CoreGrid Scholar — curriculum evolution (Phase-04 §178).
 *
 * A new curriculum must never destroy historical curriculum records. This
 * module supplies the non-destructive supersede operation over
 * `CurriculumFramework` versions and the property check that keeps history
 * intact after an evolution.
 */

import {
  activeVersionOf,
  validateCurricula,
  type CurriculumFramework,
  type CurriculumVersion,
} from "./curriculum-core";

export interface SupersedeInput {
  framework: CurriculumFramework;
  nextVersion: Omit<CurriculumVersion, "version"> & { version: string };
  /** The version being superseded (required — evolution is explicit). */
  supersedesLabel: string;
}

export type SupersedeResult =
  { ok: true; framework: CurriculumFramework } | { ok: false; issues: string[] };

export function supersedeCurriculumVersion(input: SupersedeInput): SupersedeResult {
  const issues: string[] = [];

  const current = input.framework.versions.find((v) => v.version === input.supersedesLabel);
  if (!current) {
    issues.push(
      `version "${input.supersedesLabel}" does not exist in curriculum "${input.framework.id}"`,
    );
  }
  if (!input.nextVersion.version.trim()) issues.push("nextVersion requires a version label");
  if (input.framework.versions.some((v) => v.version === input.nextVersion.version)) {
    issues.push(
      `version "${input.nextVersion.version}" already exists — evolution must not overwrite history`,
    );
  }

  // Inclusive range convention: the superseded version expires the day BEFORE
  // the next version takes effect (ranges never share a day).
  const previousDay = dayBeforeIso(input.nextVersion.effectiveDate);
  const superseded = input.framework.versions.map((v) =>
    v.version === input.supersedesLabel ? { ...v, expiryDate: previousDay } : v,
  );
  const framework: CurriculumFramework = {
    ...input.framework,
    versions: [...superseded, input.nextVersion],
  };

  const validation = validateCurricula([framework]);
  if (!validation.ok)
    issues.push(
      ...validation.issues.map((i) => i.replace(`curriculum "${input.framework.id}": `, "")),
    );

  return issues.length === 0 ? { ok: true, framework } : { ok: false, issues };
}

function dayBeforeIso(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  parsed.setUTCDate(parsed.getUTCDate() - 1);
  return parsed.toISOString().slice(0, 10);
}

/** §178 property: every historical version label survives an evolution. */
export function assertHistoryPreserved(
  before: readonly CurriculumVersion[],
  after: readonly CurriculumVersion[],
): string[] {
  const beforeLabels = new Set(before.map((v) => v.version));
  const afterLabels = new Set(after.map((v) => v.version));
  const issues: string[] = [];
  for (const label of beforeLabels) {
    if (!afterLabels.has(label)) issues.push(`history destroyed: version "${label}" disappeared`);
  }
  return issues;
}

/** Which version is in force on a date (after evolution). */
export function activeAfterEvolution(
  framework: CurriculumFramework,
  onDate: string,
): CurriculumVersion | null {
  return activeVersionOf(framework, onDate);
}
