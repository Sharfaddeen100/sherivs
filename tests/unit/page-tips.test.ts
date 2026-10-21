/**
 * Sherivs — per-page guidance registry tests.
 */
import { describe, expect, it } from "vitest";
import { findTipsForPath, PAGE_TIPS } from "../../frontend/src/lib/guidance/page-tips";

describe("page-tips registry", () => {
  it("contains valid, non-empty guidance entries", () => {
    expect(PAGE_TIPS.length).toBeGreaterThanOrEqual(8);
    for (const entry of PAGE_TIPS) {
      expect(entry.patterns.length).toBeGreaterThan(0);
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.tips.length).toBeGreaterThan(0);
      for (const tip of entry.tips) {
        expect(tip.trim().length).toBeGreaterThan(5);
        expect(tip.length).toBeLessThanOrEqual(260);
      }
    }
  });

  it("matches the longest registered prefix", () => {
    expect(findTipsForPath("/admin/staff-accounts")?.title).toBe("Staff & user accounts");
    expect(findTipsForPath("/admin/hr")?.title).toBe("HR & workforce");
    expect(findTipsForPath("/admin")?.title).toBe("Administration");
    expect(findTipsForPath("/admin/dashboard")?.title).toBe("Administration");
    expect(findTipsForPath("/bursar/dashboard")?.title).toBe("Fees & finance");
    expect(findTipsForPath("/parent/dashboard")?.title).toBe("Parent portal");
    expect(findTipsForPath("/student/dashboard")?.title).toBe("Student portal");
    expect(findTipsForPath("/settings")?.title).toBe("Settings");
  });

  it("is robust to query strings and returns null off-registry", () => {
    expect(findTipsForPath("/admin/staff-accounts?created=1")?.title).toBe("Staff & user accounts");
    expect(findTipsForPath("/totally/unknown")).toBeNull();
  });
});
