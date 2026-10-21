/**
 * Sherivs Scholar — school reality validator + reality drift detection
 * (Phase-04 §163–165).
 *
 * Configured reality (the SchoolBuildSpec) must be continuously evaluated
 * against OPERATIONAL reality (events, device observations, user reports,
 * authorized sensor data). When a configured reality diverges — the classic
 * example being a laboratory configured as available but repeatedly reported
 * unavailable (§164) — the drift is surfaced, never silently accepted.
 *
 * Honest unknowns: categories with no operational data yet report
 * consistent=null (no assumption, §162) until their cluster provides checks.
 */

import type { SchoolBuildSpec } from "./school-builder";
import { validateInstitutionConfiguration } from "./config-validator";

/** Repeated negative reports required before operational drift is declared. */
export const DRIFT_THRESHOLD = 3;

export interface FacilityObservation {
  campus: string;
  facility: string;
  available: boolean;
  source?: string;
}

export type RealityCategory = "structure" | "scheduling" | "curriculum" | "facility" | "staffing";

export interface RealityCheck {
  category: RealityCategory;
  /** true/false, or null when the system genuinely has no data. */
  consistent: boolean | null;
  detail: string[];
}

export type DriftKind = "facility_reported_unavailable" | "facility_not_configured";

export interface RealityDrift {
  kind: DriftKind;
  campus: string;
  facility: string;
  evidenceCount: number;
  threshold: number;
  detail: string;
}

function campusNames(spec: SchoolBuildSpec | undefined): Set<string> {
  const names = new Set<string>();
  if (!spec || !Array.isArray(spec.campuses)) return names;
  for (const campus of spec.campuses) {
    const name = (campus as { name?: unknown }).name;
    if (typeof name === "string" && name.trim() !== "") names.add(name.trim());
  }
  return names;
}

/** Detect configured-vs-operational divergence from observation evidence. */
export function detectRealityDrift(
  spec: SchoolBuildSpec | undefined,
  observations: readonly FacilityObservation[],
): RealityDrift[] {
  const configured = campusNames(spec);
  const drift: RealityDrift[] = [];

  const unavailable = new Map<string, { campus: string; facility: string; count: number }>();
  for (const observation of observations) {
    if (observation.available) continue;
    const key = `${observation.campus}::${observation.facility}`;
    const existing = unavailable.get(key);
    if (existing) existing.count += 1;
    else
      unavailable.set(key, {
        campus: observation.campus,
        facility: observation.facility,
        count: 1,
      });
  }

  for (const entry of unavailable.values()) {
    if (entry.count < DRIFT_THRESHOLD) continue;
    const isConfigured = configured.has(entry.campus);
    if (!isConfigured) {
      drift.push({
        kind: "facility_not_configured",
        campus: entry.campus,
        facility: entry.facility,
        evidenceCount: entry.count,
        threshold: DRIFT_THRESHOLD,
        detail: `operational reality reports "${entry.campus}/${entry.facility}" but configuration does not include this campus`,
      });
    } else {
      drift.push({
        kind: "facility_reported_unavailable",
        campus: entry.campus,
        facility: entry.facility,
        evidenceCount: entry.count,
        threshold: DRIFT_THRESHOLD,
        detail: `"${entry.campus}/${entry.facility}" is configured as available but has been reported unavailable ${entry.count} times`,
      });
    }
  }

  return drift;
}

/** Continuous reality evaluation (§163): consistent / inconsistent / unknown. */
export function evaluateSchoolReality(
  spec: SchoolBuildSpec | undefined,
  observations: readonly FacilityObservation[] = [],
): RealityCheck[] {
  const checks: RealityCheck[] = [];

  if (!spec) {
    checks.push({
      category: "structure",
      consistent: null,
      detail: ["no institution configuration exists — reality state unknown"],
    });
    return checks;
  }

  // Structure + scheduling split from the A5 validator issue prefixes.
  const validation = validateInstitutionConfiguration(spec);
  const structural: string[] = [];
  const scheduling: string[] = [];
  for (const issue of validation.issues) {
    if (issue.startsWith("shifts:") || issue.startsWith("hours:")) scheduling.push(issue);
    else structural.push(issue);
  }
  checks.push({
    category: "structure",
    consistent: validation.ok ? true : structural.length === 0 ? true : false,
    detail: structural.length > 0 ? structural : ["educational structure is internally consistent"],
  });
  checks.push({
    category: "scheduling",
    consistent: validation.ok ? true : scheduling.length === 0 ? true : false,
    detail: scheduling.length > 0 ? scheduling : ["shift + hours configuration is consistent"],
  });

  // Curriculum + staffing checks arrive with their clusters (D/H); until then
  // they report honest "no data" — the system does not invent consistency.
  checks.push({
    category: "curriculum",
    consistent: null,
    detail: ["curriculum configuration not yet evaluated — awaits curriculum cluster (D)"],
  });
  checks.push({
    category: "staffing",
    consistent: null,
    detail: ["staffing reality not yet evaluated — awaits staffing cluster"],
  });

  const drift = detectRealityDrift(spec, observations);
  checks.push({
    category: "facility",
    consistent: drift.length === 0,
    detail:
      drift.length > 0
        ? drift.map((d) => d.detail)
        : ["no facility drift detected from operational observations"],
  });

  return checks;
}
