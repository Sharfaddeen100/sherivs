/**
 * CoreGrid Scholar — facility digital-twin binding (Phase 16 consumption).
 *
 * Scholar CONSUMES the domain-neutral Phase-16 twin contracts: twin KINDS,
 * observation SOURCES and observation QUALITIES are the kernel vocabulary.
 * Scholar contributes only its facility metric map and binding rules; it never
 * redefines the twin model. Unknown metrics/sources fail closed.
 */
import { TWIN_KINDS, type TwinKind } from "@/lib/twin-core";
import {
  OBSERVATION_SOURCES,
  type ObservationQuality,
  type ObservationSource,
} from "@/lib/twin-state";

/** Facility-facing twin kinds (all exist in the kernel TwinKind vocabulary). */
export const SCHOLAR_FACILITY_TWIN_KINDS: readonly TwinKind[] = [
  "classroom",
  "laboratory",
  "room",
  "building",
  "facility",
  "campus",
  "asset",
  "infrastructure",
  "operational_environment",
];

export const SCHOLAR_FACILITY_METRICS = [
  "occupancy",
  "temperature",
  "power",
  "water",
  "maintenance",
  "availability",
] as const;
export type ScholarFacilityMetric = (typeof SCHOLAR_FACILITY_METRICS)[number];

/** Facility metric → twin attribute binding (Scholar data). */
export const FACILITY_METRIC_ATTRIBUTE: Readonly<Record<ScholarFacilityMetric, string>> = {
  occupancy: "occupancy_count",
  temperature: "temperature_c",
  power: "power_status",
  water: "water_status",
  maintenance: "maintenance_state",
  availability: "availability",
};

/** Observation sources a school facility can legitimately produce. */
export const SCHOLAR_FACILITY_SOURCES: readonly ObservationSource[] = [
  "hardware",
  "human_input",
  "manual_inspection",
  "application",
  "external_api",
];

export function facilityTwinAttribute(metric: string): string | null {
  return FACILITY_METRIC_ATTRIBUTE[metric as ScholarFacilityMetric] ?? null;
}

export function isFacilityObservationSource(source: string): boolean {
  return (
    (OBSERVATION_SOURCES as readonly string[]).includes(source) &&
    (SCHOLAR_FACILITY_SOURCES as readonly string[]).includes(source)
  );
}

export function isFacilityTwinKind(kind: string): boolean {
  return (SCHOLAR_FACILITY_TWIN_KINDS as readonly string[]).includes(kind);
}

/** Freshness/validity rules over the kernel quality vocabulary. */
export function qualityForFacilityObservation(input: {
  source: string;
  ageMs: number;
  stalenessMs: number;
}): ObservationQuality {
  if (!isFacilityObservationSource(input.source)) return "INVALID";
  if (input.ageMs > input.stalenessMs) return "STALE";
  return "VALID";
}

/** Kernel-kind validation of the whole facility binding (used by tests + init). */
export function auditFacilityTwinBinding(): string[] {
  const issues: string[] = [];
  for (const kind of SCHOLAR_FACILITY_TWIN_KINDS) {
    if (!(TWIN_KINDS as readonly string[]).includes(kind)) issues.push(`unknown twin kind ${kind}`);
  }
  for (const source of SCHOLAR_FACILITY_SOURCES) {
    if (!(OBSERVATION_SOURCES as readonly string[]).includes(source)) {
      issues.push(`unknown observation source ${source}`);
    }
  }
  return issues;
}
