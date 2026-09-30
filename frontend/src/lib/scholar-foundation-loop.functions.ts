/**
 * Scholar foundation validation server path (Gate 14, bounded).
 *
 * Scholar entity → universal cg_entity substrate → verified foundation loop.
 * The Scholar entity is created through the Scholar ontology boundary
 * (`runtime/scholar-foundation-flow.ts`) and its persisted row is carried
 * through the verified foundation loop to an independent verification record.
 * No Scholar table is touched and no Scholar capability is rebuilt.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { asKernelAdmin, type KernelAdminClient } from "@/lib/kernel-admin-client";
import { requireSchoolAdminScope } from "@/lib/security-role-gate";
import { planFoundationLoop } from "@/lib/control-plane/foundation-loop";
import {
  auditFoundationLoop,
  persistFoundationPlan,
} from "@/lib/foundation-loop.functions";
import {
  buildScholarFoundationEntity,
  scholarFoundationRequest,
  SCHOLAR_FOUNDATION_ENTITY_TYPES,
  SCHOLAR_FOUNDATION_MISSION_ID,
} from "@/lib/runtime/scholar-foundation-flow";

const scholarSchema = z.object({
  entityType: z.string().trim().min(1).max(128),
  state: z.string().trim().max(120).optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().trim().min(8).max(200),
}).strict();

export type ScholarFoundationResult = {
  ok: true;
  replayed: boolean;
  executionId: string;
  executionStatus: string;
  scholarEntityType: string;
  realityRef: string;
  verificationDecision: string | null;
};

async function loadAdmin(): Promise<KernelAdminClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return asKernelAdmin(supabaseAdmin);
}

export async function executeScholarFoundationLoop(input: {
  supabase: Parameters<typeof requireSchoolAdminScope>[0];
  userId: string;
  data: z.infer<typeof scholarSchema>;
}): Promise<ScholarFoundationResult> {
  const tenantId = await requireSchoolAdminScope(input.supabase);
  const admin = await loadAdmin();
  const now = new Date().toISOString();

  // Scholar vocabulary is validated here, before any write (runtime owns it).
  const entityRow = buildScholarFoundationEntity(
    { entityType: input.data.entityType, state: input.data.state ?? null, attributes: input.data.attributes },
    tenantId,
    now,
  );
  const { data: inserted, error: insertError } = await admin
    .from("cg_entity")
    .insert(entityRow)
    .select("id, tenant_id")
    .single();
  if (insertError) throw new Error(insertError.message);
  const realityRef = String(inserted.id);

  const plan = planFoundationLoop({
    tenantId,
    actorId: input.userId,
    now,
    reality: { id: realityRef, tenantId: inserted.tenant_id ?? null },
    requestedRealityRef: realityRef,
    request: scholarFoundationRequest({
      executionId: crypto.randomUUID(),
      idempotencyKey: input.data.idempotencyKey,
      requestedAt: now,
    }),
  });

  const result = await persistFoundationPlan(plan, admin);
  await auditFoundationLoop({
    admin,
    tenantId,
    userId: input.userId,
    action: "scholar_foundation_loop",
    result,
    realityRef,
  });
  return {
    ok: true,
    replayed: result.replayed,
    executionId: result.executionId,
    executionStatus: result.executionStatus,
    scholarEntityType: input.data.entityType,
    realityRef,
    verificationDecision: result.verification?.decision ?? null,
  };
}

export const scholarFoundationLoop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => scholarSchema.parse(input))
  .handler(async ({ data, context }): Promise<ScholarFoundationResult> =>
    executeScholarFoundationLoop({
      supabase: context.supabase,
      userId: context.userId,
      data,
    }),
  );

export { SCHOLAR_FOUNDATION_ENTITY_TYPES, SCHOLAR_FOUNDATION_MISSION_ID };