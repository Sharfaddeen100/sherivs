/**
 * CoreGrid — school template engine + R-001 template catalog tests.
 *
 * Proves CoreGrid ADAPTS: templates are data bundles recommended from what an
 * organization selects; nothing is ever forced or removed.
 */
import { describe, expect, it } from "vitest";
import {
  auditTemplates,
  matchTemplate,
  recommendTemplates,
} from "../../frontend/src/lib/onboarding/template-engine";
import {
  SCHOLAR_SCHOOL_TEMPLATES,
  SCHOLAR_TEMPLATE_FEATURE_SET,
  SCHOLAR_TEMPLATE_FEATURES,
} from "../../frontend/src/lib/runtime/scholar-school-templates";

const key = (feature: string): ReadonlySet<string> => new Set([feature]);

describe("template engine (domain-neutral)", () => {
  it("recommends nothing for an empty selection", () => {
    expect(recommendTemplates(SCHOLAR_SCHOOL_TEMPLATES, new Set())).toEqual([]);
  });

  it("matches selected features and ranks best-first", () => {
    const selected = new Set(["schedule.boarding", "curriculum.religious"]);
    const recommendations = recommendTemplates(SCHOLAR_SCHOOL_TEMPLATES, selected);
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].matchedKeys).toBeGreaterThanOrEqual(
      recommendations[recommendations.length - 1].matchedKeys,
    );
    // Every returned template covers at least one selected feature.
    for (const recommendation of recommendations) {
      expect(recommendation.matchedKeys).toBeGreaterThan(0);
    }
  });

  it("never removes the school's own choices", () => {
    const recommendation = matchTemplate(
      { id: "minimal", title: "Minimal", description: "", featureKeys: ["curriculum.core"] },
      new Set(["schedule.boarding"]),
    );
    expect(recommendation.uncoveredKeys).toEqual(["schedule.boarding"]);
  });
});

describe("Scholar template catalog", () => {
  it("is structurally valid against the feature catalog", () => {
    expect(auditTemplates(SCHOLAR_SCHOOL_TEMPLATES, SCHOLAR_TEMPLATE_FEATURE_SET)).toEqual([]);
    expect(SCHOLAR_TEMPLATE_FEATURES.length).toBeGreaterThanOrEqual(10);
    expect(SCHOLAR_SCHOOL_TEMPLATES.length).toBeGreaterThanOrEqual(8);
  });

  it("suggests the right schools for religious, TVET, boarding and multi-campus choices", () => {
    expect(
      recommendTemplates(SCHOLAR_SCHOOL_TEMPLATES, key("curriculum.religious"))
        .map((r) => r.template.id)
        .slice(0, 2),
    ).toEqual(expect.arrayContaining(["religious_christian", "islamic_madrassa"]));
    expect(
      recommendTemplates(SCHOLAR_SCHOOL_TEMPLATES, key("curriculum.vocational"))[0].template.id,
    ).toBe("vocational_tvet");
    expect(
      recommendTemplates(SCHOLAR_SCHOOL_TEMPLATES, key("schedule.boarding"))[0].template.id,
    ).toBe("boarding_school");
    expect(
      recommendTemplates(SCHOLAR_SCHOOL_TEMPLATES, key("site.multi_campus"))[0].template.id,
    ).toBe("multi_campus_group");
  });

  it("keeps the school's own mix when no template covers it fully", () => {
    const selected = new Set([
      "curriculum.entrepreneurship",
      "schedule.double_shift",
      "community.public_govt",
    ]);
    const recommendations = recommendTemplates(SCHOLAR_SCHOOL_TEMPLATES, selected);
    expect(recommendations.length).toBeGreaterThan(0);
    // No suggestion silently drops the school's public+double-shift choice.
    for (const recommendation of recommendations) {
      expect(recommendation.template.featureKeys).not.toContain("community.private");
    }
  });
});
