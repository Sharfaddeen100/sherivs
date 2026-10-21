/**
 * Sherivs Scholar — school builder tests (Phase-04 §79–80).
 * The builder composes parts and delegates structural validation to A1/A2 —
 * an institution can never be saved structurally inconsistent.
 */
import { describe, expect, it } from "vitest";
import { buildSchoolSpec, emptyBuildParts } from "@/lib/scholar/school-builder";

const LEVELS = [
  { name: "Lower Primary", code: "lower", sortOrder: 0 },
  { name: "Upper Primary", code: "upper", sortOrder: 1 },
];

const PROGRAMMES = [
  { name: "Foundation", code: "foundation", sortOrder: 0 },
  { name: "Islamic Track", code: "islamic", parentCode: "foundation", sortOrder: 0 },
];

describe("school-builder — configuration composition (§79–80)", () => {
  it("composes a valid spec from levels, programmes, shifts and hours", () => {
    const result = buildSchoolSpec({
      levels: LEVELS,
      programmes: PROGRAMMES,
      shifts: [{ name: "Morning" }, { name: "Evening" }],
      hours: { open: "08:00", close: "17:00" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.levels.length).toBe(2);
      expect((result.spec.shifts as { name: string }[]).length).toBe(2);
    }
  });

  it("requires at least one level (no invention, §162)", () => {
    const result = buildSchoolSpec(emptyBuildParts());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("levels");
  });

  it("propagates level duplicate errors into build issues", () => {
    const result = buildSchoolSpec({
      levels: [
        { name: "SS1", sortOrder: 0 },
        { name: "SS1", sortOrder: 1 },
      ],
      programmes: PROGRAMMES,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("levels:");
  });

  it("propagates programme cycle errors into build issues", () => {
    const result = buildSchoolSpec({
      levels: LEVELS,
      programmes: [
        { name: "A", code: "a", parentCode: "b" },
        { name: "B", code: "b", parentCode: "a" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("programmes:");
  });

  it("rejects duplicate shift names and invalid hours values", () => {
    const badShifts = buildSchoolSpec({
      levels: LEVELS,
      programmes: PROGRAMMES,
      shifts: [{ name: "Morning" }, { name: "Morning" }],
    });
    expect(badShifts.ok).toBe(false);

    const badHours = buildSchoolSpec({
      levels: LEVELS,
      programmes: PROGRAMMES,
      hours: { open: 830 },
    });
    expect(badHours.ok).toBe(false);
  });
});
