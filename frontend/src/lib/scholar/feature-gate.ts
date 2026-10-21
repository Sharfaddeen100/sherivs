/**
 * Sherivs Scholar — fail-closed feature gate.
 *
 * The one place that answers "may this actor use this feature?": unknown code,
 * missing identity, missing tenant, a feature the institution's reality does not
 * install, a role set outside the feature's categories, or an undeclared grant
 * all DENY. Policies may only make a decision stricter.
 *
 * Boundary: the gate EVALUATES and EXPLAINS. Live enforcement for server
 * surfaces stays with Phase 08 (`security-role-gate.ts`) + RLS; this gate is the
 * feature-level decision the runtime layers and surfaces consume.
 */

import {
  evaluatePermission,
  type PermissionPolicy,
  type PolicyOutcome,
} from "./roles/role-permission-engine";
import { EDUCATION_REALITY_ROLES, roleById } from "./roles/role-registry";
import type { EducationRealityRole } from "./roles/role-definition";
import type { InstitutionReality } from "./roles/role-template-engine";
import type { RoleWorkspaceKey } from "./roles/role-workspaces";
import {
  featureCodeByCode,
  SCHOLAR_FEATURE_CODES,
  type ScholarFeatureCode,
} from "./capability-codes";

export interface FeatureGateActor {
  identityId: string | null;
  tenantId: string | null;
  roleIds: readonly string[];
}

export interface FeatureGateRequest {
  code: string;
  actor: FeatureGateActor;
  policies?: readonly PermissionPolicy[];
  /** When supplied, a code whose reality is absent is not installed at all. */
  reality?: InstitutionReality;
  /**
   * Role definitions to decide against (defaults to the installed catalog).
   * Tenants install GRANTS on top of the catalog, so a caller may pass the
   * tenant's role set with its grants.
   */
  roles?: readonly EducationRealityRole[];
}

export interface FeatureGateDecision {
  code: string;
  outcome: PolicyOutcome;
  /** True only when the outcome is ALLOW. */
  enabled: boolean;
  reasons: readonly string[];
  capability: string | null;
  workspace: RoleWorkspaceKey | null;
  /** Assigned roles whose category the feature serves. */
  categoryRoles: readonly string[];
  models: readonly string[];
  /** Policies that applied to this decision (audit trail). */
  appliedPolicies: readonly string[];
}

const DENIED: PolicyOutcome = "DENY";

function deny(code: string, reason: string, feature?: ScholarFeatureCode): FeatureGateDecision {
  return {
    code,
    outcome: DENIED,
    enabled: false,
    reasons: [reason],
    capability: feature?.capability ?? null,
    workspace: feature?.workspace ?? null,
    categoryRoles: [],
    models: [],
    appliedPolicies: [],
  };
}

/** Decide one feature code for one actor. */
export function decideFeatureAccess(request: FeatureGateRequest): FeatureGateDecision {
  const feature = featureCodeByCode(request.code);
  if (!feature) return deny(request.code, `unknown feature code "${request.code}"`);

  const { actor } = request;
  if (!actor.identityId) return deny(request.code, "no identity — fail closed", feature);
  if (!actor.tenantId) return deny(request.code, "no tenant context — fail closed", feature);

  if (request.reality) {
    const features = new Set(request.reality.featureKeys);
    if (!feature.featureKeys.some((key) => features.has(key))) {
      return deny(
        request.code,
        `feature is not installed in this reality (needs one of: ${feature.featureKeys.join(", ")})`,
        feature,
      );
    }
  }

  const roles = request.roles ?? EDUCATION_REALITY_ROLES;
  const categoryRoles = actor.roleIds.filter((roleId) => {
    const role = roles.find((candidate) => candidate.id === roleId) ?? roleById(roleId);
    return role !== undefined && feature.roleCategories.includes(role.category);
  });
  if (categoryRoles.length === 0) {
    return deny(
      request.code,
      `no assigned role in the categories this feature serves (${feature.roleCategories.join(", ")})`,
      feature,
    );
  }

  const decision = evaluatePermission(
    { roleIds: categoryRoles, capability: feature.capability },
    request.policies ?? [],
    roles,
  );

  return {
    code: request.code,
    outcome: decision.outcome,
    enabled: decision.outcome === "ALLOW",
    reasons: decision.reasons,
    capability: feature.capability,
    workspace: feature.workspace,
    categoryRoles,
    models: decision.models,
    appliedPolicies: decision.appliedPolicies,
  };
}

/** Decisions for every installed code, deterministic order. */
export function featureGateSnapshot(
  request: Omit<FeatureGateRequest, "code"> & { codes?: readonly string[] },
): readonly FeatureGateDecision[] {
  const codes =
    request.codes ??
    (request.reality
      ? SCHOLAR_FEATURE_CODES.filter((feature) =>
          feature.featureKeys.some((key) => request.reality?.featureKeys.includes(key)),
        ).map((feature) => feature.code)
      : SCHOLAR_FEATURE_CODES.map((feature) => feature.code));
  return codes.map((code) => decideFeatureAccess({ ...request, code }));
}

export function enabledFeatureCodes(
  request: Omit<FeatureGateRequest, "code"> & { codes?: readonly string[] },
): readonly string[] {
  return featureGateSnapshot(request)
    .filter((decision) => decision.enabled)
    .map((decision) => decision.code);
}

/** Server-side helper: throw when a feature is not enabled (never silently allow). */
export function assertFeatureAccess(request: FeatureGateRequest): FeatureGateDecision {
  const decision = decideFeatureAccess(request);
  if (!decision.enabled) {
    throw new Error(`Feature "${request.code}" is not available: ${decision.reasons.join("; ")}`);
  }
  return decision;
}
