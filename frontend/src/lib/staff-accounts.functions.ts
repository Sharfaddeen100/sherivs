/**
 * Admin flow for creating real portal accounts for a school's staff / students /
 * parents. Returns the freshly-minted email + password so the admin can hand
 * the credentials to the person. Idempotent by email — running it again for
 * an existing user resets the password to a new one.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  decideAccountAdministration,
  resolveRoleGate,
  type AccountAdministrationOutcome,
} from "@/lib/security-role-gate";

const CREATABLE_ROLES = [
  "admin",
  "principal",
  "teacher",
  "bursar",
  "parent",
  "student",
  "driver",
  "hq",
] as const;

export type CreatableStaffRole = (typeof CREATABLE_ROLES)[number];

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  role: z.enum(CREATABLE_ROLES),
  phone: z.string().trim().max(40).optional().nullable(),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .optional()
    .nullable(),
});

export type CreateStaffAccountResult = {
  userId: string;
  email: string;
  password: string;
  role: CreatableStaffRole;
  fullName: string;
  reused: boolean;
};

function randomPassword() {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const num = "23456789";
  const sym = "!@#$";
  let p = "";
  for (let i = 0; i < 8; i++) p += alpha[Math.floor(Math.random() * alpha.length)];
  for (let i = 0; i < 3; i++) p += num[Math.floor(Math.random() * num.length)];
  p += sym[Math.floor(Math.random() * sym.length)];
  return p;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findAuthUserIdByEmail(admin: any, email: string) {
  // listUsers is paged; a single 1000-page lookup is enough for tenants
  // that don't exceed that size, and matches the rest of the codebase.
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data?.users ?? []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
    ?.id as string | undefined;
}

export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }): Promise<CreateStaffAccountResult> => {
    // Canonical Phase 08 composite gate: platform super-admin OR same-school
    // admin/principal. Replaces legacy direct role-row parsing.
    const superGate = await resolveRoleGate(context.supabase, "platform_super_admin");
    const adminGate =
      superGate.decision === "allow"
        ? null
        : await resolveRoleGate(context.supabase, "school_admin");

    const access = decideAccountAdministration({
      platformSuper: superGate.decision === "allow",
      schoolAdmin: adminGate?.decision === "allow",
      schoolScope: adminGate?.decision === "allow" ? adminGate.scope : null,
      targetSchoolId: null,
    });
    if (access.decision === "deny") throw new Error(access.reason);

    const schoolId = access.scope ?? undefined;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const password = data.password?.length ? data.password : randomPassword();

    let userId = await findAuthUserIdByEmail(supabaseAdmin, data.email);
    let reused = false;

    if (userId) {
      reused = true;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName },
      });
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName },
      });
      if (error || !created?.user) throw new Error(error?.message ?? "Failed to create account");
      userId = created.user.id as string;
    }

    // Link into public.users for this school (upsert by pk).
    if (schoolId) {
      const { error: uErr } = await supabaseAdmin.from("users").upsert({
        id: userId,
        school_id: schoolId,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        role: data.role,
        is_active: true,
      });
      if (uErr) throw new Error(uErr.message);
    }

    return {
      userId,
      email: data.email,
      password,
      role: data.role,
      fullName: data.fullName,
      reused,
    };
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // Canonical Phase 08 composite gate: platform super-admin OR same-school
    // admin/principal, with the target same-tenant rule for school admins.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const superGate = await resolveRoleGate(context.supabase, "platform_super_admin");
    let access: AccountAdministrationOutcome;

    if (superGate.decision === "allow") {
      access = decideAccountAdministration({
        platformSuper: true,
        schoolAdmin: false,
        schoolScope: null,
        targetSchoolId: null,
      });
    } else {
      const adminGate = await resolveRoleGate(context.supabase, "school_admin");
      if (adminGate.decision !== "allow") throw new Error("Forbidden");
      const { data: target } = await supabaseAdmin
        .from("users")
        .select("school_id, email")
        .eq("id", data.userId)
        .maybeSingle();
      if (!target) throw new Error("Not allowed to reset this user");
      access = decideAccountAdministration({
        platformSuper: false,
        schoolAdmin: true,
        schoolScope: adminGate.scope,
        targetSchoolId: (target.school_id as string | null) ?? null,
      });
    }

    if (access.decision === "deny") throw new Error(access.reason);

    const password = randomPassword();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);

    const { data: fresh } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();

    return { userId: data.userId, email: fresh?.email ?? null, password };
  });

export const CREATABLE_STAFF_ROLES = CREATABLE_ROLES;
