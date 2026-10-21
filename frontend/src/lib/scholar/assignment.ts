/**
 * Sherivs Scholar — assignment engine (Phase-04 §37, F2 — final missing
 * artifact of the build map).
 *
 * Assignments cover teachers, students, classes, rooms, subjects, equipment
 * and supervisors (§37). This module models assignment SPECS (who/what is
 * assigned to which context, when) and guards the invariants that matter:
 * unique assignments, no double-assignment of the same resource into the same
 * time window, and no references to resources the institution did not declare.
 * Optimisation of assignments stays owned by Phase 12 (§35/§191 boundary).
 */

import { isValidIsoDate } from "./academic-period";

export type AssignmentType =
  "teacher" | "student" | "class" | "room" | "subject" | "equipment" | "supervisor" | "custom";

export const ASSIGNMENT_TYPES: readonly AssignmentType[] = [
  "teacher",
  "student",
  "class",
  "room",
  "subject",
  "equipment",
  "supervisor",
  "custom",
] as const;

export interface AssignmentSpec {
  id: string;
  type: AssignmentType;
  /** The resource being assigned (teacher id, student id, room id, subject code…). */
  assigneeId: string;
  /** The context the resource is assigned to (lesson/activity/timetable slot). */
  contextRef: string;
  /** Optional day window (YYYY-MM-DD) + inclusive minutes within the day. */
  date?: string | null;
  startMinute?: number | null;
  endMinute?: number | null;
  notes?: string | null;
}

export interface AssignmentReferenceIndex {
  assigneeIds?: ReadonlySet<string>;
  contextRefs?: ReadonlySet<string>;
}

export type AssignmentsValidation =
  { ok: true; assignments: AssignmentSpec[] } | { ok: false; issues: string[] };

export function validateAssignments(
  input: readonly AssignmentSpec[],
  refs: AssignmentReferenceIndex = {},
): AssignmentsValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const assignment of input) {
    const id = assignment.id.trim();
    if (!id) {
      issues.push("an assignment requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate assignment id "${id}"`);
    ids.add(id);
    if (!ASSIGNMENT_TYPES.includes(assignment.type)) {
      issues.push(`assignment "${id}": type must be one of ${ASSIGNMENT_TYPES.join(", ")}`);
    }
    if (!assignment.assigneeId.trim()) issues.push(`assignment "${id}": assigneeId is required`);
    if (!assignment.contextRef.trim()) issues.push(`assignment "${id}": contextRef is required`);
    if (refs.assigneeIds && !refs.assigneeIds.has(assignment.assigneeId)) {
      issues.push(`assignment "${id}": unknown assignee "${assignment.assigneeId}"`);
    }
    if (refs.contextRefs && !refs.contextRefs.has(assignment.contextRef)) {
      issues.push(`assignment "${id}": unknown context "${assignment.contextRef}"`);
    }
    if (assignment.date && !isValidIsoDate(assignment.date)) {
      issues.push(`assignment "${id}": date must be YYYY-MM-DD`);
    }
    const hasMinutes = assignment.startMinute != null || assignment.endMinute != null;
    if (hasMinutes) {
      if (!Number.isInteger(assignment.startMinute) || !Number.isInteger(assignment.endMinute)) {
        issues.push(`assignment "${id}": startMinute and endMinute must both be whole minutes`);
      } else if (
        assignment.startMinute != null &&
        assignment.endMinute != null &&
        (assignment.startMinute < 0 ||
          assignment.endMinute > 1440 ||
          assignment.endMinute <= assignment.startMinute)
      ) {
        issues.push(`assignment "${id}": invalid time window (0–1440, end > start)`);
      }
    }
  }

  return issues.length === 0 ? { ok: true, assignments: [...input] } : { ok: false, issues };
}

export type AssignmentConflictKind = "double_assignment" | "overlapping_window";

export interface AssignmentConflict {
  kind: AssignmentConflictKind;
  type: AssignmentType;
  assigneeId: string;
  detail: string;
}

function windowsOverlap(
  a: Pick<AssignmentSpec, "date" | "startMinute" | "endMinute">,
  b: Pick<AssignmentSpec, "date" | "startMinute" | "endMinute">,
): boolean {
  if (a.date !== b.date) return false;
  if (
    a.startMinute == null ||
    a.endMinute == null ||
    b.startMinute == null ||
    b.endMinute == null
  ) {
    return false;
  }
  return a.startMinute < b.endMinute && b.startMinute < a.endMinute;
}

/** Detect conflicting assignments of the same resource within a day window. */
export function detectAssignmentConflicts(
  assignments: readonly AssignmentSpec[],
): AssignmentConflict[] {
  const conflicts: AssignmentConflict[] = [];

  for (let i = 0; i < assignments.length; i += 1) {
    for (let j = i + 1; j < assignments.length; j += 1) {
      const a = assignments[i];
      const b = assignments[j];
      if (a.type !== b.type || a.assigneeId !== b.assigneeId) continue;
      if (a.id === b.id) continue;
      if (!windowsOverlap(a, b)) continue;
      conflicts.push({
        kind: a.contextRef === b.contextRef ? "double_assignment" : "overlapping_window",
        type: a.type,
        assigneeId: a.assigneeId,
        detail: `"${a.assigneeId}" is assigned to "${a.contextRef}" and "${b.contextRef}" in the same window`,
      });
    }
  }

  return conflicts;
}

/** All assignments that place a given resource into contexts (for review). */
export function assignmentsForResource(
  assignments: readonly AssignmentSpec[],
  type: AssignmentType,
  assigneeId: string,
): AssignmentSpec[] {
  return assignments.filter((a) => a.type === type && a.assigneeId === assigneeId);
}
