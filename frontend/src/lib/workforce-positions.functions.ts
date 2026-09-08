/**
 * CoreGrid — workforce-position server functions (org-admin HR surface).
 *
 * Wraps the RPC layer of migration 20260907000300 with the canonical
 * school-admin scope gate. The tenant boundary is resolved server-side from
 * the actor; the client never supplies it. Positions are workforce reality —
 * they never grant authorization (Phase 08 stays the only authority).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { asKernelAdmin } from "@/lib/kernel-admin-client";
import { requireSchoolAdminScope } from "@/lib/security-role-gate";
import { scholarWorkforceKind } from "@/lib/runtime/scholar-workforce";
import {
  isWorkforceEmploymentType,
  parseWorkforcePositionView,
  type WorkforcePositionView,
} from "@/lib/workforce-positions";

export const listWorkforcePositions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({}).parse(input))
  .handler(async ({ context }): Promise<WorkforcePositionView[]> => {
    const schoolId = await requireSchoolAdminScope(context.supabase);
    const db = asKernelAdmin(context.supabase);
    const { data, error } = await db.rpc("list_workforce_positions", { p_tenant: schoolId });
    if (error) throw new Error(error.message);
    const rows = Array.isArray(data) ? data : [];
    return rows.map((row) => parseWorkforcePositionView(row));
  });

export const assignWorkforcePosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        kindCode: z.string().min(1).max(80),
        isPrimary: z.boolean().default(false),
        employmentType: z.string().default("full_time"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const schoolId = await requireSchoolAdminScope(context.supabase);

    if (!isWorkforceEmploymentType(data.employmentType)) {
      throw new Error(`Invalid employment type "${data.employmentType}"`);
    }
    const kind = scholarWorkforceKind(data.kindCode);
    if (!kind) throw new Error(`Unknown position kind "${data.kindCode}"`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin
      .from("users")
      .select("role, school_id")
      .eq("id", data.userId)
      .maybeSingle();
    if (!target) throw new Error("Target account not found");
    if (target.school_id !== schoolId) throw new Error("Target account is outside this school");
    if (target.role === "parent" || target.role === "student") {
      throw new Error(
        "Positions apply to staff accounts only; parents and students are relationships.",
      );
    }

    const { data: positionId, error } = await asKernelAdmin(context.supabase).rpc(
      "assign_workforce_position",
      {
        p_tenant: schoolId,
        p_identity: data.userId,
        p_kind_code: kind.kindCode,
        p_primary: data.isPrimary,
        p_employment_type: data.employmentType,
      },
    );
    if (error) throw new Error(error.message);
    return { positionId: positionId as string | null, kindTitle: kind.title };
  });

export const endWorkforcePosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ positionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // The RPC re-derives the tenant from the position row and re-checks the
    // actor scope; resolving the scope here is belt-and-braces context.
    const schoolId = await requireSchoolAdminScope(context.supabase);
    void schoolId;
    const { data: ended, error } = await asKernelAdmin(context.supabase).rpc(
      "end_workforce_position",
      { p_position_id: data.positionId },
    );
    if (error) throw new Error(error.message);
    return { ended: ended === true };
  });

export type AssignWorkforcePositionResult = Awaited<ReturnType<typeof assignWorkforcePosition>>;
