/**
 * Sherivs Scholar — Educational Reality Role Engine: inheritance engine.
 *
 * Roles form a hierarchy inside ONE institution's reality (e.g. Head Teacher →
 * Deputy Head Teacher → Subject Teacher). The hierarchy is installed as DATA by
 * the institution; this engine validates it and resolves effective permission
 * without ever escalating beyond what a role declares.
 *
 * Laws:
 *  - a hierarchy edge must reference known roles and never the same role twice;
 *  - cycles are rejected (a role cannot inherit itself through a loop);
 *  - effective permissions are the UNION of declared grants along the ancestor
 *    chain — inheritance can never create a permission no role declares;
 *  - a role with several parents is allowed (a person can sit in two chains) and
 *    both chains are reported.
 */

import type { EducationRealityRole } from "./role-definition";
import { EDUCATION_REALITY_ROLES, EDUCATION_REALITY_ROLE_IDS } from "./role-registry";

export interface RoleHierarchyEdge {
  parent: string;
  child: string;
}

export interface RoleHierarchy {
  readonly edges: readonly RoleHierarchyEdge[];
}

export function validateRoleHierarchy(
  hierarchy: RoleHierarchy,
  knownRoleIds: ReadonlySet<string> = EDUCATION_REALITY_ROLE_IDS,
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  const adjacency = new Map<string, Set<string>>();

  for (const edge of hierarchy.edges) {
    if (edge.parent === edge.child) issues.push(`edge ${edge.parent} → itself is not allowed`);
    for (const ref of [edge.parent, edge.child]) {
      if (!knownRoleIds.has(ref)) issues.push(`edge references unknown role "${ref}"`);
    }
    const key = `${edge.parent}→${edge.child}`;
    if (seen.has(key)) issues.push(`duplicate edge ${key}`);
    seen.add(key);
    const children = adjacency.get(edge.parent) ?? new Set<string>();
    children.add(edge.child);
    adjacency.set(edge.parent, children);
  }

  // Cycle detection (DFS with colouring).
  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  const colour = new Map<string, number>();
  const visit = (node: string, path: string[]): void => {
    colour.set(node, GREY);
    for (const child of adjacency.get(node) ?? []) {
      const state = colour.get(child) ?? WHITE;
      if (state === GREY) {
        issues.push(`cycle detected: ${[...path, node, child].join(" → ")}`);
        continue;
      }
      if (state === WHITE) visit(child, [...path, node]);
    }
    colour.set(node, BLACK);
  };
  for (const node of adjacency.keys()) {
    if ((colour.get(node) ?? WHITE) === WHITE) visit(node, []);
  }

  return issues;
}

export interface InheritanceResolution {
  roleId: string;
  /** Ancestors (parents first), nearest last. */
  ancestors: readonly string[];
  /** Direct + transitive children. */
  descendants: readonly string[];
}

export function resolveInheritance(
  roleId: string,
  hierarchy: RoleHierarchy,
): InheritanceResolution {
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  for (const edge of hierarchy.edges) {
    parents.set(edge.child, [...(parents.get(edge.child) ?? []), edge.parent]);
    children.set(edge.parent, [...(children.get(edge.parent) ?? []), edge.child]);
  }

  const ancestors: string[] = [];
  const walkUp = (node: string, guard: Set<string>) => {
    for (const parent of parents.get(node) ?? []) {
      if (guard.has(parent)) continue;
      guard.add(parent);
      ancestors.push(parent);
      walkUp(parent, guard);
    }
  };
  walkUp(roleId, new Set([roleId]));

  const descendants: string[] = [];
  const walkDown = (node: string, guard: Set<string>) => {
    for (const child of children.get(node) ?? []) {
      if (guard.has(child)) continue;
      guard.add(child);
      descendants.push(child);
      walkDown(child, guard);
    }
  };
  walkDown(roleId, new Set([roleId]));

  return { roleId, ancestors, descendants };
}

export function topLevelRoles(hierarchy: RoleHierarchy): string[] {
  const childIds = new Set(hierarchy.edges.map((edge) => edge.child));
  const parentIds = [...new Set(hierarchy.edges.map((edge) => edge.parent))];
  return parentIds.filter((id) => !childIds.has(id)).sort();
}

/**
 * Effective permission set for a set of roles plus their ancestors. Order is
 * deterministic and every grant traces back to a role that declares it.
 */
export function effectivePermissionSet(
  roleIds: readonly string[],
  hierarchy: RoleHierarchy,
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): Map<string, readonly string[]> {
  const byId = new Map(roles.map((role) => [role.id, role]));
  const grants = new Map<string, string[]>();

  for (const roleId of roleIds) {
    const chain = [roleId, ...resolveInheritance(roleId, hierarchy).ancestors];
    for (const id of chain) {
      const role = byId.get(id);
      if (!role) continue;
      for (const permission of role.permissions) {
        const sources = grants.get(permission) ?? [];
        if (!sources.includes(id)) sources.push(id);
        grants.set(permission, sources);
      }
    }
  }

  return new Map([...grants.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
