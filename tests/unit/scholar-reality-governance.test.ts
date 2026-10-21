/**
 * Sherivs Scholar — A9/A10 tests (§163–167, §166–168).
 * Reality drift detection + configuration governance, both configuration-pure.
 */
import { describe, expect, it } from "vitest";
import {
  DRIFT_THRESHOLD,
  detectRealityDrift,
  evaluateSchoolReality,
  type FacilityObservation,
} from "@/lib/scholar/reality-validator";
import {
  CONFIG_GOVERNANCE_ROLES,
  explainChange,
  governConfigChange,
  versionApprovedChange,
} from "@/lib/scholar/config-governance";
import { buildSchoolSpec } from "@/lib/scholar/school-builder";

const LEVELS = [
  { name: "Primary", code: "primary", sortOrder: 0 },
  { name: "Secondary", code: "secondary", sortOrder: 1 },
];
const PROGRAMMES = [{ name: "Basic", code: "basic", sortOrder: 0 }];

function okSpec(extra: Record<string, unknown> = {}) {
  const built = buildSchoolSpec({
    levels: LEVELS,
    programmes: PROGRAMMES,
    campuses: [{ name: "Main Campus" }],
    ...extra,
  });
  if (!built.ok) throw new Error("fixture spec must build");
  return built.spec;
}

function unavailable(campus: string, facility: string, count: number): FacilityObservation[] {
  return Array.from({ length: count }, () => ({
    campus,
    facility,
    available: false,
    source: "user_report",
  }));
}

describe("reality-validator (§163–165)", () => {
  it("detects drift when a configured facility is repeatedly reported unavailable", () => {
    const spec = okSpec();
    const drift = detectRealityDrift(
      spec,
      unavailable("Main Campus", "Science Lab", DRIFT_THRESHOLD),
    );
    expect(drift).toHaveLength(1);
    expect(drift[0].kind).toBe("facility_reported_unavailable");
    expect(drift[0].evidenceCount).toBe(DRIFT_THRESHOLD);

    const checks = evaluateSchoolReality(
      spec,
      unavailable("Main Campus", "Science Lab", DRIFT_THRESHOLD),
    );
    const facility = checks.find((c) => c.category === "facility");
    expect(facility?.consistent).toBe(false);
  });

  it("does not declare drift below the repeated-evidence threshold", () => {
    const spec = okSpec();
    expect(detectRealityDrift(spec, unavailable("Main Campus", "Science Lab", 2))).toHaveLength(0);
    const checks = evaluateSchoolReality(spec, unavailable("Main Campus", "Science Lab", 2));
    expect(checks.find((c) => c.category === "facility")?.consistent).toBe(true);
  });

  it("flags operational reality that is not configured at all (no assumption)", () => {
    const drift = detectRealityDrift(
      okSpec(),
      unavailable("North Campus", "Workshop", DRIFT_THRESHOLD),
    );
    expect(drift[0].kind).toBe("facility_not_configured");
  });

  it("reports honest unknowns for categories without operational data", () => {
    const spec = okSpec();
    const checks = evaluateSchoolReality(spec);
    expect(checks.find((c) => c.category === "structure")?.consistent).toBe(true);
    expect(checks.find((c) => c.category === "staffing")?.consistent).toBe(null);
    expect(checks.find((c) => c.category === "curriculum")?.consistent).toBe(null);
    expect(evaluateSchoolReality(undefined)[0].consistent).toBe(null);
  });
});

describe("config-governance (§166–168)", () => {
  const now = "2026-09-04T10:00:00.000Z";

  function intent(spec = okSpec(), roles: readonly string[] = CONFIG_GOVERNANCE_ROLES) {
    return {
      baseline: spec,
      scenarios: [{ kind: "add_shift", shift: { name: "Evening" } }] as const,
      reason: "add evening shift for working learners",
      actor: "user-ada",
      actorRoles: roles,
      blueprintId: "bp-scholar-001",
      now,
    };
  }

  it("approves a valid previewed change and audits it", () => {
    const outcome = governConfigChange(intent());
    expect(outcome.decision).toBe("approved");
    if (outcome.decision === "approved") {
      expect(outcome.preview.ok).toBe(true);
      expect(outcome.audit.decision).toBe("approved");
      expect(outcome.audit.previewOk).toBe(true);
      const versioned = versionApprovedChange(outcome, intent());
      expect(versioned.ok).toBe(true);
      if (versioned.ok) expect(versioned.blueprint.header.version).toBe(1);
    }
  });

  it("denies actors without P08 governance roles", () => {
    const outcome = governConfigChange(intent(okSpec(), ["teacher"]));
    expect(outcome.decision).toBe("denied");
    if (outcome.decision === "denied") {
      expect(outcome.reasons.join(" ")).toContain("not authorised");
      expect(outcome.audit.decision).toBe("denied");
    }
  });

  it("denies changes whose preview fails validation", () => {
    const spec = okSpec();
    const conflicting = {
      ...intent(spec),
      scenarios: [
        { kind: "add_shift", shift: { name: "Evening" } },
        { kind: "add_shift", shift: { name: "Evening" } },
      ] as const,
    };
    const outcome = governConfigChange(conflicting);
    expect(outcome.decision).toBe("denied");
    if (outcome.decision === "denied") {
      expect(outcome.reasons.join(" ")).toContain("preview failed");
    }
  });

  it("denies changes without a validated baseline (no invention)", () => {
    const outcome = governConfigChange({ ...intent(), baseline: undefined });
    expect(outcome.decision).toBe("denied");
    if (outcome.decision === "denied") {
      expect(outcome.reasons.join(" ")).toContain("no validated baseline");
    }
  });

  it("explains the decision (§167)", () => {
    const explanation = explainChange(intent(), governConfigChange(intent()));
    expect(explanation.sourceData.join(" ")).toContain("baseline configuration");
    expect(explanation.constraints.join(" ")).toContain("A5 validation");
    expect(explanation.uncertainty.length).toBeGreaterThan(0);
  });
});
