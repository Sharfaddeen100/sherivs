/**
 * CoreGrid Scholar — agricultural education (Phase-04 §14).
 *
 * Crop production, livestock, fisheries, agricultural science, farm
 * practicals, agricultural projects, field work, farm facilities and
 * agricultural equipment are configuration. Which agriculture an institution
 * teaches — and where — is never assumed.
 */

export type AgriculturalField =
  | "crop_production"
  | "livestock"
  | "fisheries"
  | "agricultural_science"
  | "farm_practicals"
  | "agricultural_projects"
  | "field_work"
  | "custom";

export const AGRICULTURAL_FIELDS: readonly AgriculturalField[] = [
  "crop_production",
  "livestock",
  "fisheries",
  "agricultural_science",
  "farm_practicals",
  "agricultural_projects",
  "field_work",
  "custom",
] as const;

export interface AgriculturalProgramme {
  id: string;
  name: string;
  fields: AgriculturalField[];
  farmFacilities?: string[];
  equipment?: string[];
  notes?: string | null;
}

export type AgriculturalValidation =
  { ok: true; programmes: AgriculturalProgramme[] } | { ok: false; issues: string[] };

export function validateAgriculturalEducation(
  input: readonly AgriculturalProgramme[],
): AgriculturalValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const programme of input) {
    const id = programme.id.trim();
    if (!id) {
      issues.push("an agricultural programme requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate programme id "${id}"`);
    ids.add(id);
    if (!programme.name.trim()) issues.push(`programme "${id}": name is required`);
    if (programme.fields.length === 0) {
      issues.push(`programme "${id}": at least one agricultural field is required`);
    }
    for (const field of programme.fields) {
      if (!AGRICULTURAL_FIELDS.includes(field)) {
        issues.push(`programme "${id}": field must be one of ${AGRICULTURAL_FIELDS.join(", ")}`);
      }
    }
  }

  return issues.length === 0 ? { ok: true, programmes: [...input] } : { ok: false, issues };
}
