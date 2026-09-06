/**
 * CoreGrid Scholar — archetype simulation suite (Phase-04 §171–172, O5).
 * African institution archetypes through ONE configuration path.
 */
import { describe, expect, it } from "vitest";
import { buildSchoolSpec } from "@/lib/scholar/school-builder";
import { validateCurricula } from "@/lib/scholar/curriculum-core";
import { validateReligiousEducation } from "@/lib/scholar/curriculum-religious";
import { validateTraditionalEducation } from "@/lib/scholar/curriculum-traditional";
import { validateAgriculturalEducation } from "@/lib/scholar/curriculum-agricultural";
import { validateTechnicalEducation } from "@/lib/scholar/curriculum-technical";
import { validateInstitutionLanguages } from "@/lib/scholar/languages";

const PRIMARY_LEVELS = [
  { name: "Lower Primary", code: "lower", sortOrder: 0 },
  { name: "Upper Primary", code: "upper", sortOrder: 1 },
];
const SECONDARY_LEVELS = [
  { name: "JSS", code: "jss", sortOrder: 0 },
  { name: "SSS", code: "sss", sortOrder: 1 },
];
const NATIONAL = {
  id: "cur-national",
  name: "National Curriculum",
  versions: [
    { version: "2024", effectiveDate: "2024-09-01", authority: "Ministry", source: "national" },
  ],
};

function expectStructure(parts: Parameters<typeof buildSchoolSpec>[0]) {
  const built = buildSchoolSpec(parts);
  expect(built.ok).toBe(true);
  if (!built.ok) throw new Error(built.issues.join("; "));
  return built.spec;
}

describe("African institution archetypes (§171–172)", () => {
  it("1 — single-campus urban day primary (Nigeria)", () => {
    const spec = expectStructure({
      levels: PRIMARY_LEVELS,
      programmes: [{ name: "Basic Education", code: "basic", sortOrder: 0 }],
      campuses: [{ name: "Main Campus" }],
      languages: [
        { code: "en", name: "English", uses: ["instructional", "administrative", "examination"] },
        { code: "ha", name: "Hausa", uses: ["instructional", "local"] },
      ],
    });
    expect(spec.shifts).toEqual([]);
  });

  it("2 — multi-campus state secondary (Ghana) with streams", () => {
    expectStructure({
      levels: SECONDARY_LEVELS,
      programmes: [{ name: "SHS Programme", code: "shs", sortOrder: 0 }],
      campuses: [{ name: "Kumasi Campus" }, { name: "Accra Campus" }],
    });
    expect(
      validateInstitutionLanguages([
        { code: "en", name: "English", uses: ["instructional", "administrative"] },
      ]).ok,
    ).toBe(true);
  });

  it("3 — multi-shift urban secondary (morning/evening)", () => {
    const spec = expectStructure({
      levels: SECONDARY_LEVELS,
      programmes: [{ name: "Secondary", code: "sec", sortOrder: 0 }],
      shifts: [{ name: "Morning" }, { name: "Evening" }],
      campuses: [{ name: "Downtown Campus" }],
    });
    expect(spec.shifts).toHaveLength(2);
  });

  it("4 — boarding national secondary with houses", () => {
    expectStructure({
      levels: SECONDARY_LEVELS,
      programmes: [{ name: "National Secondary", code: "nat", sortOrder: 0 }],
      campuses: [{ name: "Hilltop Campus" }],
      policies: { boarding_enabled: true },
    });
  });

  it("5 — Islamic integrated school (Qur'anic + national)", () => {
    expectStructure({
      levels: PRIMARY_LEVELS,
      programmes: [
        { name: "Basic", code: "basic", sortOrder: 0 },
        { name: "Tahfeez", code: "tahfeez", sortOrder: 1 },
      ],
    });
    expect(validateCurricula([NATIONAL]).ok).toBe(true);
    expect(
      validateReligiousEducation([
        { id: "rel-islamic", kind: "islamic", name: "Islamic Studies", faithIdentifier: "islam" },
        { id: "rel-quranic", kind: "quranic", name: "Qur'anic Memorisation" },
      ]).ok,
    ).toBe(true);
  });

  it("6 — madrasa-track institution", () => {
    expectStructure({
      levels: [{ name: "Hifz Stage", code: "hifz", sortOrder: 0 }],
      programmes: [{ name: "Madrasa Basic", code: "madrasa", sortOrder: 0 }],
    });
    expect(
      validateReligiousEducation([
        { id: "rel-madrasa", kind: "madrasa", name: "Madrasa Track", faithIdentifier: "islam" },
      ]).ok,
    ).toBe(true);
  });

  it("7 — Christian mission school", () => {
    expect(
      validateReligiousEducation([
        { id: "rel-christian", kind: "christian", name: "CRE", faithIdentifier: "christianity" },
        { id: "rel-church", kind: "church_based", name: "Church Day School" },
      ]).ok,
    ).toBe(true);
  });

  it("8 — vocational/technical training college", () => {
    expectStructure({
      levels: [{ name: "Trade Level", code: "trade", sortOrder: 0 }],
      programmes: [{ name: "Crafts", code: "crafts", sortOrder: 0 }],
    });
    expect(
      validateTechnicalEducation([
        { id: "tech-w", name: "Welding", domains: ["fabrication", "mechanics"] },
      ]).ok,
    ).toBe(true);
  });

  it("9 — agricultural college with farm practicals", () => {
    expect(
      validateAgriculturalEducation([
        {
          id: "agri-1",
          name: "Farm College",
          fields: ["crop_production", "livestock", "farm_practicals"],
        },
      ]).ok,
    ).toBe(true);
  });

  it("10 — traditional community apprenticeship", () => {
    expect(
      validateTraditionalEducation([
        {
          id: "trad-1",
          kind: "community_apprenticeship",
          name: "Weaving Apprenticeship",
          community: "Community X",
        },
        { id: "trad-2", kind: "oral_traditions", name: "Oral History" },
      ]).ok,
    ).toBe(true);
  });

  it("11 — rural multi-grade village school (custom levels)", () => {
    expectStructure({
      levels: [{ name: "Multigrade Group", code: "multigrade", sortOrder: 0 }],
      programmes: [{ name: "Community Basic", code: "cb", sortOrder: 0 }],
      campuses: [{ name: "Village Centre" }],
    });
  });

  it("12 — dual-curriculum private international school", () => {
    expect(
      validateCurricula([NATIONAL, { ...NATIONAL, id: "cur-cambridge", name: "Cambridge Pathway" }])
        .ok,
    ).toBe(true);
    expectStructure({
      levels: [{ name: "Key Stage", code: "ks", sortOrder: 0 }],
      programmes: [{ name: "International", code: "intl", sortOrder: 0 }],
    });
  });

  it("13 — future/unfamiliar model — fully custom, one configuration path", () => {
    const spec = expectStructure({
      levels: [{ name: "Apprenticeship Ring", code: "ring", sortOrder: 0 }],
      programmes: [{ name: "Guild Programme", code: "guild", sortOrder: 0 }],
      shifts: [{ name: "Weekend" }, { name: "Night" }],
      campuses: [{ name: "Workshop Campus" }],
      policies: { mode: "community_guild" },
    });
    expect(spec.campuses).toHaveLength(1);
    expect(spec.policies.mode).toBe("community_guild");
  });
});
