/**
 * Sherivs Scholar — Educational Reality Role Engine: context engine.
 *
 * Resolves WHO is working, IN WHICH TENANT, WITH WHICH ROLES, AT WHICH TIME into
 * the context a surface or workspace generator needs. It is deliberately
 * fail-closed: without an identity or a tenant there is no context, and
 * assignments belonging to another tenant are never used (tenant isolation).
 *
 * Authority boundary: the context is descriptive. Enforcement stays in Phase 08.
 */

import type { EducationRealityRole, RoleSecurityLevel, RoleTenantScope } from "./role-definition";
import { EDUCATION_REALITY_ROLES } from "./role-registry";
import { workspacesForRoles, type WorkspaceAssignment } from "./role-workspace-engine";
import type { RoleWorkspaceKey } from "./role-workspaces";
import {
  suggestRolesForInstitution,
  type InstitutionReality,
  type RoleSuggestionSet,
} from "./role-template-engine";

export interface RoleAssignment {
  roleId: string;
  /** Tenant the assignment lives in (never trusted from the client at runtime). */
  tenantId: string;
  activeFrom?: string;
  activeTo?: string;
}

export interface RoleContextInput {
  identityId: string | null;
  tenantId: string | null;
  assignments: readonly RoleAssignment[];
  /** ISO timestamp used for time-bounded assignments (defaults to now). */
  now?: string;
  /** When provided, the context also carries the reality's role suggestions. */
  reality?: InstitutionReality;
}

const SECURITY_RANK: Record<RoleSecurityLevel, number> = {
  public: 0,
  internal: 1,
  sensitive: 2,
  restricted: 3,
  sovereign: 4,
};

const TENANT_SCOPE_RANK: Record<RoleTenantScope, number> = {
  tenant: 1,
  jurisdiction: 2,
  cross_tenant_authorized: 3,
  platform: 4,
};

export interface ResolvedRoleContext {
  ok: true;
  identityId: string;
  tenantId: string;
  /** Active role ids in this tenant, deterministic order. */
  roleIds: readonly string[];
  /** Role ids that are assigned but not structurally registered (audit). */
  unknownRoleIds: readonly string[];
  workspaces: readonly WorkspaceAssignment[];
  primaryWorkspace: RoleWorkspaceKey | null;
  securityLevel: RoleSecurityLevel;
  tenantScope: RoleTenantScope;
  models: readonly string[];
  suggestions: RoleSuggestionSet | null;
}

export interface RoleContextFailure {
  ok: false;
  reasons: readonly string[];
}

export type RoleContext = ResolvedRoleContext | RoleContextFailure;

/** Time-bounded assignment check (inclusive start, exclusive end). */
export function isAssignmentActive(assignment: RoleAssignment, at: string): boolean {
  const time = Date.parse(at);
  if (Number.isNaN(time)) return false;
  if (assignment.activeFrom && Date.parse(assignment.activeFrom) > time) return false;
  if (assignment.activeTo && Date.parse(assignment.activeTo) <= time) return false;
  return true;
}

export function resolveRoleContext(
  input: RoleContextInput,
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): RoleContext {
  const reasons: string[] = [];
  if (!input.identityId) reasons.push("no identity — fail closed");
  if (!input.tenantId) reasons.push("no tenant context — fail closed");
  if (reasons.length > 0) return { ok: false, reasons };

  const at = input.now ?? new Date().toISOString();
  const identityId = input.identityId as string;
  const tenantId = input.tenantId as string;

  const scoped = input.assignments.filter(
    (assignment) => assignment.tenantId === tenantId && isAssignmentActive(assignment, at),
  );

  const roleIds: string[] = [];
  const unknownRoleIds: string[] = [];
  for (const assignment of scoped) {
    if (!roles.some((role) => role.id === assignment.roleId)) {
      unknownRoleIds.push(assignment.roleId);
      continue;
    }
    if (!roleIds.includes(assignment.roleId)) roleIds.push(assignment.roleId);
  }
  roleIds.sort();

  const assigned = roleIds
    .map((id) => roles.find((role) => role.id === id))
    .filter((role): role is EducationRealityRole => role !== undefined);

  const securityLevel = assigned.reduce<RoleSecurityLevel>(
    (highest, role) =>
      SECURITY_RANK[role.securityLevel] > SECURITY_RANK[highest] ? role.securityLevel : highest,
    "public",
  );
  const tenantScope = assigned.reduce<RoleTenantScope>(
    (widest, role) =>
      TENANT_SCOPE_RANK[role.tenantScope] > TENANT_SCOPE_RANK[widest] ? role.tenantScope : widest,
    "tenant",
  );

  const models = new Set<string>();
  for (const role of assigned) {
    if (role.authority.rbac) models.add("RBAC");
    if (role.authority.abac) models.add("ABAC");
    if (role.authority.pbac) models.add("PBAC");
    if (role.authority.rebac) models.add("REBAC");
    if (role.authority.rls) models.add("RLS");
  }

  const workspaces = workspacesForRoles(roleIds, roles);
  const primaryWorkspace = workspaces
    .slice()
    .sort(
      (left, right) =>
        right.sourceRoles.length - left.sourceRoles.length ||
        left.workspace.localeCompare(right.workspace),
    )[0]?.workspace;

  return {
    ok: true,
    identityId,
    tenantId,
    roleIds,
    unknownRoleIds,
    workspaces,
    primaryWorkspace: primaryWorkspace ?? null,
    securityLevel,
    tenantScope,
    models: [...models].sort(),
    suggestions: input.reality ? suggestRolesForInstitution(input.reality) : null,
  };
}
