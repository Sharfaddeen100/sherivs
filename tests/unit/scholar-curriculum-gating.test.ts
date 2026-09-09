/**
 * CoreGrid Scholar — curriculum gating tests.
 */
import { describe, expect, it } from "vitest";
import {
  curriculumModulesForProfile,
  isCurriculumModuleShown,
} from "../../frontend/src/lib/runtime/scholar-curriculum-gating";

describe("curriculum-per-school-type gating", () => {
  it("always surfaces core and traditional, nothing else by default", () => {
    expect(curriculumModulesForProfile(new Set())).toEqual([
      "curriculum-core",
      "curriculum-traditional",
    ]);
  });

  it("surfaces only the curriculum streams the school selected", () => {
    const modules = curriculumModulesForProfile(
      new Set(["curriculum.religious", "curriculum.vocational"]),
    );
    expect(modules).toContain("curriculum-religious");
    expect(modules).toContain("curriculum-vocational");
    expect(modules).not.toContain("curriculum-agricultural");
    expect(modules).not.toContain("curriculum-entrepreneurship");
    expect(modules).not.toContain("curriculum-technical");
  });

  it("never forces an unselected stream on a school", () => {
    expect(isCurriculumModuleShown("curriculum-religious", new Set())).toBe(false);
    expect(isCurriculumModuleShown("curriculum-core", new Set())).toBe(true);
    expect(isCurriculumModuleShown("curriculum-technical", new Set(["curriculum.technical"]))).toBe(
      true,
    );
  });
});
