/**
 * CoreGrid — organization-profile server functions (org-admin scope).
 *
 * Reads and writes a tenant's profile through the domain-neutral org-profile
 * RPCs (cg_org_profile substrate). The tenant boundary is resolved server-side
 * from the actor (never supplied by the client). Scholar defines the payload
 * shape via `scholar-profile.ts`; the kernel never interprets payloads.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { asKernelAdmin } from "@/lib/kernel-admin-client";
import { requireSchoolAdminScope } from "@/lib/security-role-gate";
import {
  SCHOLAR_PROFILE_CLOSING_PRESETS,
  SCHOLAR_SCHOOL_PROFILE_KEY,
  scholarSchoolProfileSchema,
} from "@/lib/runtime/scholar-profile";

export const SCHOLAR_PROFILE_RUNTIME = "runtime:scholar";

export const getOrganizationProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({}).parse(input))
  .handler(async ({ context }) => {
    const schoolId = await requireSchoolAdminScope(context.supabase);
    const db = asKernelAdmin(context.supabase);
    const { data, error } = await db.rpc("get_org_profile", {
      p_tenant: schoolId,
      p_runtime: SCHOLAR_PROFILE_RUNTIME,
      p_profile_key: SCHOLAR_SCHOOL_PROFILE_KEY,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!row?.payload) return null;
    return { payload: scholarSchoolProfileSchema.parse(row.payload) };
  });

export const saveOrganizationProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ profile: scholarSchoolProfileSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const schoolId = await requireSchoolAdminScope(context.supabase);
    const { data: id, error } = await asKernelAdmin(context.supabase).rpc("upsert_org_profile", {
      p_tenant: schoolId,
      p_runtime: SCHOLAR_PROFILE_RUNTIME,
      p_profile_key: SCHOLAR_SCHOOL_PROFILE_KEY,
      p_payload: data.profile,
    });
    if (error) throw new Error(error.message);
    return { id: id as string | null, closingPresets: SCHOLAR_PROFILE_CLOSING_PRESETS };
  });

export type SavedSchoolProfile = Awaited<ReturnType<typeof getOrganizationProfile>>;
