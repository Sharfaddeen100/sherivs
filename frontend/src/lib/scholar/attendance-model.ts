import { isValidIsoDate } from "./academic-period";

/**
 * Sherivs Scholar — attendance model (Phase-04 §38).
 *
 * Attendance covers students, staff, classes, events, practicals and boarding
 * (§38) — the contexts are typed configuration and no context is presumed for
 * an institution that does not run it. Register entries stay pure; event
 * recording flows through G2's kernel event projection. The authoritative
 * attendance subsystem stays bounded with its owning phases (§38 note).
 */

export type AttendanceContext = "student" | "staff" | "class" | "event" | "practical" | "boarding";

export const ATTENDANCE_CONTEXTS: readonly AttendanceContext[] = [
  "student",
  "staff",
  "class",
  "event",
  "practical",
  "boarding",
] as const;

export type AttendanceStatus =
  "present" | "absent" | "late" | "excused" | "early_departure" | "remote" | "field_activity";

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
  "early_departure",
  "remote",
  "field_activity",
] as const;

export interface AttendanceRegisterEntry {
  context: AttendanceContext;
  /** Class/event/practical/boarding-group or person scope this belongs to. */
  subjectId: string;
  /** The identity (student/staff) whose attendance is recorded. */
  personId: string;
  date: string;
  status: AttendanceStatus;
  shiftName?: string | null;
  notes?: string | null;
}

export type AttendanceValidation =
  { ok: true; entries: AttendanceRegisterEntry[] } | { ok: false; issues: string[] };

export function validateAttendanceRegister(
  input: readonly AttendanceRegisterEntry[],
  knownShiftNames?: ReadonlySet<string> | null,
): AttendanceValidation {
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const entry of input) {
    if (!ATTENDANCE_CONTEXTS.includes(entry.context)) {
      issues.push(`context must be one of ${ATTENDANCE_CONTEXTS.join(", ")}`);
    }
    if (!ATTENDANCE_STATUSES.includes(entry.status)) {
      issues.push(`status must be one of ${ATTENDANCE_STATUSES.join(", ")}`);
    }
    if (!entry.subjectId.trim()) issues.push("a register entry requires a subjectId");
    if (!entry.personId.trim()) issues.push("a register entry requires a personId");
    if (!isValidIsoDate(entry.date))
      issues.push(`entry for "${entry.personId}": date must be YYYY-MM-DD`);
    if (entry.shiftName && knownShiftNames && !knownShiftNames.has(entry.shiftName)) {
      issues.push(`entry for "${entry.personId}": unknown shift "${entry.shiftName}"`);
    }
    const key = `${entry.context}::${entry.subjectId}::${entry.personId}::${entry.date}::${entry.shiftName ?? ""}`;
    if (seen.has(key))
      issues.push(`duplicate register entry for "${entry.personId}" on ${entry.date}`);
    seen.add(key);
  }

  return issues.length === 0 ? { ok: true, entries: [...input] } : { ok: false, issues };
}

export interface AttendanceCounts {
  present: number;
  absent: number;
  late: number;
  excused: number;
  early_departure: number;
  remote: number;
  field_activity: number;
}

export function countByStatus(entries: readonly AttendanceRegisterEntry[]): AttendanceCounts {
  const counts: AttendanceCounts = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    early_departure: 0,
    remote: 0,
    field_activity: 0,
  };
  for (const entry of entries) {
    counts[entry.status] += 1;
  }
  return counts;
}

/** Attendance rate (%) for a person, counting present-ish statuses. */
export function attendanceRateFor(
  entries: readonly AttendanceRegisterEntry[],
  personId: string,
  presentKinds: readonly AttendanceStatus[] = ["present", "remote", "field_activity"],
): number | null {
  const mine = entries.filter((e) => e.personId === personId);
  if (mine.length === 0) return null;
  const present = mine.filter((e) => presentKinds.includes(e.status)).length;
  return (present / mine.length) * 100;
}
