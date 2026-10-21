/**
 * Sherivs Scholar — parent/guardian relationships + family structure
 * (Phase-04 §110–111).
 *
 * Parents and guardians hold CONTROLLED relationships to students: every
 * permission is policy-driven (§110). Family structure is configuration:
 * parents, guardians, foster guardians, emergency contacts and authorized
 * representatives (§111). The relationship is projected onto the kernel as the
 * declared Scholar ontology edge `guardians` (guardian → learner) — the same
 * safe default posture as the rest of the runtime: contact sharing is OFF
 * until a policy grants it.
 */

import { scholarRelationshipDraft } from "@/lib/runtime/scholar-reality";

export type FamilyRole =
  "parent" | "guardian" | "foster_guardian" | "emergency_contact" | "authorized_representative";

export const FAMILY_ROLES: readonly FamilyRole[] = [
  "parent",
  "guardian",
  "foster_guardian",
  "emergency_contact",
  "authorized_representative",
] as const;

export interface GuardianRelation {
  guardianIdentityId: string;
  learnerIdentityId: string;
  tenantId?: string | null;
  role: FamilyRole;
  /** Policy-driven permissions (§110) — never implicit. */
  policy?: {
    contactShare?: boolean;
    accessScopes?: string[];
  } | null;
  verified?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
}

export type GuardianshipValidation =
  { ok: true; relation: GuardianRelation } | { ok: false; issues: string[] };

/** Safe default: no contact sharing, no scopes (policy must grant). */
export function defaultGuardianPolicy(): { contactShare: boolean; accessScopes: string[] } {
  return { contactShare: false, accessScopes: [] };
}

export function validateGuardianRelation(relation: GuardianRelation): GuardianshipValidation {
  const issues: string[] = [];

  if (!relation.guardianIdentityId.trim()) issues.push("guardianIdentityId is required");
  if (!relation.learnerIdentityId.trim()) issues.push("learnerIdentityId is required");
  if (relation.guardianIdentityId.trim() === relation.learnerIdentityId.trim()) {
    issues.push("a guardian cannot be the same identity as the learner");
  }
  if (!FAMILY_ROLES.includes(relation.role)) {
    issues.push(`role must be one of ${FAMILY_ROLES.join(", ")}`);
  }
  if (relation.tenantId && !relation.tenantId.trim())
    issues.push("tenantId must not be blank when provided");
  if (
    relation.validFrom &&
    relation.validTo &&
    Number.isFinite(Date.parse(relation.validFrom)) &&
    Number.isFinite(Date.parse(relation.validTo)) &&
    relation.validTo < relation.validFrom
  ) {
    issues.push("validTo must not precede validFrom");
  }

  return issues.length === 0 ? { ok: true, relation } : { ok: false, issues };
}

/**
 * §110 controlled relationship: whether a policy grants this guardian access
 * to a given sensitive scope. Contact sharing alone never unlocks scopes.
 */
export function guardianMayAccess(relation: GuardianRelation, scope: string): boolean {
  const scopes = relation.policy?.accessScopes ?? [];
  return scopes.includes(scope);
}

/** Project the family edge onto the declared kernel relation "guardians". */
export function projectGuardianEdge(
  relation: GuardianRelation,
  now: string,
): ReturnType<typeof scholarRelationshipDraft> {
  return scholarRelationshipDraft(
    "guardians",
    {
      sourceEntityId: relation.guardianIdentityId,
      targetEntityId: relation.learnerIdentityId,
      tenantId: relation.tenantId,
      attributes: { role: relation.role, verified: relation.verified ?? false },
      validFrom: relation.validFrom,
      validTo: relation.validTo,
    },
    now,
  );
}
