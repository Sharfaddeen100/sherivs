/**
 * Sherivs Scholar — religious education configuration (Phase-04 §11).
 *
 * Islamic education, Qur'anic education, Christian education, church-based
 * schooling, madrasa structures, faith-based institutions, traditional
 * religious education and institution-defined religious programmes are all
 * supported through ONE configuration path. The system never assumes a
 * religion (§11) — faith is declared by the institution, not the platform.
 */

export type ReligiousEducationKind =
  | "islamic"
  | "quranic"
  | "christian"
  | "church_based"
  | "madrasa"
  | "faith_based"
  | "traditional_religious"
  | "institution_defined";

export const RELIGIOUS_EDUCATION_KINDS: readonly ReligiousEducationKind[] = [
  "islamic",
  "quranic",
  "christian",
  "church_based",
  "madrasa",
  "faith_based",
  "traditional_religious",
  "institution_defined",
] as const;

export interface ReligiousEducationProgramme {
  id: string;
  kind: ReligiousEducationKind;
  name: string;
  /** Faith is institution-declared configuration, never a platform default. */
  faithIdentifier?: string | null;
  curriculumId?: string | null;
  notes?: string | null;
}

export type ReligiousEducationValidation =
  { ok: true; programmes: ReligiousEducationProgramme[] } | { ok: false; issues: string[] };

export function validateReligiousEducation(
  input: readonly ReligiousEducationProgramme[],
): ReligiousEducationValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const programme of input) {
    const id = programme.id.trim();
    if (!id) {
      issues.push("a religious education programme requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate programme id "${id}"`);
    ids.add(id);
    if (!programme.name.trim()) issues.push(`programme "${id}": name is required`);
    if (!RELIGIOUS_EDUCATION_KINDS.includes(programme.kind)) {
      issues.push(`programme "${id}": kind must be one of ${RELIGIOUS_EDUCATION_KINDS.join(", ")}`);
    }
  }

  return issues.length === 0 ? { ok: true, programmes: [...input] } : { ok: false, issues };
}
