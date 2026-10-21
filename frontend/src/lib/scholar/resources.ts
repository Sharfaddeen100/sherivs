/**
 * Sherivs Scholar — resource management + inventory relationship
 * (Phase-04 §64–65).
 *
 * Resources include books, devices, furniture, equipment, tools, vehicles and
 * laboratory assets. §65: full inventory belongs to the appropriate operational
 * subsystem — this runtime references a resource's EDUCATIONAL USE only.
 */

export type ResourceKind =
  | "book"
  | "device"
  | "furniture"
  | "equipment"
  | "tool"
  | "vehicle"
  | "laboratory_asset"
  | "custom";

export const RESOURCE_KINDS: readonly ResourceKind[] = [
  "book",
  "device",
  "furniture",
  "equipment",
  "tool",
  "vehicle",
  "laboratory_asset",
  "custom",
] as const;

export interface ManagedResource {
  id: string;
  kind: ResourceKind;
  name: string;
  quantity?: number | null;
  locationRef?: string | null;
  /** Educational use reference (§65) — never a duplicate inventory ledger. */
  educationalUseRef?: string | null;
}

export function validateResources(input: readonly ManagedResource[]): string[] {
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
    if (!RESOURCE_KINDS.includes(resource.kind)) {
      issues.push(`resource "${id}": kind must be one of ${RESOURCE_KINDS.join(", ")}`);
    }
    if (
      resource.quantity != null &&
      (!Number.isInteger(resource.quantity) || resource.quantity < 0)
    ) {
      issues.push(`resource "${id}": quantity must be a non-negative integer when provided`);
    }
  }
  return issues;
}
