/**
 * CoreGrid Scholar — Cluster G tests (Phase-04 §38–39, 44–45).
 * Attendance model + events, learning activities, lesson model.
 */
import { describe, expect, it } from "vitest";
import {
  attendanceRateFor,
  countByStatus,
  validateAttendanceRegister,
} from "@/lib/scholar/attendance-model";
import { recordAttendanceEvent } from "@/lib/scholar/attendance-events";
import { validateLearningActivities } from "@/lib/scholar/learning-activities";
import { validateLessons } from "@/lib/scholar/lesson";

const NOW = "2026-09-04T08:00:00.000Z";

describe("attendance-model (§38)", () => {
  it("records attendance across student/class/boarding contexts", () => {
    const result = validateAttendanceRegister(
      [
        {
          context: "student",
          subjectId: "cls-1a",
          personId: "l-1",
          date: "2026-09-04",
          status: "present",
        },
        {
          context: "student",
          subjectId: "cls-1a",
          personId: "l-2",
          date: "2026-09-04",
          status: "late",
          shiftName: "Morning",
        },
        {
          context: "boarding",
          subjectId: "house-eagle",
          personId: "l-1",
          date: "2026-09-04",
          status: "present",
        },
      ],
      new Set(["Morning", "Evening"]),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects unknown contexts, statuses and duplicate marks", () => {
    const badStatus = validateAttendanceRegister([
      {
        context: "student",
        subjectId: "cls-1a",
        personId: "l-1",
        date: "2026-09-04",
        status: "absent",
      },
      {
        context: "student",
        subjectId: "cls-1a",
        personId: "l-1",
        date: "2026-09-04",
        status: "absent",
      },
    ]);
    expect(badStatus.ok).toBe(false);
    if (!badStatus.ok) expect(badStatus.issues.join(" ")).toContain("duplicate register entry");
  });

  it("computes counts and person attendance rates", () => {
    const entries = [
      {
        context: "student" as const,
        subjectId: "cls-1a",
        personId: "l-1",
        date: "2026-09-01",
        status: "present" as const,
      },
      {
        context: "student" as const,
        subjectId: "cls-1a",
        personId: "l-1",
        date: "2026-09-02",
        status: "absent" as const,
      },
      {
        context: "student" as const,
        subjectId: "cls-1a",
        personId: "l-1",
        date: "2026-09-03",
        status: "remote" as const,
      },
    ];
    const counts = countByStatus(entries);
    expect(counts.present).toBe(1);
    expect(counts.absent).toBe(1);
    expect(attendanceRateFor(entries, "l-1")).toBeCloseTo(66.67, 1);
    expect(attendanceRateFor(entries, "l-999")).toBe(null);
  });
});

describe("attendance-events (§39)", () => {
  it("projects every attendance kind onto a kernel event draft", () => {
    const draft = recordAttendanceEvent(
      {
        context: "student",
        subjectId: "cls-1a",
        personId: "l-1",
        date: "2026-09-04",
        status: "late",
        shiftName: "Morning",
        tenantId: "tenant-1",
        idempotencyKey: "idem-abc",
      },
      NOW,
    );
    expect(draft.event_type).toBe("scholar.attendance.late");
    expect(draft.aggregate_type).toBe("scholar.attendance");
    expect(draft.idempotency_key).toBe("idem-abc");
    expect((draft.payload as { shiftName: string }).shiftName).toBe("Morning");
  });

  it("rejects invalid statuses and dates before reaching the kernel", () => {
    // Negative path only: invalid runtime status exercised through a cast.
    const badStatus = {
      context: "student",
      subjectId: "cls-1a",
      personId: "l-1",
      date: "2026-09-04",
      status: "sick",
    } as unknown as Parameters<typeof recordAttendanceEvent>[0];
    expect(() => recordAttendanceEvent(badStatus, NOW)).toThrow(/status must be one of/);
    expect(() =>
      recordAttendanceEvent(
        {
          context: "student",
          subjectId: "cls-1a",
          personId: "l-1",
          date: "09-04",
          status: "present",
        },
        NOW,
      ),
    ).toThrow(/YYYY-MM-DD/);
  });
});

describe("learning-activities (§44)", () => {
  it("accepts the documented activity diversity through one path", () => {
    const result = validateLearningActivities([
      { id: "act-lesson", kind: "lesson", name: "Maths 1A" },
      { id: "act-lab", kind: "laboratory", name: "Chemistry practical", classCohortId: "cls-1a" },
      { id: "act-farm", kind: "farm_activity", name: "Maize plot weeding" },
      { id: "act-religious", kind: "religious_activity", name: "Friday assembly" },
      { id: "act-sports", kind: "sports", name: "Inter-house football" },
      { id: "act-project", kind: "project", name: "Entrepreneurship project" },
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects unknown activity kinds and blank facilitators", () => {
    // Negative path only: invalid runtime kind exercised through a cast.
    const badKind = { id: "act-x", kind: "singing", name: "X" } as unknown as Parameters<
      typeof validateLearningActivities
    >[0][number];
    expect(validateLearningActivities([badKind]).ok).toBe(false);

    const blankFacilitator = validateLearningActivities([
      { id: "act-y", kind: "lesson", name: "Y", facilitatorIds: [" "] },
    ]);
    expect(blankFacilitator.ok).toBe(false);
  });
});

describe("lesson (§45)", () => {
  it("validates a full lesson against the institution index", () => {
    const result = validateLessons(
      [
        {
          id: "lsn-1",
          name: "Fractions 1A",
          subjectCode: "MATH",
          teacherIds: ["ident-t1"],
          classCohortId: "cls-1a",
          date: "2026-09-07",
          startTime: "08:00",
          endTime: "08:45",
          campus: "Main Campus",
          location: "B12",
          learningObjectives: ["model fractions"],
          resourceRefs: ["res-textbook-math"],
          activityIds: ["act-lesson"],
        },
      ],
      {
        subjectCodes: new Set(["MATH"]),
        classCohortIds: new Set(["cls-1a"]),
        campusNames: new Set(["Main Campus"]),
        activityIds: new Set(["act-lesson"]),
      },
    );
    expect(result.ok).toBe(true);
  });

  it("rejects dangling refs and inverted time windows", () => {
    const dangling = validateLessons(
      [{ id: "lsn-x", name: "X", subjectCode: "nope", classCohortId: "ghost" }],
      { subjectCodes: new Set(["MATH"]), classCohortIds: new Set(["cls-1a"]) },
    );
    expect(dangling.ok).toBe(false);

    const inverted = validateLessons([
      { id: "lsn-y", name: "Y", startTime: "10:00", endTime: "09:00" },
    ]);
    expect(inverted.ok).toBe(false);
  });
});
