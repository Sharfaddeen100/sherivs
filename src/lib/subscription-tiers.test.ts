import { describe, expect, it } from "vitest";
import { hasTierFeature, isFeatureActive } from "./subscription-tiers";

describe("subscription tier feature access", () => {
  it("keeps all features unlocked regardless of the tier", () => {
    expect(hasTierFeature("trial", "bus_live_tracking")).toBe(true);
    expect(hasTierFeature("growth", "ai_timetable")).toBe(true);
    expect(hasTierFeature("starter", "digital_twin")).toBe(true);
  });

  it("treats feature activity as globally enabled when the school is unlocked", () => {
    expect(isFeatureActive("trial", {}, "bus_live_tracking")).toBe(true);
    expect(isFeatureActive("growth", { bus_live_tracking: false }, "bus_live_tracking")).toBe(true);
    expect(isFeatureActive("starter", { digital_twin: false }, "digital_twin")).toBe(true);
  });
});
