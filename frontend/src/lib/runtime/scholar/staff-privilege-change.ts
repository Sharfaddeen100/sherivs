/**
 * Pure decision for a staff privilege change (role / is_active) performed by a
 * school admin through the server path. The DB freeze trigger lets only the
 * service_role change these columns, so this decision is the application gate.
 * No I/O. school_id is never part of the resulting patch.
 */

/**
 * Staff roles that may be assigned. Intersection of the DB users.role CHECK
 * (20260626150625: admin, principal, teacher, bursar, driver, ...) and the HR
 * STAFF_ROLES list. super_admin / student / parent / hq / alumni never appear.
 */
export const ASSIGNABLE_STAFF_ROLES = [
  "teacher",
  "admin",
  "principal",
  "bursar",
  "driver",
] as const;

export type AssignableStaffRole = (typeof ASSIGNABLE_STAFF_ROLES)[number];

const ASSIGNABLE = new Set<string>(ASSIGNABLE_STAFF_ROLES);

export type StaffPrivilegeDenyCode =
  | "NOT_AUTHENTICATED"
  | "NOT_SCHOOL_ADMIN"
  | "TARGET_NOT_FOUND"
  | "CROSS_SCHOOL"
  | "SELF_CHANGE"
  | "INVALID_ROLE"
  | "TARGET_NOT_STAFF"
  | "EMPTY_CHANGE";

export type StaffPrivilegeTarget = {
  id: string;
  schoolId: string | null;
  role: string | null;
  isActive: boolean | null;
};

export type StaffPrivilegeInput = {
  actorId: string | null | undefined;
  actorSchoolId: string | null | undefined;
  actorIsSchoolAdmin: boolean;
  actorActive: boolean;
  target: StaffPrivilegeTarget | null;
  change: { role?: string; isActive?: boolean };
};

export type StaffPrivilegePatch = { role?: string; is_active?: boolean };

export type StaffPrivilegeDecision =
  | { ok: true; patch: StaffPrivilegePatch }
  | { ok: false; code: StaffPrivilegeDenyCode; message: string };

const deny = (code: StaffPrivilegeDenyCode, message: string): StaffPrivilegeDecision => ({
  ok: false,
  code,
  message,
});

export function decideStaffPrivilegeChange(input: StaffPrivilegeInput): StaffPrivilegeDecision {
  if (!input.actorId?.trim()) return deny("NOT_AUTHENTICATED", "Authentication required");
  if (!input.actorIsSchoolAdmin || !input.actorActive) {
    return deny("NOT_SCHOOL_ADMIN", "Only an active school admin may change staff privileges");
  }
  const target = input.target;
  if (!target) return deny("TARGET_NOT_FOUND", "Target user not found");
  if (!input.actorSchoolId || !target.schoolId || target.schoolId !== input.actorSchoolId) {
    return deny("CROSS_SCHOOL", "Target user is outside your school");
  }
  if (input.actorId === target.id) {
    return deny("SELF_CHANGE", "You cannot change your own role or active state");
  }
  const { role, isActive } = input.change;
  if (role === undefined && isActive === undefined) {
    return deny("EMPTY_CHANGE", "No privilege change requested");
  }
  if (role !== undefined && !ASSIGNABLE.has(role)) {
    return deny("INVALID_ROLE", "Role is not an assignable staff role");
  }
  if (!target.role || !ASSIGNABLE.has(target.role)) {
    return deny("TARGET_NOT_STAFF", "Target user is not a staff member");
  }
  const patch: StaffPrivilegePatch = {};
  if (role !== undefined) patch.role = role;
  if (isActive !== undefined) patch.is_active = isActive;
  return { ok: true, patch };
}
