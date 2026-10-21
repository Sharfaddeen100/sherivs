/**
 * Sherivs Scholar — oversight: government visibility, inspection,
 * accreditation, certification (Phase-04 §94–97).
 *
 * Government-authorized entities receive SCOPED VISIBILITY — never automatic
 * institution-wide control (§94). Inspection supports evidence collection,
 * compliance review, findings and corrective actions (§95). Accreditation
 * models authority, status, scope, expiration and evidence (§96). Certification
 * supports institution-defined workflows (§97).
 */

export type AccreditationStatus = "candidate" | "accredited" | "expired" | "revoked";

export interface OversightScope {
  authorityTenantId: string;
  institutionTenantId: string;
  visibilityScopes: string[];
  /** §94: control is NOT automatic — it must be explicitly granted. */
  controlGranted: boolean;
}

export interface Inspection {
  id: string;
  institutionTenantId: string;
  date: string;
  evidenceRefs: string[];
  findings: string[];
  correctiveActions: string[];
  status: "planned" | "in_progress" | "completed";
}

export interface Accreditation {
  id: string;
  institutionTenantId: string;
  authority: string;
  status: AccreditationStatus;
  scope: string[];
  expiresAt?: string | null;
  evidenceRefs?: string[];
}

export const ACCREDITATION_STATUSES: readonly AccreditationStatus[] = [
  "candidate",
  "accredited",
  "expired",
  "revoked",
] as const;

export function validateOversightScopes(input: readonly OversightScope[]): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const scope of input) {
    if (!scope.authorityTenantId.trim() || !scope.institutionTenantId.trim()) {
      issues.push("an oversight scope requires authority and institution tenant ids");
      continue;
    }
    const key = `${scope.authorityTenantId}::${scope.institutionTenantId}`;
    if (seen.has(key)) issues.push(`duplicate oversight scope "${key}"`);
    seen.add(key);
    if (scope.authorityTenantId === scope.institutionTenantId) {
      issues.push("an authority tenant cannot oversee itself");
    }
    if (scope.visibilityScopes.length === 0) {
      issues.push(`oversight scope "${key}": at least one visibility scope is required`);
    }
  }
  return issues;
}

export function validateInspections(input: readonly Inspection[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const inspection of input) {
    const id = inspection.id.trim();
    if (!id) {
      issues.push("an inspection requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate inspection id "${id}"`);
    ids.add(id);
    if (!inspection.institutionTenantId.trim())
      issues.push(`inspection "${id}": institutionTenantId is required`);
    if (!Number.isFinite(Date.parse(inspection.date)))
      issues.push(`inspection "${id}": date must be valid`);
  }
  return issues;
}

export function validateAccreditations(input: readonly Accreditation[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const accreditation of input) {
    const id = accreditation.id.trim();
    if (!id) {
      issues.push("an accreditation requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate accreditation id "${id}"`);
    ids.add(id);
    if (!accreditation.institutionTenantId.trim())
      issues.push(`accreditation "${id}": institutionTenantId is required`);
    if (!accreditation.authority.trim())
      issues.push(`accreditation "${id}": authority is required`);
    if (!ACCREDITATION_STATUSES.includes(accreditation.status)) {
      issues.push(
        `accreditation "${id}": status must be one of ${ACCREDITATION_STATUSES.join(", ")}`,
      );
    }
    if (accreditation.scope.length === 0)
      issues.push(`accreditation "${id}": scope must not be empty`);
    if (accreditation.expiresAt && !Number.isFinite(Date.parse(accreditation.expiresAt))) {
      issues.push(`accreditation "${id}": expiresAt must be a valid timestamp`);
    }
  }
  return issues;
}

/** §96: is the accreditation currently valid for the whole of its scope? */
export function isAccredited(accreditation: Accreditation, at: string): boolean {
  if (accreditation.status !== "accredited") return false;
  if (accreditation.expiresAt && accreditation.expiresAt < at) return false;
  return true;
}
