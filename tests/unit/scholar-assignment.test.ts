/**
 * Sherivs Scholar — assignment engine tests (Phase-04 §37, F2).
 */
import { describe, expect, it } from "vitest";
import {
  assignmentsForResource,
  detectAssignmentConflicts,
  validateAssignments,
  type AssignmentSpec,
} from "@/lib/scholar/assignment";

describe("assignment engine (§37)", () => {
  const teacherAssignment: AssignmentSpec = {
    id: "asg-1",
    type: "teacher",
    assigneeId: "ident-t1",
    contextRef: "lsn-1",
    date: "2026-09-07",
    startMinute: 480,
    endMinute: 540,
  };

  it("accepts every §37 assignment type", () => {
    const result = validateAssignments(
      [
        teacherAssignment,
        { id: "asg-2", type: "student", assigneeId: "l-1", contextRef: "cls-1a" },
        { id: "asg-3", type: "class", assigneeId: "cls-1a", contextRef: "hall-a" },
        { id: "asg-4", type: "room", assigneeId: "rm-1", contextRef: "lsn-1" },
        { id: "asg-5", type: "subject", assigneeId: "MATH", contextRef: "lsn-1" },
        { id: "asg-6", type: "equipment", assigneeId: "proj-1", contextRef: "lsn-1" },
        { id: "asg-7", type: "supervisor", assigneeId: "ident-hod", contextRef: "ex-1" },
      ],
      {
        assigneeIds: new Set(["ident-t1", "l-1", "cls-1a", "rm-1", "MATH", "proj-1", "ident-hod"]),
        contextRefs: new Set(["lsn-1", "cls-1a", "hall-a", "ex-1"]),
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.assignments).toHaveLength(7);
  });

  it("rejects duplicate ids and unknown assignees/contexts", () => {
    const duplicate = validateAssignments([
      teacherAssignment,
      { ...teacherAssignment, id: "asg-1" },
    ]);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.issues.join(" ")).toContain("duplicate assignment id");

    const dangling = validateAssignments(
      [{ ...teacherAssignment, id: "asg-9", assigneeId: "ghost" }],
      { assigneeIds: new Set(["ident-t1"]), contextRefs: new Set(["lsn-1"]) },
    );
    expect(dangling.ok).toBe(false);
  });

  it("rejects invalid time windows", () => {
    const inverted = validateAssignments([
      { ...teacherAssignment, id: "asg-x", startMinute: 540, endMinute: 480 },
    ]);
    expect(inverted.ok).toBe(false);
  });

  it("detects double assignments and overlapping windows for the same resource", () => {
    const assignments: AssignmentSpec[] = [
      teacherAssignment,
      { ...teacherAssignment, id: "asg-2", contextRef: "lsn-2", startMinute: 500, endMinute: 560 },
      { ...teacherAssignment, id: "asg-3", contextRef: "lsn-2", startMinute: 500, endMinute: 560 },
    ];
    const conflicts = detectAssignmentConflicts(assignments);
    const kinds = conflicts.map((c) => c.kind);
    expect(kinds).toContain("overlapping_window");
    expect(kinds).toContain("double_assignment");
  });

  it("allows the same resource in non-overlapping windows and answers per-resource queries", () => {
    const assignments: AssignmentSpec[] = [
      teacherAssignment,
      { ...teacherAssignment, id: "asg-4", contextRef: "lsn-3", startMinute: 600, endMinute: 660 },
    ];
    expect(detectAssignmentConflicts(assignments)).toEqual([]);
    expect(assignmentsForResource(assignments, "teacher", "ident-t1")).toHaveLength(2);
    expect(assignmentsForResource(assignments, "room", "rm-1")).toEqual([]);
  });
});
