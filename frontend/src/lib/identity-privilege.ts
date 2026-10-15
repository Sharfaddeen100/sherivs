/**
 * SHERIVS-001 — application-layer identity privilege boundary.
 *
 * Database enforcement (proposed migration
 * `20261015000010_sherivs_identity_privilege_freeze.sql.proposed`) is the
 * independent authorization layer. This module is the application agreement:
 * self-service and client-shaped patches cannot carry privilege-bearing
 * columns, and HR updates cannot reassign school_id.
 *
 * Fail closed. Do not guess actor or target identity.
 */
import { z } from "zod";

export const PRIVILEGED_USER_COLUMNS = [
  "role",
  "school_id",
  "is_active",
] as const;

export type PrivilegedUserColumn = (typeof PRIVILEGED_USER_COLUMNS)[number];

const PRIVILEGED_SET = new Set<string>(PRIVILEGED_USER_COLUMNS);

export const HR_STAFF_PATCH_COLUMNS = [
  "full_name",
  "email",
  "phone",
  "role",
  "subject_specialty",
  "employment_type",
  "salary",
  "date_enrolled",
  "is_active",
  "avatar_url",
] as const;

const HR_ALLOWED = new Set<string>(HR_STAFF_PATCH_COLUMNS);

export const IDENTITY_PRIVILEGE_REASONS = {
  privilegedProfileField: "Forbidden: profile updates cannot change identity or membership fields",
  schoolReassignment: "Forbidden: school assignment cannot be changed through this update",
  selfRole: "Forbidden: cannot change your own role",
  selfActive: "Forbidden: cannot change your own account active state",
  actorUnresolved: "Forbidden: actor identity is unresolved",
  targetUnresolved: "Forbidden: target identity is unresolved",
  unknownField: "Forbidden: unrecognized user field",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function privilegedKeysIn(value: unknown): string[] {
  if (!isRecord(value)) return [];
  return Object.keys(value).filter((key) => PRIVILEGED_SET.has(key));
}

export function assertNoPrivilegedProfileKeys(value: unknown): void {
  const keys = privilegedKeysIn(value);
  if (keys.length > 0) {
    throw new Error(IDENTITY_PRIVILEGE_REASONS.privilegedProfileField);
  }
}

const SelfProfilePatch = z
  .object({
    full_name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    address: z.string().trim().max(400).nullable().optional(),
    emergency_contact_name: z.string().trim().max(120).nullable().optional(),
    emergency_contact: z.string().trim().max(40).nullable().optional(),
    avatar_url: z.string().trim().url().nullable().optional(),
  })
  .strict();

export function parseSelfProfilePatch(input: unknown) {
  assertNoPrivilegedProfileKeys(input);
  return SelfProfilePatch.parse(input);
}

export type HrStaffPatchInput = {
  actorId: string | null | undefined;
  targetId: string | null | undefined;
  patch: unknown;
  currentRole?: string | null;
  currentActive?: boolean | null;
};

export type HrStaffPatch = Partial<{
  full_name: unknown;
  email: unknown;
  phone: unknown;
  role: unknown;
  subject_specialty: unknown;
  employment_type: unknown;
  salary: unknown;
  date_enrolled: unknown;
  is_active: unknown;
  avatar_url: unknown;
}>;

/**
 * Allowlist an HR staff UPDATE and refuse privilege-bearing self-mutation.
 * school_id is never a legitimate HR field. Role / is_active may be set on
 * another user in the actor's school; they may not be changed on self.
 */
export function parseHrStaffPatch(input: HrStaffPatchInput): HrStaffPatch {
  const actorId = input.actorId?.trim() ?? "";
  const targetId = input.targetId?.trim() ?? "";
  if (!actorId) {
    throw new Error(IDENTITY_PRIVILEGE_REASONS.actorUnresolved);
  }
  if (!targetId) {
    throw new Error(IDENTITY_PRIVILEGE_REASONS.targetUnresolved);
  }
  if (!isRecord(input.patch)) {
    throw new Error(IDENTITY_PRIVILEGE_REASONS.unknownField);
  }

  if (Object.prototype.hasOwnProperty.call(input.patch, "school_id")) {
    throw new Error(IDENTITY_PRIVILEGE_REASONS.schoolReassignment);
  }

  const outbound: HrStaffPatch = {};
  for (const [key, value] of Object.entries(input.patch)) {
    if (key === "id") continue;
    if (!HR_ALLOWED.has(key)) {
      throw new Error(IDENTITY_PRIVILEGE_REASONS.unknownField);
    }
    outbound[key as keyof HrStaffPatch] = value;
  }

  const self = actorId === targetId;
  if (self) {
    if (
      Object.prototype.hasOwnProperty.call(outbound, "role") &&
      input.currentRole != null &&
      outbound.role !== input.currentRole
    ) {
      throw new Error(IDENTITY_PRIVILEGE_REASONS.selfRole);
    }
    if (
      Object.prototype.hasOwnProperty.call(outbound, "is_active") &&
      input.currentActive != null &&
      outbound.is_active !== input.currentActive
    ) {
      throw new Error(IDENTITY_PRIVILEGE_REASONS.selfActive);
    }
    delete outbound.role;
    delete outbound.is_active;
  }

  return outbound;
}

export function assertNotSelfAccountStatusChange(actorId: string, targetId: string): void {
  const actor = actorId.trim();
  const target = targetId.trim();
  if (!actor) {
    throw new Error(IDENTITY_PRIVILEGE_REASONS.actorUnresolved);
  }
  if (!target) {
    throw new Error(IDENTITY_PRIVILEGE_REASONS.targetUnresolved);
  }
  if (actor === target) {
    throw new Error(IDENTITY_PRIVILEGE_REASONS.selfActive);
  }
}
