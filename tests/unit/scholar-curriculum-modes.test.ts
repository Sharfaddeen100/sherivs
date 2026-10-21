/**
 * Sherivs Scholar — Cluster D education-mode tests (§11–16).
 * Religious, traditional, vocational, agricultural, technical, entrepreneurship.
 */
import { describe, expect, it } from "vitest";
import { validateReligiousEducation } from "@/lib/scholar/curriculum-religious";
import { validateTraditionalEducation } from "@/lib/scholar/curriculum-traditional";
import { validateVocationalEducation } from "@/lib/scholar/curriculum-vocational";
import { validateAgriculturalEducation } from "@/lib/scholar/curriculum-agricultural";
import { validateTechnicalEducation } from "@/lib/scholar/curriculum-technical";
import { validateEntrepreneurshipEducation } from "@/lib/scholar/curriculum-entrepreneurship";
import {
  validateClassLanguageProfiles,
  validateInstitutionLanguages,
} from "@/lib/scholar/languages";

describe("religious education (§11)", () => {
  it("accepts diverse faith systems through one configuration path", () => {
    const result = validateReligiousEducation([
      { id: "rel-islamic", kind: "islamic", name: "Islamic Studies", faithIdentifier: "islam" },
      { id: "rel-quranic", kind: "quranic", name: "Qur'anic School", faithIdentifier: "islam" },
      {
        id: "rel-christian",
        kind: "christian",
        name: "Christian Religious Knowledge",
        faithIdentifier: "christianity",
      },
      { id: "rel-madrasa", kind: "madrasa", name: "Madrasa Track" },
      { id: "rel-community", kind: "institution_defined", name: "Local Faith Programme" },
    ]);
    expect(result.ok).toBe(true);
  });

  it("never presumes a religion — unknown kinds are rejected", () => {
    // Negative path only: runtime kind is invalid by design.
    const invalid = { id: "x", kind: "hindu", name: "X" } as unknown as {
      id: string;
      kind: "islamic";
      name: string;
    };
    const result = validateReligiousEducation([invalid]);
    expect(result.ok).toBe(false);
  });
});

describe("traditional & community education (§12)", () => {
  it("accepts indigenous/oral/apprenticeship programmes", () => {
    const result = validateTraditionalEducation([
      {
        id: "trad-oral",
        kind: "oral_traditions",
        name: "Oral History of the Plateau",
        community: "Plateau communities",
      },
      {
        id: "trad-apprentice",
        kind: "community_apprenticeship",
        name: "Blacksmith Apprenticeship",
        skills: ["forging", "repair"],
      },
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects duplicate programme ids", () => {
    const result = validateTraditionalEducation([
      { id: "trad-x", kind: "cultural_education", name: "A" },
      { id: "trad-x", kind: "cultural_education", name: "B" },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("duplicate");
  });
});

describe("vocational education (§13)", () => {
  it("accepts trades with competency + certification + placement config", () => {
    const result = validateVocationalEducation([
      {
        id: "voc-tailoring",
        name: "Tailoring & Fashion",
        trade: "tailoring",
        hasWorkshop: true,
        hasApprenticeship: true,
        competencyRequirements: ["cutting", "sewing", "finishing"],
        certification: "City & Guilds",
        industryPlacement: { required: true, providerTypes: ["garment-factories", "boutiques"] },
      },
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects required placements without declared provider types (no assumption)", () => {
    const result = validateVocationalEducation([
      { id: "voc-x", name: "X", trade: "welding", industryPlacement: { required: true } },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("provider types");
  });
});

describe("agricultural education (§14)", () => {
  it("accepts farm practicals with facilities and equipment", () => {
    const result = validateAgriculturalEducation([
      {
        id: "agri-main",
        name: "Farm School",
        fields: ["crop_production", "livestock", "fisheries"],
        farmFacilities: ["school-farm", "fish-ponds"],
        equipment: ["tractor"],
      },
    ]);
    expect(result.ok).toBe(true);
  });

  it("requires at least one field", () => {
    const result = validateAgriculturalEducation([{ id: "agri-x", name: "X", fields: [] }]);
    expect(result.ok).toBe(false);
  });
});

describe("technical education (§15)", () => {
  it("accepts engineering/computing domains with workshops", () => {
    const result = validateTechnicalEducation([
      {
        id: "tech-main",
        name: "Technical College",
        domains: ["engineering", "mechanics", "computing"],
        workshopFacilities: ["fabrication-workshop"],
        equipment: ["lathe", "welder"],
      },
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects unknown technical domains", () => {
    const invalid = { id: "tech-x", name: "X", domains: ["astrology"] } as unknown as {
      id: string;
      name: string;
      domains: "engineering"[];
    };
    const result = validateTechnicalEducation([invalid]);
    expect(result.ok).toBe(false);
  });
});

describe("entrepreneurship education (§16)", () => {
  it("accepts student-business + cooperative modes", () => {
    const result = validateEntrepreneurshipEducation([
      {
        id: "entrep-main",
        name: "Youth Enterprise",
        modes: ["student_businesses", "cooperative_projects", "market_simulations"],
      },
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects unknown modes", () => {
    const invalid = { id: "entrep-x", name: "X", modes: ["crypto"] } as unknown as {
      id: string;
      name: string;
      modes: "custom"[];
    };
    const result = validateEntrepreneurshipEducation([invalid]);
    expect(result.ok).toBe(false);
  });
});

describe("languages (§17–18)", () => {
  it("validates institution language configuration", () => {
    const result = validateInstitutionLanguages([
      {
        code: "en",
        name: "English",
        uses: ["instructional", "administrative", "examination", "communication"],
      },
      { code: "ha", name: "Hausa", uses: ["instructional", "local"] },
      { code: "yo", name: "Yoruba", uses: ["local"] },
    ]);
    expect(result.ok).toBe(true);
  });

  it("rejects languages without uses and unknown uses", () => {
    const noUses = validateInstitutionLanguages([{ code: "xx", name: "X", uses: [] }]);
    expect(noUses.ok).toBe(false);

    const invalid = { code: "yy", name: "Y", uses: ["signing"] } as unknown as {
      code: string;
      name: string;
      uses: "local"[];
    };
    expect(validateInstitutionLanguages([invalid]).ok).toBe(false);
  });

  it("validates class multilingual profiles (§18)", () => {
    // A local language may double as a secondary instructional language.
    const doubled = validateClassLanguageProfiles(
      [
        {
          classId: "cls-1a",
          primaryInstructionalLanguage: "en",
          secondaryInstructionalLanguage: "ha",
          localLanguage: "ha",
          languageSupportProgramme: "foundation-literacy",
        },
      ],
      new Set(["en", "ha"]),
    );
    expect(doubled.ok).toBe(true);

    // But primary and secondary instructional languages must differ.
    const contradiction = validateClassLanguageProfiles(
      [
        {
          classId: "cls-1a",
          primaryInstructionalLanguage: "ha",
          secondaryInstructionalLanguage: "ha",
        },
      ],
      new Set(["en", "ha"]),
    );
    expect(contradiction.ok).toBe(false);
    if (!contradiction.ok) expect(contradiction.issues.join(" ")).toContain("must differ");
  });

  it("rejects unknown class languages against the institution index", () => {
    const result = validateClassLanguageProfiles(
      [{ classId: "cls-1a", primaryInstructionalLanguage: "fr" }],
      new Set(["en", "ha"]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("unknown language");
  });
});
