/**
 * Super-admin school ops. (No super-admin bootstrap: super admins are
 * granted only by an operator via docs/ops/sql/create-super-admin.sql.)
 *
 * School provisioning itself was migrated to the platform onboarding engine
 * (`provisionOrganization` in
 * `lib/onboarding/provision-organization.functions.ts`) by V1-013; the
 * legacy Scholar-specific creator server fn is REMOVED here, together with
 * its derived, partially predictable `Admin@<slug><year>!` password.
 * `resetSchoolAdminPassword` now uses the engine's generated-once password
 * (`generateInitialPassword`, §30) instead.
 *
 * `client.server` (service-role) is imported INSIDE handlers so this file
 * stays safe to import from components / route loaders.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tokenMsRemaining } from "@/lib/auth-helpers";
import { requirePlatformSuperAdmin } from "@/lib/security-role-gate";
import { generateInitialPassword } from "@/lib/onboarding/generated-credentials";
import { subscriptionTier } from "@/lib/validation";

/* ---------- platform super admin ----------
 * There is NO in-app path to become a super admin. Rows in public.super_admins
 * are created only by an operator with database authority (service_role /
 * postgres) via docs/ops/sql/create-super-admin.sql. The former public
 * "claim the first super admin" bootstrap was removed (2026-10-20): it let any
 * signed-in account claim the platform while the table was empty.
 * ------------------------------------------------------------------------- */

/* ---------- super-admin school ops ---------- */

async function assertSuper(context: {
  supabase: Parameters<typeof requirePlatformSuperAdmin>[0];
  claims: { exp: number };
}) {
  // Canonical Phase 08 role gate — platform super admin (fail closed).
  // Lifecycle threading (DEFECT-1 follow-through): the JWT carries no
  // lifecycle claim, so `lifecycle: null` opts this call into the lifecycle
  // contract while flagging the identity lifecycle unverified (never silent);
  // session validity is attested from the verified token's exp claim.
  await requirePlatformSuperAdmin(context.supabase, {
    lifecycle: null,
    sessionValid: typeof context?.claims?.exp === "number" && tokenMsRemaining(context.claims.exp) > 0,
  });
}

const updateSchoolSchema = z.object({
  schoolId: z.string().uuid(),
  subscriptionTier: subscriptionTier.optional(),
  subscriptionStatus: z.enum(["active", "suspended", "expired", "trial"]).optional(),
  monthlyFee: z.number().min(0).max(1_000_000).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateSchoolPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => updateSchoolSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      subscription_tier?: string;
      subscription_status?: string;
      monthly_fee?: number;
      subscription_expires_at?: string | null;
      is_active?: boolean;
    } = {};
    if (data.subscriptionTier != null) patch.subscription_tier = data.subscriptionTier;
    if (data.subscriptionStatus != null) patch.subscription_status = data.subscriptionStatus;
    if (data.monthlyFee != null) patch.monthly_fee = data.monthlyFee;
    if (data.expiresAt !== undefined) patch.subscription_expires_at = data.expiresAt;
    if (data.isActive != null) patch.is_active = data.isActive;
    const { error } = await supabaseAdmin.from("schools").update(patch).eq("id", data.schoolId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("super_admin_logs").insert({
      admin_id: context.userId,
      action: "update_school",
      target_school_id: data.schoolId,
      details: patch as Record<string, string | number | boolean | null>,
    });
    return { ok: true };
  });

const resetPwSchema = z.object({ schoolId: z.string().uuid() });

export const resetSchoolAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => resetPwSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("slug")
      .eq("id", data.schoolId)
      .maybeSingle();
    if (!school) throw new Error("School not found");
    const { data: admin } = await supabaseAdmin
      .from("users")
      .select("id, email")
      .eq("school_id", data.schoolId)
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!admin) throw new Error("No admin account for this school");
    // §30: generated-once password (the legacy derived slug+year pattern was
    // retired with the V1-013 school-creation migration).
    const tempPassword = generateInitialPassword();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(admin.id, {
      password: tempPassword,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("super_admin_logs").insert({
      admin_id: context.userId,
      action: "reset_school_admin_password",
      target_school_id: data.schoolId,
      details: { admin_email: admin.email },
    });
    return { adminEmail: admin.email, tempPassword };
  });
