/**
 * Sherivs Scholar — school operating policies (Phase-04 §77, M1, upgrade
 * target of the legacy education-governance surface).
 *
 * Institutions may define attendance, grading, promotion, discipline,
 * academic, facility, device and communication policies (plus custom areas).
 * Policies are data — every statement is versioned configuration and the
 * runtime never embeds a school's policy as code (§78).
 */

export type PolicyArea =
  | "attendance"
  | "grading"
  | "promotion"
  | "discipline"
  | "academic"
  | "facility"
  | "device"
  | "communication"
  | "custom";

export const POLICY_AREAS: readonly PolicyArea[] = [
  "attendance",
  "grading",
  "promotion",
  "discipline",
  "academic",
  "facility",
  "device",
  "communication",
  "custom",
] as const;

export interface InstitutionPolicy {
  code: string;
  area: PolicyArea;
  name: string;
  statement: string;
  enabled: boolean;
  version?: number | null;
  effectiveFrom?: string | null;
  appliesTo?: string[] | null;
}

export function validatePolicies(input: readonly InstitutionPolicy[]): string[] {
  const issues: string[] = [];
  const codes = new Set<string>();
  for (const policy of input) {
    const code = policy.code.trim();
    if (!code) {
      issues.push("a policy requires a code");
      continue;
    }
    if (codes.has(code)) issues.push(`duplicate policy code "${code}"`);
    codes.add(code);
    if (!policy.name.trim()) issues.push(`policy "${code}": name is required`);
    if (!policy.statement.trim()) issues.push(`policy "${code}": statement is required`);
    if (!POLICY_AREAS.includes(policy.area)) {
      issues.push(`policy "${code}": area must be one of ${POLICY_AREAS.join(", ")}`);
    }
    if (policy.version != null && (!Number.isInteger(policy.version) || policy.version < 1)) {
      issues.push(`policy "${code}": version must be a positive integer when provided`);
    }
  }
  return issues;
}

/** Active (enabled) policies for an area, sorted by code for determinism. */
export function activePoliciesFor(
  policies: readonly InstitutionPolicy[],
  area: PolicyArea,
): InstitutionPolicy[] {
  return policies
    .filter((p) => p.area === area && p.enabled)
    .sort((a, b) => a.code.localeCompare(b.code));
}
