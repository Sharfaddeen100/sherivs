import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ASSIGNABLE_STAFF_ROLES,
  decideStaffPrivilegeChange,
} from "@/lib/runtime/scholar/staff-privilege-change";
import { performStaffPrivilegeChange } from "@/lib/runtime/scholar/staff-privilege.functions";

const SCHOOL_A = "school-a";
const SCHOOL_B = "school-b";

describe("ASSIGNABLE_STAFF_ROLES", () => {
  it("contains only staff roles", () => {
    for (const r of ["super_admin", "student", "parent", "hq", "alumni"]) {
      expect(ASSIGNABLE_STAFF_ROLES as readonly string[]).not.toContain(r);
    }
    expect(ASSIGNABLE_STAFF_ROLES).toContain("teacher");
  });
});

const base = {
  actorId: "admin-1",
  actorSchoolId: SCHOOL_A,
  actorIsSchoolAdmin: true,
  actorActive: true,
  target: { id: "t-1", schoolId: SCHOOL_A, role: "teacher", isActive: true },
  change: { role: "bursar" } as { role?: string; isActive?: boolean },
};

describe("decideStaffPrivilegeChange", () => {
  it("allows a same-school role + active change; patch never has school_id", () => {
    const d = decideStaffPrivilegeChange({ ...base, change: { role: "bursar", isActive: false } });
    expect(d).toEqual({ ok: true, patch: { role: "bursar", is_active: false } });
  });
  const codeOf = (o: Parameters<typeof decideStaffPrivilegeChange>[0]) => {
    const d = decideStaffPrivilegeChange(o);
    return d.ok ? "OK" : d.code;
  };
  it("denies by code", () => {
    expect(codeOf({ ...base, actorId: "" })).toBe("NOT_AUTHENTICATED");
    expect(codeOf({ ...base, actorIsSchoolAdmin: false })).toBe("NOT_SCHOOL_ADMIN");
    expect(codeOf({ ...base, actorActive: false })).toBe("NOT_SCHOOL_ADMIN");
    expect(codeOf({ ...base, target: null })).toBe("TARGET_NOT_FOUND");
    expect(codeOf({ ...base, target: { ...base.target, schoolId: SCHOOL_B } })).toBe("CROSS_SCHOOL");
    expect(codeOf({ ...base, target: { ...base.target, schoolId: null } })).toBe("CROSS_SCHOOL");
    expect(codeOf({ ...base, actorSchoolId: null })).toBe("CROSS_SCHOOL");
    expect(codeOf({ ...base, target: { ...base.target, id: "admin-1" } })).toBe("SELF_CHANGE");
    expect(codeOf({ ...base, change: { role: "super_admin" } })).toBe("INVALID_ROLE");
    expect(codeOf({ ...base, target: { ...base.target, role: "student" } })).toBe("TARGET_NOT_STAFF");
    expect(codeOf({ ...base, change: {} })).toBe("EMPTY_CHANGE");
  });
});

type Row = { id: string; school_id: string | null; role: string | null; is_active: boolean | null };

function fakeClients(rows: Row[]) {
  const updates: { patch: Record<string, unknown>; filters: Record<string, string> }[] = [];
  const audits: Record<string, unknown>[] = [];
  const adminClient = {
    from(table: string) {
      return {
        select() {
          return {
            eq(_c: string, id: string) {
              return { maybeSingle: async () => ({ data: rows.find((r) => r.id === id) ?? null, error: null }) };
            },
          };
        },
        update(patch: Record<string, unknown>) {
          const filters: Record<string, string> = {};
          const chain = {
            eq(c: string, v: string) {
              filters[c] = v;
              if (Object.keys(filters).length === 2) {
                updates.push({ patch, filters: { ...filters } });
                return Promise.resolve({ error: null });
              }
              return chain;
            },
          };
          return chain;
        },
        insert(payload: Record<string, unknown>) {
          if (table === "audit_logs") audits.push(payload);
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  return { adminClient, userClient: {}, updates, audits };
}

const rows = (): Row[] => [
  { id: "admin-1", school_id: SCHOOL_A, role: "admin", is_active: true },
  { id: "admin-b", school_id: SCHOOL_B, role: "admin", is_active: true },
  { id: "teacher-1", school_id: SCHOOL_A, role: "teacher", is_active: true },
  { id: "teacher-2", school_id: SCHOOL_A, role: "teacher", is_active: true },
  { id: "target-b", school_id: SCHOOL_B, role: "teacher", is_active: true },
];

const run = (c: ReturnType<typeof fakeClients>, actorId: string, actorSchoolId: string, input: { userId: string; role?: string; isActive?: boolean }) =>
  performStaffPrivilegeChange({ userClient: c.userClient, adminClient: c.adminClient as never, actorId, actorSchoolId, input });

describe("performStaffPrivilegeChange", () => {
  it("same-school admin changes role, scoped by school_id, with audit", async () => {
    const c = fakeClients(rows());
    const r = await run(c, "admin-1", SCHOOL_A, { userId: "teacher-1", role: "bursar" });
    expect(r).toEqual({ ok: true, patch: { role: "bursar" } });
    expect(c.updates).toEqual([{ patch: { role: "bursar" }, filters: { id: "teacher-1", school_id: SCHOOL_A } }]);
    expect(c.audits).toHaveLength(1);
    const nv = c.audits[0].new_value as Record<string, any>;
    expect(c.audits[0].action).toBe("staff.privilege_change");
    expect(nv.outcome).toBe("succeeded");
    expect(nv.gate).toBe("requireSchoolAdminScope");
    expect(nv.details.before.role).toBe("teacher");
    expect(nv.details.after.role).toBe("bursar");
  });

  it("same-school admin deactivates a teacher", async () => {
    const c = fakeClients(rows());
    const r = await run(c, "admin-1", SCHOOL_A, { userId: "teacher-1", isActive: false });
    expect(r.patch).toEqual({ is_active: false });
    expect(c.updates[0].patch).toEqual({ is_active: false });
    expect(c.audits).toHaveLength(1);
  });

  it("admin of another school is denied CROSS_SCHOOL with no update", async () => {
    const c = fakeClients(rows());
    await expect(run(c, "admin-b", SCHOOL_B, { userId: "teacher-1", role: "bursar" })).rejects.toThrow(/^CROSS_SCHOOL/);
    expect(c.updates).toHaveLength(0);
    expect((c.audits[0].new_value as any).outcome).toBe("denied");
  });

  it("non-admin actor is denied", async () => {
    const c = fakeClients(rows());
    await expect(run(c, "teacher-2", SCHOOL_A, { userId: "teacher-1", role: "admin" })).rejects.toThrow(/^NOT_SCHOOL_ADMIN/);
    expect(c.updates).toHaveLength(0);
  });

  it("self-change is denied", async () => {
    const c = fakeClients(rows());
    await expect(run(c, "admin-1", SCHOOL_A, { userId: "admin-1", role: "principal" })).rejects.toThrow(/^SELF_CHANGE/);
    await expect(run(c, "admin-1", SCHOOL_A, { userId: "admin-1", isActive: false })).rejects.toThrow(/^SELF_CHANGE/);
    expect(c.updates).toHaveLength(0);
  });

  it.each(["super_admin", "hacker"])("invalid role %s is denied", async (role) => {
    const c = fakeClients(rows());
    await expect(run(c, "admin-1", SCHOOL_A, { userId: "teacher-1", role })).rejects.toThrow(/^INVALID_ROLE/);
    expect(c.updates).toHaveLength(0);
  });

  it("unknown target is denied TARGET_NOT_FOUND", async () => {
    const c = fakeClients(rows());
    await expect(run(c, "admin-1", SCHOOL_A, { userId: "nope", role: "bursar" })).rejects.toThrow(/^TARGET_NOT_FOUND/);
  });
});

describe("static: client.server never imported by client code", () => {
  const ROOT = fileURLToPath(new URL("../..", import.meta.url));
  const walk = (d: string): string[] =>
    readdirSync(d).flatMap((n) => {
      const p = join(d, n);
      return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
    });
  it("routes and components do not reference client.server", () => {
    // routes/api/** are server-only HTTP handlers, not client modules.
    const files = [
      ...walk(join(ROOT, "frontend/src/routes")).filter((f) => !f.includes("/routes/api/")),
      ...walk(join(ROOT, "frontend/src/components")),
    ];
    const offenders = files.filter((f) => /client\.server/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
