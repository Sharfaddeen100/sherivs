/**
 * CoreGrid — Phase 06 Workspace Engine: composition projection.
 *
 * The workspace is a projection of authority (Phase 01 §13; Phase 06 "the engine
 * composes, it never owns"). This module computes that projection with the REAL
 * engine: a role's capability set comes from the catalog, and the navigation the
 * user actually receives is resolved by `resolveWorkspaceNav`, which withholds any
 * item whose required capabilities are missing.
 *
 * It is pure and deterministic, so a workspace can be inspected without signing in
 * as every role — and an empty workspace is reported as empty rather than filled
 * with a default.
 */
import {
  flattenQuickNav,
  hasNavDestinations,
  resolveWorkspaceHome,
  resolveWorkspaceNav,
  type WorkspaceNavSection,
} from "@/lib/workspace-engine/navigation";
import {
  SCHOLAR_NAV_CONTRIBUTIONS,
  scholarCapabilitiesForRole,
  scholarWorkspaceLabelForRole,
} from "@/lib/workspace-engine/nav-catalog";
import type { AppRole } from "@/lib/roles";

export interface WorkspaceProjection {
  role: AppRole;
  label: string;
  /** Capabilities the role holds, as resolved from the catalog. */
  capabilityCount: number;
  /** Navigation the engine actually grants this role. */
  sections: WorkspaceNavSection[];
  sectionCount: number;
  itemCount: number;
  quickNavKeys: string[];
  home: string | null;
  /** True when authority resolves to nothing — never disguised with a default. */
  empty: boolean;
}

export function projectWorkspace(role: AppRole): WorkspaceProjection {
  const capabilities = scholarCapabilitiesForRole(role);
  const sections = resolveWorkspaceNav(SCHOLAR_NAV_CONTRIBUTIONS, capabilities);
  const items = sections.flatMap((section) => section.items);

  return {
    role,
    label: scholarWorkspaceLabelForRole(role),
    capabilityCount: capabilities.size,
    sections,
    sectionCount: sections.length,
    itemCount: items.length,
    quickNavKeys: flattenQuickNav(sections).map((item) => item.key),
    home: resolveWorkspaceHome(sections),
    empty: !hasNavDestinations(sections),
  };
}

/** Compose every requested role, deterministically and in the order given. */
export function projectWorkspaces(roles: readonly AppRole[]): readonly WorkspaceProjection[] {
  return roles.map(projectWorkspace);
}

/**
 * Every item the projection grants each role, keyed by role — the auditable form of
 * "who sees what", derived from authorization rather than from the UI.
 */
export function projectionMatrix(roles: readonly AppRole[]): Record<string, string[]> {
  const matrix: Record<string, string[]> = {};
  for (const projection of projectWorkspaces(roles)) {
    matrix[projection.role] = projection.sections.flatMap((section) =>
      section.items.map((item) => item.key),
    );
  }
  return matrix;
}
