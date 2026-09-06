/**
 * CoreGrid Scholar — assignment model + lifecycle (Phase-04 §47–48).
 *
 * Assignments support individual, group, practical, project, research and
 * field work forms (§47) through one definition shape, and follow an explicit
 * lifecycle (§48): proposed → assigned → submitted → assessed → returned →
 * archived. Transitions are validated — no state is ever jumped silently.
 */

import type { AssessmentKind } from "./assessment-model";

export type AssignmentForm =
  "individual" | "group" | "practical" | "project" | "research" | "field_work" | "custom";

export const ASSIGNMENT_FORMS: readonly AssignmentForm[] = [
  "individual",
  "group",
  "practical",
  "project",
  "research",
  "field_work",
  "custom",
] as const;

export type AssignmentState =
  "proposed" | "assigned" | "submitted" | "assessed" | "returned" | "archived";

export const ASSIGNMENT_STATES: readonly AssignmentState[] = [
  "proposed",
  "assigned",
  "submitted",
  "assessed",
  "returned",
  "archived",
] as const;

export const ASSIGNMENT_TRANSITIONS: Record<AssignmentState, readonly AssignmentState[]> = {
  proposed: ["assigned", "archived"],
  assigned: ["submitted", "archived"],
  submitted: ["assessed"],
  assessed: ["returned"],
  returned: ["archived"],
  archived: [],
} as const;

export interface AssignmentDefinition {
  id: string;
  form: AssignmentForm;
  title: string;
  subjectCode?: string | null;
  classCohortId?: string | null;
  assignedBy?: string | null;
  dueDate?: string | null;
  assessmentKind?: AssessmentKind | null;
}

export interface AssignmentLifecycleState {
  assignmentId: string;
  state: AssignmentState;
}

export type AssignmentValidation =
  { ok: true; assignments: AssignmentDefinition[] } | { ok: false; issues: string[] };

export function validateAssignments(input: readonly AssignmentDefinition[]): AssignmentValidation {
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
    if (!assignment.title.trim()) issues.push(`assignment "${id}": title is required`);
    if (!ASSIGNMENT_FORMS.includes(assignment.form)) {
      issues.push(`assignment "${id}": form must be one of ${ASSIGNMENT_FORMS.join(", ")}`);
    }
  }

  return issues.length === 0 ? { ok: true, assignments: [...input] } : { ok: false, issues };
}

export function canTransitionAssignment(from: AssignmentState, to: AssignmentState): boolean {
  return ASSIGNMENT_TRANSITIONS[from].includes(to);
}

/** Apply a lifecycle transition, returning the issue text when illegal. */
export function advanceAssignment(
  current: AssignmentLifecycleState,
  to: AssignmentState,
): { ok: true; state: AssignmentState } | { ok: false; issue: string } {
  if (!canTransitionAssignment(current.state, to)) {
    return {
      ok: false,
      issue: `assignment "${current.assignmentId}" cannot move from "${current.state}" to "${to}"`,
    };
  }
  return { ok: true, state: to };
}
