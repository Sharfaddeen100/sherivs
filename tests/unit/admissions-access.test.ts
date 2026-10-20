import { describe, expect, it } from "vitest";
import { admissionsOnlyNav, decideAdminAreaAccess, isAdmissionsPath } from "@/lib/admissions-access";

const base = { superAdmin: false, pathname: "/admin/admissions", canManageAdmissions: true as boolean | null };

describe("admin area access (registrar)", () => {
  it("admin and principal reach every admin path", () => {
    for (const role of ["admin", "principal"] as const) {
      expect(decideAdminAreaAccess({ ...base, role, pathname: "/admin/fees", canManageAdmissions: false })).toBe("allow");
    }
  });
  it("a registrar reaches admissions only", () => {
    expect(decideAdminAreaAccess({ ...base, role: "teacher" })).toBe("allow");
    expect(decideAdminAreaAccess({ ...base, role: "teacher", pathname: "/admin/admissions/x" })).toBe("allow");
    for (const p of ["/admin/fees", "/admin/hr", "/admin/admissions-evil", "/admin"]) {
      expect(decideAdminAreaAccess({ ...base, role: "teacher", pathname: p })).toBe("deny");
    }
  });
  it("non-registrar staff, parents and students are denied; unresolved is pending", () => {
    expect(decideAdminAreaAccess({ ...base, role: "teacher", canManageAdmissions: false })).toBe("deny");
    expect(decideAdminAreaAccess({ ...base, role: "bursar", canManageAdmissions: false })).toBe("deny");
    expect(decideAdminAreaAccess({ ...base, role: "parent", canManageAdmissions: true })).toBe("deny");
    expect(decideAdminAreaAccess({ ...base, role: "student", canManageAdmissions: true })).toBe("deny");
    expect(decideAdminAreaAccess({ ...base, role: "teacher", canManageAdmissions: null })).toBe("pending");
    expect(decideAdminAreaAccess({ ...base, role: null })).toBe("deny");
  });
  it("super admin always passes", () => {
    expect(decideAdminAreaAccess({ ...base, role: null, superAdmin: true, pathname: "/admin/hr" })).toBe("allow");
  });
  it("path matcher is exact on segment boundary", () => {
    expect(isAdmissionsPath("/admin/admissions")).toBe(true);
    expect(isAdmissionsPath("/admin/admissions-x")).toBe(false);
  });
  it("nav shows only admissions for a registrar and nothing extra for admins/others", () => {
    const nav = admissionsOnlyNav("teacher", true);
    expect(nav).toHaveLength(1);
    expect(nav[0].items.map((i) => i.url)).toEqual(["/admin/admissions"]);
    expect(admissionsOnlyNav("admin", true)).toEqual([]);
    expect(admissionsOnlyNav("teacher", false)).toEqual([]);
  });
});
