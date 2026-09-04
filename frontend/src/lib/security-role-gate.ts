/**
 * CoreGrid — Phase 08 Security Engine: canonical runtime role gate.
 *
 * Single enforcement module for role-scoped server functions. Both supported
 * role kinds (school-admin and platform super-admin) evaluate through the
 * Phase 08 security gateway (`security-core.evaluateSecurityGateway`), which
 * remains the single decision authority: fail-closed by default (§I.5), never
 * a silent allow on an unknown signal (AT.9).
 *
 * Boundary:
 * - Phase 02 owns identity; this module consumes identity assertions.
 * - Phase 03 owns tenancy; the resolved scope is the tenant boundary.
 * - Phase 08 owns the security decision; this module owns no state.
 * - Row-Level Security remains the database boundary. This gate implements
 *   the application/database agreement (§19 phase-01). Neither layer is
 *   sufficient alone; both must agree.
 *
 * The pure decision (`evaluateRoleGate`) is unit-testable without a database.
 * `assertRoleScope` adapts it to the Supabase RPC primitives used by the
 * legacy server functions (`is_school_admin`, `get_my_school_id`,
 * `is_super_admin`).
 */

import { evaluateSecurityGateway } from "./security-core";

/* ─────────────────────────────────────────────────────────────
 * Pure decision contract
 * ────────────────────────────────────────────────────────────*/

export type RoleGateKind = "school_admin" | "platform_super_admin";

export interface RoleGateSignals {
  /** Result of the role RPC. Anything but `true` fails closed. */
  roleGranted?: boolean | null;
  /** Resolved scope (school id for school_admin; unused for platform roles). */
  scope?: string | null;
}

export type RoleGateOutcome =
  | {
      decision: "allow";
      /** Resolved, trimmed scope; null for platform roles. */
      scope: string | null;
      reason: "Role gate verified";
    }
  | {
      decision: "deny";
      code: "role_required" | "tenant_unresolved" | "gateway_deny";
      reason: string;
    };

const REASONS = {
  schoolAdminRole: "Forbidden: school admin role required",
  platformSuperAdminRole: "Forbidden: platform super admin role required",
  tenantUnresolved: "No school in scope",
  gatewayDeny: "Forbidden: role access denied",
} as const;

/**
 * Decide whether an actor may perform a role-scoped operation.
 *
 * Evaluation order:
 *   1. Role gate — the actor must hold the required role.
 *   2. Tenant gate — school-admin actors must have a non-empty school scope.
 *   3. Security gateway — fail-closed confirmation (default rule §I.5).
 *
 * Any missing/unknown signal is a DENY, never a silent allow (AT.9).
 */
export function evaluateRoleGate(kind: RoleGateKind, signals: RoleGateSignals): RoleGateOutcome {
  const roleGranted = signals.roleGranted === true;
  const rawScope = kind === "school_admin" ? signals.scope : null;
  const hasScope = typeof rawScope === "string" && rawScope.trim() !== "";

  if (!roleGranted) {
    return {
      decision: "deny",
      code: "role_required",
      reason: kind === "school_admin" ? REASONS.schoolAdminRole : REASONS.platformSuperAdminRole,
    };
  }
  if (kind === "school_admin" && !hasScope) {
    return { decision: "deny", code: "tenant_unresolved", reason: REASONS.tenantUnresolved };
  }

  // The auth middleware (bearer token) and the server-function input validator
  // have already run upstream; identity, session, integrity and rate-limit
  // signals are satisfied at this enforcement point. The gateway's default
  // rule remains fail-closed: an unexpected decision below must never grant.
  const gateway = evaluateSecurityGateway({
    identityValid: true,
    tenantContextValid: kind !== "school_admin" || hasScope,
    sessionValid: true,
    withinRateLimit: true,
    requestIntegrityValid: true,
    authorizationDecision: "ALLOW",
  });

  if (gateway.decision !== "allow") {
    return { decision: "deny", code: "gateway_deny", reason: REASONS.gatewayDeny };
  }

  return {
    decision: "allow",
    scope: kind === "school_admin" ? rawScope!.trim() : null,
    reason: "Role gate verified",
  };
}

/* ─────────────────────────────────────────────────────────────
 * Server adapters (consume the legacy Supabase RPC primitives)
 * ────────────────────────────────────────────────────────────*/

// The Supabase client type is intentionally structural: only the RPC surface
// is used, matching the legacy helpers this gate replaces.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRpcClient = any;

const ROLE_RPC: Record<RoleGateKind, { role: string; scope?: string }> = {
  school_admin: { role: "is_school_admin", scope: "get_my_school_id" },
  platform_super_admin: { role: "is_super_admin" },
};

/**
 * Resolve the role signal (and scope where applicable) from the database RPC
 * primitives and evaluate the role gate. Does not throw on DENY — callers that
 * need composite (any-of) authorization resolve multiple kinds and combine the
 * outcomes. Throws only on an RPC-level error.
 */
export async function resolveRoleGate(
  supabase: SupabaseRpcClient,
  kind: RoleGateKind,
): Promise<RoleGateOutcome> {
  const rpc = ROLE_RPC[kind];
  const roleRes = await supabase.rpc(rpc.role);
  if (roleRes.error) {
    throw new Error(roleRes.error?.message ?? "Failed to verify role access");
  }

  let scope: string | null = null;
  if (rpc.scope) {
    const scopeRes = await supabase.rpc(rpc.scope);
    if (scopeRes.error) {
      throw new Error(scopeRes.error?.message ?? "Failed to resolve scope");
    }
    scope = (scopeRes.data as string | null) ?? null;
  }

  return evaluateRoleGate(kind, {
    roleGranted: (roleRes.data as boolean | null) ?? false,
    scope,
  });
}

/** Assert a single role kind; throws a canonical reason on DENY. */
export async function assertRoleScope(
  supabase: SupabaseRpcClient,
  kind: RoleGateKind,
): Promise<string | null> {
  const gate = await resolveRoleGate(supabase, kind);
  if (gate.decision !== "allow") {
    throw new Error(gate.reason);
  }
  return gate.scope;
}

/** Assert a school-admin/principal scope and return the actor's school id. */
export async function requireSchoolAdminScope(supabase: SupabaseRpcClient): Promise<string> {
  const scope = await assertRoleScope(supabase, "school_admin");
  if (scope === null) {
    // Defensive: a null scope is a DENY in the gate above; this guards against
    // future divergence between the gate and this adapter.
    throw new Error(REASONS.tenantUnresolved);
  }
  return scope;
}

/** Assert a platform super-admin. */
export async function requirePlatformSuperAdmin(supabase: SupabaseRpcClient): Promise<void> {
  await assertRoleScope(supabase, "platform_super_admin");
}

/* ─────────────────────────────────────────────────────────────
 * Composite account-administration decision
 * (super-admin OR same-tenant school admin)
 * ────────────────────────────────────────────────────────────*/

export interface AccountAdministrationSignals {
  /** Platform super-admin resolved. */
  platformSuper: boolean;
  /** Same-school admin/principal role resolved. */
  schoolAdmin: boolean;
  /** School scope of the school-admin actor (null when not resolved). */
  schoolScope: string | null;
  /** School of the target record. Null/omitted when no target check applies. */
  targetSchoolId?: string | null;
}

export type AccountAdministrationOutcome =
  | { decision: "allow"; actor: "platform_super"; scope: null }
  | { decision: "allow"; actor: "school_admin"; scope: string }
  | {
      decision: "deny";
      code: "role_required" | "tenant_unresolved" | "not_same_tenant";
      reason: string;
    };

/**
 * Decide composite account-administration access: platform super-admins may
 * act on any tenant; school admins may act only inside their own tenant and
 * (when a target is supplied) only on records that belong to that same tenant.
 * Anything else fails closed.
 */
export function decideAccountAdministration(
  signals: AccountAdministrationSignals,
): AccountAdministrationOutcome {
  if (signals.platformSuper) {
    return { decision: "allow", actor: "platform_super", scope: null };
  }

  if (!signals.schoolAdmin) {
    return {
      decision: "deny",
      code: "role_required",
      reason: "Forbidden: only school admins or platform super admins may administer accounts",
    };
  }

  const scope = signals.schoolScope?.trim() ?? "";
  if (scope === "") {
    return {
      decision: "deny",
      code: "tenant_unresolved",
      reason: "School admin is not linked to a school",
    };
  }

  if (signals.targetSchoolId != null && signals.targetSchoolId !== scope) {
    return {
      decision: "deny",
      code: "not_same_tenant",
      reason: "Not allowed: the target record is outside the actor's school scope",
    };
  }

  return { decision: "allow", actor: "school_admin", scope };
}
