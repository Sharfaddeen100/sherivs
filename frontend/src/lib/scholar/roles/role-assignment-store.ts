/**
 * CoreGrid Scholar — role assignment & grant store (WAVE-R37).
 *
 * Typed contract over the `cg_role_assignment` / `cg_role_grant` substrate and
 * the merge that turns catalog roles + tenant grants into the ROLE SET the
 * runtime feature gate decides against.
 *
 * Boundary: this module owns no persistence and no authorization. It validates
 * shape, applies active grants (revoked grants are ignored) and audits the rows.
 * The server functions perform the reads/writes through the scoped RPCs.
 */

import { z } from "zod";
import { KERNEL_CAPABILITIES } from "@/lib/kernel/kernel-capability-registry";
import type { EducationRealityRole } from "./role-definition";

export const ROLE_ASSIGNMENT_STATUSES = ["proposed", "active", "suspended", "ended"] as const;
export type RoleAssignmentStatus = (typeof ROLE_ASSIGNMENT_STATUSES)[number];

export const roleAssignmentSchema = z.object({
  id: z.string().uuid(),
  identity_ref: z.string().min(1),
  role_id: z.string().regex(/^role:[a-z0-9]+(-[a-z0-9]+)*$/),
  status: z.enum(ROLE_ASSIGNMENT_STATUSES),
  started_on: z.string().min(1),
  ended_on: z.string().nullable(),
});

export type RoleAssignmentRow = z.infer<typeof roleAssignmentSchema>;

export const roleGrantSchema = z.object({
  id: z.string().uuid(),
  role_id: z.string().regex(/^role:[a-z0-9]+(-[a-z0-9]+)*$/),
  capability: z.string().regex(/^[a-z][a-z0-9-]{1,80}$/),
  granted_by: z.string().min(1),
  granted_on: z.string().min(1),
  revoked_on: z.string().nullable(),
});

export type RoleGrantRow = z.infer<typeof roleGrantSchema>;

const CAPABILITY_IDS: ReadonlySet<string> = new Set(KERNEL_CAPABILITIES.map((c) => c.id));
const ACTIVE_STATUSES: readonly RoleAssignmentStatus[] = ["proposed", "active", "suspended"];

/** Assignment is in force at `at` (status live + time window covers `at`). */
export function isAssignmentInForce(assignment: RoleAssignmentRow, at: string): boolean {
  if (!ACTIVE_STATUSES.includes(assignment.status)) return false;
  const time = Date.parse(at);
  if (Number.isNaN(time)) return false;
  if (Date.parse(assignment.started_on) > time) return false;
  if (assignment.ended_on && Date.parse(assignment.ended_on) <= time) return false;
  return true;
}

/** Role ids an identity holds in a tenant at a moment (unknown rows ignored). */
export function roleIdsForIdentity(
  assignments: readonly RoleAssignmentRow[],
  at: string = new Date().toISOString(),
): readonly string[] {
  const ids = new Set<string>();
  for (const assignment of assignments) {
    if (isAssignmentInForce(assignment, at)) ids.add(assignment.role_id);
  }
  return [...ids].sort();
}

/** Active grants per role id (revoked grants never count). */
export function activeGrantsByRole(
  grants: readonly RoleGrantRow[],
): ReadonlyMap<string, readonly string[]> {
  const byRole = new Map<string, string[]>();
  for (const grant of grants) {
    if (grant.revoked_on) continue;
    const list = byRole.get(grant.role_id) ?? [];
    if (!list.includes(grant.capability)) list.push(grant.capability);
    byRole.set(grant.role_id, list);
  }
  return new Map([...byRole.entries()].map(([role, capabilities]) => [role, capabilities.sort()]));
}

/**
 * Merge tenant grants into the catalog role set: the returned roles carry the
 * grants as permissions, which is exactly what the feature gate evaluates.
 * Grants for unknown capabilities are rejected, never silently kept.
 */
export function applyGrantsToRoles(
  roles: readonly EducationRealityRole[],
  grants: readonly RoleGrantRow[],
): { roles: EducationRealityRole[]; rejected: readonly string[] } {
  const byRole = activeGrantsByRole(grants);
  const rejected: string[] = [];

  const merged = roles.map((role) => {
    const capabilities = (byRole.get(role.id) ?? []).filter((capability) => {
      if (CAPABILITY_IDS.has(capability)) return true;
      rejected.push(`${role.id}: unknown capability "${capability}"`);
      return false;
    });
    if (capabilities.length === 0) return role;
    return { ...role, permissions: [...new Set([...role.permissions, ...capabilities])].sort() };
  });

  return { roles: merged, rejected };
}

/** Structural audit of the stored rows (shape, unknown refs, duplicates). */
export function auditRoleAssignmentRows(
  assignments: readonly RoleAssignmentRow[],
  grants: readonly RoleGrantRow[],
  knownRoleIds: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  const seenAssignments = new Set<string>();

  for (const assignment of assignments) {
    const parsed = roleAssignmentSchema.safeParse(assignment);
    if (!parsed.success) {
      issues.push(`assignment ${assignment.id}: invalid row`);
    }
    if (!knownRoleIds.has(assignment.role_id)) {
      issues.push(`assignment ${assignment.id}: unknown role "${assignment.role_id}"`);
    }
    const key = `${assignment.identity_ref}:${assignment.role_id}`;
    if (ACTIVE_STATUSES.includes(assignment.status)) {
      if (seenAssignments.has(key)) {
        issues.push(`assignment ${assignment.id}: duplicate live assignment for ${key}`);
      }
      seenAssignments.add(key);
    }
  }

  const seenGrants = new Set<string>();
  for (const grant of grants) {
    const parsed = roleGrantSchema.safeParse(grant);
    if (!parsed.success) issues.push(`grant ${grant.id}: invalid row`);
    if (!knownRoleIds.has(grant.role_id)) {
      issues.push(`grant ${grant.id}: unknown role "${grant.role_id}"`);
    }
    if (!CAPABILITY_IDS.has(grant.capability)) {
      issues.push(`grant ${grant.id}: unknown capability "${grant.capability}"`);
    }
    if (grant.revoked_on) continue;
    const key = `${grant.role_id}:${grant.capability}`;
    if (seenGrants.has(key)) issues.push(`grant ${grant.id}: duplicate active grant for ${key}`);
    seenGrants.add(key);
  }

  return issues;
}
