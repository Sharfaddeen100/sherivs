/**
 * Sherivs Scholar — programme hierarchy tests (Phase-04 §6).
 * Proves the hierarchy is purely configurable (religious/vocational/custom
 * trees all pass the same validator; cycles and dangling parents fail).
 */
import { describe, expect, it } from "vitest";
import {
  effectiveKey,
  programmeChildren,
  validateProgrammeStructure,
} from "@/lib/scholar/programme";

describe("programme — configurable hierarchy (§6)", () => {
  it("accepts a custom multi-root hierarchy (e.g. faith + national + vocational branches)", () => {
    const result = validateProgrammeStructure([
      { name: "Faith Track", code: "faith", sortOrder: 0 },
      { name: "Qur'anic Studies", code: "quran", parentCode: "faith", sortOrder: 0 },
      { name: "National Curriculum", code: "national", sortOrder: 1 },
      { name: "Primary", code: "primary", parentCode: "national", sortOrder: 0 },
      { name: "Vocational", code: "vocational", parentCode: "national", sortOrder: 1 },
      { name: "Apprenticeship Workshop", code: "workshop", parentCode: "vocational", sortOrder: 0 },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.total).toBe(6);
      expect(result.roots).toEqual(["faith", "national"]);
    }
  });

  it("uses name as the effective key when no code is given", () => {
    expect(effectiveKey({ name: "SS1" })).toBe("SS1");
    expect(effectiveKey({ name: "SS1", code: "ss1" })).toBe("ss1");
  });

  it("fails closed on dangling parents", () => {
    const result = validateProgrammeStructure([{ name: "Child", parentCode: "missing-parent" }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("unknown parent");
  });

  it("fails closed on cycles", () => {
    const result = validateProgrammeStructure([
      { name: "A", code: "a", parentCode: "b" },
      { name: "B", code: "b", parentCode: "a" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("cycle");
  });

  it("fails closed on duplicates and invalid codes", () => {
    expect(
      validateProgrammeStructure([
        { name: "A", code: "a" },
        { name: "B", code: "a" },
      ]).ok,
    ).toBe(false);
    expect(validateProgrammeStructure([{ name: "A", code: "Bad Code!" }]).ok).toBe(false);
    expect(validateProgrammeStructure("nope").ok).toBe(false);
  });

  it("builds an ordered children adjacency map", () => {
    const children = programmeChildren([
      { name: "Root", code: "root" },
      { name: "Z", code: "z", parentCode: "root", sortOrder: 2 },
      { name: "A", code: "a", parentCode: "root", sortOrder: 0 },
    ]);
    expect((children.get("root") ?? []).map(effectiveKey)).toEqual(["a", "z"]);
  });
});
