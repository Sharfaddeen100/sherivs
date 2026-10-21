/**
 * Sherivs Scholar — Educational Reality Role Engine: permission engine.
 *
 * `Role → Policy → Permission → Resource → Action` resolution. Fail-closed:
 * anything unknown, unassigned or contradicted resolves to DENY.
 *
 * Authority boundary: this engine EVALUATES and explains; it is not the
 * platform's enforcement authority. Live enforcement stays in Phase 08/09
 * (`security-role-gate.ts`, RLS). It exists so a surface, a workspace generator
 * or an operator can ask "what would this role set be allowed to do, and why"
 * without re-implementing authorization.
 */

import { KERNEL_CAPABILITIES } from "@/lib/kernel/kernel-capability-registry";
import { EDUCATION_REALITY_ROLES } from "./role-registry";
import type { EducationRealityRole } from "./role-definition";

export const POLICY_OUTCOMES = ["ALLOW", "DENY", "REDACT", "ESCALATE", "REQUIRE_APPROVAL"] as const;
export type PolicyOutcome = (typeof POLICY_OUTCOMES)[number];

/** Most restrictive wins when several policies apply. */
const RESTRICTIVENESS: Record<PolicyOutcome, number> = {
  DENY: 5,
  REQUIRE_APPROVAL: 4,
  ESCALATE: 3,
  REDACT: 2,
  ALLOW: 1,
};

export interface PermissionPolicy {
  id: string;
  /** Kernel capability the policy governs (`*` for all). */
  capability: string;
  outcome: PolicyOutcome;
  /** Optional role scoping; omit for tenant-wide policy. */
  appliesToRoleIds?: readonly string[];
  reason?: string;
}

export interface PermissionRequest {
  roleIds: readonly string[];
  capability: string;
  action?: string;
}

export interface PermissionDecision {
  outcome: PolicyOutcome;
  reasons: readonly string[];
  /** Roles whose declaration grants the capability. */
  grantedBy: readonly string[];
  appliedPolicies: readonly string[];
  /** Authorization models that participated (informative, for audit). */
  models: readonly string[];
}

const CAPABILITY_IDS: ReadonlySet<string> = new Set(KERNEL_CAPABILITIES.map((c) => c.id));

function declaredGrants(role: EducationRealityRole, capability: string, action?: string): boolean {
  for (const permission of role.permissions) {
    const [grantCapability, grantAction] = permission.split(":");
    if (grantCapability !== capability) continue;
    // A wildcard grant covers every action.
    if (!grantAction || grantAction === "*") return true;
    // A specific request must match; a request WITHOUT an action asks whether the
    // role holds the capability at all, so any declared action satisfies it.
    if (!action) return true;
    if (grantAction === action) return true;
  }
  return false;
}

function authorityModels(roles: readonly EducationRealityRole[]): string[] {
  const models = new Set<string>();
  for (const role of roles) {
    if (role.authority.rbac) models.add("RBAC");
    if (role.authority.abac) models.add("ABAC");
    if (role.authority.pbac) models.add("PBAC");
    if (role.authority.rebac) models.add("REBAC");
    if (role.authority.rls) models.add("RLS");
  }
  return [...models].sort();
}

/**
 * Evaluate a permission request against role grants and policies.
 * Order: grant check (RBAC) → policy overlay (PBAC) → most restrictive wins.
 */
export function evaluatePermission(
  request: PermissionRequest,
  policies: readonly PermissionPolicy[] = [],
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): PermissionDecision {
  if (!CAPABILITY_IDS.has(request.capability)) {
    return {
      outcome: "DENY",
      reasons: [`capability "${request.capability}" is not registered in the kernel`],
      grantedBy: [],
      appliedPolicies: [],
      models: [],
    };
  }
  if (request.roleIds.length === 0) {
    return {
      outcome: "DENY",
      reasons: ["no role assigned — fail closed"],
      grantedBy: [],
      appliedPolicies: [],
      models: [],
    };
  }

  const assigned = request.roleIds
    .map((id) => roles.find((role) => role.id === id))
    .filter((role): role is EducationRealityRole => role !== undefined);

  const grantedBy = assigned
    .filter((role) => declaredGrants(role, request.capability, request.action))
    .map((role) => role.id);

  const reasons: string[] = [];
  let outcome: PolicyOutcome = grantedBy.length > 0 ? "ALLOW" : "DENY";
  reasons.push(
    grantedBy.length > 0
      ? `granted by ${grantedBy.join(", ")}`
      : "no assigned role declares this capability",
  );

  const applicable = policies.filter(
    (policy) =>
      (policy.capability === "*" || policy.capability === request.capability) &&
      (!policy.appliesToRoleIds ||
        policy.appliesToRoleIds.some((id) => request.roleIds.includes(id))),
  );

  for (const policy of applicable) {
    if (RESTRICTIVENESS[policy.outcome] > RESTRICTIVENESS[outcome]) {
      outcome = policy.outcome;
      reasons.push(
        `policy ${policy.id} → ${policy.outcome}${policy.reason ? `: ${policy.reason}` : ""}`,
      );
    }
  }

  return {
    outcome,
    reasons,
    grantedBy,
    appliedPolicies: applicable.map((policy) => policy.id),
    models: authorityModels(assigned),
  };
}

/** The permission set a role set holds (union of declared grants, sorted). */
export function permissionSetForRoles(
  roleIds: readonly string[],
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): readonly string[] {
  const grants = new Set<string>();
  for (const id of roleIds) {
    const role = roles.find((candidate) => candidate.id === id);
    for (const permission of role?.permissions ?? []) grants.add(permission);
  }
  return [...grants].sort();
}
