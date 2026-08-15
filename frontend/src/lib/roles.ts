/**
 * Maps DB role -> portal dashboard path.
 * Used by the `_authenticated/index.tsx` redirector and the auth flow.
 */
export type AppRole =
  | "super_admin"
  | "hq"
  | "admin"
  | "principal"
  | "teacher"
  | "bursar"
  | "parent"
  | "student"
  | "driver";

export function dashboardPathForRole(role: AppRole): string {
  switch (role) {
    case "super_admin":
      return "/super-admin/dashboard";
    case "hq":
      return "/hq/dashboard";
    case "admin":
    case "principal":
      return "/admin/dashboard";
    case "teacher":
      return "/teacher/dashboard";
    case "bursar":
      return "/bursar/dashboard";
    case "parent":
      return "/parent/dashboard";
    case "student":
      return "/student/dashboard";
    case "driver":
      return "/driver/dashboard";
  }
}

export const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: "Super Admin",
  hq: "HQ",
  admin: "School Admin",
  principal: "Principal",
  teacher: "Teacher",
  bursar: "Bursar",
  parent: "Parent",
  student: "Student",
  driver: "Bus Driver",
};
