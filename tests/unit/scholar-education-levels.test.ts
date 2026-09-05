/**
 * CoreGrid Scholar — educational level registry tests (Phase-04 §5).
 *
 * Proves the level model is configuration-driven: Nigerian (SS/JSS), Ghanaian
 * (JHS/SHS), and fully custom level sets must all validate through the SAME
 * code path — no hidden fixed hierarchy.
 */
import { describe, expect, it } from "vitest";
import { sortLevels, validateLevels } from "@/lib/scholar/education-levels";

describe("education-levels — configurable level registry (§5)", () => {
  it("accepts a Nigerian-style secondary level set without hard-coding it", () => {
    const result = validateLevels([
      { name: "JSS1", code: "jss1", sortOrder: 0 },
      { name: "JSS2", code: "jss2", sortOrder: 1 },
      { name: "JSS3", code: "jss3", sortOrder: 2 },
      { name: "SS1", code: "ss1", sortOrder: 3 },
      { name: "SS2", code: "ss2", sortOrder: 4 },
      { name: "SS3", code: "ss3", sortOrder: 5 },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.levels.map((l) => l.name)).toEqual([
        "JSS1",
        "JSS2",
        "JSS3",
        "SS1",
        "SS2",
        "SS3",
      ]);
  });

  it("accepts a Ghanaian-style level set (JHS/SHS) through the same model", () => {
    const result = validateLevels([
      { name: "JHS 1", sortOrder: 0 },
      { name: "JHS 2", sortOrder: 1 },
      { name: "JHS 3", sortOrder: 2 },
      { name: "SHS 1", sortOrder: 3 },
      { name: "SHS 2", sortOrder: 4 },
      { name: "SHS 3", sortOrder: 5 },
    ]);
    expect(result.ok).toBe(true);
  });

  it("accepts fully custom institution-defined levels", () => {
    const result = validateLevels([
      { name: "Qur'anic Foundation", sortOrder: 0 },
      { name: "Evening Adult Literacy", sortOrder: 1 },
      { name: "Apprenticeship Year 1", sortOrder: 2 },
    ]);
    expect(result.ok).toBe(true);
  });

  it("orders levels deterministically by sortOrder", () => {
    const result = validateLevels([
      { name: "B", sortOrder: 2 },
      { name: "A", sortOrder: 0 },
      { name: "C", sortOrder: 1 },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.levels.map((l) => l.name)).toEqual(["A", "C", "B"]);
    expect(
      sortLevels([
        { name: "x", sortOrder: 1 },
        { name: "y", sortOrder: 0 },
      ]).map((l) => l.name),
    ).toEqual(["y", "x"]);
  });

  it("fails closed on empty, duplicate, blank or malformed configurations", () => {
    expect(validateLevels([]).ok).toBe(false);
    expect(
      validateLevels([
        { name: "SS1", sortOrder: 0 },
        { name: "SS1", sortOrder: 1 },
      ]).ok,
    ).toBe(false);
    expect(validateLevels([{ name: "   ", sortOrder: 0 }]).ok).toBe(false);
    expect(validateLevels([{ name: "SS1", code: "SS ONE", sortOrder: 0 }]).ok).toBe(false);
    expect(validateLevels([{ name: "SS1", sortOrder: -1 }]).ok).toBe(false);
    expect(validateLevels([{ name: "SS1", sortOrder: 1.5 }]).ok).toBe(false);
  });
});
