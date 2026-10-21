/**
 * Sherivs Scholar — cross-subject learning (Phase-04 §20).
 *
 * Subjects relate to one another (prerequisite → successor, support,
 * integration, shared competency, custom). The relationship vocabulary is
 * small and generic; which subjects actually relate is institution
 * configuration, validated against the subject index when provided.
 */

export type SubjectRelationshipKind =
  "prerequisite" | "supports" | "integrates_with" | "shares_competency" | "custom";

export const SUBJECT_RELATIONSHIP_KINDS: readonly SubjectRelationshipKind[] = [
  "prerequisite",
  "supports",
  "integrates_with",
  "shares_competency",
  "custom",
] as const;

export interface SubjectRelationship {
  sourceCode: string;
  targetCode: string;
  kind: SubjectRelationshipKind;
  note?: string | null;
}

export type SubjectRelationshipsValidation =
  { ok: true; relationships: SubjectRelationship[] } | { ok: false; issues: string[] };

export function validateSubjectRelationships(
  input: readonly SubjectRelationship[],
  knownSubjectCodes?: ReadonlySet<string> | null,
): SubjectRelationshipsValidation {
  const issues: string[] = [];

  for (const relationship of input) {
    if (!relationship.sourceCode.trim() || !relationship.targetCode.trim()) {
      issues.push("a subject relationship requires source and target codes");
      continue;
    }
    if (relationship.sourceCode === relationship.targetCode) {
      issues.push(`subject "${relationship.sourceCode}" cannot relate to itself`);
    }
    if (knownSubjectCodes) {
      if (!knownSubjectCodes.has(relationship.sourceCode)) {
        issues.push(`relationship references unknown subject "${relationship.sourceCode}"`);
      }
      if (!knownSubjectCodes.has(relationship.targetCode)) {
        issues.push(`relationship references unknown subject "${relationship.targetCode}"`);
      }
    }
    if (!SUBJECT_RELATIONSHIP_KINDS.includes(relationship.kind)) {
      issues.push(`kind must be one of ${SUBJECT_RELATIONSHIP_KINDS.join(", ")}`);
    }
  }

  return issues.length === 0 ? { ok: true, relationships: [...input] } : { ok: false, issues };
}
