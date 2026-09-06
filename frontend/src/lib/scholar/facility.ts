/**
 * CoreGrid Scholar — school facilities + declared capabilities
 * (Phase-04 §59, 63, upgrade target of education-facilities).
 *
 * Facilities are typed configuration (classroom, laboratory, workshop,
 * library, office, hall, dormitory, clinic, cafeteria, kitchen, farm, sports
 * field, prayer facility, mosque, church, community centre, custom) and every
 * facility may DECLARE capabilities (§63). Nothing is assumed about what a
 * room can do — the institution declares it.
 */

export type FacilityKind =
  | "classroom"
  | "laboratory"
  | "workshop"
  | "library"
  | "office"
  | "hall"
  | "dormitory"
  | "clinic"
  | "cafeteria"
  | "kitchen"
  | "farm"
  | "sports_field"
  | "prayer_facility"
  | "mosque"
  | "church"
  | "community_centre"
  | "custom";

export const FACILITY_KINDS: readonly FacilityKind[] = [
  "classroom",
  "laboratory",
  "workshop",
  "library",
  "office",
  "hall",
  "dormitory",
  "clinic",
  "cafeteria",
  "kitchen",
  "farm",
  "sports_field",
  "prayer_facility",
  "mosque",
  "church",
  "community_centre",
  "custom",
] as const;

export interface Facility {
  id: string;
  name: string;
  kind: FacilityKind;
  campus?: string | null;
  capacity?: number | null;
  /** Declared capabilities (§63) — free-form because institutions differ. */
  capabilities?: string[];
}

export function validateFacilities(input: readonly Facility[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const facility of input) {
    const id = facility.id.trim();
    if (!id) {
      issues.push("a facility requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate facility id "${id}"`);
    ids.add(id);
    if (!facility.name.trim()) issues.push(`facility "${id}": name is required`);
    if (!FACILITY_KINDS.includes(facility.kind)) {
      issues.push(`facility "${id}": kind must be one of ${FACILITY_KINDS.join(", ")}`);
    }
    if (
      facility.capacity != null &&
      (!Number.isInteger(facility.capacity) || facility.capacity < 1)
    ) {
      issues.push(`facility "${id}": capacity must be a positive integer when provided`);
    }
    if (facility.capabilities?.some((c) => !c.trim())) {
      issues.push(`facility "${id}": capability declarations must not be blank`);
    }
  }
  return issues;
}
