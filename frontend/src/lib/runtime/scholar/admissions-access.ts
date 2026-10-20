/**
 * Admissions-area access rule (pure). Mirrors the database predicate
 * public.can_manage_admissions(): school admin / principal, or an active
 * `registrar` workforce position. A registrar gets the admissions page ONLY;
 * every other /admin path stays admin/principal. This is chrome/UX — the
 * database RLS on admission_applications remains the enforcement layer.
 */
import type { AppRole } from "@/lib/roles";
import type { WorkspaceNavSection } from "@/lib/workspace-engine/navigation";

export const ADMISSIONS_PATH = "/admin/admissions";
export const ADMIN_ROLES: readonly AppRole[] = ["admin", "principal"];

export function isAdmissionsPath(pathname: string): boolean {
  return pathname === ADMISSIONS_PATH || pathname.startsWith(`${ADMISSIONS_PATH}/`);
}

export type AdminAccessInput = {
  role: AppRole | null;
  superAdmin: boolean;
  pathname: string;
  /** Result of the can_manage_admissions() RPC; null while unresolved. */
  canManageAdmissions: boolean | null;
};

export type AdminAccessDecision = "allow" | "deny" | "pending";

export function decideAdminAreaAccess(input: AdminAccessInput): AdminAccessDecision {
  if (input.superAdmin) return "allow";
  if (!input.role) return "deny";
  if (ADMIN_ROLES.includes(input.role)) return "allow";
  if (!isAdmissionsPath(input.pathname)) return "deny";
  if (input.role === "parent" || input.role === "student") return "deny";
  if (input.canManageAdmissions === null) return "pending";
  return input.canManageAdmissions ? "allow" : "deny";
}

/** Single-item nav appended for non-admin staff that may manage admissions. */
export function admissionsOnlyNav(role: AppRole | null, canManageAdmissions: boolean): WorkspaceNavSection[] {
  if (!role || ADMIN_ROLES.includes(role) || !canManageAdmissions) return [];
  return [
    {
      sectionKey: "registrar.admissions",
      sectionLabel: "Admissions",
      runtimeRef: "runtime:scholar",
      iconKey: "administration",
      collapsible: false,
      items: [
        {
          key: "r001.org_admin.admissions",
          label: "Admissions",
          iconKey: "signin",
          url: ADMISSIONS_PATH,
          capabilities: [],
          orderHint: 0,
          runtimeRef: "runtime:scholar",
        },
      ],
    },
  ];
}
