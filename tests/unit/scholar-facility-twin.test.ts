/**
 * CoreGrid Scholar — facility twin binding tests (Phase 16 consumption).
 */
import { describe, expect, it } from "vitest";
import {
  auditFacilityTwinBinding,
  classifyFacilityTwinKind,
  facilityTwinAttribute,
  isFacilityObservationSource,
  isFacilityTwinKind,
  qualityForFacilityObservation,
  SCHOLAR_FACILITY_METRICS,
} from "../../frontend/src/lib/runtime/scholar-facility-twin";

describe("facility twin binding", () => {
  it("uses only kernel twin kinds and observation sources", () => {
    expect(auditFacilityTwinBinding()).toEqual([]);
  });

  it("maps every facility metric to a twin attribute and rejects unknown ones", () => {
    expect(SCHOLAR_FACILITY_METRICS.length).toBeGreaterThanOrEqual(5);
    for (const metric of SCHOLAR_FACILITY_METRICS) {
      expect(facilityTwinAttribute(metric)).toBeTruthy();
    }
    expect(facilityTwinAttribute("noise")).toBeNull();
    expect(isFacilityTwinKind("classroom")).toBe(true);
    expect(isFacilityTwinKind("course")).toBe(false);
  });

  it("classifies quality from the kernel vocabulary and fails closed", () => {
    expect(
      qualityForFacilityObservation({ source: "hardware", ageMs: 1000, stalenessMs: 60000 }),
    ).toBe("VALID");
    expect(
      qualityForFacilityObservation({ source: "hardware", ageMs: 120000, stalenessMs: 60000 }),
    ).toBe("STALE");
    expect(
      qualityForFacilityObservation({ source: "crystal_ball", ageMs: 0, stalenessMs: 60000 }),
    ).toBe("INVALID");
    expect(isFacilityObservationSource("government_dataset")).toBe(false);
    expect(isFacilityObservationSource("manual_inspection")).toBe(true);
  });
});

describe("facility name classification into kernel twin kinds", () => {
  it("maps real school facility names to the right twin kind", () => {
    expect(classifyFacilityTwinKind("Science Laboratory")).toBe("laboratory");
    expect(classifyFacilityTwinKind("Primary 4 Classroom")).toBe("classroom");
    expect(classifyFacilityTwinKind("Boys Hostel")).toBe("room");
    expect(classifyFacilityTwinKind("School Library")).toBe("room");
    expect(classifyFacilityTwinKind("Assembly Hall")).toBe("building");
    expect(classifyFacilityTwinKind("Football Field")).toBe("operational_environment");
    expect(classifyFacilityTwinKind("Solar Power Plant")).toBe("infrastructure");
    expect(classifyFacilityTwinKind("School Bus Park")).toBe("asset");
    expect(classifyFacilityTwinKind("Main Kitchen")).toBe("facility");
  });

  it("falls back to a supported kind for unknown facilities", () => {
    const kind = classifyFacilityTwinKind("Mystery Annex");
    expect(isFacilityTwinKind(kind)).toBe(true);
    expect(kind).toBe("facility");
  });
});
