/**
 * CoreGrid — Phase 06 Workspace Engine: navigation chrome.
 *
 * Workspace-DYNAMIC UI foundation. Every navigation surface (sidebar,
 * bottom nav, home hubs) is resolved from CONTRIBUTIONS through the
 * workspace's active runtime set and the viewer's AUTHORIZED capability
 * set. This module is domain-free: no role enum, no fixed portal, no
 * scholar/business/government labels. Domain runtimes publish navigation
 * seeds as DATA (see the runtime contribution catalog) — adding a runtime never requires a
 * change to this engine or to the shell components.
 *
 * Laws honoured here:
 * - UI lists are capability-gated; an empty capability list on an item is a
 *   cosmetic default that backend authorization must still enforce (AGENTS §34).
 * - Every item carries its runtime provenance (runtimeRef) so composition is
 *   auditable and tenant-scoped at the caller.
 * - Resolution never mutates contribution data.
 */

export interface NavItemSeed {
  key: string;
  label: string;
  /** Icon registry key — the UI maps this to an icon; data never imports components. */
  iconKey: string;
  url: string;
  /** Additional URLs/prefixes that count as "active" for highlighting. */
  activeUrls?: readonly string[];
  activePrefixes?: readonly string[];
  /** Authorized capabilities the item requires (AND). Empty = always visible. */
  capabilities?: readonly string[];
  orderHint: number;
}

export interface NavContribution {
  /** Runtime that publishes this section (e.g. "runtime:scholar", "platform"). */
  runtimeRef: string;
  sectionKey: string;
  sectionLabel?: string;
  /** Group icon registry key (for collapsible sections). */
  iconKey?: string;
  /** Render as a collapsible group rather than a flat group. */
  collapsible?: boolean;
  items: readonly NavItemSeed[];
}

export interface WorkspaceNavItem extends NavItemSeed {
  runtimeRef: string;
}

export interface WorkspaceNavSection {
  sectionKey: string;
  sectionLabel: string;
  runtimeRef: string;
  iconKey: string;
  collapsible: boolean;
  items: WorkspaceNavItem[];
}

export type NavResolution = readonly WorkspaceNavSection[];

/** Cosmetic gate: item visible only when EVERY required capability is allowed. */
export function itemVisibleForCapabilities(
  item: Pick<NavItemSeed, "capabilities">,
  allowedCapabilities: ReadonlySet<string>,
): boolean {
  return (item.capabilities ?? []).every((capability) => allowedCapabilities.has(capability));
}

/**
 * Resolve chrome: contributions → visible sections for the viewer's allowed
 * capabilities. Duplicate item keys are dropped (first contribution wins);
 * items within a section keep contribution order, then orderHint.
 */
export function resolveWorkspaceNav(
  contributions: readonly NavContribution[],
  allowedCapabilities: ReadonlySet<string>,
): NavResolution {
  const seen = new Set<string>();
  const sections: WorkspaceNavSection[] = [];

  for (const contribution of contributions) {
    const visibleItems: WorkspaceNavItem[] = [];
    for (const seed of contribution.items) {
      if (!itemVisibleForCapabilities(seed, allowedCapabilities)) continue;
      if (seen.has(seed.key)) continue;
      seen.add(seed.key);
      visibleItems.push({
        ...seed,
        capabilities: [...(seed.capabilities ?? [])],
        runtimeRef: contribution.runtimeRef,
      });
    }
    if (visibleItems.length === 0) continue;
    sections.push({
      sectionKey: contribution.sectionKey,
      sectionLabel: contribution.sectionLabel ?? contribution.runtimeRef,
      runtimeRef: contribution.runtimeRef,
      iconKey: contribution.iconKey ?? "group",
      collapsible: contribution.collapsible ?? false,
      items: visibleItems.sort((a, b) => a.orderHint - b.orderHint),
    });
  }

  return sections;
}

/** Flatten visible items (already ordered) and cap for quick/mobile nav. */
export function flattenQuickNav(sections: NavResolution, max = 5): readonly WorkspaceNavItem[] {
  const flat = sections.flatMap((section) => section.items);
  return flat.slice(0, Math.max(0, max));
}

/** First destination (orderHint 0) of the resolved chrome = the workspace home. */
export function resolveWorkspaceHome(sections: NavResolution): string | null {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.orderHint === 0) return item.url;
    }
  }
  return null;
}

/** Does this resolution contain any visible destination? */
export function hasNavDestinations(sections: NavResolution): boolean {
  return sections.some((section) => section.items.length > 0);
}
