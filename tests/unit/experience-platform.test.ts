/**
 * Sherivs — Phase 24 wave-1 tests: experience-platform contracts —
 * semantic tokens/theming, capability-derived IA, accessibility defaults,
 * policy-governed personalization.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  allowPersonalizationDimensions,
  contrastRatio,
  createAccessibilityDefaults,
  createDefaultTokenSet,
  minimumContrast,
  nodeRequiresAllCapabilities,
  passesContrast,
  personalizeExperience,
  resolveThemeMode,
  resolveWorkspaceNavigation,
  semanticToken,
  spacingScale,
  withHighContrast,
  type NavigationNode,
} from "@/lib/experience/experience-platform";

describe("semantic tokens + theming (§G/H/I/J/BW/BY)", () => {
  it("resolves system preference and builds light/dark token sets", () => {
    expect(resolveThemeMode("light", true)).toBe("light");
    expect(resolveThemeMode("system", true)).toBe("dark");
    const dark = createDefaultTokenSet({ mode: "dark", density: "compact" });
    expect(dark.mode).toBe("dark");
    expect(dark.density).toBe("compact");
    expect(dark.fontSizeBase).toBe(16);
    expect(semanticToken(dark, "text")).toBe(DEFAULT_DARK.text);
  });

  it("applies high-contrast overrides in both palettes", () => {
    const darkHigh = withHighContrast(DEFAULT_DARK);
    const lightHigh = withHighContrast(DEFAULT_LIGHT);
    expect(darkHigh.border).not.toBe(DEFAULT_DARK.border);
    expect(lightHigh.textSubtle).not.toBe(DEFAULT_LIGHT.textSubtle);
    const tokens = createDefaultTokenSet({ mode: "dark", contrast: "high_contrast" });
    expect(tokens.contrast).toBe("high_contrast");
  });

  it("density scales spacing — compact is tighter than comfortable", () => {
    const comfortable = createDefaultTokenSet({ mode: "light", density: "comfortable" });
    const compact = createDefaultTokenSet({ mode: "light", density: "compact" });
    expect(spacingScale(compact, 4).value).toBeLessThan(spacingScale(comfortable, 4).value);
  });
});

describe("information architecture (§N/R/X)", () => {
  const nodes: NavigationNode[] = [
    { id: "home", labelKey: "nav.home", category: "workspace", capabilityRefs: [], orderHint: 0 },
    {
      id: "people",
      labelKey: "nav.people",
      category: "data",
      capabilityRefs: ["member:read"],
      orderHint: 10,
    },
    {
      id: "policy",
      labelKey: "nav.policy",
      category: "admin",
      capabilityRefs: ["policy:administer"],
      orderHint: 20,
    },
  ];

  it("shows nodes whose capability refs are fully allowed", () => {
    const allowed = new Set(["member:read"]);
    const visible = resolveWorkspaceNavigation(nodes, allowed);
    expect(visible.map((n) => n.id)).toEqual(["home", "people"]);
    expect(nodeRequiresAllCapabilities(nodes[2], allowed)).toBe(false);
  });

  it("does not rely on UI-only hiding for authorization", () => {
    const denied = new Set<string>();
    const visible = resolveWorkspaceNavigation(nodes, denied);
    // Cosmetic filter shows capability-free nodes; backend still gates them.
    expect(visible.map((n) => n.id)).toEqual(["home"]);
  });
});

describe("accessibility defaults (§BL/BM/CA/CC)", () => {
  it("defaults to AA, visible focus, 44px touch targets", () => {
    const defaults = createAccessibilityDefaults();
    expect(defaults.level).toBe("AA");
    expect(defaults.focusVisible).toBe(true);
    expect(defaults.minTouchTarget).toBe(44);
    expect(createAccessibilityDefaults({ reducedMotion: true }).reducedMotion).toBe(true);
  });

  it("computes WCAG contrast and thresholds", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeGreaterThan(20);
    expect(minimumContrast("AA", false)).toBe(4.5);
    expect(minimumContrast("AA", true)).toBe(3);
    expect(minimumContrast("AAA", false)).toBe(7);
    expect(passesContrast("AA", false, "#000000", "#ffffff")).toBe(true);
    expect(passesContrast("AAA", false, "#888888", "#ffffff")).toBe(false);
    expect(passesContrast("AA", true, "#888888", "#ffffff")).toBe(true);
  });
});

describe("personalization (§P/R) is policy governed", () => {
  it("applies only policy-allowed dimensions and reports denials", () => {
    const policy = allowPersonalizationDimensions("density", "language");
    const outcome = personalizeExperience(["density", "motion", "colorMode"], policy);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.applied).toEqual(["density"]);
      expect(outcome.denied).toEqual(["motion", "colorMode"]);
    }
  });

  it("fully applies when every requested dimension is allowed", () => {
    const policy = allowPersonalizationDimensions(
      "density",
      "motion",
      "colorMode",
      "typography",
      "language",
      "layout",
      "shortcuts",
    );
    const outcome = personalizeExperience(["density", "layout", "language"], policy);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.applied).toEqual(["density", "layout", "language"]);
  });
});
