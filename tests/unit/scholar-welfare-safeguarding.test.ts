/**
 * CoreGrid Scholar — Cluster J tests (Phase-04 §53–56).
 * SEN accommodations, counselling (strict access), welfare, safeguarding.
 */
import { describe, expect, it } from "vitest";
import { validateSenProfiles } from "@/lib/scholar/special-needs";
import {
  canAccessCounsellingCase,
  validateCounselling,
  validateCounsellingIntervention,
  validateCounsellingReferral,
} from "@/lib/scholar/counselling";
import {
  validateEmergencyContacts,
  validateSupportServices,
  validateWelfareCases,
  validateWelfareInterventions,
} from "@/lib/scholar/welfare";
import {
  validateEscalation,
  validateRestrictedEvidence,
  validateSafeguardingCases,
  validateSafeguardingIncidents,
} from "@/lib/scholar/safeguarding";

describe("special-needs (§53)", () => {
  it("accepts configurable accommodations per learner", () => {
    const issues = validateSenProfiles([
      {
        studentId: "l-1",
        accommodations: [
          { kind: "additional_time", note: "+25% in exams" },
          { kind: "alternative_assessment" },
          { kind: "assistive_technology", note: "screen reader" },
        ],
      },
      { studentId: "l-2", accommodations: [{ kind: "specialized_classroom" }] },
    ]);
    expect(issues).toEqual([]);
  });

  it("rejects unknown kinds and empty accommodation lists", () => {
    const badKind = validateSenProfiles([
      {
        studentId: "l-1",
        accommodations: [{ kind: "remedial_magic" as never }],
      },
    ]);
    expect(badKind.join(" ")).toContain("accommodation kind must be one of");

    const empty = validateSenProfiles([{ studentId: "l-2", accommodations: [] }]);
    expect(empty.join(" ")).toContain("at least one accommodation");
  });
});

describe("counselling (§54)", () => {
  const counsellors = [{ id: "ident-c1", name: "Ms Counsellor" }];
  const cases = [
    {
      id: "case-1",
      studentId: "l-1",
      status: "open" as const,
      openedAt: "2026-09-01T00:00:00.000Z",
    },
  ];

  it("validates counsellors, appointments and cases", () => {
    const issues = validateCounselling(
      counsellors,
      [
        {
          id: "appt-1",
          counsellorId: "ident-c1",
          studentId: "l-1",
          scheduledAt: "2026-09-08T10:00:00.000Z",
        },
      ],
      cases,
    );
    expect(issues).toEqual([]);
  });

  it("rejects unknown counsellors and bad statuses", () => {
    const issues = validateCounselling(
      counsellors,
      [
        {
          id: "appt-2",
          counsellorId: "ghost",
          studentId: "l-1",
          scheduledAt: "2026-09-08T10:00:00.000Z",
        },
      ],
      [
        {
          id: "case-9",
          studentId: "l-1",
          status: "mystery" as never,
          openedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
    );
    expect(issues.join(" ")).toContain("unknown counsellor");
    expect(issues.join(" ")).toContain("status must be one of");
  });

  it("enforces strict access to counselling cases (§54)", () => {
    expect(canAccessCounsellingCase(["school_admin"])).toBe(true);
    expect(canAccessCounsellingCase(["designated_safeguarding_officer"])).toBe(true);
    expect(canAccessCounsellingCase(["teacher"])).toBe(false);
    expect(canAccessCounsellingCase(["teacher", "school_admin"])).toBe(true);
  });

  it("validates referrals and interventions", () => {
    expect(
      validateCounsellingReferral({
        id: "ref-1",
        caseId: "case-1",
        toService: "Educational Psychologist",
        reason: "assessment needed",
      }),
    ).toEqual([]);
    expect(
      validateCounsellingReferral({ id: "ref-2", caseId: "", toService: "", reason: "" }),
    ).toHaveLength(3);
    expect(
      validateCounsellingIntervention({
        id: "int-1",
        caseId: "case-1",
        type: "group session",
        startedAt: "2026-09-10T00:00:00.000Z",
      }),
    ).toEqual([]);
  });
});

describe("welfare (§55)", () => {
  it("validates welfare cases, services, contacts and interventions", () => {
    const cases = validateWelfareCases([
      {
        id: "wf-1",
        studentId: "l-1",
        status: "open",
        openedAt: "2026-09-02T00:00:00.000Z",
        kind: "nutrition",
      },
    ]);
    expect(cases).toEqual([]);

    const services = validateSupportServices([
      { id: "svc-feed", name: "School Feeding", provider: "Caterer" },
    ]);
    expect(services).toEqual([]);

    const contacts = validateEmergencyContacts(
      [
        { id: "ec-1", studentId: "l-1", contactIdentityId: "ident-g1", priority: 1 },
        { id: "ec-2", studentId: "l-1", contactIdentityId: "ident-g2", priority: 2 },
      ],
      new Set(["l-1"]),
    );
    expect(contacts).toEqual([]);

    const interventions = validateWelfareInterventions([
      {
        id: "wf-int-1",
        caseId: "wf-1",
        type: "feeding support",
        startedAt: "2026-09-03T00:00:00.000Z",
      },
    ]);
    expect(interventions).toEqual([]);
  });

  it("rejects bad statuses and unknown students", () => {
    const badStatus = validateWelfareCases([
      {
        id: "wf-x",
        studentId: "l-1",
        status: "escalated" as never,
        openedAt: "2026-09-02T00:00:00.000Z",
      },
    ]);
    expect(badStatus.join(" ")).toContain("status must be one of");

    const unknownStudent = validateEmergencyContacts(
      [{ id: "ec-x", studentId: "ghost", contactIdentityId: "ident-g1", priority: 1 }],
      new Set(["l-1"]),
    );
    expect(unknownStudent.join(" ")).toContain("unknown student");
  });
});

describe("safeguarding (§56)", () => {
  it("validates controlled cases, incidents and escalation", () => {
    const cases = [
      {
        id: "sg-1",
        studentId: "l-1",
        status: "investigating" as const,
        openedAt: "2026-09-02T00:00:00.000Z",
        responsibleOfficerId: "ident-do",
      },
    ];
    expect(validateSafeguardingCases(cases)).toEqual([]);

    const incidents = validateSafeguardingIncidents(
      [
        {
          id: "sg-inc-1",
          caseId: "sg-1",
          date: "2026-09-02",
          kind: "bullying",
          detail: "Reported pattern",
        },
      ],
      new Set(["sg-1"]),
    );
    expect(incidents).toEqual([]);

    expect(
      validateEscalation({
        id: "sg-esc-1",
        caseId: "sg-1",
        escalatedTo: "ident-head",
        reason: "outside school hours",
        at: "2026-09-02T18:00:00.000Z",
      }),
    ).toEqual([]);
  });

  it("keeps restricted evidence explicitly role-gated (§56)", () => {
    expect(
      validateRestrictedEvidence([
        {
          id: "ev-1",
          caseId: "sg-1",
          evidenceRef: "file:interview-1",
          accessRoles: ["designated_safeguarding_officer"],
        },
      ]),
    ).toEqual([]);

    const noRoles = validateRestrictedEvidence([
      { id: "ev-2", caseId: "sg-1", evidenceRef: "file:photo", accessRoles: [] },
    ]);
    expect(noRoles.join(" ")).toContain("accessRoles must not be empty");
  });

  it("rejects incidents referencing unknown cases", () => {
    const issues = validateSafeguardingIncidents(
      [{ id: "sg-inc-9", caseId: "ghost", date: "2026-09-02", kind: "other", detail: "x" }],
      new Set(["sg-1"]),
    );
    expect(issues.join(" ")).toContain("unknown safeguarding case");
  });
});
