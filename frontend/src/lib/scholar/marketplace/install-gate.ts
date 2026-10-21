/**
 * Sherivs Scholar — marketplace install gate (WAVE-R38).
 *
 * Installing is a gated act: the tenant must exist, the feature code must be
 * known, it must not already be installed, and an ACTIVE entitlement must cover
 * it. Anything else fails closed.
 */

import { featureCodeByCode } from "../capability-codes";
import { isEntitlementActive, type Entitlement } from "@/lib/marketplace-entitlement";

export interface InstallRequest {
  tenantId: string | null;
  featureCode: string;
  /** Codes already installed for the tenant. */
  installedCodes: readonly string[];
  entitlements: readonly Entitlement[];
  now?: string;
}

export interface InstallDecision {
  allowed: boolean;
  reasons: readonly string[];
  entitlementRefs: readonly string[];
}

export function decideInstall(request: InstallRequest): InstallDecision {
  if (!request.tenantId) {
    return { allowed: false, reasons: ["no tenant context — fail closed"], entitlementRefs: [] };
  }
  const feature = featureCodeByCode(request.featureCode);
  if (!feature) {
    return {
      allowed: false,
      reasons: [`unknown feature code "${request.featureCode}"`],
      entitlementRefs: [],
    };
  }
  if (request.installedCodes.includes(request.featureCode)) {
    return {
      allowed: false,
      reasons: [`${request.featureCode} is already installed for this tenant`],
      entitlementRefs: [],
    };
  }

  const now = request.now ?? new Date().toISOString();
  const active = request.entitlements.filter((entitlement) =>
    isEntitlementActive(entitlement, now),
  );
  if (active.length === 0) {
    return {
      allowed: false,
      reasons: ["no active entitlement covers this installation"],
      entitlementRefs: [],
    };
  }

  return {
    allowed: true,
    reasons: [`entitled by ${active.map((entitlement) => entitlement.id).join(", ")}`],
    entitlementRefs: active.map((entitlement) => String(entitlement.id)),
  };
}
