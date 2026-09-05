/**
 * CoreGrid Scholar — Cluster E tests (Phase-04 §30–34).
 * Academic periods, school calendar, flexible hours and multi-shift operation.
 */
import { describe, expect, it } from "vitest";
import {
  containsRange,
  isValidIsoDate,
  rangesOverlap,
  validateAcademicPeriods,
  type AcademicPeriod,
} from "@/lib/scholar/academic-period";
import { classifyCalendarDays, validateCalendar, type CalendarEntry } from "@/lib/scholar/calendar";
import {
  blockMinutes,
  emptyDayRoutine,
  validateSchoolDayRoutine,
  type SchoolDayRoutine,
} from "@/lib/scholar/school-hours";
import { shiftDimensionCoverage, validateShifts, type ShiftDefinition } from "@/lib/scholar/shifts";

describe("academic-period (§30)", () => {
  const year: AcademicPeriod = {
    kind: "annual",
    name: "Academic Year 2026",
    code: "AY2026",
    startDate: "2026-01-05",
    endDate: "2026-12-18",
  };
  const term1: AcademicPeriod = {
    kind: "term",
    name: "Term 1",
    code: "T1",
    startDate: "2026-01-05",
    endDate: "2026-04-03",
    parentId: "AY2026",
  };

  it("accepts a nested annual/term structure", () => {
    const result = validateAcademicPeriods([year, term1]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.periods).toHaveLength(2);
  });

  it("rejects overlapping periods at the same level (conflict-free ranges)", () => {
    const clash = validateAcademicPeriods([
      term1,
      { ...term1, code: "T2", startDate: "2026-03-01", endDate: "2026-06-30" },
    ]);
    expect(clash.ok).toBe(false);
    if (!clash.ok) expect(clash.issues.join(" ")).toContain("overlap");
  });

  it("rejects a period that does not nest inside its parent", () => {
    const escapes = validateAcademicPeriods([
      year,
      { ...term1, code: "T1", endDate: "2027-01-15" },
    ]);
    expect(escapes.ok).toBe(false);
    if (!escapes.ok) expect(escapes.issues.join(" ")).toContain("nest inside parent");
  });

  it("detects parent cycles and invalid dates", () => {
    const cycle = validateAcademicPeriods([
      { ...year, parentId: "T1" },
      { ...term1, parentId: "AY2026" },
    ]);
    expect(cycle.ok).toBe(false);
    if (!cycle.ok) expect(cycle.issues.join(" ")).toContain("cycle");

    const badDate = validateAcademicPeriods([{ ...year, endDate: "2026-02-30" }]);
    expect(badDate.ok).toBe(false);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(rangesOverlap("2026-01-01", "2026-03-31", "2026-02-01", "2026-02-28")).toBe(true);
    expect(containsRange(year, term1)).toBe(true);
  });
});

describe("calendar (§31)", () => {
  const entries: CalendarEntry[] = [
    { kind: "instructional_day", date: "2026-03-02", name: "Term 1 teaching" },
    { kind: "examination", date: "2026-03-10", name: "Mid-term test" },
    { kind: "training_day", date: "2026-03-12", name: "Teacher professional development" },
  ];

  it("accepts a realistic mixed calendar", () => {
    const result = validateCalendar(entries);
    expect(result.ok).toBe(true);
  });

  it("rejects a day that is both instructional and closed", () => {
    const result = validateCalendar([
      ...entries,
      { kind: "closure", date: "2026-03-02", name: "Unexpected closure" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("instructional day");
  });

  it("rejects references to unknown academic periods", () => {
    const result = validateCalendar(
      [{ kind: "examination", date: "2026-03-10", name: "Test", periodCode: "NOPE" }],
      new Set(["T1"]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("unknown academic period");
  });

  it("classifies days into instructional/closed/other", () => {
    const classified = classifyCalendarDays([
      ...entries,
      { kind: "public_holiday", date: "2026-03-13", name: "Public holiday" },
    ]);
    expect(classified.instructional).toEqual(["2026-03-02"]);
    expect(classified.closed).toEqual(["2026-03-13"]);
    expect(classified.other).toContain("2026-03-10");
  });
});

describe("school-hours (§32)", () => {
  it("starts from a transparent empty routine (no invented blocks)", () => {
    const empty = emptyDayRoutine();
    expect(empty.blocks).toEqual([]);
    expect(empty.open).toBe("");
  });

  const routine: SchoolDayRoutine = {
    name: "Morning day",
    open: "07:30",
    close: "15:30",
    blocks: [
      { kind: "assembly", label: "Assembly", start: "07:30", end: "07:45" },
      { kind: "instruction", label: "Period 1", start: "07:45", end: "08:45" },
      { kind: "break", label: "Break", start: "10:00", end: "10:30" },
      { kind: "lunch", label: "Lunch", start: "12:30", end: "13:30" },
      { kind: "prayer", label: "Prayer", start: "15:00", end: "15:15" },
    ],
  };

  it("accepts a valid daily routine", () => {
    const result = validateSchoolDayRoutine(routine);
    expect(result.ok).toBe(true);
  });

  it("rejects overlapping and inverted blocks", () => {
    const overlap = validateSchoolDayRoutine({
      ...routine,
      blocks: [
        { kind: "instruction", label: "P1", start: "08:00", end: "09:00" },
        { kind: "instruction", label: "P2", start: "08:30", end: "09:30" },
      ],
    });
    expect(overlap.ok).toBe(false);
    if (!overlap.ok) expect(overlap.issues.join(" ")).toContain("overlaps");

    const inverted = validateSchoolDayRoutine({
      ...routine,
      close: "07:00",
    });
    expect(inverted.ok).toBe(false);
  });

  it("measures block durations in minutes", () => {
    expect(blockMinutes({ kind: "lunch", start: "12:30", end: "13:30" })).toBe(60);
    expect(blockMinutes({ kind: "instruction", start: "not-a-time", end: "13:00" })).toBe(null);
  });
});

describe("shifts (§33–34)", () => {
  const morning = { name: "Morning", kind: "morning", start: "07:00", end: "13:00" } as const;
  const evening = { name: "Evening", kind: "evening", start: "14:00", end: "20:00" } as const;

  it("accepts a multi-shift school with per-shift dimensions", () => {
    const result = validateShifts([
      {
        ...morning,
        staffGroupIds: ["staff-1"],
        studentGroupIds: ["form-1"],
        facilityIds: ["hall-a"],
      },
      { ...evening, scheduleId: "sch-eve", policies: { guardian_notice: true } },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(shiftDimensionCoverage(result.shifts[0]).staff).toBe(true);
      expect(shiftDimensionCoverage(result.shifts[1]).policies).toBe(true);
      expect(shiftDimensionCoverage(result.shifts[1]).staff).toBe(false);
    }
  });

  it("rejects duplicate shift names and invalid kinds", () => {
    const duplicate = validateShifts([
      morning,
      { name: "Morning", kind: "morning", start: "07:00", end: "13:00" },
    ]);
    expect(duplicate.ok).toBe(false);
    // Cast only for the negative-path test: runtime kind is invalid by design.
    const badKind = validateShifts([
      { name: "Forenoon", kind: "forenoon" } as unknown as ShiftDefinition,
    ]);
    expect(badKind.ok).toBe(false);
  });

  it("rejects inverted shift windows but allows custom shifts without times", () => {
    const inverted = validateShifts([{ ...morning, end: "06:00" }]);
    expect(inverted.ok).toBe(false);
    const custom = validateShifts([{ name: "Extended Day", kind: "custom" }]);
    expect(custom.ok).toBe(true);
  });
});
