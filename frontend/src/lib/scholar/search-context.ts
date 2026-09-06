/**
 * CoreGrid Scholar — educational memory/search context (Phase-04 §119–121).
 *
 * Educational search must understand educational entities — "Show SS2
 * mathematics students", "Which laboratories are free tomorrow?", "Which
 * teachers teach chemistry?" — while §121 guarantees natural-language
 * interpretation NEVER bypasses authorization. This module is the authorization
 * guard for search scope: a role may search exactly the entity kinds its
 * policy grants, and nothing else.
 */

export type SearchableEntityKind =
  | "level"
  | "programme"
  | "subject"
  | "class"
  | "teacher"
  | "student"
  | "guardian"
  | "facility"
  | "device"
  | "activity"
  | "curriculum"
  | "assessment";

export const SEARCHABLE_ENTITY_KINDS: readonly SearchableEntityKind[] = [
  "level",
  "programme",
  "subject",
  "class",
  "teacher",
  "student",
  "guardian",
  "facility",
  "device",
  "activity",
  "curriculum",
  "assessment",
] as const;

export interface RoleSearchScope {
  role: string;
  allowedKinds: SearchableEntityKind[];
}

export interface ResolvedSearchScope {
  role: string;
  allowedKinds: SearchableEntityKind[];
  deniedKinds: SearchableEntityKind[];
}

/** Default posture: an unknown role may search nothing (deny by default). */
export function resolveSearchScope(
  role: string,
  matrix: readonly RoleSearchScope[],
  requestedKinds: readonly SearchableEntityKind[] = SEARCHABLE_ENTITY_KINDS,
): ResolvedSearchScope {
  const granted = new Set(matrix.find((row) => row.role === role)?.allowedKinds ?? []);
  const allowed = requestedKinds.filter((kind) => granted.has(kind));
  const denied = requestedKinds.filter((kind) => !granted.has(kind));
  return { role, allowedKinds: allowed, deniedKinds: denied };
}

/** Example semantic intents (§120) resolved against allowed kinds. */
export function resolveQueryIntent(
  query: string,
  role: string,
  matrix: readonly RoleSearchScope[],
): { subject: string; kinds: SearchableEntityKind[] } {
  const normalized = query.toLowerCase();
  const requested: SearchableEntityKind[] = [];
  if (normalized.includes("student") || normalized.includes("pupil")) requested.push("student");
  if (normalized.includes("teacher")) requested.push("teacher");
  if (normalized.includes("laborator") || normalized.includes("room")) requested.push("facility");
  if (
    normalized.includes("subject") ||
    normalized.includes("mathematic") ||
    normalized.includes("chemistry")
  ) {
    requested.push("subject");
  }
  if (normalized.includes("class") || normalized.includes("form")) requested.push("class");
  const scope = resolveSearchScope(role, matrix, requested);
  return { subject: query, kinds: scope.allowedKinds };
}
