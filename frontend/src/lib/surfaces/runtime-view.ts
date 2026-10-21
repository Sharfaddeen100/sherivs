/**
 * Sherivs — generated runtime surface view-model (WAVE-R40).
 *
 * The internal surface a person receives: workspaces, dashboards and (when they
 * staff the platform organization) Sherivs departments — all composed by the
 * engines from the roles the SERVER resolved for this identity. The route never
 * supplies its own roles, and never decides what is visible.
 *
 * Fail-closed by construction: with no tenant scope, no assigned role or no
 * enabled feature code, the view is empty AND says why. An empty runtime is a
 * statement about authorization, not a rendering accident.
 */

import { featureGateSnapshot } from "@/lib/scholar/feature-gate";
import {
  composeDashboardGrids,
  type DashboardGrid,
  type DashboardWidget,
} from "@/lib/scholar/dashboards/grid-engine";
import { roleById } from "@/lib/scholar/roles/role-registry";
import {
  primaryWorkspaceForRoles,
  workspacesForRoles,
  type WorkspaceAssignment,
} from "@/lib/scholar/roles/role-workspace-engine";
import type { RoleWorkspaceKey } from "@/lib/scholar/roles/role-workspaces";
import {
  platformWorkspaceForRoles,
  type PlatformDepartmentAssignment,
} from "@/lib/scholar/platform-org/platform-workspace-engine";

export interface RuntimeWorkspaceView {
  workspace: RoleWorkspaceKey;
  label: string;
  sourceRoles: readonly string[];
  widgets: readonly DashboardWidget[];
}

export interface RuntimeViewInput {
  tenantId: string | null;
  /** Role ids resolved server-side for this identity (never client-supplied). */
  roleIds: readonly string[];
  /** Feature codes the server enabled for this identity. */
  enabledCodes: readonly string[];
  /** Grants the substrate rejected (unknown capability) — surfaced, not hidden. */
  rejectedGrants?: readonly string[];
  identityId?: string | null;
}

export interface RuntimeView {
  tenantId: string | null;
  roleIds: readonly string[];
  /** Role ids the catalog does not recognize (ignored by every engine). */
  unknownRoleIds: readonly string[];
  enabledCodes: readonly string[];
  workspaces: readonly RuntimeWorkspaceView[];
  landing: RoleWorkspaceKey | null;
  /** Every workspace assignment, per the role engine (including widget-less). */
  assignments: readonly WorkspaceAssignment[];
  platformDepartments: readonly PlatformDepartmentAssignment[];
  rejectedGrants: readonly string[];
  /** Why the runtime is empty or partial — stated on the surface, never hidden. */
  notices: readonly string[];
}

/** Workspaces a role set unlocks, with the widgets each one renders. */
function composeWorkspaces(
  roleIds: readonly string[],
  enabledCodes: readonly string[],
): readonly RuntimeWorkspaceView[] {
  const assignments = workspacesForRoles(roleIds);
  const grids: readonly DashboardGrid[] = composeDashboardGrids({ roleIds, enabledCodes });
  const widgetsByWorkspace = new Map<RoleWorkspaceKey, readonly DashboardWidget[]>(
    grids.map((grid) => [grid.workspace, grid.widgets]),
  );
  return assignments.map((assignment) => ({
    workspace: assignment.workspace,
    label: assignment.label,
    sourceRoles: assignment.sourceRoles,
    widgets: widgetsByWorkspace.get(assignment.workspace) ?? [],
  }));
}

export function buildRuntimeView(input: RuntimeViewInput): RuntimeView {
  const unknownRoleIds = input.roleIds.filter((roleId) => !roleById(roleId));
  const knownRoleIds = input.roleIds.filter((roleId) => Boolean(roleById(roleId)));
  const workspaces = composeWorkspaces(knownRoleIds, input.enabledCodes);
  const notices: string[] = [];

  if (!input.tenantId) {
    notices.push("No tenant scope resolved for this identity — nothing is granted (fail closed).");
  } else if (knownRoleIds.length === 0) {
    notices.push(
      "No reality role is assigned in this tenant — workspaces and dashboards stay empty until one is granted.",
    );
  }
  if (input.rejectedGrants?.length) {
    notices.push(
      `${input.rejectedGrants.length} tenant grant(s) named capabilities the kernel does not own and were ignored.`,
    );
  }
  if (knownRoleIds.length > 0 && input.enabledCodes.length === 0) {
    notices.push(
      "Roles are assigned but no feature code is enabled for them — widgets appear only when a feature is enabled AND a role participates.",
    );
  }
  if (unknownRoleIds.length > 0) {
    notices.push(
      `${unknownRoleIds.length} assigned role id(s) are not in the reality catalog and were ignored.`,
    );
  }

  return {
    tenantId: input.tenantId,
    roleIds: knownRoleIds,
    unknownRoleIds,
    enabledCodes: input.enabledCodes,
    workspaces,
    landing: primaryWorkspaceForRoles(knownRoleIds),
    assignments: workspacesForRoles(knownRoleIds),
    platformDepartments: platformWorkspaceForRoles(knownRoleIds),
    rejectedGrants: input.rejectedGrants ?? [],
    notices,
  };
}

/** Feature decisions for the actor, for surface provenance (why a widget exists). */
export function runtimeFeatureDecisions(input: RuntimeViewInput) {
  return featureGateSnapshot({
    actor: {
      identityId: input.identityId ?? "surface:runtime",
      tenantId: input.tenantId,
      roleIds: input.roleIds,
    },
  });
}
