/**
 * CoreGrid Scholar — institution configuration validator (Phase-04 §83).
 *
 * Detects structural and consistency problems in an institution's operating
 * configuration: invalid levels/programmes, duplicate or blank campuses and
 * languages, malformed hours, duplicate shifts. It extends A1–A3 validators
 * with cross-part checks. New check families (rooms, teachers, facilities,
 * schedules) plug in here as their clusters land — never per-institution code.
 */

import { validateLevels } from "./education-levels";
import { validateProgrammeStructure } from "./programme";
import type { ShiftConfig } from "./school-builder";
import type { SchoolBuildSpec } from "./school-builder";

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface ConfigurationCheck {
  name: string;
  run: (spec: SchoolBuildSpec) => string[];
}

const registeredChecks: ConfigurationCheck[] = [];

/** Register an additional consistency check (used by later clusters). */
export function registerConfigurationCheck(check: ConfigurationCheck): void {
  registeredChecks.push(check);
}

function validateLevelsPart(spec: SchoolBuildSpec): string[] {
  const result = validateLevels(spec.levels);
  return result.ok ? [] : result.issues.map((i) => `levels: ${i}`);
}

function validateProgrammesPart(spec: SchoolBuildSpec): string[] {
  const result = validateProgrammeStructure(spec.programmes);
  return result.ok ? [] : result.issues.map((i) => `programmes: ${i}`);
}

function validateList(names: unknown, label: string): string[] {
  const issues: string[] = [];
  if (!Array.isArray(names)) {
    return names == null ? [] : [`${label}: must be an array`];
  }
  const seen = new Set<string>();
  for (const entry of names) {
    const name =
      typeof (entry as { name?: unknown }).name === "string"
        ? (entry as { name: string }).name.trim()
        : "";
    if (name === "") issues.push(`${label}: entries need a non-blank name`);
    else if (seen.has(name)) issues.push(`${label}: duplicate "${name}"`);
    else seen.add(name);
  }
  return issues;
}

function validateShiftsPart(shifts: unknown): string[] {
  const issues: string[] = [];
  if (!Array.isArray(shifts)) return shifts == null ? [] : ["shifts: must be an array"];
  const seen = new Set<string>();
  for (const shift of shifts as ShiftConfig[]) {
    const name = shift.name?.trim() ?? "";
    if (name === "") issues.push("shifts: a shift must have a non-blank name");
    else if (seen.has(name)) issues.push(`shifts: duplicate shift "${name}"`);
    else seen.add(name);
  }
  return issues;
}

function validateHoursPart(hours: SchoolBuildSpec["hours"]): string[] {
  const issues: string[] = [];
  if (hours == null) return [];
  const record = hours as Record<string, unknown>;
  for (const key of ["open", "close"] as const) {
    const value = record[key];
    if (value != null && (typeof value !== "string" || !HHMM_RE.test(value))) {
      issues.push(`hours.${key} must be HH:MM (24h)`);
    }
  }
  return issues;
}

export interface ConfigurationValidation {
  ok: boolean;
  issues: string[];
}

/**
 * Run all built-in + registered checks over an institution configuration.
 * Returns every issue (never stops at the first).
 */
export function validateInstitutionConfiguration(spec: SchoolBuildSpec): ConfigurationValidation {
  const issues: string[] = [
    ...validateLevelsPart(spec),
    ...validateProgrammesPart(spec),
    ...validateList(spec.campuses, "campuses"),
    ...validateList(spec.languages, "languages"),
    ...validateShiftsPart(spec.shifts),
    ...validateHoursPart(spec.hours),
  ];
  for (const check of registeredChecks) {
    issues.push(...check.run(spec).map((i) => `${check.name}: ${i}`));
  }
  return { ok: issues.length === 0, issues };
}
