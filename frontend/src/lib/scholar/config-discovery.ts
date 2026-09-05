/**
 * CoreGrid Scholar — adaptive configuration discovery (Phase-04 §159–160).
 *
 * The system asks the administrator only for information that cannot be safely
 * inferred (§159) and progressively discovers complexity as the institution
 * activates capabilities (§160). This module derives, from the CURRENT build
 * parts, (a) what is already detectable, and (b) the minimal set of unknowns
 * that genuinely require an answer — it never invents values (§162).
 */

import type { SchoolBuildSpec } from "./school-builder";

export type ScholarCapability =
  | "structure"
  | "curriculum"
  | "attendance"
  | "assessment"
  | "boarding"
  | "transport"
  | "facilities";

export interface DiscoveryReport {
  detected: ScholarCapability[];
  /** Configuration still genuinely required before activation. */
  required: string[];
  /** Open questions the administrator must answer (not inferred). */
  openQuestions: string[];
}

/**
 * Derive the discovery report from a build spec. Structure is the entry gate:
 * until levels + programme hierarchy exist, nothing else is inferred.
 */
export function discover(spec: SchoolBuildSpec | undefined): DiscoveryReport {
  const detected: ScholarCapability[] = [];
  const required: string[] = [];
  const openQuestions: string[] = [];

  const hasLevels = !!spec && spec.levels.length > 0;
  const hasProgrammes = !!spec && spec.programmes.length > 0;

  if (hasLevels && hasProgrammes) {
    detected.push("structure");
  } else {
    if (!hasLevels) {
      required.push("educational levels");
      openQuestions.push("What educational levels does the institution operate?");
    }
    if (!hasProgrammes) {
      required.push("programme hierarchy");
      openQuestions.push("What programmes/hierarchy structure does the institution use?");
    }
    return { detected, required, openQuestions };
  }

  if (spec) {
    if (Array.isArray(spec.shifts) && spec.shifts.length > 1) {
      detected.push("attendance"); // multi-shift implies shift-aware attendance
    }
    if (Array.isArray(spec.campuses) && spec.campuses.length > 0) {
      detected.push("facilities"); // campus presence implies facilities lifecycle
    }
    if (spec.policies.transport_enabled === true) detected.push("transport");
    if (spec.policies.boarding_enabled === true) detected.push("boarding");
  }

  if (detected.includes("attendance")) {
    openQuestions.push("Should attendance operate per shift or institution-wide?");
  }
  return { detected, required, openQuestions };
}

/** Progressive capability registry — each entry is activated only when detected. */
export const SCHOLAR_CAPABILITIES: readonly ScholarCapability[] = [
  "structure",
  "curriculum",
  "attendance",
  "assessment",
  "boarding",
  "transport",
  "facilities",
] as const;
