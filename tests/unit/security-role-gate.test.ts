/**
 * Sherivs — Phase 08 Security Engine: canonical runtime role gate tests.
 *
 * Validates the pure decision contract of `security-role-gate` for both role
 * kinds (school_admin, platform_super_admin):
 * - a granted role with a valid scope is allowed;
 * - every other combination fails closed (no silent grants, AT.9);
 * - school-admin requires a school scope; platform roles never do;
 * - reasons and codes are canonical and non-leaky;
 * - the Phase 08 security gateway remains the single decision authority.
 */

import { describe, expect, it } from "vitest";
import {
  decideAccountAdministration,
  decideStaffRole,
  evaluateRoleGate,
  requireStaffContext,
  resolveStaffContext,
  type RoleGateKind,
  type RoleGateSignals,
} from "@/lib/security-role-gate";

function signals(kind: RoleGateKind, overrides: Partial<RoleGateSignals> = {}): RoleGateSignals {
  const base: RoleGateSignals =
    kind === "school_admin"
      ? { roleGranted: true, scope: "school-a" }
      : { roleGranted: true, scope: null };
  return { ...base, ...overrides };
}

describe("evaluateRoleGate — school_admin", () => {
  it("allows a school admin with a resolved school scope", () => {
    const gate = evaluateRoleGate("school_admin", signals("school_admin"));
    expect(gate.decision).toBe("allow");
    if (gate.decision === "allow") {
      expect(gate.scope).toBe("school-a");
      expect(gate.reason).toBe("Role gate verified");
    }
  });

  it("trims whitespace from the resolved school scope", () => {
    const gate = evaluateRoleGate(
      "school_admin",
      signals("school_admin", { scope: "  school-b  " }),
    );
    expect(gate.decision).toBe("allow");
    if (gate.decision === "allow") expect(gate.scope).toBe("school-b");
  });

  it("fails closed when the role is not granted or the signal is unknown", () => {
    const denied = evaluateRoleGate(
      "school_admin",
      signals("school_admin", { roleGranted: false }),
    );
    expect(denied).toMatchObject({ decision: "deny", code: "role_required" });
    expect(
      evaluateRoleGate("school_admin", signals("school_admin", { roleGranted: null })).decision,
    ).toBe("deny");
    expect(
      evaluateRoleGate("school_admin", signals("school_admin", { roleGranted: undefined }))
        .decision,
    ).toBe("deny");
  });

  it("fails closed when no school scope can be resolved", () => {
    const gate = evaluateRoleGate("school_admin", signals("school_admin", { scope: null }));
    expect(gate).toMatchObject({ decision: "deny", code: "tenant_unresolved" });
    expect(
      evaluateRoleGate("school_admin", signals("school_admin", { scope: "   " })).decision,
    ).toBe("deny");
  });
});

describe("evaluateRoleGate — platform_super_admin", () => {
  it("allows a platform super admin without any school scope", () => {
    const gate = evaluateRoleGate("platform_super_admin", signals("platform_super_admin"));
    expect(gate.decision).toBe("allow");
    if (gate.decision === "allow") {
      expect(gate.scope).toBeNull();
    }
  });

  it("fails closed when the super-admin role is not granted", () => {
    const gate = evaluateRoleGate(
      "platform_super_admin",
      signals("platform_super_admin", { roleGranted: false }),
    );
    expect(gate).toMatchObject({ decision: "deny", code: "role_required" });
  });

  it("never requires a tenant scope for platform roles", () => {
    const gate = evaluateRoleGate(
      "platform_super_admin",
      signals("platform_super_admin", { scope: null }),
    );
    expect(gate.decision).toBe("allow");
  });
});

describe("evaluateRoleGate — shared invariants", () => {
  it("keeps reasons non-leaky (no stack traces, no internal policy data)", () => {
    const deny = evaluateRoleGate("school_admin", { roleGranted: false });
    if (deny.decision === "deny") {
      expect(deny.reason).not.toMatch(/at /);
      expect(deny.reason).not.toMatch(/secret|token|password/i);
    }
  });

  it("distinguishes role kinds in deny reasons", () => {
    const school = evaluateRoleGate("school_admin", { roleGranted: false });
    const platform = evaluateRoleGate("platform_super_admin", { roleGranted: false });
    if (school.decision === "deny" && platform.decision === "deny") {
      expect(school.reason).toContain("school admin");
      expect(platform.reason).toContain("platform super admin");
      expect(school.reason).not.toBe(platform.reason);
    }
  });
});

describe("decideAccountAdministration — composite account administration", () => {
  it("allows a platform super admin regardless of scope", () => {
    const gate = decideAccountAdministration({
      platformSuper: true,
      schoolAdmin: false,
      schoolScope: null,
      targetSchoolId: "any-tenant",
    });
    expect(gate).toEqual({ decision: "allow", actor: "platform_super", scope: null });
  });

  it("allows a school admin to act inside their own school scope", () => {
    const gate = decideAccountAdministration({
      platformSuper: false,
      schoolAdmin: true,
      schoolScope: "school-a",
      targetSchoolId: null,
    });
    expect(gate).toEqual({ decision: "allow", actor: "school_admin", scope: "school-a" });
  });

  it("allows a school admin when the target belongs to the same school", () => {
    const gate = decideAccountAdministration({
      platformSuper: false,
      schoolAdmin: true,
      schoolScope: "school-a",
      targetSchoolId: "school-a",
    });
    expect(gate.decision).toBe("allow");
  });

  it("denies when the target belongs to a different school (cross-tenant)", () => {
    const gate = decideAccountAdministration({
      platformSuper: false,
      schoolAdmin: true,
      schoolScope: "school-a",
      targetSchoolId: "school-b",
    });
    expect(gate).toMatchObject({ decision: "deny", code: "not_same_tenant" });
  });

  it("denies when neither role is held", () => {
    const gate = decideAccountAdministration({
      platformSuper: false,
      schoolAdmin: false,
      schoolScope: null,
      targetSchoolId: null,
    });
    expect(gate).toMatchObject({ decision: "deny", code: "role_required" });
  });

  it("denies a school admin who is not linked to a school", () => {
    const gate = decideAccountAdministration({
      platformSuper: false,
      schoolAdmin: true,
      schoolScope: "   ",
      targetSchoolId: null,
    });
    expect(gate).toMatchObject({ decision: "deny", code: "tenant_unresolved" });
  });
});

describe("decideStaffRole — school-staff role sets", () => {
  it("allows admin and principal for school_admin (mirrors is_school_admin)", () => {
    expect(decideStaffRole("school_admin", { role: "admin", scope: "school-a" }).decision).toBe(
      "allow",
    );
    expect(decideStaffRole("school_admin", { role: "principal", scope: "school-a" }).decision).toBe(
      "allow",
    );
  });

  it("allows teacher for school_teacher", () => {
    const gate = decideStaffRole("school_teacher", { role: "teacher", scope: "school-a" });
    expect(gate).toEqual({
      decision: "allow",
      role: "teacher",
      scope: "school-a",
      reason: "Staff role verified",
    });
  });

  it("allows every teaching role for teaching_staff", () => {
    for (const role of ["admin", "principal", "teacher"] as const) {
      expect(decideStaffRole("teaching_staff", { role, scope: "school-a" }).decision).toBe("allow");
    }
  });

  it("allows admin/principal/bursar for finance_staff", () => {
    for (const role of ["admin", "principal", "bursar"] as const) {
      expect(decideStaffRole("finance_staff", { role, scope: "school-a" }).decision).toBe("allow");
    }
  });

  it("fails closed for roles outside the requested set", () => {
    expect(decideStaffRole("teaching_staff", { role: "bursar", scope: "school-a" })).toMatchObject({
      decision: "deny",
      code: "role_required",
    });
    expect(decideStaffRole("finance_staff", { role: "teacher", scope: "school-a" })).toMatchObject({
      decision: "deny",
      code: "role_required",
    });
    expect(decideStaffRole("school_teacher", { role: "admin", scope: "school-a" })).toMatchObject({
      decision: "deny",
      code: "role_required",
    });
    expect(decideStaffRole("school_admin", { role: "student", scope: "school-a" }).decision).toBe(
      "deny",
    );
  });

  it("fails closed on unknown, null or malformed roles and blank scopes", () => {
    expect(decideStaffRole("teaching_staff", { role: null, scope: "school-a" }).decision).toBe(
      "deny",
    );
    expect(decideStaffRole("teaching_staff", { role: undefined, scope: "school-a" }).decision).toBe(
      "deny",
    );
    expect(
      decideStaffRole("teaching_staff", { role: "super_admin", scope: "school-a" }),
    ).toMatchObject({
      decision: "deny",
      code: "role_required",
    });
    expect(decideStaffRole("teaching_staff", { role: "teacher", scope: null })).toMatchObject({
      decision: "deny",
      code: "tenant_unresolved",
    });
    expect(decideStaffRole("teaching_staff", { role: "teacher", scope: "   " })).toMatchObject({
      decision: "deny",
      code: "tenant_unresolved",
    });
  });

  it("trims and normalizes case while preserving the canonical allow shape", () => {
    const gate = decideStaffRole("teaching_staff", { role: "  Teacher  ", scope: "  school-a " });
    expect(gate).toEqual({
      decision: "allow",
      role: "teacher",
      scope: "school-a",
      reason: "Staff role verified",
    });
  });

  it("keeps deny reasons non-leaky", () => {
    const deny = decideStaffRole("finance_staff", { role: "student", scope: "school-a" });
    if (deny.decision === "deny") {
      expect(deny.reason).not.toMatch(/at /);
      expect(deny.reason).not.toMatch(/secret|token|password/i);
    }
  });
});

describe("resolveStaffContext / requireStaffContext — adapters over existing RPCs", () => {
  function rpcStub(role: string | null, scope: string | null, error?: { message: string }) {
    return {
      rpc: async (name: string) => {
        if (error) return { error };
        if (name === "get_my_role") return { data: role, error: null };
        if (name === "get_my_school_id") return { data: scope, error: null };
        return { data: null, error: null };
      },
    };
  }

  it("resolves an allow for a teaching teacher", async () => {
    const gate = await resolveStaffContext(rpcStub("teacher", "school-a"), "teaching_staff");
    expect(gate).toMatchObject({ decision: "allow", role: "teacher", scope: "school-a" });
  });

  it("requireStaffContext returns the typed context on allow", async () => {
    const ctx = await requireStaffContext(rpcStub("bursar", "school-a"), "finance_staff");
    expect(ctx).toEqual({ role: "bursar", schoolId: "school-a" });
  });

  it("requireStaffContext throws the canonical reason on DENY", async () => {
    await expect(
      requireStaffContext(rpcStub("student", "school-a"), "finance_staff"),
    ).rejects.toThrow("Forbidden: role not authorized for this operation");
    await expect(requireStaffContext(rpcStub("teacher", null), "teaching_staff")).rejects.toThrow(
      "No school in scope",
    );
  });

  it("surfaces RPC-level errors instead of failing open", async () => {
    const broken = rpcStub("teacher", "school-a", { message: "rpc down" });
    await expect(resolveStaffContext(broken, "teaching_staff")).rejects.toThrow("rpc down");
  });
});
