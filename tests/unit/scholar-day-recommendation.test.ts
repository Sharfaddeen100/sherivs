/**
 * CoreGrid Scholar — dynamic school-day recommendation tests.
 */
import { describe, expect, it } from "vitest";
import {
  DAY_PRESETS,
  recommendDayRoutines,
  recommendSiteRoutines,
} from "../../frontend/src/lib/scholar/day-recommendation";

describe("school-day recommendation", () => {
  it("produces a validated routine for every closing model (12:00→18:00)", () => {
    for (const window of Object.values(DAY_PRESETS)) {
      const { routines, issues } = recommendDayRoutines({
        name: "Full day",
        windows: [window],
      });
      expect(issues).toEqual([]);
      expect(routines.length).toBe(1);
      expect(routines[0].open).toBe(window.open);
      expect(routines[0].close).toBe(window.close);
    }
  });

  it("produces two validated routines for a double-shift school", () => {
    const { routines, issues } = recommendDayRoutines({
      name: "Shift",
      windows: [
        { open: "07:00", close: "12:30" },
        { open: "13:00", close: "18:00" },
      ],
    });
    expect(issues).toEqual([]);
    expect(routines.length).toBe(2);
    expect(routines.map((r) => r.name)).toEqual(["Shift morning", "Shift afternoon"]);
  });

  it("adds a validated boarding evening-study routine when declared", () => {
    const { routines, issues } = recommendDayRoutines({
      name: "Boarding day",
      windows: [{ open: "07:30", close: "17:00" }],
      boardingPrep: { open: "18:00", close: "20:30" },
    });
    expect(issues).toEqual([]);
    expect(routines.length).toBe(2);
    const prep = routines[1];
    expect(prep.blocks[0]?.kind).toBe("boarding");
    expect(prep.blocks[0]?.label).toBe("Evening study");
    expect(prep.close).toBe("20:30");
  });

  it("rejects invalid windows and requires at least one window", () => {
    expect(recommendDayRoutines({ name: "Broken", windows: [] }).issues.length).toBeGreaterThan(0);
    const inverted = recommendDayRoutines({
      name: "Broken",
      windows: [{ open: "14:00", close: "13:00" }],
    });
    expect(inverted.issues.length).toBeGreaterThan(0);
    expect(inverted.routines.length).toBe(0);
  });

  it("never invents blocks the school did not declare", () => {
    const { routines } = recommendDayRoutines({
      name: "Simple",
      windows: [DAY_PRESETS.fullDay_17],
    });
    expect(routines[0].blocks).toEqual([]);
  });
});

describe("multi-campus site recommendation", () => {
  it("resolves per-campus windows (different closing models + boarding)", () => {
    const { sites, issues } = recommendSiteRoutines([
      { campusRef: "main", name: "Main Campus", windows: [DAY_PRESETS.fullDay_17] },
      {
        campusRef: "annex",
        name: "Annex Campus",
        windows: [DAY_PRESETS.halfDay_12],
        boardingPrep: { open: "18:00", close: "20:00" },
      },
    ]);
    expect(issues).toEqual([]);
    expect(sites).toHaveLength(2);
    const main = sites.find((site) => site.campusRef === "main");
    const annex = sites.find((site) => site.campusRef === "annex");
    expect(main?.routines[0].close).toBe("17:00");
    expect(annex?.routines).toHaveLength(2);
    expect(annex?.routines[1].blocks[0]?.kind).toBe("boarding");
  });

  it("flags campuses without a reference and keeps valid campuses", () => {
    const { sites, issues } = recommendSiteRoutines([
      { campusRef: "", name: "Broken", windows: [DAY_PRESETS.fullDay_17] },
      { campusRef: "valid", name: "Valid", windows: [DAY_PRESETS.fullDay_17] },
    ]);
    expect(issues.join(" ")).toContain("campusRef");
    expect(sites).toHaveLength(1);
    expect(sites[0].campusRef).toBe("valid");
  });
});
