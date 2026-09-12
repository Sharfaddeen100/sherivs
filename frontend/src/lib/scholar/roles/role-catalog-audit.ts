/**
 * CoreGrid Scholar — Educational Reality Role Engine: catalog audit.
 *
 * The audit is the machine-checkable definition of "the role catalog is well
 * formed": every category represented, every role structurally valid, every
 * staffed role linked to the P25 workforce catalog, no duplicate definitions.
 * It is exposed (not thrown) so a surface or a wave can report the result.
 */

import { SCHOLAR_WORKFORCE_KINDS } from "@/lib/runtime/scholar-workforce";
import { ROLE_CATEGORIES, auditRoleCategories, type RoleCategory } from "./role-categories";
import { ALL_ROLE_GROUPS } from "./role-catalog-groups";
import { validateRoleDefinition, type EducationRealityRole } from "./role-definition";
import {
  EDUCATION_REALITY_ROLES,
  MULTI_REALITY_ROLE_IDS,
  ROLE_PENDING_WORKFORCE_POSTS,
} from "./role-registry";

export interface RoleCatalogAudit {
  ok: boolean;
  issues: readonly string[];
  roleCount: number;
  groupCount: number;
  mergeCount: number;
  staffedRoleCount: number;
  /** Reality posts awaiting a P25 workforce kind (next workforce wave). */
  pendingWorkforcePostCount: number;
  categoriesCovered: readonly RoleCategory[];
  categoriesMissing: readonly RoleCategory[];
  linkedWorkforceKindCount: number;
  unlinkedWorkforceKindCount: number;
}

export function auditEducationRealityRoles(
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): RoleCatalogAudit {
  const issues: string[] = [...auditRoleCategories()];
  const known = new Set(roles.map((role) => role.id));
  const seen = new Set<string>();
  const linkedKinds = new Set<string>();
  const covered = new Set<RoleCategory>();

  for (const role of roles) {
    covered.add(role.category);
    if (seen.has(role.id)) issues.push(`${role.id}: duplicate role definition`);
    seen.add(role.id);
    issues.push(...validateRoleDefinition(role, { knownRoleIds: known }));
    if (role.staffing.kind === "scholar_workforce" && role.staffing.kindCode) {
      linkedKinds.add(role.staffing.kindCode);
    }
  }

  const missing = ROLE_CATEGORIES.filter((category) => !covered.has(category));
  for (const category of missing) issues.push(`category ${category}: no role in the catalog`);

  const allKinds = new Set(SCHOLAR_WORKFORCE_KINDS.map((kind) => kind.kindCode));
  const unlinkedKinds = [...allKinds].filter((code) => !linkedKinds.has(code));

  return {
    ok: issues.length === 0,
    issues,
    roleCount: roles.length,
    groupCount: ALL_ROLE_GROUPS.length,
    mergeCount: MULTI_REALITY_ROLE_IDS.length,
    staffedRoleCount: roles.filter((role) => role.staffing.kind === "scholar_workforce").length,
    pendingWorkforcePostCount: ROLE_PENDING_WORKFORCE_POSTS.length,
    categoriesCovered: [...covered].sort(),
    categoriesMissing: missing,
    linkedWorkforceKindCount: linkedKinds.size,
    unlinkedWorkforceKindCount: unlinkedKinds.length,
  };
}
