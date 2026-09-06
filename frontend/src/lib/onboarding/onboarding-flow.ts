/**
 * CoreGrid — Phase 25 Onboarding, Administration & Workforce Identity:
 * domain-neutral ORGANIZATION ONBOARDING FLOW.
 *
 * Implements the phase-25 blueprint's creation model and lifecycle semantics
 * in a DOMAIN-FREE way: onboarding transforms a newly created ORGANIZATION
 * record into a securely configured, policy-driven, operational CoreGrid
 * environment. The organization may be a school, university, company,
 * government agency, community institution, non-profit — orgType is DATA, never
 * a code branch. Every present and future domain runtime (Scholar R-001 is the
 * first) can be activated for the organization once its onboarding completes.
 *
 * Platform laws honoured here:
 * - No domain logic: education flows live in the runtime that consumes this.
 * - No fixed portals: surfaces derive from identity + role + context +
 *   permissions + policies + organization (P02/P03/P08 semantics).
 * - Progression is explicit and sequential — stages are never jumped.
 * - Every record names its organization, tenant boundary and acting identity.
 */

export type OnboardingStage =
  | "organization_created"
  | "profile_configured"
  | "tenant_provisioned"
  | "admin_provisioned"
  | "policy_set_installed"
  | "workspace_provisioned"
  | "runtime_activated"
  | "active";

export const ONBOARDING_STAGES: readonly OnboardingStage[] = [
  "organization_created",
  "profile_configured",
  "tenant_provisioned",
  "admin_provisioned",
  "policy_set_installed",
  "workspace_provisioned",
  "runtime_activated",
  "active",
] as const;

const STAGE_INDEX: Record<OnboardingStage, number> = {
  organization_created: 0,
  profile_configured: 1,
  tenant_provisioned: 2,
  admin_provisioned: 3,
  policy_set_installed: 4,
  workspace_provisioned: 5,
  runtime_activated: 6,
  active: 7,
};

export interface OrganizationOnboarding {
  onboardingId: string;
  organizationId: string;
  /** Organization class is DATA — school/company/agency/community/custom. */
  orgType: string;
  tenantId?: string | null;
  /** P02 organization identity id. */
  organizationIdentityId?: string | null;
  /** P02 human identity id of the initial administrator (primary authority). */
  adminIdentityId?: string | null;
  policySetId?: string | null;
  workspaceId?: string | null;
  /** Domain runtimes activated for this organization (any future runtime). */
  activeRuntimeIds: string[];
  stage: OnboardingStage;
  actor: string;
  createdAt: string;
  updatedAt: string;
}

export type OnboardingValidation =
  { ok: true; onboarding: OrganizationOnboarding } | { ok: false; issues: string[] };

export interface CreateOrganizationOnboardingInput {
  onboardingId: string;
  organizationId: string;
  orgType: string;
  actor: string;
  createdAt: string;
}

/** Stage → artifacts that MUST be recorded when entering that stage. */
const STAGE_ARTIFACTS: Partial<Record<OnboardingStage, string[]>> = {
  tenant_provisioned: ["tenantId", "organizationIdentityId"],
  admin_provisioned: ["adminIdentityId"],
  policy_set_installed: ["policySetId"],
  workspace_provisioned: ["workspaceId"],
  runtime_activated: ["runtimeId"],
};

export function createOrganizationOnboarding(
  input: CreateOrganizationOnboardingInput,
): OnboardingValidation {
  const issues: string[] = [];
  if (!input.onboardingId.trim()) issues.push("an onboarding requires an onboardingId");
  if (!input.organizationId.trim()) issues.push("an onboarding requires an organizationId");
  const orgType = input.orgType.trim();
  if (orgType.length < 1 || orgType.length > 80) {
    issues.push("orgType must be 1–80 characters");
  }
  if (!input.actor.trim()) issues.push("an onboarding requires an acting identity");
  if (!Number.isFinite(Date.parse(input.createdAt))) {
    issues.push("createdAt must be a valid ISO timestamp");
  }
  if (issues.length > 0) return { ok: false, issues };

  const onboarding: OrganizationOnboarding = {
    onboardingId: input.onboardingId.trim(),
    organizationId: input.organizationId.trim(),
    orgType,
    tenantId: null,
    organizationIdentityId: null,
    adminIdentityId: null,
    policySetId: null,
    workspaceId: null,
    activeRuntimeIds: [],
    stage: "organization_created",
    actor: input.actor.trim(),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
  return { ok: true, onboarding };
}

export interface AdvanceArtifacts {
  tenantId?: string | null;
  organizationIdentityId?: string | null;
  adminIdentityId?: string | null;
  policySetId?: string | null;
  workspaceId?: string | null;
  /** Required for runtime_activated. */
  runtimeId?: string | null;
}

export type AdvanceResult =
  { ok: true; onboarding: OrganizationOnboarding } | { ok: false; issue: string };

/** Sequential advance: no stage may be skipped and artifacts must be present. */
export function advanceOnboarding(
  current: OrganizationOnboarding,
  to: OnboardingStage,
  artifacts: AdvanceArtifacts = {},
  now: string,
): AdvanceResult {
  const fromIndex = STAGE_INDEX[current.stage];
  const toIndex = STAGE_INDEX[to];
  if (toIndex !== fromIndex + 1) {
    return {
      ok: false,
      issue: `onboarding "${current.onboardingId}" cannot move from "${current.stage}" to "${to}"`,
    };
  }

  const required = STAGE_ARTIFACTS[to] ?? [];
  for (const artifact of required) {
    const value = artifacts[artifact as keyof AdvanceArtifacts];
    if (!value || String(value).trim() === "") {
      return {
        ok: false,
        issue: `onboarding "${current.onboardingId}": "${artifact}" is required for stage "${to}"`,
      };
    }
  }

  const next: OrganizationOnboarding = {
    ...current,
    stage: to,
    updatedAt: now,
    tenantId: artifacts.tenantId ?? current.tenantId,
    organizationIdentityId: artifacts.organizationIdentityId ?? current.organizationIdentityId,
    adminIdentityId: artifacts.adminIdentityId ?? current.adminIdentityId,
    policySetId: artifacts.policySetId ?? current.policySetId,
    workspaceId: artifacts.workspaceId ?? current.workspaceId,
    activeRuntimeIds: [...current.activeRuntimeIds],
  };

  if (to === "runtime_activated") {
    const runtimeId = artifacts.runtimeId ?? "";
    if (next.activeRuntimeIds.includes(runtimeId)) {
      return { ok: false, issue: `runtime "${runtimeId}" is already active for this organization` };
    }
    next.activeRuntimeIds = [...next.activeRuntimeIds, runtimeId];
  }

  // §admin authority: the initial administrator must never be the org identity.
  if (to === "admin_provisioned" && next.adminIdentityId === next.organizationIdentityId) {
    return { ok: false, issue: "the initial administrator cannot be the organization identity" };
  }

  return { ok: true, onboarding: next };
}

/** Artifacts required to ENTER a stage (read-only view for progress/resume). */
export function requiredArtifactsForStage(stage: OnboardingStage): readonly string[] {
  return STAGE_ARTIFACTS[stage] ?? [];
}

export interface OnboardingProgress {
  index: number;
  currentStage: OnboardingStage;
  nextStage: OnboardingStage | null;
  ratio: number;
  complete: boolean;
}

/** Progress + resume point for guided onboarding journeys (§BA/BB). */
export function onboardingProgress(onboarding: OrganizationOnboarding): OnboardingProgress {
  const index = STAGE_INDEX[onboarding.stage];
  const total = ONBOARDING_STAGES.length;
  const last = total - 1;
  const complete = index === last;
  return {
    index,
    currentStage: onboarding.stage,
    nextStage: complete ? null : ONBOARDING_STAGES[index + 1],
    ratio: complete ? 1 : index / last,
    complete,
  };
}

/** Onboarding is operationally complete when the organization is 'active'. */
export function isOnboardingComplete(onboarding: OrganizationOnboarding): boolean {
  return onboarding.stage === "active";
}

/**
 * Dynamic-surface context handed to P06 once onboarding provisions a
 * workspace — the workspace derives from these facts, never from a fixed
 * portal label.
 */
export function activeRuntimeContext(onboarding: OrganizationOnboarding) {
  if (onboarding.stage !== "active") return null;
  if (!onboarding.workspaceId || !onboarding.adminIdentityId || !onboarding.tenantId) return null;
  return {
    organizationId: onboarding.organizationId,
    tenantId: onboarding.tenantId,
    adminIdentityId: onboarding.adminIdentityId,
    workspaceId: onboarding.workspaceId,
    activeRuntimeIds: [...onboarding.activeRuntimeIds],
    orgType: onboarding.orgType,
  };
}
