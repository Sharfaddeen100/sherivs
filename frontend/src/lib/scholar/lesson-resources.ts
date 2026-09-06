/**
 * CoreGrid Scholar — lesson resources (Phase-04 §46).
 *
 * Resources may include textbooks, digital content, laboratory equipment,
 * devices, worksheets, videos, simulations and physical materials — all
 * configuration. Quantities are optional; nothing is assumed about how an
 * institution stocks its resources.
 */

export type LessonResourceKind =
  | "textbook"
  | "digital"
  | "laboratory_equipment"
  | "device"
  | "worksheet"
  | "video"
  | "simulation"
  | "physical_material"
  | "custom";

export const LESSON_RESOURCE_KINDS: readonly LessonResourceKind[] = [
  "textbook",
  "digital",
  "laboratory_equipment",
  "device",
  "worksheet",
  "video",
  "simulation",
  "physical_material",
  "custom",
] as const;

export interface LessonResource {
  id: string;
  kind: LessonResourceKind;
  name: string;
  subjectCode?: string | null;
  quantity?: number | null;
  location?: string | null;
}

export type LessonResourcesValidation =
  { ok: true; resources: LessonResource[] } | { ok: false; issues: string[] };

export function validateLessonResources(
  input: readonly LessonResource[],
): LessonResourcesValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const resource of input) {
    const id = resource.id.trim();
    if (!id) {
      issues.push("a resource requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate resource id "${id}"`);
    ids.add(id);
    if (!resource.name.trim()) issues.push(`resource "${id}": name is required`);
    if (!LESSON_RESOURCE_KINDS.includes(resource.kind)) {
      issues.push(`resource "${id}": kind must be one of ${LESSON_RESOURCE_KINDS.join(", ")}`);
    }
    if (
      resource.quantity != null &&
      (!Number.isInteger(resource.quantity) || resource.quantity < 0)
    ) {
      issues.push(`resource "${id}": quantity must be a non-negative integer when provided`);
    }
  }

  return issues.length === 0 ? { ok: true, resources: [...input] } : { ok: false, issues };
}
