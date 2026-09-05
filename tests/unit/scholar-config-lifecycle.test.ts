/**
 * CoreGrid Scholar — A6/A7/A8 tests (§84–85, §161–162, §159–160).
 * Simulation, safe defaults and discovery are all configuration-pure.
 */
import { describe, expect, it } from "vitest";
import { simulate } from "@/lib/scholar/config-simulator";
import {
  canTransitionConfigState,
  configurationState,
  describeConfiguration,
  transparentDefaultParts,
} from "@/lib/scholar/safe-defaults";
import { discover } from "@/lib/scholar/config-discovery";
import { buildSchoolSpec } from "@/lib/scholar/school-builder";

const LEVELS = [
  { name: "Lower Primary", code: "lower", sortOrder: 0 },
  { name: "Upper Primary", code: "upper", sortOrder: 1 },
];
const PROGRAMMES = [{ name: "Foundation", code: "foundation", sortOrder: 0 }];

function okSpec(extra: Record<string, unknown> = {}) {
  const built = buildSchoolSpec({ levels: LEVELS, programmes: PROGRAMMES, ...extra });
  if (!built.ok) throw new Error("fixture spec must build");
  return built.spec;
}

describe("config-simulator (§84–85)", () => {
  it("applies scenarios non-destructively and reports changes", () => {
    const spec = okSpec();
    const result = simulate(spec, [
      { kind: "add_campus", name: "North Campus" },
      { kind: "add_shift", shift: { name: "Evening" } },
    ]);
    expect(result.ok).toBe(true);
    expect(result.changes.join(" ")).toContain("North Campus");
    expect((result.proposed.campuses as { name: string }[]).length).toBe(1);
    expect(result.proposed.shifts.length).toBe(1);
    // Original untouched.
    expect(Array.isArray(spec.campuses) ? (spec.campuses as { name: string }[]).length : 0).toBe(0);
  });

  it("surfaces consequences when a scenario breaks consistency", () => {
    const spec = okSpec();
    const dupShift = simulate(spec, [
      { kind: "add_shift", shift: { name: "Morning" } },
      { kind: "add_shift", shift: { name: "Morning" } },
    ]);
    expect(dupShift.ok).toBe(false);
    if (!dupShift.ok) expect(dupShift.issues.join(" ")).toContain("duplicate shift");
  });

  it("skips no-op removals and records notes", () => {
    const spec = okSpec();
    const result = simulate(spec, [
      { kind: "remove_campus", name: "Missing Campus" },
      { kind: "note", text: "review pending" },
    ]);
    expect(result.ok).toBe(true);
    expect(result.changes.join(" ")).toContain("not present");
    expect(result.changes.join(" ")).toContain("note: review pending");
  });
});

describe("safe-defaults (§161–162)", () => {
  it("injects NO structural assumptions into transparent defaults", () => {
    expect(transparentDefaultParts()).toEqual({
      levels: [],
      programmes: [],
      shifts: [],
      hours: {},
      languages: [],
      campuses: [],
    });
  });

  it("marks unconfigured institutions as 'unknown' (no invention)", () => {
    expect(configurationState(undefined)).toBe("unknown");
    const spec = okSpec();
    expect(configurationState(spec)).toBe("draft");
    const description = describeConfiguration(undefined);
    expect(description.state).toBe("unknown");
    expect(description.unknown).toContain("educational levels");
  });

  it("enforces the config state lifecycle", () => {
    expect(canTransitionConfigState("review", "approved")).toBe(true);
    expect(canTransitionConfigState("review", "active")).toBe(false);
    expect(canTransitionConfigState("active", "suspended")).toBe(true);
  });
});

describe("config-discovery (§159–160)", () => {
  it("asks for the minimal unknowns when structure is missing", () => {
    const report = discover(undefined);
    expect(report.required).toContain("educational levels");
    expect(report.openQuestions.length).toBeGreaterThan(0);
    expect(report.detected).not.toContain("attendance");
  });

  it("progressively detects capabilities from configuration", () => {
    const single = discover(okSpec());
    expect(single.detected).toContain("structure");
    expect(single.detected).not.toContain("attendance");

    const multi = discover(okSpec({ shifts: [{ name: "Morning" }, { name: "Evening" }] }));
    expect(multi.detected).toContain("attendance");

    const withTransport = discover(okSpec({ policies: { transport_enabled: true } }));
    expect(withTransport.detected).toContain("transport");
  });
});
