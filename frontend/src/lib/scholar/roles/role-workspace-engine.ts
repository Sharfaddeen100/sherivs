/**
 * CoreGrid Scholar — Educational Reality Role Engine: workspace engine.
 *
 * Workspace generation is derived from ROLES, never from a role-name branch:
 * a person holding several roles receives the union of the workspaces those
 * roles participate in, each traced back to the roles that unlocked it.
 *
 * Example: Principal + Boarding Director + Finance Officer →
 * leadership + governance + academic + operations + boarding + student welfare
 * + finance workspaces (each with its source roles).
 */

import { EDUCATION_REALITY_ROLES } from "./role-registry";
import { roleWorkspaceLabel, type RoleWorkspaceKey } from "./role-workspaces";
import type { EducationRealityRole } from "./role-definition";

export interface WorkspaceAssignment {
  workspace: RoleWorkspaceKey;
  label: string;
  /** Roles that unlock the workspace (deterministic order). */
  sourceRoles: readonly string[];
}

export function workspacesForRoles(
  roleIds: readonly string[],
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): WorkspaceAssignment[] {
  const byWorkspace = new Map<RoleWorkspaceKey, Set<string>>();
  for (const roleId of roleIds) {
    const role = roles.find((candidate) => candidate.id === roleId);
    for (const workspace of role?.workspaceRequirements ?? []) {
      const sources = byWorkspace.get(workspace) ?? new Set<string>();
      sources.add(roleId);
      byWorkspace.set(workspace, sources);
    }
  }
  return [...byWorkspace.entries()]
    .map(([workspace, sources]) => ({
      workspace,
      label: roleWorkspaceLabel(workspace),
      sourceRoles: [...sources].sort(),
    }))
    .sort((left, right) => left.workspace.localeCompare(right.workspace));
}

export function workspaceKeysForRoles(
  roleIds: readonly string[],
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): readonly RoleWorkspaceKey[] {
  return workspacesForRoles(roleIds, roles).map((assignment) => assignment.workspace);
}

/**
 * Landing workspace for a role set: the workspace the MOST roles participate
 * in (ties broken alphabetically). Null when no role is assigned — a surface
 * shows an unassigned state rather than inventing a dashboard.
 */
export function primaryWorkspaceForRoles(
  roleIds: readonly string[],
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): RoleWorkspaceKey | null {
  const assignments = workspacesForRoles(roleIds, roles);
  if (assignments.length === 0) return null;
  return [...assignments].sort(
    (left, right) =>
      right.sourceRoles.length - left.sourceRoles.length ||
      left.workspace.localeCompare(right.workspace),
  )[0].workspace;
}

/** Workspaces a single role participates in (its own generation contract). */
export function workspacesForRole(roleId: string): readonly RoleWorkspaceKey[] {
  return workspacesForRoles([roleId]).map((assignment) => assignment.workspace);
}
