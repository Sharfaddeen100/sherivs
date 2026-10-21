/**
 * Sherivs Scholar — traditional & community education (Phase-04 §12).
 *
 * Community knowledge, indigenous knowledge, oral traditions, cultural
 * education, local language education, traditional skills and community
 * apprenticeship are represented through configuration — the runtime never
 * presumes which tradition a community practises.
 */

export type TraditionalEducationKind =
  | "community_knowledge"
  | "indigenous_knowledge"
  | "oral_traditions"
  | "cultural_education"
  | "local_language_education"
  | "traditional_skills"
  | "community_apprenticeship"
  | "custom";

export const TRADITIONAL_EDUCATION_KINDS: readonly TraditionalEducationKind[] = [
  "community_knowledge",
  "indigenous_knowledge",
  "oral_traditions",
  "cultural_education",
  "local_language_education",
  "traditional_skills",
  "community_apprenticeship",
  "custom",
] as const;

export interface TraditionalEducationProgramme {
  id: string;
  kind: TraditionalEducationKind;
  name: string;
  /** The community/tradition that owns this knowledge — declared by it. */
  community?: string | null;
  skills?: string[];
  notes?: string | null;
}

export type TraditionalEducationValidation =
  { ok: true; programmes: TraditionalEducationProgramme[] } | { ok: false; issues: string[] };

export function validateTraditionalEducation(
  input: readonly TraditionalEducationProgramme[],
): TraditionalEducationValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const programme of input) {
    const id = programme.id.trim();
    if (!id) {
      issues.push("a traditional education programme requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate programme id "${id}"`);
    ids.add(id);
    if (!programme.name.trim()) issues.push(`programme "${id}": name is required`);
    if (!TRADITIONAL_EDUCATION_KINDS.includes(programme.kind)) {
      issues.push(
        `programme "${id}": kind must be one of ${TRADITIONAL_EDUCATION_KINDS.join(", ")}`,
      );
    }
  }

  return issues.length === 0 ? { ok: true, programmes: [...input] } : { ok: false, issues };
}
