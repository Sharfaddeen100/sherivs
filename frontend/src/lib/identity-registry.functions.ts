/**
 * CoreGrid — Phase 02 identity registry server functions (L2 consumption).
 *
 * Registers identities in `cg_identity` through the pure `identity-registry`
 * contract. Tenant-scoped: the canonical school-admin gate resolves the actor's
 * OWN school as the tenant boundary (P02 C2; Constitution §26/§38 — never trust
 * a client-supplied tenant id). Writes use the service role because cg_identity
 * is deny-by-default RLS.
 *
 * Status: DB-VALIDATED schema (20260904020000) — HTTP-layer invocation pending
 * an app runtime; the DB path is exercised live by the L2 verification script.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { asKernelAdmin } from "@/lib/kernel-admin-client";
import { requireSchoolAdminScope } from "@/lib/security-role-gate";
import {
  IDENTITY_KINDS,
  IDENTITY_STATES,
  identityDraft,
  type IdentityKind,
  type IdentityState,
} from "@/lib/identity-registry";

const registerIdentitySchema = z.object({
  kind: z.enum(IDENTITY_KINDS as unknown as [string, ...string[]]),
  display_name: z.string().trim().min(1).max(200),
  external_subject: z.string().trim().min(1).max(300).optional().nullable(),
  entity_id: z.string().uuid().optional().nullable(),
  state: z.enum(IDENTITY_STATES as unknown as [IdentityState, ...IdentityState[]]).optional(),
  verified: z.boolean().optional(),
});

export type RegisterIdentityResult = {
  ok: true;
  id: string;
  kind: IdentityKind;
  tenant_id: string;
};

export const registerIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => registerIdentitySchema.parse(input))
  .handler(async ({ data, context }): Promise<RegisterIdentityResult> => {
    // Tenant boundary = the actor's resolved school scope.
    const schoolId = await requireSchoolAdminScope(context.supabase);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = asKernelAdmin(supabaseAdmin);
    const now = new Date().toISOString();

    const row = identityDraft(
      {
        kind: data.kind as IdentityKind,
        displayName: data.display_name,
        externalSubject: data.external_subject ?? null,
        entityId: data.entity_id ?? null,
        tenantId: schoolId,
        state: (data.state as IdentityState | undefined) ?? "provisioned",
        verified: data.verified ?? false,
      },
      now,
    );

    const { data: inserted, error } = await admin
      .from("cg_identity")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return {
      ok: true,
      id: inserted.id as string,
      kind: row.kind,
      tenant_id: row.tenant_id ?? schoolId,
    };
  });
