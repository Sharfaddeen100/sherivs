import { describe, expect, it } from "vitest";
import { dashboardPathForRole, ROLE_LABEL, type AppRole } from "./roles";

describe("dashboardPathForRole", () => {
  const cases: Array<[AppRole, string]> = [
    ["super_admin", "/super-admin/dashboard"],
    ["hq", "/hq/dashboard"],
    ["admin", "/admin/dashboard"],
    ["principal", "/admin/dashboard"],
    ["teacher", "/teacher/dashboard"],
    ["bursar", "/bursar/dashboard"],
    ["parent", "/parent/dashboard"],
    ["student", "/student/dashboard"],
    ["driver", "/driver/dashboard"],
  ];

  it.each(cases)("routes %s -> %s", (role, path) => {
    expect(dashboardPathForRole(role)).toBe(path);
  });

  it("has a label for every role that resolves to a dashboard", () => {
    for (const [role] of cases) {
      expect(ROLE_LABEL[role]).toBeTruthy();
      expect(dashboardPathForRole(role).startsWith("/")).toBe(true);
    }
  });

  it("returns a different dashboard when a user's role is changed", () => {
    // Simulates: admin demotes themselves to teacher → realtime fires →
    // app-context.tsx calls dashboardPathForRole(next.role) and redirects.
    const before = dashboardPathForRole("admin");
    const after = dashboardPathForRole("teacher");
    expect(before).not.toBe(after);
    expect(after).toBe("/teacher/dashboard");
  });

  it("keeps principals on the admin dashboard (shared portal)", () => {
    expect(dashboardPathForRole("principal")).toBe(dashboardPathForRole("admin"));
  });
});
