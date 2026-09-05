/**
 * CoreGrid Scholar — technical education (Phase-04 §15).
 *
 * Engineering, mechanics, electrical systems, electronics, construction,
 * fabrication, computing, manufacturing and technical workshops are
 * configuration — an institution defines exactly which technical domains and
 * workshop facilities its programmes need.
 */

export type TechnicalDomain =
  | "engineering"
  | "mechanics"
  | "electrical_systems"
  | "electronics"
  | "construction"
  | "fabrication"
  | "computing"
  | "manufacturing"
  | "custom";

export const TECHNICAL_DOMAINS: readonly TechnicalDomain[] = [
  "engineering",
  "mechanics",
  "electrical_systems",
  "electronics",
  "construction",
  "fabrication",
  "computing",
  "manufacturing",
  "custom",
] as const;

export interface TechnicalProgramme {
  id: string;
  name: string;
  domains: TechnicalDomain[];
  workshopFacilities?: string[];
  equipment?: string[];
}

export type TechnicalValidation =
  { ok: true; programmes: TechnicalProgramme[] } | { ok: false; issues: string[] };

export function validateTechnicalEducation(
  input: readonly TechnicalProgramme[],
): TechnicalValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const programme of input) {
    const id = programme.id.trim();
    if (!id) {
      issues.push("a technical programme requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate programme id "${id}"`);
    ids.add(id);
    if (!programme.name.trim()) issues.push(`programme "${id}": name is required`);
    if (programme.domains.length === 0) {
      issues.push(`programme "${id}": at least one technical domain is required`);
    }
    for (const domain of programme.domains) {
      if (!TECHNICAL_DOMAINS.includes(domain)) {
        issues.push(`programme "${id}": domain must be one of ${TECHNICAL_DOMAINS.join(", ")}`);
      }
    }
  }

  return issues.length === 0 ? { ok: true, programmes: [...input] } : { ok: false, issues };
}
