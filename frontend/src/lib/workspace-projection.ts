/**
 * Sherivs — Phase 06 Workspace Engine: composition projection (DOMAIN-NEUTRAL).
 *
 * The workspace is a projection of authority (Phase 01 §13). This module computes
 * that projection from *inputs* — a key, a label, the viewer's capability set and
 * the navigation contributions that exist — and knows nothing about any runtime.
 *
 * RUNTIME NEUTRALITY: no runtime, vertical or domain may be referenced here. The
 * A runtime (runtime-001 first, then every future runtime) supplies its own
 * contributions and capability sets through an adapter in the runtime layer
 * (`frontend/src/lib/runtime/scholar-workspace-projection.ts`). That is what keeps
 * a new vertical from having to touch, or destabilise, the engine.
 */
import {
  flattenQuickNav,
  hasNavDestinations,
  resolveWorkspaceHome,
  resolveWorkspaceNav,
  type NavContribution,
  type WorkspaceNavSection,
} from "@/lib/workspace-engine/navigation";

/** One composition request: what exists, and what the viewer may reach. */
export interface WorkspaceCompositionInput {
  /** Stable identifier of the composition (runtime-qualified, e.g. `r001:teacher`). */
  key: string;
  /** Human label supplied by the owning runtime. */
  label: string;
  /** Capabilities the viewer holds — the only authority the engine consults. */
  capabilities: ReadonlySet<string>;
  /** Navigation contributions published by the runtime(s) installed here. */
  contributions: readonly NavContribution[];
}

export interface WorkspaceComposition {
  key: string;
  label: string;
  capabilityCount: number;
  /** Navigation the engine actually grants this viewer. */
  sections: readonly WorkspaceNavSection[];
  sectionCount: number;
  itemCount: number;
  quickNavKeys: string[];
  home: string | null;
  /** True when authority resolves to nothing — never disguised with a default. */
  empty: boolean;
}

export function composeWorkspace(input: WorkspaceCompositionInput): WorkspaceComposition {
  const sections = resolveWorkspaceNav(input.contributions, input.capabilities);
  const items = sections.flatMap((section) => section.items);

  return {
    key: input.key,
    label: input.label,
    capabilityCount: input.capabilities.size,
    sections,
    sectionCount: sections.length,
    itemCount: items.length,
    quickNavKeys: flattenQuickNav(sections).map((item) => item.key),
    home: resolveWorkspaceHome(sections),
    empty: !hasNavDestinations(sections),
  };
}

/** Compose every request, deterministically and in the order given. */
export function composeWorkspaces(
  inputs: readonly WorkspaceCompositionInput[],
): readonly WorkspaceComposition[] {
  return inputs.map(composeWorkspace);
}

/**
 * The auditable "who sees what" matrix, derived from authorization rather than
 * from the UI: composition key → the navigation item keys it receives.
 */
export function compositionMatrix(
  inputs: readonly WorkspaceCompositionInput[],
): Record<string, string[]> {
  const matrix: Record<string, string[]> = {};
  for (const composition of composeWorkspaces(inputs)) {
    matrix[composition.key] = composition.sections.flatMap((section) =>
      section.items.map((item) => item.key),
    );
  }
  return matrix;
}
