/**
 * Sherivs Scholar — vocational education (Phase-04 §13).
 *
 * Trades, apprenticeships, workshops, practical training, competency
 * requirements, practical examinations, industry placements, certifications
 * and skills evidence are configuration; the runtime never presumes which
 * trade is being taught or how the apprenticeship is structured.
 */

export interface VocationalProgramme {
  id: string;
  name: string;
  /** The trade/occupation the programme leads towards (institution-defined). */
  trade?: string | null;
  hasApprenticeship?: boolean;
  hasWorkshop?: boolean;
  competencyRequirements?: string[];
  certification?: string | null;
  industryPlacement?: { required?: boolean; providerTypes?: string[] } | null;
}

export type VocationalValidation =
  { ok: true; programmes: VocationalProgramme[] } | { ok: false; issues: string[] };

export function validateVocationalEducation(
  input: readonly VocationalProgramme[],
): VocationalValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const programme of input) {
    const id = programme.id.trim();
    if (!id) {
      issues.push("a vocational programme requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate programme id "${id}"`);
    ids.add(id);
    if (!programme.name.trim()) issues.push(`programme "${id}": name is required`);
    if (programme.industryPlacement && programme.industryPlacement.required === true) {
      const providerTypes = programme.industryPlacement.providerTypes ?? [];
      if (providerTypes.length === 0) {
        issues.push(
          `programme "${id}": required industry placement needs provider types (no assumption allowed)`,
        );
      }
    }
  }

  return issues.length === 0 ? { ok: true, programmes: [...input] } : { ok: false, issues };
}
