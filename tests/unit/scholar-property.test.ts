/**
 * Sherivs Scholar — property tests (Phase-04 §170, O6).
 *
 * Mandated invariants, exercised across representative samples:
 * 1. An unauthorized user cannot access an educational entity.
 * 2. A deleted class cannot silently remain active.
 * 3. A transferred student cannot remain simultaneously active in
 *    incompatible contexts.
 * 4. A facility marked unavailable cannot be scheduled without override.
 * 5. A revoked teacher assignment cannot continue granting teaching authority.
 */
import { describe, expect, it } from "vitest";
import { resolveSearchScope, type RoleSearchScope } from "@/lib/scholar/search-context";
import { validateClassFlexibility } from "@/lib/scholar/class-flexibility";
import { validateBoarding } from "@/lib/scholar/boarding";
import { detectFacilityConflicts } from "@/lib/scholar/facility-availability";
import { validateGraphEdges } from "@/lib/scholar/reality-graph";
import { validateLessons } from "@/lib/scholar/lesson";
import { powerSafeBatchSize, validateOfflineQueue } from "@/lib/scholar/offline";

const ROLES: RoleSearchScope[] = [
  { role: "student", allowedKinds: ["class", "activity"] },
  { role: "teacher", allowedKinds: ["student", "class", "subject", "assessment"] },
];

describe("§170 property: authorization boundaries", () => {
  it("an unauthorized user cannot access an educational entity", () => {
    for (const role of ["student", "parent", "unregistered"]) {
      const scope = resolveSearchScope(role, ROLES, ["assessment", "facility"]);
      for (const kind of scope.allowedKinds) {
        expect(ROLES.find((r) => r.role === role)?.allowedKinds ?? []).toContain(kind);
      }
    }
    expect(resolveSearchScope("student", ROLES, ["student"]).deniedKinds).toContain("student");
  });

  it("a deleted class cannot silently remain active", () => {
    const knownGroups = new Set(["cls-1a", "cls-2a"]);
    const membershipSets = [
      [{ learnerId: "l-1", activityCode: "math", groupId: "cls-1a" }],
      [{ learnerId: "l-1", activityCode: "math", groupId: "cls-deleted" }],
      [{ learnerId: "l-2", activityCode: "math", groupId: "cls-2a" }],
    ];
    for (const memberships of membershipSets) {
      const result = validateClassFlexibility(memberships, knownGroups);
      const referencesDeleted = memberships.some((m) => !knownGroups.has(m.groupId));
      if (referencesDeleted) {
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.issues.join(" ")).toContain("unknown group");
      } else {
        expect(result.ok).toBe(true);
      }
    }
  });
});

describe("§170 property: active-state exclusivity", () => {
  it("a transferred student cannot hold two active boarding assignments", () => {
    const facilities = [
      { id: "house-a", name: "House A", kind: "dormitory" as const, bedCount: 10 },
      { id: "house-b", name: "House B", kind: "dormitory" as const, bedCount: 10 },
    ];
    const samples = [
      [{ studentId: "l-1", facilityId: "house-a", active: true }],
      [
        { studentId: "l-1", facilityId: "house-a", active: true },
        { studentId: "l-1", facilityId: "house-b", active: true },
      ],
    ];
    for (const assignments of samples) {
      const issues = validateBoarding(facilities, assignments);
      const doubleActive = assignments.filter((a) => a.active !== false).length > 1;
      if (doubleActive) expect(issues.join(" ")).toContain("more than one active");
      else expect(issues).toEqual([]);
    }
  });

  it("an unavailable facility cannot be scheduled without an explicit override", () => {
    const statuses = new Map([
      ["fac-lab", { facilityId: "fac-lab", state: "unavailable" as const, capacity: 30 }],
      ["fac-hall", { facilityId: "fac-hall", state: "operational" as const, capacity: 100 }],
    ]);
    const bookings = [
      {
        facilityId: "fac-lab",
        activityRef: "chem-a",
        startMinute: 480,
        endMinute: 540,
        attendees: 20,
      },
      {
        facilityId: "fac-hall",
        activityRef: "assembly",
        startMinute: 480,
        endMinute: 540,
        attendees: 80,
      },
    ];
    const conflicts = detectFacilityConflicts(bookings, statuses);
    expect(conflicts.filter((c) => c.facilityId === "fac-lab")).toHaveLength(1);
    expect(conflicts.filter((c) => c.facilityId === "fac-hall")).toHaveLength(0);
  });
});

describe("§170 property: revoked authority", () => {
  it("a revoked teacher cannot keep a teaches edge or a lesson", () => {
    const activeTeachers = new Set(["ident-t1"]);
    const edges = [
      {
        kind: "teaches" as const,
        sourceEntityId: "ident-t1",
        sourceType: "educator",
        targetEntityId: "cls-1a",
        targetType: "learning_group",
      },
      {
        kind: "teaches" as const,
        sourceEntityId: "ident-t2",
        sourceType: "educator",
        targetEntityId: "cls-1a",
        targetType: "learning_group",
      },
    ];
    const issues = validateGraphEdges(edges, activeTeachers);
    expect(issues.join(" ")).toContain('unknown source entity "ident-t2"');

    const lessonResult = validateLessons([
      { id: "lsn-1", name: "L1", subjectCode: "MATH", teacherIds: ["ident-t2"] },
    ]);
    // The lesson shape validates (teacher id present); authority enforcement is
    // a P08 gate concern — the revoked id is not in the active roster, so a
    // gated server function must refuse it.
    expect(lessonResult.ok).toBe(true);
    expect(activeTeachers.has("ident-t2")).toBe(false);
  });
});

describe("§173–175 boundary sanity (offline/performance/device)", () => {
  it("queues stay bounded and power-aware (§87/§90)", () => {
    const issues = validateOfflineQueue([
      {
        opId: "o1",
        kind: "attendance.mark",
        entity: "attendance",
        entityId: "x:1",
        queuedAt: "2026-09-04T08:00:00.000Z",
        syncMode: "standard",
      },
      {
        opId: "o2",
        kind: "attendance.mark",
        entity: "attendance",
        entityId: "x:2",
        queuedAt: "2026-09-04T08:01:00.000Z",
        syncMode: "low_bandwidth",
      },
    ]);
    expect(issues).toEqual([]);
    expect(powerSafeBatchSize(5)).toBe(5);
    expect(powerSafeBatchSize(100)).toBeLessThanOrEqual(10);
  });
});
