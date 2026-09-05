/**
 * CoreGrid Scholar — configuration simulator (Phase-04 §84–85).
 *
 * Scenario simulation belongs to educational reality: "What happens if we add
 * another campus / introduce evening classes / mark a laboratory unavailable?"
 * A scenario is a pure DIFF over a SchoolBuildSpec; the proposed result is
 * validated through the A5 validator so the administrator sees consequences
 * (including broken consistency) BEFORE anything is applied. Optimization
 * intelligence belongs to later phases — this module only simulates config.
 */

import { validateInstitutionConfiguration } from "./config-validator";
import type { SchoolBuildSpec, ShiftConfig, SchoolHoursConfig } from "./school-builder";

export type ConfigScenario =
  | { kind: "add_campus"; name: string }
  | { kind: "remove_campus"; name: string }
  | { kind: "add_shift"; shift: ShiftConfig }
  | { kind: "set_hours"; hours: SchoolHoursConfig }
  | { kind: "note"; text: string };

export interface SimulationResult {
  proposed: SchoolBuildSpec;
  ok: boolean;
  issues: string[];
  changes: string[];
}

function withName(entries: { name: string }[], name: string): { name: string }[] {
  return entries.filter((e) => e.name.trim() !== name.trim());
}

function withShift(shifts: ShiftConfig[], shift: ShiftConfig): ShiftConfig[] {
  return [...shifts, { name: shift.name.trim(), sortOrder: shift.sortOrder }];
}

/** Clone a spec deeply enough that scenarios never mutate the original. */
export function cloneSpec(spec: SchoolBuildSpec): SchoolBuildSpec {
  return {
    ...spec,
    levels: [...spec.levels],
    programmes: [...spec.programmes],
    shifts: [...spec.shifts],
    campuses: Array.isArray(spec.campuses) ? [...spec.campuses] : spec.campuses,
    languages: Array.isArray(spec.languages) ? [...spec.languages] : spec.languages,
    policies: { ...(spec.policies ?? {}) },
  };
}

/** Apply scenarios to a copy and validate the result (non-destructive). */
export function simulate(
  spec: SchoolBuildSpec,
  scenarios: readonly ConfigScenario[],
): SimulationResult {
  const proposed = cloneSpec(spec);
  const changes: string[] = [];

  for (const scenario of scenarios) {
    switch (scenario.kind) {
      case "add_campus": {
        const name = scenario.name.trim();
        const campuses = Array.isArray(proposed.campuses) ? [...proposed.campuses] : [];
        if (campuses.some((c) => (c as { name?: string }).name === name)) {
          changes.push(`campus "${name}" already present — skipped`);
          break;
        }
        campuses.push({ name });
        proposed.campuses = campuses;
        changes.push(`added campus "${name}"`);
        break;
      }
      case "remove_campus": {
        const campuses = Array.isArray(proposed.campuses) ? proposed.campuses : [];
        const next = withName(campuses as { name: string }[], scenario.name);
        if (next.length === campuses.length) {
          changes.push(`campus "${scenario.name}" not present — skipped`);
          break;
        }
        proposed.campuses = next;
        changes.push(`removed campus "${scenario.name}"`);
        break;
      }
      case "add_shift":
        proposed.shifts = withShift(proposed.shifts, scenario.shift);
        changes.push(`added shift "${scenario.shift.name}"`);
        break;
      case "set_hours":
        proposed.hours = scenario.hours;
        changes.push("updated school hours");
        break;
      case "note":
        changes.push(`note: ${scenario.text}`);
        break;
    }
  }

  const validation = validateInstitutionConfiguration(proposed);
  return { proposed, ok: validation.ok, issues: validation.issues, changes };
}
