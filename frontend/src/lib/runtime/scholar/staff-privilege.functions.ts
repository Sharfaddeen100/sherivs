import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tokenMsRemaining } from "@/lib/auth-helpers";
import { requireSchoolAdminScope } from "@/lib/security-role-gate";
import { decideStaffPrivilegeChange } from "@/lib/staff-privilege-change";
import type { WriteAuditClient } from "@/lib/server/write-audit";

/**
 * Server path for users.role / is_active changes. The DB freeze trigger only
 * permits service_role to write these columns, so the admin client is used here
 * strictly after the school-admin gate and the pure decision.
 */

type UsersQuery = {
  select(cols: string): {
    eq(col: string, v: string): { maybeSingle(): PromiseLike<unknown> };
  };
  update(patch: Record<string, unknown>): {
    eq(col: string, v: string): { eq(col: string, v: string): PromiseLike<unknown> };
  };
};

export type PrivilegeAdminClient = WriteAuditClient & {
  from(table: string): ReturnType<WriteAuditClient["from"]> & Partial<UsersQuery>;
};

export type PerformStaffPrivilegeDeps = {
  userClient: unknown;
  adminClient: PrivilegeAdminClient;
  actorId: string;
  actorSchoolId: string;
  input: { userId: string; role?: string; isActive?: boolean };
};

type UserRow = { id?: string; role: string | null; is_active: boolean | null; school_id: string | null };

async function loadUser(admin: PrivilegeAdminClient, id: string): Promise<UserRow | null> {
  const q = admin.from("users") as unknown as UsersQuery;
  const res = (await q.select("id, school_id, role, is_active").eq("id", id).maybeSingle()) as {
    data?: UserRow | null;
    error?: { message: string } | null;
  } | null;
  if (res?.error) throw new Error(`Failed to load user: ${res.error.message}`);
  return res?.data ?? null;
}

export async function performStaffPrivilegeChange(deps: PerformStaffPrivilegeDeps) {
  // Dynamic import keeps the server-only audit writer out of the client bundle
  // (this module is imported by the admin/hr route for the server-fn RPC stub).
  const { writeAuditRecord } = await import("@/lib/server/write-audit");
  const { adminClient, actorId, actorSchoolId, input } = deps;
  const [actor, target] = await Promise.all([
    loadUser(adminClient, actorId),
    loadUser(adminClient, input.userId),
  ]);

  const decision = decideStaffPrivilegeChange({
    actorId,
    actorSchoolId,
    // The actor row must also belong to the gated school (defense in depth).
    actorIsSchoolAdmin:
      (actor?.role === "admin" || actor?.role === "principal") && actor?.school_id === actorSchoolId,
    actorActive: actor?.is_active === true,
    target: target
      ? {
          id: input.userId,
          schoolId: target.school_id,
          role: target.role,
          isActive: target.is_active,
        }
      : null,
    change: { role: input.role, isActive: input.isActive },
  });

  if (!decision.ok) {
    try {
      await writeAuditRecord(adminClient, {
        action: "staff.privilege_change",
        gate: "requireSchoolAdminScope",
        tenantId: actorSchoolId,
        actorId,
        table: "users",
        recordId: input.userId,
        outcome: "denied",
        details: { code: decision.code, requested: { role: input.role ?? null, isActive: input.isActive ?? null } },
      });
    } catch {
      // best-effort: the denial itself must still surface
    }
    throw new Error(`${decision.code}: ${decision.message}`);
  }

  const q = adminClient.from("users") as unknown as UsersQuery;
  const res = (await q
    .update(decision.patch)
    .eq("id", input.userId)
    .eq("school_id", actorSchoolId)) as { error?: { message: string } | null } | null;
  if (res?.error) throw new Error(res.error.message);

  await writeAuditRecord(adminClient, {
    action: "staff.privilege_change",
    gate: "requireSchoolAdminScope",
    tenantId: actorSchoolId,
    actorId,
    table: "users",
    recordId: input.userId,
    outcome: "succeeded",
    details: {
      before: { role: target?.role ?? null, is_active: target?.is_active ?? null },
      after: {
        role: decision.patch.role ?? target?.role ?? null,
        is_active: decision.patch.is_active ?? target?.is_active ?? null,
      },
    },
  });

  return { ok: true as const, patch: decision.patch };
}

const schema = z.object({
  userId: z.string().uuid(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateStaffPrivilege = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const schoolId = await requireSchoolAdminScope(context.supabase, {
      lifecycle: null,
      sessionValid: typeof context?.claims?.exp === "number" && tokenMsRemaining(context.claims.exp) > 0,
    });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return performStaffPrivilegeChange({
      userClient: context.supabase,
      adminClient: supabaseAdmin as unknown as PrivilegeAdminClient,
      actorId: context.userId,
      actorSchoolId: schoolId,
      input: data,
    });
  });
