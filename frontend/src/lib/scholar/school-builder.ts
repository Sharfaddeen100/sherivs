/**
 * Sherivs Scholar — school builder (Phase-04 §79–80).
 *
 * The administrator constructs the institution's operating model through
 * configuration: educational structure, organisation, schedules, shifts,
 * subjects, programmes, roles, policies, resources and facilities. This module
 * is the composition + validation front door for a SchoolBuildSpec — it
 * CONSUMES the level registry (A1) and programme hierarchy (A2) validators so
 * an institution can never be saved in an inconsistent structural state.
 *
 * No institution-specific structure is implied anywhere (§78, §186); every
 * part is optional until provided by configuration, and unknowns are never
 * invented (§162).
 */

import { validateLevels, type EducationalLevel } from "./education-levels";
import { validateProgrammeStructure, type ProgrammeItem } from "./programme";

/** Flexible shift definition (§33) — names are institution-defined. */
export interface ShiftConfig {
  name: string;
  sortOrder?: number;
}

/** Flexible daily-hours definition (§32) — free-form periods. */
export interface SchoolHoursConfig {
  open?: string | null;
  close?: string | null;
  note?: string | null;
}

export interface SchoolBuildParts {
  levels?: unknown;
  programmes?: unknown;
  shifts?: unknown;
  hours?: unknown;
  languages?: unknown;
  campuses?: unknown;
  /** Free-form JSON-compatible institutional operating policies (§77). */
  policies?: unknown;
}

/** A validated build spec with concrete structural types (A1/A2). */
export interface SchoolBuildSpec {
  levels: EducationalLevel[];
  programmes: ProgrammeItem[];
  shifts: ShiftConfig[];
  hours: SchoolHoursConfig | Record<string, unknown>;
  languages: unknown;
  campuses: unknown;
  policies: Record<string, unknown>;
}

export type BuildValidation = { ok: true; spec: SchoolBuildSpec } | { ok: false; issues: string[] };

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Assemble a build spec from parts and validate it.
 * Structural validation delegates to A1 (levels) and A2 (programmes); any
 * other part is accepted as configuration and validated by its own cluster
 * module when it becomes concrete.
 */
export function buildSchoolSpec(parts: SchoolBuildParts): BuildValidation {
  const issues: string[] = [];

  const levels = parts.levels ?? [];
  const levelsResult = validateLevels(levels);
  if (!levelsResult.ok) issues.push(...levelsResult.issues.map((i) => `levels: ${i}`));

  const programmes = parts.programmes ?? [];
  const programmesResult = validateProgrammeStructure(programmes);
  if (!programmesResult.ok) {
    issues.push(...programmesResult.issues.map((i) => `programmes: ${i}`));
  }

  // Shift sanity: unique, non-blank names when provided (§33).
  if (parts.shifts != null) {
    const shifts = parts.shifts as unknown;
    if (Array.isArray(shifts)) {
      const names = new Set<string>();
      for (const shift of shifts) {
        const name = (shift as { name?: unknown }).name;
        const text = typeof name === "string" ? name.trim() : "";
        if (text === "") issues.push("shifts: a shift must have a non-blank name");
        else if (names.has(text)) issues.push(`shifts: duplicate shift name "${text}"`);
        else names.add(text);
      }
    } else {
      issues.push("shifts: must be an array");
    }
  }

  if (issues.length > 0) return { ok: false, issues };

  const hours = parts.hours ?? {};
  const hoursRecord = asRecord(hours);
  if (hoursRecord.open != null && typeof hoursRecord.open !== "string") {
    issues.push("hours.open must be a string");
  }
  if (hoursRecord.close != null && typeof hoursRecord.close !== "string") {
    issues.push("hours.close must be a string");
  }
  if (issues.length > 0) return { ok: false, issues };

  const programmeItems = Array.isArray(programmes)
    ? (programmes as unknown as ProgrammeItem[])
    : [];
  const shiftItems = Array.isArray(parts.shifts) ? (parts.shifts as unknown as ShiftConfig[]) : [];
  const spec: SchoolBuildSpec = {
    levels: levelsResult.ok ? levelsResult.levels : [],
    programmes: programmeItems,
    shifts: shiftItems,
    hours: (hours ?? {}) as SchoolHoursConfig,
    languages: parts.languages ?? [],
    campuses: parts.campuses ?? [],
    policies: asRecord(parts.policies),
  };
  return { ok: true, spec };
}

export function emptyBuildParts(): SchoolBuildParts {
  return { levels: [], programmes: [], shifts: [], hours: {}, languages: [], campuses: [] };
}
