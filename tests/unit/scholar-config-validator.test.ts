/**
 * Sherivs Scholar — configuration validator tests (Phase-04 §83).
 */
import { describe, expect, it } from "vitest";
import {
  registerConfigurationCheck,
  validateInstitutionConfiguration,
} from "@/lib/scholar/config-validator";
import { buildSchoolSpec, type SchoolBuildSpec } from "@/lib/scholar/school-builder";
import type { ShiftConfig } from "@/lib/scholar/school-builder";
import type { EducationalLevel } from "@/lib/scholar/education-levels";

const LEVELS = [
  { name: "Lower Primary", code: "lower", sortOrder: 0 },
  { name: "Upper Primary", code: "upper", sortOrder: 1 },
];
const PROGRAMMES = [{ name: "Foundation", code: "foundation", sortOrder: 0 }];

function specWith(extra: Partial<Record<string, unknown>> = {}): SchoolBuildSpec {
  const built = buildSchoolSpec({ levels: LEVELS, programmes: PROGRAMMES, ...extra });
  if (!built.ok) throw new Error("fixture spec must build");
  return built.spec;
}

/**
 * A raw (already-typed) spec for DEEPER validator checks that the A3 builder
 * legitimately rejects first (duplicate shifts, empty levels, malformed hours).
 */
function rawSpec(over: Partial<SchoolBuildSpec>): SchoolBuildSpec {
  const built = buildSchoolSpec({ levels: LEVELS, programmes: PROGRAMMES });
  if (!built.ok) throw new Error("fixture spec must build");
  return { ...built.spec, ...over };
}

describe("config-validator — institution configuration checks (§83)", () => {
  it("accepts a consistent configuration", () => {
    expect(validateInstitutionConfiguration(specWith()).ok).toBe(true);
  });

  it("rejects duplicate campuses and blank languages", () => {
    const dup = validateInstitutionConfiguration(
      specWith({ campuses: [{ name: "Main" }, { name: "Main" }] }),
    );
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.issues.join(" ")).toContain("campuses: duplicate");

    const blank = validateInstitutionConfiguration(specWith({ languages: [{ name: "" }] }));
    expect(blank.ok).toBe(false);
    if (!blank.ok) expect(blank.issues.join(" ")).toContain("languages");
  });

  it("rejects malformed hours and duplicate shifts", () => {
    const badHours = validateInstitutionConfiguration(rawSpec({ hours: { open: "830" } }));
    expect(badHours.ok).toBe(false);
    if (!badHours.ok) expect(badHours.issues.join(" ")).toContain("hours.open");

    const dupShifts = validateInstitutionConfiguration(
      rawSpec({ shifts: [{ name: "Morning" }, { name: "Morning" }] as ShiftConfig[] }),
    );
    expect(dupShifts.ok).toBe(false);
    if (!dupShifts.ok) expect(dupShifts.issues.join(" ")).toContain("shifts: duplicate");
  });

  it("reports structural issues from A1/A2", () => {
    const result = validateInstitutionConfiguration(rawSpec({ levels: [] as EducationalLevel[] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("levels");
  });

  it("runs registered extension checks (later clusters plug in here)", () => {
    registerConfigurationCheck({
      name: "facility-test",
      run: (spec) => (spec.policies.fake_missing_facility ? [] : ["facilities must be declared"]),
    });
    const result = validateInstitutionConfiguration(specWith({ policies: {} }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("facility-test");
  });
});
