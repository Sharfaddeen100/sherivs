/**
 * CoreGrid Scholar — structure graph over the kernel (Phase-04 §22–25, C5).
 *
 * Level/class/cohort relationships are PROJECTED onto the universal kernel
 * (`cg_relationship` via `kernel/reality.ts`) using only relationship types
 * declared in the Scholar runtime ontology — never invented edges. The edge
 * kind "belongs_to" is a structural alias that resolves to a declared relation
 * from the source/target entity types (learner→group = enrolls; program→group
 * = composes); offers/enrolls/teaches map onto the declared relations of the
 * same name. Entity-type constraints from the manifest are enforced here
 * because the runtime is what owns education vocabulary (kernel stays generic).
 */

import { scholarRelationshipDraft } from "@/lib/runtime/scholar-reality";
import { SCHOLAR_RUNTIME_MANIFEST } from "@/lib/runtime/scholar";

export type StructureEdgeKind = "belongs_to" | "offers" | "enrolls" | "teaches";

export const STRUCTURE_EDGE_KINDS: readonly StructureEdgeKind[] = [
  "belongs_to",
  "offers",
  "enrolls",
  "teaches",
] as const;

/** Scholar ontology node types (entityTypes from the runtime manifest). */
export type StructureNodeType = string;

export interface StructureEdgeProposal {
  kind: StructureEdgeKind;
  sourceEntityId: string;
  targetEntityId: string;
  /** Manifest ontology types — enforcement happens only when provided. */
  sourceType?: string | null;
  targetType?: string | null;
  tenantId?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export type StructureEdgeProjection =
  | { ok: true; relationType: string; draft: ReturnType<typeof scholarRelationshipDraft> }
  | { ok: false; issues: string[] };

interface DeclaredRelation {
  name: string;
  sourceTypes?: string[];
  targetTypes?: string[];
}

const DECLARED_RELATIONS = new Map<string, DeclaredRelation>(
  SCHOLAR_RUNTIME_MANIFEST.ontology.relationshipTypes.map((relation) => [
    relation.name,
    { name: relation.name, sourceTypes: relation.sourceTypes, targetTypes: relation.targetTypes },
  ]),
);

function resolveBelongsToRelation(
  sourceType: string | null | undefined,
  targetType: string | null | undefined,
): string | null {
  if (sourceType === "learner" && targetType === "learning_group") return "enrolls";
  if (sourceType === "program" && targetType === "learning_group") return "composes";
  return null;
}

function typeAllowed(allowed: string[] | undefined, value: string | null | undefined): boolean {
  if (value == null) return true;
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(value);
}

export function projectStructureEdge(
  proposal: StructureEdgeProposal,
  now: string,
): StructureEdgeProjection {
  const issues: string[] = [];

  if (!proposal.sourceEntityId.trim() || !proposal.targetEntityId.trim()) {
    return { ok: false, issues: ["source and target entity ids are required"] };
  }

  const relationType =
    proposal.kind === "belongs_to"
      ? resolveBelongsToRelation(proposal.sourceType, proposal.targetType)
      : proposal.kind;

  if (relationType === null) {
    issues.push(
      `belongs_to edge ${proposal.sourceEntityId} → ${proposal.targetEntityId} has no declared Scholar relation for types "${proposal.sourceType ?? "?"}" → "${proposal.targetType ?? "?"}"`,
    );
    return { ok: false, issues };
  }

  const declared = DECLARED_RELATIONS.get(relationType);
  if (!declared) {
    issues.push(
      `"${relationType}" is not declared in the Scholar ontology — no kernel edge invented`,
    );
    return { ok: false, issues };
  }

  if (!typeAllowed(declared.sourceTypes, proposal.sourceType)) {
    issues.push(
      `"${relationType}" does not allow source type "${proposal.sourceType}" (declared: ${(declared.sourceTypes ?? []).join(", ")})`,
    );
  }
  if (!typeAllowed(declared.targetTypes, proposal.targetType)) {
    issues.push(
      `"${relationType}" does not allow target type "${proposal.targetType}" (declared: ${(declared.targetTypes ?? []).join(", ")})`,
    );
  }
  if (issues.length > 0) return { ok: false, issues };

  const draft = scholarRelationshipDraft(
    relationType,
    {
      sourceEntityId: proposal.sourceEntityId,
      targetEntityId: proposal.targetEntityId,
      tenantId: proposal.tenantId,
      validFrom: proposal.validFrom,
      validTo: proposal.validTo,
    },
    now,
  );
  return { ok: true, relationType, draft };
}
