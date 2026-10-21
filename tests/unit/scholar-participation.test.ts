/**
 * Sherivs Scholar — Cluster B tests (Phase-04 §26–29, 52, 110–111).
 * Student/staff context over P02 identity, workload, student groups, guardians.
 */
import { describe, expect, it } from "vitest";
import {
  assertHumanLearnerIdentity,
  learnerIdentityDraft,
  studentContextSummary,
  validateStudentProfile,
  type StudentProfile,
} from "@/lib/scholar/student-context";
import { validateStaffContext } from "@/lib/scholar/staff-context";
import { summarizeWorkload, validateWeeklyWorkload } from "@/lib/scholar/workload";
import {
  groupingsForLearner,
  validateStudentGroupMemberships,
  validateStudentGroups,
} from "@/lib/scholar/student-groups";
import {
  defaultGuardianPolicy,
  guardianMayAccess,
  projectGuardianEdge,
  validateGuardianRelation,
  type GuardianRelation,
} from "@/lib/scholar/guardians";

describe("student-context (§26–27)", () => {
  it("builds a learner identity draft as a P02 human identity", () => {
    const row = learnerIdentityDraft(
      "Amina Yusuf",
      { tenantId: "tenant-1" },
      "2026-09-04T00:00:00.000Z",
    );
    expect(row.kind).toBe("human");
    expect(row.tenant_id).toBe("tenant-1");
    expect(() => assertHumanLearnerIdentity(row)).not.toThrow();
    expect(() => assertHumanLearnerIdentity({ kind: "organization" })).toThrow(/kind "human"/);
  });

  it("validates an enrolled profile over P02 anchors", () => {
    const profile: StudentProfile = {
      studentId: "ident-1",
      tenantId: "tenant-1",
      enrolmentStatus: "enrolled",
      programmeCode: "basic",
      classCohortIds: ["cls-1a"],
      subjectCodes: ["mathematics"],
      academicHistory: [{ periodCode: "AY2026", classCohortId: "cls-1a", outcome: "promoted" }],
      progression: { currentLevelCode: "lower", nextLevelCode: "upper" },
    };
    const result = validateStudentProfile(profile, {
      programmeCodes: new Set(["basic"]),
      cohortIds: new Set(["cls-1a"]),
      subjectCodes: new Set(["mathematics"]),
      academicPeriodCodes: new Set(["AY2026"]),
      levelCodes: new Set(["lower", "upper"]),
    });
    expect(result.ok).toBe(true);
    const summary = studentContextSummary(profile);
    expect(summary.programme).toBe("basic");
    expect(summary.classes).toEqual(["cls-1a"]);
  });

  it("rejects dangling educational references", () => {
    const result = validateStudentProfile(
      {
        studentId: "ident-1",
        enrolmentStatus: "enrolled",
        programmeCode: "nope",
        classCohortIds: ["ghost"],
      },
      { programmeCodes: new Set(["basic"]), cohortIds: new Set(["cls-1a"]) },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("unknown");
  });
});

describe("staff-context (§28)", () => {
  it("validates educator context with responsibilities", () => {
    const result = validateStaffContext(
      {
        educatorId: "ident-2",
        subjectCodes: ["mathematics"],
        classIds: ["cls-1a"],
        campusNames: ["Main Campus"],
        shiftNames: ["Morning"],
        responsibilities: [{ area: "teaching", description: "Form 1A mathematics" }],
      },
      {
        subjectCodes: new Set(["mathematics"]),
        classIds: new Set(["cls-1a"]),
        campusNames: new Set(["Main Campus"]),
        shiftNames: new Set(["Morning"]),
      },
    );
    expect(result.ok).toBe(true);
  });

  it("rejects unknown shifts and invalid responsibility areas", () => {
    const badShift = validateStaffContext(
      { educatorId: "ident-2", shiftNames: ["Dawn"] },
      { shiftNames: new Set(["Morning", "Evening"]) },
    );
    expect(badShift.ok).toBe(false);

    const badArea = validateStaffContext({
      educatorId: "ident-2",
      // Negative path only: runtime value is invalid by design.
      responsibilities: [
        { area: "gardening", description: "x" } as unknown as {
          area: "teaching";
          description: string;
        },
      ],
    });
    expect(badArea.ok).toBe(false);
  });
});

describe("workload (§29)", () => {
  it("summarises weekly workload across all areas", () => {
    const result = validateWeeklyWorkload({
      educatorId: "ident-2",
      academicPeriodCode: "T1",
      items: [
        { area: "teaching", description: "Maths 1A", hoursPerWeek: 18 },
        { area: "preparation", description: "Lesson prep", hoursPerWeek: 5 },
        { area: "meetings", description: "Staff meetings", hoursPerWeek: 1 },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.summary.byArea.teaching).toBe(18);
      expect(result.summary.totalHoursPerWeek).toBe(24);
    }
    expect(summarizeWorkload([]).totalHoursPerWeek).toBe(0);
  });

  it("rejects negative hours and configured caps", () => {
    const negative = validateWeeklyWorkload({
      educatorId: "ident-2",
      items: [{ area: "teaching", description: "x", hoursPerWeek: -2 }],
    });
    expect(negative.ok).toBe(false);

    const overloaded = validateWeeklyWorkload(
      {
        educatorId: "ident-2",
        items: [
          { area: "teaching", description: "a", hoursPerWeek: 30 },
          { area: "duties", description: "b", hoursPerWeek: 10 },
        ],
      },
      35,
    );
    expect(overloaded.ok).toBe(false);
    if (!overloaded.ok) expect(overloaded.issues.join(" ")).toContain("exceeds");
  });
});

describe("student-groups (§52)", () => {
  it("supports criterion-driven dynamic grouping", () => {
    const result = validateStudentGroups([
      { id: "set-maths-a", name: "Maths Set A", criterion: "subject", subjectCode: "mathematics" },
      { id: "science-lab-1", name: "Lab 1", criterion: "practical" },
      { id: "lang-ha", name: "Hausa", criterion: "language" },
      { id: "extra-chess", name: "Chess", criterion: "custom" },
    ]);
    expect(result.ok).toBe(true);
  });

  it("enforces one active membership per learner per group", () => {
    const groups = validateStudentGroups([
      { id: "set-maths-a", name: "Maths Set A", criterion: "subject" },
    ]);
    expect(groups.ok).toBe(true);
    const issues = validateStudentGroupMemberships(
      [
        { groupId: "set-maths-a", studentId: "l-1", active: true },
        { groupId: "set-maths-a", studentId: "l-1", active: true },
      ],
      new Set(["set-maths-a"]),
    );
    expect(issues.join(" ")).toContain("more than one active membership");
  });

  it("answers which groups a learner sits in per criterion", () => {
    const groups = [
      {
        id: "set-maths-a",
        name: "Maths Set A",
        criterion: "subject" as const,
        subjectCode: "mathematics",
      },
      { id: "football-red", name: "Red", criterion: "custom" as const },
    ];
    const memberships = [
      { groupId: "set-maths-a", studentId: "l-1", active: true },
      { groupId: "football-red", studentId: "l-1", active: true },
      { groupId: "set-maths-a", studentId: "l-2", active: true },
    ];
    const result = groupingsForLearner(groups, memberships, "l-1");
    expect(result).toHaveLength(2);
    expect(result[0].criterion).toBe("subject");
  });
});

describe("guardians/family (§110–111)", () => {
  const relation: GuardianRelation = {
    guardianIdentityId: "ident-g1",
    learnerIdentityId: "ident-l1",
    tenantId: "tenant-1",
    role: "guardian",
    verified: true,
  };

  it("accepts every family role with a safe-default policy", () => {
    for (const role of [
      "parent",
      "guardian",
      "foster_guardian",
      "emergency_contact",
      "authorized_representative",
    ] as const) {
      const result = validateGuardianRelation({ ...relation, role });
      expect(result.ok).toBe(true);
    }
    expect(defaultGuardianPolicy()).toEqual({ contactShare: false, accessScopes: [] });
  });

  it("keeps permissions policy-driven (§110)", () => {
    expect(guardianMayAccess(relation, "grades")).toBe(false);
    const granted = { ...relation, policy: { contactShare: true, accessScopes: ["grades"] } };
    expect(guardianMayAccess(granted, "grades")).toBe(true);
    // Contact sharing alone never grants sensitive scopes.
    expect(guardianMayAccess({ ...relation, policy: { contactShare: true } }, "grades")).toBe(
      false,
    );
  });

  it("rejects self-relations and empty identities", () => {
    const selfRelation = validateGuardianRelation({ ...relation, learnerIdentityId: "ident-g1" });
    expect(selfRelation.ok).toBe(false);
    const missing = validateGuardianRelation({ ...relation, guardianIdentityId: "" });
    expect(missing.ok).toBe(false);
  });

  it("projects the family edge onto the declared kernel guardians relation", () => {
    const draft = projectGuardianEdge(relation, "2026-09-04T00:00:00.000Z");
    expect(draft.source_entity_id).toBe("ident-g1");
    expect(draft.target_entity_id).toBe("ident-l1");
    expect(draft.relation_type).toBe("guardians");
    expect((draft.attributes as { role: string }).role).toBe("guardian");
  });
});
