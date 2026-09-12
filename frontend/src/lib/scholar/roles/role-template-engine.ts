/**
 * CoreGrid Scholar — Educational Reality Role Engine: template engine.
 *
 * Turns an institution's REALITY (the feature keys + templates it selected at
 * onboarding, its education levels and jurisdictions) into the role set it
 * should staff — with PRIMARY / SECONDARY / OPTIONAL priorities and the
 * rationale for each suggestion.
 *
 * There is no `if (schoolType === "secondary")` anywhere: the engine matches
 * declared reality data against role scope. A role whose feature scope is not
 * part of the institution's reality is never suggested; a role that is part of
 * it is promoted. Naming alternatives (Islamic / Christian / alternative
 * titles) are DATA, so the same role can be named the way the institution
 * names it without forking the definition.
 */

import { EDUCATION_REALITY_ROLES, roleById } from "./role-registry";
import type { EducationLevel, EducationRealityRole, RolePriority } from "./role-definition";
import type { RoleWorkspaceKey } from "./role-workspaces";

export interface InstitutionReality {
  /** Existing institution feature keys the organization selected. */
  featureKeys: readonly string[];
  /** Existing institution template ids that matched the organization. */
  templateRefs?: readonly string[];
  educationLevels?: readonly EducationLevel[];
  jurisdictions?: readonly string[];
  /** Religious/curriculum flavour for naming alternatives only. */
  curriculumFlavour?: "christian" | "islamic" | "secular" | "alternative";
}

export interface SuggestedRole {
  role: EducationRealityRole;
  /** Display name for THIS reality (naming alternative when one applies). */
  displayName: string;
  /** Effective priority for this reality. */
  priority: RolePriority;
  /** Why the role is suggested — matched reality facts, never a guess. */
  rationale: readonly string[];
}

export interface RoleSuggestionSet {
  reality: InstitutionReality;
  primary: readonly SuggestedRole[];
  secondary: readonly SuggestedRole[];
  optional: readonly SuggestedRole[];
  total: number;
}

/**
 * Naming alternatives by flavour. Keys are role ids; only the NAME changes —
 * the definition, permissions and workspace stay identical.
 */
const NAMING_ALTERNATIVES: Record<string, Record<string, string>> = {
  islamic: {
    "role:religious-education-director": "Islamic Studies Director",
    "role:faith-studies-coordinator": "Islamic Studies Coordinator",
    "role:religious-teacher": "Islamic Studies Teacher",
    "role:religious-program-officer": "Islamic Programme Officer",
    "role:religious-activities-coordinator": "Islamic Activities Coordinator",
    "role:faith-counselor": "Islamic Guidance Counselor",
  },
  christian: {
    "role:religious-education-director": "Christian Religious Education Director",
    "role:faith-studies-coordinator": "Religious Education Coordinator",
    "role:religious-program-officer": "Faith Programme Officer",
    "role:religious-activities-coordinator": "Chapel Activities Coordinator",
  },
  secular: {
    "role:faith-studies-coordinator": "Ethics & Values Coordinator",
    "role:faith-counselor": "Values Counselor",
  },
  alternative: {
    "role:religious-education-director": "Institution Religious Director",
    "role:faith-studies-coordinator": "Belief & Values Coordinator",
  },
};

/** Display name for a role under a naming flavour (identity when none applies). */
export function roleDisplayName(
  role: EducationRealityRole,
  flavour: InstitutionReality["curriculumFlavour"],
): string {
  if (!flavour) return role.name;
  return NAMING_ALTERNATIVES[flavour]?.[role.id] ?? role.name;
}

/** Does the role fit the reality's education levels? */
function fitsEducationLevels(
  role: EducationRealityRole,
  levels: readonly EducationLevel[] | undefined,
): boolean {
  if (!levels || levels.length === 0) return true;
  if (role.educationLevels.includes("any")) return true;
  return role.educationLevels.some((level) => levels.includes(level));
}

/** Does the role fit the reality's jurisdictions? */
function fitsJurisdiction(
  role: EducationRealityRole,
  jurisdictions: readonly string[] | undefined,
): boolean {
  if (!jurisdictions || jurisdictions.length === 0) return true;
  if (role.jurisdictions.includes("*")) return true;
  return role.jurisdictions.some((jurisdiction) => jurisdictions.includes(jurisdiction));
}

function effectivePriority(
  role: EducationRealityRole,
  matchedFeature: boolean,
  matchedTemplate: boolean,
): RolePriority {
  if (matchedFeature || matchedTemplate) {
    return role.priority === "PRIMARY" ? "PRIMARY" : "SECONDARY";
  }
  return role.priority;
}

/**
 * Suggest the role set for an institution reality. Deterministic ordering:
 * category, then display name.
 */
export function suggestRolesForInstitution(
  reality: InstitutionReality,
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): RoleSuggestionSet {
  const features = new Set(reality.featureKeys);
  const templates = new Set(reality.templateRefs ?? []);
  const suggestions: SuggestedRole[] = [];

  for (const role of roles) {
    if (!fitsEducationLevels(role, reality.educationLevels)) continue;
    if (!fitsJurisdiction(role, reality.jurisdictions)) continue;

    const matchedFeature = role.featureScope.some((key) => features.has(key));
    const matchedTemplate = role.templateRefs.some((id) => templates.has(id));
    const specialScope = role.featureScope.length > 0 || role.templateRefs.length > 0;

    // A specialist role for a reality the institution does not have is never suggested.
    if (specialScope && !matchedFeature && !matchedTemplate) continue;

    const rationale: string[] = [];
    for (const key of role.featureScope) if (features.has(key)) rationale.push(`feature:${key}`);
    for (const id of role.templateRefs) if (templates.has(id)) rationale.push(`template:${id}`);
    if (rationale.length === 0) rationale.push("universal-role");

    suggestions.push({
      role,
      displayName: roleDisplayName(role, reality.curriculumFlavour),
      priority: effectivePriority(role, matchedFeature, matchedTemplate),
      rationale,
    });
  }

  const sort = (left: SuggestedRole, right: SuggestedRole) =>
    left.role.category.localeCompare(right.role.category) ||
    left.displayName.localeCompare(right.displayName);
  const byPriority = (priority: RolePriority) =>
    suggestions.filter((suggestion) => suggestion.priority === priority).sort(sort);

  return {
    reality,
    primary: byPriority("PRIMARY"),
    secondary: byPriority("SECONDARY"),
    optional: byPriority("OPTIONAL"),
    total: suggestions.length,
  };
}

/** Workspaces a suggested role set unlocks (union, deterministic order). */
export function workspacesForSuggestions(
  suggestions: RoleSuggestionSet,
): readonly RoleWorkspaceKey[] {
  const all = [...suggestions.primary, ...suggestions.secondary, ...suggestions.optional].flatMap(
    (suggestion) => suggestion.role.workspaceRequirements,
  );
  return [...new Set(all)].sort();
}

/** All suggested role ids (primary + secondary + optional). */
export function suggestedRoleIds(suggestions: RoleSuggestionSet): readonly string[] {
  return [...suggestions.primary, ...suggestions.secondary, ...suggestions.optional].map(
    (suggestion) => suggestion.role.id,
  );
}

/** Resolve stored role ids back to definitions (unknown ids are ignored). */
export function rolesFromIds(ids: readonly string[]): EducationRealityRole[] {
  return ids
    .map((id) => roleById(id))
    .filter((role): role is EducationRealityRole => role !== undefined);
}
