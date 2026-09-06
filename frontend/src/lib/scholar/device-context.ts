/**
 * CoreGrid Scholar — device context (Phase-04 §66–68).
 *
 * Every device may have an identity, owner, location (institution/block/room),
 * purpose and network context (§66). Devices communicate with users, rooms,
 * sensors, systems and workflows ONLY according to authorization (§68). The
 * authoritative digital-twin representation belongs to Phase 16 (§67) — this
 * module models the educational device context, never the twin.
 */

export type DevicePartnerKind = "user" | "room" | "sensor" | "system" | "workflow";

export const DEVICE_PARTNER_KINDS: readonly DevicePartnerKind[] = [
  "user",
  "room",
  "sensor",
  "system",
  "workflow",
] as const;

export interface DeviceContext {
  deviceId: string;
  ownerIdentityId?: string | null;
  institution?: string | null;
  blockId?: string | null;
  roomId?: string | null;
  purpose?: string | null;
  networkContext?: string | null;
}

export interface DeviceRelationship {
  deviceId: string;
  partnerKind: DevicePartnerKind;
  partnerId: string;
  /** §68: communication is allowed only where authorization says so. */
  authorized: boolean;
}

export function validateDeviceContexts(input: readonly DeviceContext[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const device of input) {
    const id = device.deviceId.trim();
    if (!id) {
      issues.push("a device context requires a deviceId");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate device id "${id}"`);
    ids.add(id);
    if (device.ownerIdentityId != null && !device.ownerIdentityId.trim()) {
      issues.push(`device "${id}": ownerIdentityId must not be blank when provided`);
    }
  }
  return issues;
}

export function validateDeviceRelationships(input: readonly DeviceRelationship[]): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const relationship of input) {
    if (!relationship.deviceId.trim() || !relationship.partnerId.trim()) {
      issues.push("a device relationship requires deviceId and partnerId");
      continue;
    }
    const key = `${relationship.deviceId}::${relationship.partnerKind}::${relationship.partnerId}`;
    if (seen.has(key)) issues.push(`duplicate device relationship "${key}"`);
    seen.add(key);
    if (!DEVICE_PARTNER_KINDS.includes(relationship.partnerKind)) {
      issues.push(`partnerKind must be one of ${DEVICE_PARTNER_KINDS.join(", ")}`);
    }
  }
  return issues;
}
