/**
 * CoreGrid — Phase 06/25 workspace-dynamic navigation tests.
 * The engine is domain-free; the Scholar R-001 catalog is capability data.
 */
import { describe, expect, it } from "vitest";
import {
  flattenQuickNav,
  hasNavDestinations,
  itemVisibleForCapabilities,
  resolveWorkspaceNav,
  type NavContribution,
  type NavItemSeed,
} from "@/lib/workspace-engine/navigation";
import {
  SCHOLAR_NAV_CONTRIBUTIONS,
  SCHOLAR_PORTAL_CAPABILITIES,
  scholarCapabilitiesForPortal,
} from "@/lib/workspace-engine/nav-catalog";

function seed(key: string, overrides: Partial<NavItemSeed> = {}): NavItemSeed {
  return { key, label: key, iconKey: "link", url: `/x/${key}`, orderHint: 0, ...overrides };
}

const FIXTURES: readonly NavContribution[] = [
  {
    runtimeRef: "runtime:alpha",
    sectionKey: "alpha",
    sectionLabel: "Alpha",
    items: [
      seed("a.home", { orderHint: 0 }),
      seed("a.pay", { capabilities: ["finance:pay"], orderHint: 1 }),
      seed("a.roster", { capabilities: ["people:read", "people:write"], orderHint: 2 }),
    ],
  },
  {
    runtimeRef: "runtime:beta",
    sectionKey: "beta",
    sectionLabel: "Beta",
    items: [
      seed("b.pay", { url: "/beta/pay", capabilities: ["finance:pay"], orderHint: 5 }),
      seed("b.dashboard", { orderHint: 0 }),
    ],
  },
];

describe("workspace navigation engine (capability-driven)", () => {
  it("shows capability-free items and capability-matched items; hides the rest", () => {
    const allowed = new Set(["finance:pay"]);
    const sections = resolveWorkspaceNav(FIXTURES, allowed);
    const keys = sections.flatMap((s) => s.items.map((i) => i.key));
    expect(keys).toEqual(["a.home", "a.pay", "b.dashboard", "b.pay"]);
  });

  it("requires ALL listed capabilities (AND), never just one", () => {
    expect(
      itemVisibleForCapabilities(seed("x", { capabilities: ["a", "b"] }), new Set(["a"])),
    ).toBe(false);
    expect(
      itemVisibleForCapabilities(seed("x", { capabilities: ["a", "b"] }), new Set(["a", "b"])),
    ).toBe(true);
  });

  it("dedupes item keys across contributions (first wins) and keeps runtime provenance", () => {
    const dupes: readonly NavContribution[] = [
      {
        runtimeRef: "runtime:one",
        sectionKey: "one",
        sectionLabel: "One",
        items: [seed("shared", { orderHint: 9 })],
      },
      {
        runtimeRef: "runtime:two",
        sectionKey: "two",
        sectionLabel: "Two",
        items: [seed("shared", { orderHint: 1 })],
      },
    ];
    const allowed = new Set<string>();
    const sections = resolveWorkspaceNav(dupes, allowed);
    expect(sections).toHaveLength(1);
    expect(sections[0].sectionKey).toBe("one");
    expect(sections[0].items.map((i) => i.key)).toEqual(["shared"]);
    expect(sections[0].items[0].runtimeRef).toBe("runtime:one");
  });

  it("drops sections with no visible items and orders items by orderHint", () => {
    const gated: readonly NavContribution[] = [
      {
        runtimeRef: "runtime:g",
        sectionKey: "gated",
        sectionLabel: "Gated",
        items: [
          seed("g.one", { capabilities: ["secret:read"], orderHint: 2 }),
          seed("g.two", { capabilities: ["secret:read"], orderHint: 1 }),
        ],
      },
      {
        runtimeRef: "runtime:o",
        sectionKey: "open",
        sectionLabel: "Open",
        items: [seed("o.first", { orderHint: 5 }), seed("o.second", { orderHint: 1 })],
      },
    ];
    const sections = resolveWorkspaceNav(gated, new Set(["people:read", "people:write"]));
    expect(sections.map((s) => s.sectionKey)).toEqual(["open"]);
    expect(sections[0].items.map((i) => i.key)).toEqual(["o.second", "o.first"]);
  });

  it("caps quick nav and reports emptiness", () => {
    const allowed = new Set(["finance:pay"]);
    const sections = resolveWorkspaceNav(FIXTURES, allowed);
    expect(flattenQuickNav(sections, 3).map((i) => i.key)).toEqual([
      "a.home",
      "a.pay",
      "b.dashboard",
    ]);
    expect(flattenQuickNav(sections).length).toBe(4);
    expect(hasNavDestinations(sections)).toBe(true);
    expect(hasNavDestinations([])).toBe(false);
  });
});

describe("Scholar R-001 nav catalog (runtime DATA seeds)", () => {
  it("produces the parent mobile quick-nav and never leaks student destinations", () => {
    const parent = resolveWorkspaceNav(
      SCHOLAR_NAV_CONTRIBUTIONS,
      scholarCapabilitiesForPortal("parent"),
    );
    const flat = flattenQuickNav(parent, 5).map((i) => i.url);
    expect(flat).toEqual([
      "/parent/dashboard",
      "/parent/children",
      "/parent/fees",
      "/parent/bus-tracking",
      "/parent/ai-assistant",
    ]);
    const allUrls = parent.flatMap((s) => s.items.map((i) => i.url));
    expect(allUrls.every((url) => !url.startsWith("/student"))).toBe(true);
    expect(allUrls).toContain("/parent/calendar");
    expect(allUrls).toContain("/messages");
  });

  it("produces the student quick-nav and hides parent-only destinations", () => {
    const student = resolveWorkspaceNav(
      SCHOLAR_NAV_CONTRIBUTIONS,
      scholarCapabilitiesForPortal("student"),
    );
    const flat = flattenQuickNav(student, 5).map((i) => i.url);
    expect(flat).toEqual([
      "/student/dashboard",
      "/student/timetable",
      "/student/grades",
      "/student/ai-tutor",
      "/student/fees",
    ]);
    const allUrls = student.flatMap((s) => s.items.map((i) => i.url));
    expect(allUrls.some((url) => url.startsWith("/parent"))).toBe(false);
  });

  it("keeps portal capability sets distinct and complete", () => {
    const parentCaps = SCHOLAR_PORTAL_CAPABILITIES.parent;
    const studentCaps = SCHOLAR_PORTAL_CAPABILITIES.student;
    expect(new Set(parentCaps).size).toBe(parentCaps.length);
    expect(new Set(studentCaps).size).toBe(studentCaps.length);
    expect(studentCaps.some((c) => parentCaps.includes(c))).toBe(false);
  });
});
