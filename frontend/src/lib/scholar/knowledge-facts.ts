/**
 * CoreGrid Scholar — school knowledge model + structured facts (Phase-04
 * §122–123).
 *
 * The runtime provides structured institutional facts to the Knowledge Graph
 * (§122) using the §123 relationship vocabulary. Facts are validated locally;
 * consumption by P33/P36 graph engines happens later through kernel
 * projections. A fact always names its source — config, an event or an
 * observation — so inference never masquerades as truth.
 */

export type KnowledgeFactType =
  | "teaches"
  | "attends"
  | "belongs_to"
  | "located_in"
  | "requires"
  | "scheduled_in"
  | "supervises"
  | "manages"
  | "enrolled_in"
  | "assessed_by"
  | "uses"
  | "assigned_to";

export const KNOWLEDGE_FACT_TYPES: readonly KnowledgeFactType[] = [
  "teaches",
  "attends",
  "belongs_to",
  "located_in",
  "requires",
  "scheduled_in",
  "supervises",
  "manages",
  "enrolled_in",
  "assessed_by",
  "uses",
  "assigned_to",
] as const;

export type FactSource = "configuration" | "event" | "observation";

export interface KnowledgeFact {
  factType: KnowledgeFactType;
  subjectId: string;
  objectId: string;
  tenantId?: string | null;
  confidence: number;
  source: FactSource;
  validFrom?: string | null;
  validTo?: string | null;
}

export function validateKnowledgeFacts(input: readonly KnowledgeFact[]): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const fact of input) {
    if (!fact.subjectId.trim() || !fact.objectId.trim()) {
      issues.push("a fact requires subjectId and objectId");
      continue;
    }
    if (fact.subjectId === fact.objectId)
      issues.push(`fact "${fact.factType}" cannot relate an entity to itself`);
    if (!KNOWLEDGE_FACT_TYPES.includes(fact.factType)) {
      issues.push(`factType must be one of ${KNOWLEDGE_FACT_TYPES.join(", ")}`);
    }
    if (!Number.isFinite(fact.confidence) || fact.confidence < 0 || fact.confidence > 1) {
      issues.push("confidence must be a finite number between 0 and 1");
    }
    if (
      fact.source !== "configuration" &&
      fact.source !== "event" &&
      fact.source !== "observation"
    ) {
      issues.push("source must be configuration, event or observation");
    }
    if (fact.validFrom && fact.validTo && fact.validTo < fact.validFrom) {
      issues.push("validTo must not precede validFrom");
    }
    const key = `${fact.factType}::${fact.subjectId}::${fact.objectId}`;
    if (seen.has(key)) issues.push(`duplicate fact "${key}"`);
    seen.add(key);
  }
  return issues;
}
