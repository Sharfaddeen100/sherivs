import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { scholarWorkspaceHome } from "@/lib/runtime/nav-registry";
import { INSTALLED_RUNTIME_ID, INSTALLED_RUNTIME_NAME } from "@/lib/runtime/installed-runtimes";
import { resolveIdentity, type OrganizationMembership } from "./identity";

/**
 * Sherivs — server-authoritative identity resolver (§11).
 *
 * Resolves the full identity chain for the authenticated caller from the
 * identity store, through the caller's own RLS-scoped client:
 *
 *   auth user → super_admins (internal workforce) → users (memberships) →
 *   schools (organizations) → role → runtime → workspace home
 *
 * The client never supplies tenant, role, or membership data — it can only
 * ask "who am I signed in as". A deactivated membership resolves as no
 * membership (unlinked), never as a workspace.
 */
export const resolveSherivsIdentity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as SupabaseClient<Database>;
    const userId = context.userId;

    // 1. Internal Sherivs workforce (super admins) — never routed into a
    //    customer organization workspace by default.
    const { data: internal } = await db
      .from("super_admins")
      .select("id, full_name, email")
      .eq("id", userId)
      .maybeSingle();
    if (internal) {
      return resolveIdentity({ isSherivsInternal: true, memberships: [] });
    }

    // 2. Organization memberships (current identity store: one users row per
    //    auth user, carrying the organization and role).
    const { data: profile } = await db
      .from("users")
      .select("id, school_id, role, is_active")
      .eq("id", userId)
      .maybeSingle();

    if (!profile || profile.is_active === false) {
      return resolveIdentity({ isSherivsInternal: false, memberships: [] });
    }

    const role = profile.role as OrganizationMembership["role"];
    const organizationId = profile.school_id as string;
    if (!organizationId || !role) {
      return resolveIdentity({ isSherivsInternal: false, memberships: [] });
    }

    // 3. Organization reality (display name + public slug).
    const { data: org } = await db
      .from("schools")
      .select("id, name, slug")
      .eq("id", organizationId)
      .maybeSingle();

    const membership: OrganizationMembership = {
      organizationId,
      name: (org?.name as string | undefined) ?? "Your organization",
      slug: (org?.slug as string | null | undefined) ?? null,
      role,
      runtimeId: INSTALLED_RUNTIME_ID,
      runtimeName: INSTALLED_RUNTIME_NAME,
      homePath: scholarWorkspaceHome(role),
    };

    return resolveIdentity({ isSherivsInternal: false, memberships: [membership] });
  });
