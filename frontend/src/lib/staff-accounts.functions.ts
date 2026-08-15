/**
 * Admin flow for creating real portal accounts for a school's staff / students /
 * parents. Returns the freshly-minted email + password so the admin can hand
 * the credentials to the person. Idempotent by email — running it again for
 * an existing user resets the password to a new one.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

async function findAuthUserIdByEmail(admin: any, email: string) {
  // listUsers is paged; a single 1000-page lookup is enough for tenants
  // that don't exceed that size, and matches the rest of the codebase.
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return (data?.users ?? []).find((u: any) => u.email?.toLowerCase() === email.toLowerCase())?.id as
    | string
    | undefined;
}

export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }): Promise<CreateStaffAccountResult> => {
    // Authorize: caller must be an admin/principal of a school, OR a super admin.
    const { data: callerProfile } = await context.supabase
      .from("users")
      .select("school_id, role")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: superRow } = await context.supabase
      .from("super_admins")
      .select("id")
      .eq("id", context.userId)
      .maybeSingle();

    const isSuper = !!superRow;
    const isSchoolAdmin =
      callerProfile && (callerProfile.role === "admin" || callerProfile.role === "principal");

    if (!isSuper && !isSchoolAdmin) {
      throw new Error("Forbidden: only school admins or super admins can create accounts");
    }

    const schoolId = callerProfile?.school_id as string | undefined;
    if (!isSuper && !schoolId) {
      throw new Error("You are not linked to a school");
    }

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
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: callerProfile } = await context.supabase
      .from("users")
      .select("school_id, role")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: superRow } = await context.supabase
      .from("super_admins")
      .select("id")
      .eq("id", context.userId)
      .maybeSingle();
    const isSuper = !!superRow;
    const isSchoolAdmin =
      callerProfile && (callerProfile.role === "admin" || callerProfile.role === "principal");
    if (!isSuper && !isSchoolAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // If school admin, ensure the target user is in the same school.
    if (!isSuper) {
      const { data: target } = await supabaseAdmin
        .from("users")
        .select("school_id, email")
        .eq("id", data.userId)
        .maybeSingle();
      if (!target || target.school_id !== callerProfile?.school_id) {
        throw new Error("Not allowed to reset this user");
      }
    }

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