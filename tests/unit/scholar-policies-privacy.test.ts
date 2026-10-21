/**
 * Sherivs Scholar — Cluster M tests (Phase-04 §77, 134–141).
 * Operating policies, purpose-limited privacy, child data, audit/retention.
 */
import { describe, expect, it } from "vitest";
import {
  activePoliciesFor,
  validatePolicies,
  type InstitutionPolicy,
} from "@/lib/scholar/policies";
import {
  isChildData,
  purposeAllowsDataKind,
  retentionSummary,
  validateAuditRecord,
  validateDataPurposes,
  type DataUsePurpose,
} from "@/lib/scholar/privacy";

describe("policies (§77)", () => {
  const policies: InstitutionPolicy[] = [
    {
      code: "POL-ATT-01",
      area: "attendance",
      name: "Attendance threshold",
      statement: "Learners below 75% attendance require a welfare review.",
      enabled: true,
      version: 2,
    },
    {
      code: "POL-GRD-01",
      area: "grading",
      name: "Pass mark",
      statement: "Institution-defined grade scales apply per subject.",
      enabled: true,
    },
  ];

  it("accepts every documented policy area", () => {
    const issues = validatePolicies([
      ...policies,
      {
        code: "POL-DEV-01",
        area: "device",
        name: "Device use",
        statement: "Devices are for learning.",
        enabled: true,
      },
      {
        code: "POL-COM-01",
        area: "communication",
        name: "Comms",
        statement: "Channels per guardian policy.",
        enabled: false,
      },
    ]);
    expect(issues).toEqual([]);
  });

  it("rejects duplicates and blank statements", () => {
    const dup = validatePolicies([
      { code: "POL-A", area: "academic", name: "A", statement: "x", enabled: true },
      { code: "POL-A", area: "academic", name: "B", statement: "y", enabled: true },
    ]);
    expect(dup.join(" ")).toContain("duplicate policy code");

    const blank = validatePolicies([
      { code: "POL-B", area: "custom", name: "B", statement: "  ", enabled: true },
    ]);
    expect(blank.join(" ")).toContain("statement is required");
  });

  it("lists active policies per area deterministically", () => {
    const active = activePoliciesFor(policies, "attendance");
    expect(active.map((p) => p.code)).toEqual(["POL-ATT-01"]);
    expect(activePoliciesFor(policies, "promotion")).toEqual([]);
  });
});

describe("privacy (§136–140)", () => {
  const teachingUse: DataUsePurpose = {
    id: "USE-TEACH",
    purpose: "teaching",
    dataKinds: ["attendance", "grades", "lesson-plans"],
    retentionDays: 365,
    residencyRegion: "NG",
  };

  it("validates declared purposes", () => {
    expect(validateDataPurposes([teachingUse])).toEqual([]);
    const bad = validateDataPurposes([
      { id: "USE-X", purpose: "marketing" as never, dataKinds: [], retentionDays: 0 },
    ]);
    expect(bad.join(" ")).toContain("purpose must be one of");
  });

  it("flags child data for heightened protection (§137)", () => {
    expect(isChildData("grades")).toBe(true);
    expect(isChildData("lesson-plans")).toBe(false);
  });

  it("enforces purpose limitation (§136)", () => {
    expect(purposeAllowsDataKind(teachingUse, "grades").allowed).toBe(true);
    const blocked = purposeAllowsDataKind(teachingUse, "health");
    expect(blocked.allowed).toBe(false);
    expect(blocked.reasons.join(" ")).toContain("does not declare");

    const noRetention = purposeAllowsDataKind({ ...teachingUse, retentionDays: null }, "grades");
    expect(noRetention.allowed).toBe(false);
    expect(noRetention.reasons.join(" ")).toContain("retention rule");
  });

  it("summarises retention and residency", () => {
    expect(retentionSummary(teachingUse)).toEqual({ retentionDays: 365, residencyRegion: "NG" });
    expect(
      retentionSummary({ ...teachingUse, retentionDays: null, residencyRegion: null }),
    ).toEqual({
      retentionDays: null,
      residencyRegion: null,
    });
  });
});

describe("audit (§138)", () => {
  it("validates sensitive-mutation audit records", () => {
    expect(
      validateAuditRecord({
        at: "2026-09-04T10:00:00.000Z",
        actorIdentityId: "ident-admin",
        action: "safeguarding_case.updated",
        subjectKind: "safeguarding_case",
        subjectId: "sg-1",
        purpose: "welfare",
        outcome: "allowed",
      }),
    ).toEqual([]);
  });

  it("rejects records missing actor, subject or timestamp", () => {
    const issues = validateAuditRecord({
      at: "not-a-date",
      actorIdentityId: "",
      action: "",
      subjectKind: "case",
      subjectId: "",
      outcome: "denied",
    });
    expect(issues).toHaveLength(3);
  });
});
