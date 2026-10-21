/**
 * Sherivs Scholar — multi-shift school + shift-specific operation
 * (Phase-04 §33–34).
 *
 * Shift labels are configuration (morning/afternoon/evening/night/rotating/
 * weekend are the documented vocabulary, custom stays available) and each
 * shift may carry its own staff, student groups, facilities, schedule and
 * policies (§34). Validation enforces unique shift names and sane time pairs —
 * the runtime never presumes a shift exists.
 */

import { isValidHHMM } from "./school-hours";

export type ShiftKind =
  "morning" | "afternoon" | "evening" | "night" | "rotating" | "weekend" | "custom";

export const SHIFT_KINDS: readonly ShiftKind[] = [
  "morning",
  "afternoon",
  "evening",
  "night",
  "rotating",
  "weekend",
  "custom",
] as const;

export interface ShiftDefinition {
  name: string;
  kind: ShiftKind;
  /** Optional HH:MM window for fixed shifts (rotating/custom may omit it). */
  start?: string | null;
  end?: string | null;
  staffGroupIds?: string[];
  studentGroupIds?: string[];
  facilityIds?: string[];
  scheduleId?: string | null;
  policies?: Record<string, unknown>;
}

export interface ShiftDefinitionNode extends ShiftDefinition {
  id: string;
}

export type ShiftsValidation =
  { ok: true; shifts: ShiftDefinitionNode[] } | { ok: false; issues: string[] };

export function validateShifts(input: readonly ShiftDefinition[]): ShiftsValidation {
  const issues: string[] = [];
  const shifts: ShiftDefinitionNode[] = input.map((s, i) => ({ ...s, id: s.name || `shift-${i}` }));
  const names = new Set<string>();

  for (const shift of shifts) {
    const name = shift.name.trim();
    if (!name) {
      issues.push("a shift requires a non-blank name");
      continue;
    }
    if (names.has(name)) issues.push(`duplicate shift name "${name}"`);
    names.add(name);
    if (!SHIFT_KINDS.includes(shift.kind)) {
      issues.push(`shift "${name}": kind must be one of ${SHIFT_KINDS.join(", ")}`);
    }
    if (shift.start != null && !isValidHHMM(shift.start)) {
      issues.push(`shift "${name}": start must be HH:MM`);
    }
    if (shift.end != null && !isValidHHMM(shift.end)) {
      issues.push(`shift "${name}": end must be HH:MM`);
    }
    if (
      shift.start != null &&
      shift.end != null &&
      isValidHHMM(shift.start) &&
      isValidHHMM(shift.end) &&
      shift.end <= shift.start
    ) {
      issues.push(`shift "${name}": end must be after start`);
    }
  }

  return issues.length === 0 ? { ok: true, shifts } : { ok: false, issues };
}

/**
 * Whether a shift has its own operational surface for a dimension (§34).
 * Absence of configuration is not a defect — it means institution-wide
 * defaults apply.
 */
export function shiftDimensionCoverage(shift: ShiftDefinition): {
  staff: boolean;
  students: boolean;
  facilities: boolean;
  schedule: boolean;
  policies: boolean;
} {
  return {
    staff: Array.isArray(shift.staffGroupIds) && shift.staffGroupIds.length > 0,
    students: Array.isArray(shift.studentGroupIds) && shift.studentGroupIds.length > 0,
    facilities: Array.isArray(shift.facilityIds) && shift.facilityIds.length > 0,
    schedule: Boolean(shift.scheduleId),
    policies: shift.policies != null && Object.keys(shift.policies).length > 0,
  };
}
