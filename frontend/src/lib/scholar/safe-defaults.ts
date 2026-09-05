/**
 * CoreGrid Scholar — safe defaults + no-assumption state (Phase-04 §161–162).
 *
 * Safe defaults are TRANSPARENT, EDITABLE and NON-DESTRUCTIVE — and they never
 * invent an institution structure. If the system does not know something it
 * must not invent it (§162): an institution's configuration is explicitly
 * 'unknown' until the administrator provides its real operating model through
 * the School Builder (A3).
 */

import { validateInstitutionConfiguration } from "./config-validator";
import { emptyBuildParts, buildSchoolSpec, type SchoolBuildSpec } from "./school-builder";

export type InstitutionConfigState =
  "unknown" | "draft" | "review" | "approved" | "active" | "suspended";

export const CONFIG_STATE_TRANSITIONS: Record<
  InstitutionConfigState,
  readonly InstitutionConfigState[]
> = {
  unknown: ["draft"],
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["active", "review", "suspended"],
  active: ["suspended"],
  suspended: ["active"],
} as const;

export function canTransitionConfigState(
  from: InstitutionConfigState,
  to: InstitutionConfigState,
): boolean {
  return CONFIG_STATE_TRANSITIONS[from].includes(to);
}

/** Transparent starting point: NO structural assumptions are injected. */
export function transparentDefaultParts() {
  return emptyBuildParts();
}

/** An institution with no configured structure is explicitly 'unknown'. */
export function configurationState(spec: SchoolBuildSpec | undefined): InstitutionConfigState {
  if (!spec) return "unknown";
  const validation = validateInstitutionConfiguration(spec);
  if (!validation.ok) return "unknown";
  if (spec.levels.length === 0 || spec.programmes.length === 0) return "unknown";
  return "draft";
}

/** Non-destructive explanation of what IS configured vs what stays unknown. */
export function describeConfiguration(spec: SchoolBuildSpec | undefined): {
  state: InstitutionConfigState;
  configured: string[];
  unknown: string[];
} {
  const configured: string[] = [];
  const unknown: string[] = [];
  if (!spec) {
    return {
      state: "unknown",
      configured: [],
      unknown: ["educational levels", "programme hierarchy"],
    };
  }
  if (spec.levels.length > 0) configured.push("educational levels");
  else unknown.push("educational levels");
  if (spec.programmes.length > 0) configured.push("programme hierarchy");
  else unknown.push("programme hierarchy");
  if (Array.isArray(spec.campuses) && spec.campuses.length > 0) configured.push("campuses");
  else unknown.push("campuses");
  if (Array.isArray(spec.shifts) && spec.shifts.length > 0) configured.push("shifts");
  if (spec.languages != null && Array.isArray(spec.languages) && spec.languages.length > 0) {
    configured.push("languages");
  }
  return { state: configurationState(spec), configured, unknown };
}

/** Build the transparent default spec (validated) or the issues it raises. */
export function transparentDefaultSpec() {
  return buildSchoolSpec(transparentDefaultParts());
}
