/**
 * Sherivs Scholar — community mode & school networks (Phase-04 §91–93).
 *
 * Schools may operate community learning centres or shared facilities (§91);
 * a facility may serve multiple programmes/classes/institutions (§92); a
 * network may share curriculum, teachers, facilities, policies and resources
 * WITHOUT violating tenant boundaries (§93). Sharing is governed by explicit
 * agreements — no agreement, no share.
 */

export type ShareableKind = "curriculum" | "teachers" | "facilities" | "policies" | "resources";

export const SHAREABLE_KINDS: readonly ShareableKind[] = [
  "curriculum",
  "teachers",
  "facilities",
  "policies",
  "resources",
] as const;

export interface CommunityAgreement {
  id: string;
  /** Owning tenant (the one whose assets may be shared). */
  ownerTenantId: string;
  /** Guest tenants permitted to consume shared assets. */
  guestTenantIds: string[];
  sharedKinds: ShareableKind[];
  status: "active" | "suspended";
}

export function validateCommunityAgreements(input: readonly CommunityAgreement[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const agreement of input) {
    const id = agreement.id.trim();
    if (!id) {
      issues.push("a community agreement requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate community agreement id "${id}"`);
    ids.add(id);
    if (!agreement.ownerTenantId.trim())
      issues.push(`agreement "${id}": ownerTenantId is required`);
    if (agreement.guestTenantIds.some((guest) => guest === agreement.ownerTenantId)) {
      issues.push(`agreement "${id}": owner cannot also be a guest tenant`);
    }
    if (agreement.guestTenantIds.length === 0) {
      issues.push(`agreement "${id}": at least one guest tenant is required`);
    }
    for (const kind of agreement.sharedKinds) {
      if (!SHAREABLE_KINDS.includes(kind)) {
        issues.push(`agreement "${id}": shared kind must be one of ${SHAREABLE_KINDS.join(", ")}`);
      }
    }
    if (agreement.status !== "active" && agreement.status !== "suspended") {
      issues.push(`agreement "${id}": status must be active or suspended`);
    }
  }
  return issues;
}

/**
 * §93: an asset of kind K owned by tenant A may be consumed by tenant B only
 * when an ACTIVE agreement names B as a guest and K as shared.
 */
export function mayShare(
  agreement: CommunityAgreement | undefined,
  ownerTenantId: string,
  guestTenantId: string,
  kind: ShareableKind,
): boolean {
  if (!agreement || agreement.status !== "active") return false;
  if (agreement.ownerTenantId !== ownerTenantId) return false;
  if (!agreement.guestTenantIds.includes(guestTenantId)) return false;
  return agreement.sharedKinds.includes(kind);
}
