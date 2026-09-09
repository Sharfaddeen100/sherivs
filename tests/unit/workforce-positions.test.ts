/**
 * CoreGrid — workforce-position typed contract tests (RPC surface output).
 */
import { describe, expect, it } from "vitest";
import {
  isOpenWorkforcePosition,
  isWorkforceEmploymentType,
  isWorkforcePositionStatus,
  parseWorkforcePositionView,
  summarizeWorkforcePositions,
  workforcePositionSummary,
  workforcePositionViewSchema,
  type WorkforcePositionView,
} from "../../frontend/src/lib/workforce-positions";

function row(overrides: Partial<WorkforcePositionView> = {}): WorkforcePositionView {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    identity_ref: "22222222-2222-4222-8222-222222222222",
    kind_code: "subject_teacher",
    kind_title: "Subject and Class Teacher",
    family: "teaching",
    employment_type: "full_time",
    started_on: "2026-01-12",
    ended_on: null,
    status: "active",
    is_primary: true,
    authority_group: "teaching_staff",
    ...overrides,
  };
}

describe("workforce-position view contract", () => {
  it("accepts a well-formed RPC row", () => {
    expect(workforcePositionViewSchema.safeParse(row()).success).toBe(true);
    expect(parseWorkforcePositionView(row()).kind_code).toBe("subject_teacher");
  });

  it("rejects malformed rows", () => {
    // Values that violate the contract are only representable at runtime,
    // which is exactly what the schema must catch.
    const bad = (overrides: Record<string, unknown>) =>
      workforcePositionViewSchema.safeParse({ ...row(), ...overrides });

    expect(bad({ id: "not-a-uuid" }).success).toBe(false);
    expect(bad({ employment_type: "overtime" }).success).toBe(false);
    expect(bad({ status: "retired" }).success).toBe(false);
    expect(bad({ is_primary: "yes" }).success).toBe(false);
    expect(bad({ identity_ref: 42 }).success).toBe(false);
    expect(bad({ kind_title: "" }).success).toBe(false);
  });

  it("groups open vs ended statuses", () => {
    expect(isOpenWorkforcePosition("active")).toBe(true);
    expect(isOpenWorkforcePosition("on_leave")).toBe(true);
    expect(isOpenWorkforcePosition("proposed")).toBe(true);
    expect(isOpenWorkforcePosition("ended")).toBe(false);
    expect(isOpenWorkforcePosition("revoked")).toBe(false);
    expect(isOpenWorkforcePosition("suspended")).toBe(false);
  });

  it("guards employment and status values", () => {
    expect(isWorkforceEmploymentType("part_time")).toBe(true);
    expect(isWorkforceEmploymentType("casual")).toBe(false);
    expect(isWorkforcePositionStatus("suspended")).toBe(true);
    expect(isWorkforcePositionStatus("fired")).toBe(false);
  });

  it("formats display summaries", () => {
    expect(workforcePositionSummary(row())).toBe("Subject and Class Teacher • primary");
    expect(workforcePositionSummary(row({ is_primary: false }))).toBe("Subject and Class Teacher");
    expect(workforcePositionSummary(row({ status: "ended", ended_on: "2026-08-30" }))).toBe(
      "Subject and Class Teacher • primary (ended)",
    );
  });

  it("keeps a secondary ended position end-dated and non-primary", () => {
    const secondary = row({ is_primary: false, status: "ended", ended_on: "2026-08-30" });
    expect(isOpenWorkforcePosition(secondary.status)).toBe(false);
    expect(workforcePositionSummary(secondary)).toBe("Subject and Class Teacher (ended)");
  });
});

describe("summarizeWorkforcePositions (HR roll)", () => {
  it("rolls totals, people, families and primaries from open positions only", () => {
    const rows = [
      row({ identity_ref: "22222222-2222-4222-8222-222222222222", is_primary: true }), // open
      row({
        identity_ref: "33333333-3333-4333-8333-333333333333",
        kind_code: "laboratory_technician",
        kind_title: "Laboratory Technician",
        family: "learning_support",
        is_primary: false,
      }),
      row({
        identity_ref: "22222222-2222-4222-8222-222222222222",
        kind_code: "examination_officer",
        kind_title: "Examination Officer",
        is_primary: false,
      }),
      row({
        identity_ref: "44444444-4444-4444-8444-444444444444",
        status: "ended",
        ended_on: "2026-08-30",
        family: "finance",
      }),
    ];
    const s = summarizeWorkforcePositions(rows);
    expect(s.total).toBe(4);
    expect(s.open).toBe(3);
    expect(s.people).toBe(3);
    expect(s.families).toBe(2); // teaching + learning_support (ended finance excluded)
    expect(s.primaries).toBe(1);
  });

  it("handles an empty roll", () => {
    const s = summarizeWorkforcePositions([]);
    expect(s).toEqual({ total: 0, open: 0, people: 0, families: 0, primaries: 0 });
  });
});
