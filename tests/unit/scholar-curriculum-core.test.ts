/**
 * Sherivs Scholar — Cluster D core curriculum tests (§7–10, 19–21, 178).
 */
import { describe, expect, it } from "vitest";
import {
  activeVersionOf,
  validateCurricula,
  type CurriculumFramework,
  type CurriculumVersion,
} from "@/lib/scholar/curriculum-core";
import { subjectFacilityDemand, validateSubjects } from "@/lib/scholar/subject";
import { validateSubjectRelationships } from "@/lib/scholar/subject-relationships";
import { validateProgrammeDefinitions } from "@/lib/scholar/programme-definition";
import {
  activeAfterEvolution,
  assertHistoryPreserved,
  supersedeCurriculumVersion,
} from "@/lib/scholar/curriculum-evolution";

describe("curriculum-core (§7–10)", () => {
  const v1: CurriculumVersion = {
    version: "2023",
    effectiveDate: "2023-09-01",
    authority: "National Council",
    source: "national-basic-education",
  };
  const basic: CurriculumFramework = {
    id: "cur-nbe",
    name: "National Basic Education",
    country: "NG",
    versions: [v1],
  };
  const quranic: CurriculumFramework = {
    id: "cur-quranic",
    name: "Qur'anic Schools Framework",
    versions: [{ ...v1, authority: "Board", source: "quranic-committee" }],
  };

  it("operates MULTIPLE curricula simultaneously (§8)", () => {
    const result = validateCurricula([basic, quranic]);
    expect(result.ok).toBe(true);
  });

  it("selects the version in force on a date (§9)", () => {
    expect(activeVersionOf(basic, "2024-03-01")?.version).toBe("2023");
    expect(activeVersionOf(basic, "2022-01-01")).toBe(null);
  });

  it("rejects overlapping versions within one framework and missing authority", () => {
    const overlap = validateCurricula([
      {
        ...basic,
        versions: [
          v1,
          { ...v1, version: "2024", effectiveDate: "2024-02-01", expiryDate: "2026-12-31" },
        ],
      },
    ]);
    expect(overlap.ok).toBe(false);
    if (!overlap.ok) expect(overlap.issues.join(" ")).toContain("overlap in time");

    const noAuthority = validateCurricula([{ ...basic, versions: [{ ...v1, authority: "   " }] }]);
    expect(noAuthority.ok).toBe(false);
  });
});

describe("subject (§19)", () => {
  it("validates a non-hard-coded subject with full configuration", () => {
    const result = validateSubjects(
      [
        {
          code: "AGRI",
          name: "Agricultural Science",
          curriculumId: "cur-nbe",
          levelCodes: ["lower", "upper"],
          requiredFacilities: ["school-farm"],
          requiredEquipment: ["hoe", "machete"],
          requiredTeachers: 1,
        },
      ],
      { curriculumIds: new Set(["cur-nbe"]), levelCodes: new Set(["lower", "upper"]) },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(subjectFacilityDemand(result.subjects[0])).toEqual(["school-farm", "hoe", "machete"]);
    }
  });

  it("rejects duplicates and dangling references", () => {
    const duplicate = validateSubjects([
      { code: "MATH", name: "Mathematics" },
      { code: "MATH", name: "Maths" },
    ]);
    expect(duplicate.ok).toBe(false);

    const dangling = validateSubjects([{ code: "X", name: "X", curriculumId: "ghost" }], {
      curriculumIds: new Set(["cur-nbe"]),
    });
    expect(dangling.ok).toBe(false);
  });
});

describe("subject-relationships (§20)", () => {
  it("accepts cross-subject relations against a subject index", () => {
    const result = validateSubjectRelationships(
      [
        { sourceCode: "MATH", targetCode: "PHYSICS", kind: "prerequisite" },
        { sourceCode: "AGRI", targetCode: "ECON", kind: "integrates_with" },
      ],
      new Set(["MATH", "PHYSICS", "AGRI", "ECON"]),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects self-relations and unknown subjects", () => {
    const selfRelation = validateSubjectRelationships([
      { sourceCode: "MATH", targetCode: "MATH", kind: "supports" },
    ]);
    expect(selfRelation.ok).toBe(false);
    if (!selfRelation.ok) expect(selfRelation.issues.join(" ")).toContain("itself");

    const unknown = validateSubjectRelationships(
      [{ sourceCode: "MATH", targetCode: "GHOST", kind: "supports" }],
      new Set(["MATH"]),
    );
    expect(unknown.ok).toBe(false);
  });
});

describe("programme-definition (§21)", () => {
  it("validates a full programme definition", () => {
    const result = validateProgrammeDefinitions(
      [
        {
          code: "PG-AGRI",
          name: "Agricultural Education",
          purpose: "Farm-based practical education",
          durationMonths: 36,
          curriculumId: "cur-nbe",
          levelCodes: ["lower", "upper"],
          requiredSubjectCodes: ["AGRI"],
          optionalSubjectCodes: ["ECON"],
          progressionRules: [
            { fromLevelCode: "lower", toLevelCode: "upper", rule: "pass practicals" },
          ],
          certificationRequirement: "NVQ-equivalent",
        },
      ],
      {
        curriculumIds: new Set(["cur-nbe"]),
        levelCodes: new Set(["lower", "upper"]),
        subjectCodes: new Set(["AGRI", "ECON"]),
      },
    );
    expect(result.ok).toBe(true);
  });

  it("rejects required+optional overlap and dangling curriculum refs", () => {
    const overlap = validateProgrammeDefinitions([
      {
        code: "PG-X",
        name: "X",
        requiredSubjectCodes: ["AGRI"],
        optionalSubjectCodes: ["AGRI"],
      },
    ]);
    expect(overlap.ok).toBe(false);
    if (!overlap.ok) expect(overlap.issues.join(" ")).toContain("both required and optional");

    const dangling = validateProgrammeDefinitions(
      [{ code: "PG-Y", name: "Y", curriculumId: "ghost" }],
      { curriculumIds: new Set(["cur-nbe"]) },
    );
    expect(dangling.ok).toBe(false);
  });
});

describe("curriculum-evolution (§178)", () => {
  const framework: CurriculumFramework = {
    id: "cur-nbe",
    name: "National Basic Education",
    versions: [
      {
        version: "2023",
        effectiveDate: "2023-09-01",
        authority: "National Council",
        source: "national-basic-education",
      },
    ],
  };

  it("supersedes without destroying history", () => {
    const result = supersedeCurriculumVersion({
      framework,
      supersedesLabel: "2023",
      nextVersion: {
        version: "2024",
        effectiveDate: "2024-09-01",
        authority: "National Council",
        source: "national-basic-education",
        migrationRules: ["2023 cohorts complete under 2023 rules"],
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.framework.versions).toHaveLength(2);
      // §178: the historical version is still present (expired, not deleted).
      expect(assertHistoryPreserved(framework.versions, result.framework.versions)).toEqual([]);
      const v2023 = result.framework.versions.find((v) => v.version === "2023");
      expect(v2023?.expiryDate).toBe("2024-08-31");
      expect(activeAfterEvolution(result.framework, "2025-01-01")?.version).toBe("2024");
    }
  });

  it("rejects evolution that would overwrite an existing version label", () => {
    const result = supersedeCurriculumVersion({
      framework,
      supersedesLabel: "2023",
      nextVersion: {
        version: "2023",
        effectiveDate: "2025-01-01",
        authority: "Council",
        source: "national",
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("must not overwrite history");
  });

  it("flags history that would be lost", () => {
    expect(assertHistoryPreserved(framework.versions, [])).toHaveLength(1);
  });
});
