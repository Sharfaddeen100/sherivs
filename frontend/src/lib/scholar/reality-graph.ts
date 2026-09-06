/**
 * CoreGrid Scholar — reality graph (Phase-04 §71–73, §123).
 *
 * The runtime represents organisational, educational and resource graphs as
 * typed edges (§71–73) using the §123 relationship vocabulary: teaches,
 * attends, belongs-to, located-in, requires, scheduled-in, supervises,
 * manages, enrolled-in, assessed-by, uses and assigned-to. Edges are
 * PROJECTED onto the kernel only through relations DECLARED in the Scholar
 * ontology — a graph kind with no declared relation yields an explicit issue
 * (an ontology extension is required), never an invented kernel edge.
 */

export type GraphEdgeKind =
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
  | "assigned_to"
  | "custom";

export const GRAPH_EDGE_KINDS: readonly GraphEdgeKind[] = [
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
  "custom",
] as const;

export interface GraphEdgeRecord {
  kind: GraphEdgeKind;
  sourceEntityId: string;
  sourceType?: string | null;
  targetEntityId: string;
  targetType?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}

export function validateGraphEdges(
  input: readonly GraphEdgeRecord[],
  knownEntityIds?: ReadonlySet<string> | null,
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const edge of input) {
    if (!edge.sourceEntityId.trim() || !edge.targetEntityId.trim()) {
      issues.push("a graph edge requires source and target entity ids");
      continue;
    }
    if (edge.sourceEntityId === edge.targetEntityId) {
      issues.push(`graph edge "${edge.kind}" cannot connect an entity to itself`);
    }
    if (!GRAPH_EDGE_KINDS.includes(edge.kind)) {
      issues.push(`edge kind must be one of ${GRAPH_EDGE_KINDS.join(", ")}`);
    }
    if (knownEntityIds) {
      if (!knownEntityIds.has(edge.sourceEntityId)) {
        issues.push(`edge references unknown source entity "${edge.sourceEntityId}"`);
      }
      if (!knownEntityIds.has(edge.targetEntityId)) {
        issues.push(`edge references unknown target entity "${edge.targetEntityId}"`);
      }
    }
    const key = `${edge.kind}::${edge.sourceEntityId}::${edge.targetEntityId}`;
    if (seen.has(key)) issues.push(`duplicate graph edge "${key}"`);
    seen.add(key);
  }
  return issues;
}

/**
 * §123 → declared Scholar ontology relations. Kinds without a declared
 * relation resolve to null (no invention) until the ontology evolves.
 */
export function resolveOntologyRelation(
  kind: GraphEdgeKind,
  sourceType: string | null | undefined,
  targetType: string | null | undefined,
): string | null {
  switch (kind) {
    case "teaches":
      if (sourceType != null && sourceType !== "educator") return null;
      if (targetType != null && targetType !== "learning_group") return null;
      return "teaches";
    case "enrolled_in":
      return sourceType === "learner" && targetType === "learning_group" ? "enrolls" : null;
    case "belongs_to":
      if (sourceType === "learner" && targetType === "learning_group") return "enrolls";
      if (sourceType === "program" && targetType === "learning_group") return "composes";
      return null;
    default:
      // attends/located_in/requires/scheduled_in/supervises/manages/assessed_by/
      // uses/assigned_to/custom have no declared Scholar ontology relation yet.
      return null;
  }
}
