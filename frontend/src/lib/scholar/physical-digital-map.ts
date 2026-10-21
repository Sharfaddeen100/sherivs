/**
 * Sherivs Scholar — physical ↔ digital mapping (Phase-04 §70).
 *
 * Every supported physical entity should carry a digital identity/reference.
 * This module records those mappings as pure configuration. The authoritative
 * twin representation belongs to Phase 16 — a mapping here only points at the
 * digital identity the runtime may consume.
 */

export type DigitalReferenceKind = "cg_entity" | "cg_identity" | "device" | "twin";

export const DIGITAL_REFERENCE_KINDS: readonly DigitalReferenceKind[] = [
  "cg_entity",
  "cg_identity",
  "device",
  "twin",
] as const;

export interface PhysicalDigitalMapping {
  physicalEntityId: string;
  /** Physical entity kind is institution vocabulary (room, bus, farm plot…). */
  physicalEntityKind: string;
  digitalEntityId: string;
  digitalRefKind: DigitalReferenceKind;
  tenantId?: string | null;
}

export function validatePhysicalDigitalMappings(
  input: readonly PhysicalDigitalMapping[],
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const mapping of input) {
    if (!mapping.physicalEntityId.trim() || !mapping.digitalEntityId.trim()) {
      issues.push("a mapping requires physicalEntityId and digitalEntityId");
      continue;
    }
    if (mapping.physicalEntityId === mapping.digitalEntityId) {
      issues.push(`mapping "${mapping.physicalEntityId}" cannot reference itself`);
    }
    const key = `${mapping.physicalEntityId}::${mapping.digitalEntityId}`;
    if (seen.has(key)) issues.push(`duplicate mapping "${key}"`);
    seen.add(key);
    if (!mapping.physicalEntityKind.trim())
      issues.push(`mapping "${mapping.physicalEntityId}": physicalEntityKind is required`);
    if (!DIGITAL_REFERENCE_KINDS.includes(mapping.digitalRefKind)) {
      issues.push(
        `mapping "${mapping.physicalEntityId}": digitalRefKind must be one of ${DIGITAL_REFERENCE_KINDS.join(", ")}`,
      );
    }
  }
  return issues;
}
