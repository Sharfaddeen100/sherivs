/**
 * Sherivs internal console — platform staff administration (SHERIVS-008).
 *
 * Every write runs with the SERVICE ROLE, and only after the canonical
 * platform-super-admin gate. Clients have no write grant on platform_staff /
 * platform_staff_roles (RLS + grants in migration 20261020000150). Every
 * operation is audited (control-plane scope, tenantId null) — never secrets.
 *
 * `client.server` is imported INSIDE handlers so this file stays safe to
 * import from components.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tokenMsRemaining } from "@/lib/auth-helpers";
import { requirePlatformSuperAdmin } from "@/lib/security-role-gate";
import { assertInternalAal2 } from "@/lib/security/mfa-server";
import { writeAuditRecord } from "@/lib/server/write-audit";
import { SystemClock, TimeAuthority } from "@/lib/kernel/time-authority";
import { PLATFORM_ROLE_CODES, canTransition, type PlatformStaffStatus } from "./catalogue";

type GateContext = {
  supabase: Parameters<typeof requirePlatformSuperAdmin>[0];
  claims: { exp: number };
  userId: string;
};

async function assertSuper(context: GateContext) {
  assertInternalAal2((context as { claims?: { aal?: unknown } }).claims);
  await requirePlatformSuperAdmin(context.supabase, {
    lifecycle: null,
    sessionValid:
      typeof context?.claims?.exp === "number" && tokenMsRemaining(context.claims.exp) > 0,
  });
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const timeAuthority = new TimeAuthority(new SystemClock());

const DEFAULT_APP_ORIGIN = "https://app.sherivs.com";
function inviteRedirect(): string {
  // Supabase only honours redirects on the Auth → URL Configuration allow-list.
  let origin = DEFAULT_APP_ORIGIN;
  try {
    origin = new URL(getRequest().url).origin;
  } catch {
    /* fall back to canonical app host */
  }
  return `${origin}/reset-password`;
}

async function audit(
  context: GateContext,
  action: string,
  recordId: string | null,
  outcome: "succeeded" | "failed",
  details: Record<string, unknown>,
) {
  await writeAuditRecord(await admin(), {
    action: `platform_staff.${action}`,
    gate: "requirePlatformSuperAdmin",
    tenantId: null,
    actorId: context.userId,
    table: "platform_staff",
    recordId,
    outcome,
    details,
  });
}

const roleList = z.array(z.enum(PLATFORM_ROLE_CODES)).max(PLATFORM_ROLE_CODES.length);

/* ---------- list ---------- */
export const listPlatformStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuper(context);
    const db = await admin();
    const { data, error } = await db
      .from("platform_staff")
      .select(
        "id, email, full_name, department, status, invited_at, activated_at, suspended_at, platform_staff_roles(role_code)",
      )
      .order("invited_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      department: r.department,
      status: r.status as PlatformStaffStatus,
      invitedAt: r.invited_at,
      activatedAt: r.activated_at,
      suspendedAt: r.suspended_at,
      roles: ((r.platform_staff_roles ?? []) as Array<{ role_code: string }>).map(
        (x) => x.role_code,
      ),
    }));
  });

/* ---------- invite ---------- */
const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  fullName: z.string().trim().min(2).max(120),
  department: z.string().trim().max(80).optional(),
  roles: roleList.min(1),
});

export const invitePlatformStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => inviteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    const db = await admin();

    const { data: existing } = await db
      .from("platform_staff")
      .select("id")
      .ilike("email", data.email)
      .maybeSingle();
    if (existing) throw new Error("That email is already platform staff.");

    // Never repurpose an existing (e.g. customer) account into staff: invite
    // creates a NEW auth user; an existing account makes the invite fail.
    const { data: invited, error } = await db.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: inviteRedirect(),
      data: { full_name: data.fullName, sherivs_staff: true },
    });
    if (error || !invited?.user) {
      await audit(context, "invite", null, "failed", { email: data.email, reason: error?.message });
      throw new Error(
        error?.message?.toLowerCase().includes("already")
          ? "An account with that email already exists. Use a dedicated Sherivs staff email."
          : (error?.message ?? "Invite failed"),
      );
    }
    const staffId = invited.user.id;

    const { error: insErr } = await db.from("platform_staff").insert({
      id: staffId,
      email: data.email,
      full_name: data.fullName,
      department: data.department || null,
      status: "invited",
      invited_by: context.userId,
    });
    if (insErr) {
      // Do not leave a dangling invited auth user behind.
      await db.auth.admin.deleteUser(staffId);
      throw new Error(insErr.message);
    }
    const { error: roleErr } = await db.from("platform_staff_roles").insert(
      data.roles.map((role_code) => ({
        staff_id: staffId,
        role_code,
        granted_by: context.userId,
      })),
    );
    if (roleErr) throw new Error(roleErr.message);

    await audit(context, "invite", staffId, "succeeded", {
      email: data.email,
      roles: data.roles,
      department: data.department ?? null,
    });
    return { id: staffId };
  });

/* ---------- resend invite ---------- */
const idSchema = z.object({ staffId: z.string().uuid() });

async function loadStaff(staffId: string) {
  const db = await admin();
  const { data, error } = await db
    .from("platform_staff")
    .select("id, email, full_name, status")
    .eq("id", staffId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Staff member not found");
  return data as { id: string; email: string; full_name: string; status: PlatformStaffStatus };
}

export const resendPlatformStaffInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    const staff = await loadStaff(data.staffId);
    if (staff.status !== "invited") throw new Error("Only pending invites can be resent.");
    const db = await admin();
    const { error } = await db.auth.admin.inviteUserByEmail(staff.email, {
      redirectTo: inviteRedirect(),
      data: { full_name: staff.full_name, sherivs_staff: true },
    });
    // Unconfirmed invited users can be re-invited; if GoTrue refuses, fall
    // back to a recovery (set-password) email for the same account.
    if (error) {
      const { error: rErr } = await db.auth.resetPasswordForEmail(staff.email, {
        redirectTo: inviteRedirect(),
      });
      if (rErr) {
        await audit(context, "resend_invite", staff.id, "failed", { reason: rErr.message });
        throw new Error(rErr.message);
      }
    }
    await audit(context, "resend_invite", staff.id, "succeeded", { email: staff.email });
    return { ok: true };
  });

/* ---------- status changes: revoke / suspend / reactivate ---------- */
const statusSchema = z.object({
  staffId: z.string().uuid(),
  status: z.enum(["active", "suspended", "revoked"]),
});

export const setPlatformStaffStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => statusSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    if (data.staffId === context.userId) throw new Error("You cannot change your own status.");
    const staff = await loadStaff(data.staffId);
    if (!canTransition(staff.status, data.status)) {
      throw new Error(`Cannot change status from ${staff.status} to ${data.status}.`);
    }
    const db = await admin();
    const now = timeAuthority.now().at;
    const { error } = await db
      .from("platform_staff")
      .update({
        status: data.status,
        updated_at: now,
        suspended_at: data.status === "suspended" ? now : null,
      })
      .eq("id", staff.id);
    if (error) throw new Error(error.message);

    if (data.status !== "active") {
      // Cut off live sessions: ban the auth account (suspend/revoke) — the
      // 'none' duration lifts it on reactivation. Revoked staff also lose roles.
      await db.auth.admin.updateUserById(staff.id, { ban_duration: "876000h" });
      if (data.status === "revoked") {
        await db.from("platform_staff_roles").delete().eq("staff_id", staff.id);
      }
    } else {
      await db.auth.admin.updateUserById(staff.id, { ban_duration: "none" });
    }
    await audit(context, `status.${data.status}`, staff.id, "succeeded", {
      from: staff.status,
      to: data.status,
    });
    return { ok: true };
  });

/* ---------- set roles ---------- */
const rolesSchema = z.object({ staffId: z.string().uuid(), roles: roleList });

export const setPlatformStaffRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => rolesSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuper(context);
    const staff = await loadStaff(data.staffId);
    if (staff.status === "revoked") throw new Error("Revoked staff cannot hold roles.");
    const db = await admin();
    const { data: current } = await db
      .from("platform_staff_roles")
      .select("role_code")
      .eq("staff_id", staff.id);
    const before = new Set((current ?? []).map((r) => r.role_code));
    const after = new Set<string>(data.roles);
    const toAdd = [...after].filter((r) => !before.has(r));
    const toRemove = [...before].filter((r) => !after.has(r));
    if (toRemove.length) {
      const { error } = await db
        .from("platform_staff_roles")
        .delete()
        .eq("staff_id", staff.id)
        .in("role_code", toRemove);
      if (error) throw new Error(error.message);
    }
    if (toAdd.length) {
      const { error } = await db
        .from("platform_staff_roles")
        .insert(
          toAdd.map((role_code) => ({ staff_id: staff.id, role_code, granted_by: context.userId })),
        );
      if (error) throw new Error(error.message);
    }
    await audit(context, "set_roles", staff.id, "succeeded", { added: toAdd, removed: toRemove });
    return { roles: [...after] };
  });
