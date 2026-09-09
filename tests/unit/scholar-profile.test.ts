/**
 * CoreGrid Scholar — school-profile contract tests (persistence, R-24).
 */
import { describe, expect, it } from "vitest";
import {
  parseScholarSchoolProfile,
  scholarSchoolProfileSchema,
  SCHOLAR_SCHOOL_PROFILE_KEY,
} from "../../frontend/src/lib/runtime/scholar-profile";

describe("scholar school-profile contract", () => {
  it("has a stable profile key", () => {
    expect(SCHOLAR_SCHOOL_PROFILE_KEY).toBe("school_profile_v1");
  });

  it("accepts a valid profile payload", () => {
    const profile = parseScholarSchoolProfile({
      version: 1,
      features: ["curriculum.religious", "schedule.boarding"],
      closingPreset: "fullDay_17",
    });
    expect(profile.features).toEqual(["curriculum.religious", "schedule.boarding"]);
    expect(profile.closingPreset).toBe("fullDay_17");
  });

  it("defaults version and closing when absent", () => {
    const profile = parseScholarSchoolProfile({ features: [] });
    expect(profile.version).toBe(1);
    expect(profile.closingPreset).toBe("fullDay_17");
  });

  it("rejects unknown features and unknown closing presets (fail closed)", () => {
    expect(scholarSchoolProfileSchema.safeParse({ features: ["not.a.feature"] }).success).toBe(
      false,
    );
    expect(
      scholarSchoolProfileSchema.safeParse({ features: [], closingPreset: "midnight" }).success,
    ).toBe(false);
  });
});
