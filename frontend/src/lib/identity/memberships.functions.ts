import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { scholarWorkspaceHome } from "@/lib/runtime/nav-registry";
import type { OrganizationMembership } from "@/lib/identity/identity";
import { writeAuditRecord } from "@/lib/server/write-audit";

/**
 * Sherivs — active-organization switch (§11 multi-membership).
 *
 * A member with several organization memberships switches their ACTIVE
 * workspace context. Security posture (submit–resolve; the client submits a
 * CHOICE and nothing else):
 *
 *   1. The choice is validated against the caller's OWN membership set,
 *      read through the caller's RLS-scoped client — a membership the actor
 *      does not hold (or that is deactivated) is unswitchable, fail-closed.
 *   2. The active context is persisted by re-pointing the identity store's
 *      active-context binding (`users.school_id`/`role`) through the
 *      service role — the same binding every live tenant RLS predicate
 *      resolves through. Nothing about the authorization model changes;
 *      the actor simply moves into an organization they verifiably belong
 *      to. The membership-sync trigger keeps the substrate coherent.
 *   3. The write is audited (fail-closed, never logs secrets).
 *
 * Returns the resolved destination for the switched context.
 */

const switchValidator = z.object({
  /** The organization to make active (must be an ACTIVE membership of the caller). */
  organizationId: z.string().uuid(),
});

/** Pure selection helper — testable; mirrors the resolver's ordering. */
export function pickSwitchTarget<T extends { organizationId: string }>(
  memberships: readonly T[],
  organizationId: string,
): T | null {
  return memberships.find((m) => m.organizationId === organizationId) ?? null;
}

/**
 * Structural client for the membership substrate. The generated Database
 * types are produced from the LIVE database (`npm run types:generate`); the
 * membership table arrives with migration 20261008000050 and is not yet in
 * the generated types. Reads are single-column-name lookups on the caller's
 * own rows — the structural type keeps the switch path decoupled from
 * regeneration ordering without weakening any check that matters (the
 * server fn never trusts client data; the write is audited).
 */
interface MembershipFilter {
  eq(col: "user_id" | "school_id" | "is_active", val: string | boolean): MembershipFilter;
  maybeSingle(): PromiseLike<{
    data: {
      school_id: string;
      role: OrganizationMembership["role"];
      is_active: boolean | null;
    } | null;
    error: { message: string } | null;
  }>;
}

interface MembershipSubstrateClient {
  from(table: "organization_memberships"): {
    select(cols: string): MembershipFilter;
  };
}

export const switchActiveOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => switchValidator.parse(input))
  .handler(async ({ data, context }) => {
    const db = context.supabase as SupabaseClient<Database>;
    const userId = context.userId;

    // 1. Resolve the caller's own ACTIVE membership (RLS-scoped).
    const substrate = db as unknown as MembershipSubstrateClient;
    const { data: membership, error: membershipErr } = await substrate
      .from("organization_memberships")
      .select("school_id, role, is_active")
      .eq("user_id", userId)
      .eq("school_id", data.organizationId)
      .eq("is_active", true)
      .maybeSingle();
    if (membershipErr || !membership) {
      throw new Error("Not an active member of that organization.");
    }

    // 2. Verify the caller's identity-store row is live (deactivated
    //    accounts cannot switch contexts at all).
    const { data: profile, error: profileErr } = await db
      .from("users")
      .select("id, school_id, is_active")
      .eq("id", userId)
      .maybeSingle();
    if (profileErr || !profile || profile.is_active === false) {
      throw new Error("Account is not active.");
    }
    if (profile.school_id === data.organizationId) {
      // Already active — resolve the destination without a write.
      return {
        destination: scholarWorkspaceHome(membership.role),
        organizationId: data.organizationId,
      };
    }

    // 3. Persist the active-context move (service role; trigger mirrors the
    //    membership substrate and demotes the previous primary).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: updateErr } = await supabaseAdmin
      .from("users")
      .update({ school_id: data.organizationId, role: membership.role })
      .eq("id", userId);
    if (updateErr) throw new Error(updateErr.message);

    // 4. Audit — fail-closed; never records secrets.
    await writeAuditRecord(supabaseAdmin, {
      action: "organization.switch",
      gate: "requireSupabaseAuth",
      tenantId: data.organizationId,
      actorId: userId,
      table: "users",
      recordId: userId,
      outcome: "succeeded",
      details: { from_school_id: profile.school_id, to_school_id: data.organizationId },
    });

    return {
      destination: scholarWorkspaceHome(membership.role),
      organizationId: data.organizationId,
    };
  });
