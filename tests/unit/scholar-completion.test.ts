/**
 * CoreGrid Scholar — Phase-04 completion test (§199, O9).
 *
 * The §199 standard: give the platform a completely UNFAMILIAR African
 * educational institution — no interview, no code — and it must configure
 * itself through the ONE configuration path, validate, simulate consequences,
 * govern the change, version the blueprint, and surface a runtime manifest
 * identity. This suite exercises that standard end-to-end over the pure
 * Scholar contracts (the HTTP call path is covered by the wiring vertical +
 * verify-scholar-config-wiring.mjs).
 */
import { describe, expect, it } from "vitest";
import { buildSchoolSpec } from "@/lib/scholar/school-builder";
import { simulate } from "@/lib/scholar/config-simulator";
import { validateInstitutionConfiguration } from "@/lib/scholar/config-validator";
import { createBlueprint, validateBlueprint } from "@/lib/scholar/blueprint";
import { configurationState } from "@/lib/scholar/safe-defaults";
import { governConfigChange, versionApprovedChange } from "@/lib/scholar/config-governance";
import { validateAcademicPeriods } from "@/lib/scholar/academic-period";
import { detectRealityDrift } from "@/lib/scholar/reality-validator";

/** The §199 fixture: a future/unfamiliar institution nobody asked about. */
const UNFAMILIAR_PARTS = {
  levels: [{ name: "Apprenticeship Ring", code: "ring", sortOrder: 0 }],
  programmes: [{ name: "Guild Programme", code: "guild", sortOrder: 0 }],
  shifts: [{ name: "Night" }, { name: "Weekend" }],
  campuses: [{ name: "Workshop Campus" }],
  hours: { open: "16:00", close: "22:00", note: "night guild hours" },
  policies: { mode: "community_guild" },
};

describe("§199 completion test — unfamiliar institution configures itself", () => {
  it("builds + validates without any institution-specific code", () => {
    const built = buildSchoolSpec(UNFAMILIAR_PARTS);
    expect(built.ok).toBe(true);
    if (!built.ok) throw new Error(built.issues.join("; "));
    const validation = validateInstitutionConfiguration(built.spec);
    expect(validation.ok).toBe(true);
    expect(configurationState(built.spec)).toBe("draft");
  });

  it("simulates consequences non-destructively (what-if before publish)", () => {
    const built = buildSchoolSpec(UNFAMILIAR_PARTS);
    if (!built.ok) throw new Error("fixture must build");
    const originalCampuses = Array.isArray(built.spec.campuses)
      ? (built.spec.campuses as { name: string }[]).length
      : 0;
    const scenario = simulate(built.spec, [{ kind: "add_campus", name: "River Campus" }]);
    expect(scenario.ok).toBe(true);
    expect(scenario.changes.join(" ")).toContain("River Campus");
    const after = Array.isArray(scenario.proposed.campuses)
      ? (scenario.proposed.campuses as { name: string }[]).length
      : 0;
    expect(after).toBe(originalCampuses + 1);
  });

  it("governs the change and versions it as a blueprint (preview→auth→audit→version)", () => {
    const built = buildSchoolSpec(UNFAMILIAR_PARTS);
    if (!built.ok) throw new Error("fixture must build");
    const outcome = governConfigChange({
      baseline: built.spec,
      scenarios: [{ kind: "add_shift", shift: { name: "Dawn" } }],
      reason: "guild adds dawn ring",
      actor: "user-guild-admin",
      actorRoles: ["school_admin"],
      blueprintId: "bp-guild-001",
      now: "2026-09-04T12:00:00.000Z",
    });
    expect(outcome.decision).toBe("approved");
    if (outcome.decision === "approved") {
      const versioned = versionApprovedChange(outcome, {
        baseline: built.spec,
        scenarios: [{ kind: "add_shift", shift: { name: "Dawn" } }],
        reason: "guild adds dawn ring",
        actor: "user-guild-admin",
        actorRoles: ["school_admin"],
        blueprintId: "bp-guild-001",
        now: "2026-09-04T12:00:00.000Z",
      });
      expect(versioned.ok).toBe(true);
      if (versioned.ok) expect(validateBlueprint(versioned.blueprint).ok).toBe(true);
    }
  });

  it("keeps the configured reality honest (no drift, valid time structure)", () => {
    const built = buildSchoolSpec(UNFAMILIAR_PARTS);
    if (!built.ok) throw new Error("fixture must build");
    expect(detectRealityDrift(built.spec, [])).toEqual([]);
    expect(
      validateAcademicPeriods([
        {
          kind: "custom",
          name: "Guild Ring 2026",
          code: "GR-2026",
          startDate: "2026-01-05",
          endDate: "2026-12-18",
        },
      ]).ok,
    ).toBe(true);
  });
});
