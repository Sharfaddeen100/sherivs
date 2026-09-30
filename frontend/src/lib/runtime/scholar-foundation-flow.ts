/**
 * Scholar foundation validation flow (Gate 14, bounded).
 *
 * Scholar is the first domain-runtime validation of the universal foundation
 * slice: a Scholar entity is recorded through the UNIVERSAL kernel entity
 * contract (`kernel/reality.ts` entityDraft via `runtime/scholar-reality.ts`)
 * and then carried through the verified foundation loop
 * (`control-plane/foundation-loop.ts`) to an independent verification record.
 *
 * This module is pure. It persists nothing and owns no capability. Scholar
 * vocabulary lives here and in the Scholar runtime modules; the kernel never
 * imports it (kernel-purity test).
 */
import { SCHOLAR_RUNTIME_MANIFEST } from "@/lib/runtime/scholar";
import { scholarEntityDraft } from "@/lib/runtime/scholar-reality";
import { SCHOLAR_RUNTIME_ID } from "@/lib/runtime/scholar-consumption";
import type { FoundationLoopRequest } from "@/lib/control-plane/foundation-loop";

export const SCHOLAR_FOUNDATION_MISSION_ID = "COREGRID-SCHOLAR-FOUNDATION-VALIDATION-001";
export const SCHOLAR_FOUNDATION_ACTION = "record-observation" as const;

export interface ScholarFoundationEntityInput {
  entityType: string;
  state?: string | null;
  attributes?: Record<string, unknown>;
}

/** Build an insert-ready cg_entity row through the Scholar ontology boundary. */
export function buildScholarFoundationEntity(
  input: ScholarFoundationEntityInput,
  tenantId: string,
  now: string,
) {
  return scholarEntityDraft(
    input.entityType,
    {
      tenantId,
      state: input.state ?? null,
      classification: "INTERNAL",
      attributes: input.attributes ?? {},
      sourceType: `cg:${SCHOLAR_RUNTIME_ID}:foundation-validation`,
    },
    now,
  );
}

/** Governed mission envelope for the Scholar validation loop. */
export function scholarFoundationRequest(input: {
  executionId: string;
  idempotencyKey: string;
  requestedAt: string;
}): FoundationLoopRequest {
  return {
    executionId: input.executionId,
    idempotencyKey: input.idempotencyKey,
    missionId: SCHOLAR_FOUNDATION_MISSION_ID,
    version: "1",
    purpose: "scholar-domain-foundation-validation",
    authorityRef: "CONTROL-PLANE-06",
    contextRef: "scholar-foundation-validation",
    ownerRef: `RUNTIME.md / ${SCHOLAR_RUNTIME_ID}`,
    action: SCHOLAR_FOUNDATION_ACTION,
    requestedAt: input.requestedAt,
  };
}

/** Declared Scholar entity types exposed for validation surfaces. */
export const SCHOLAR_FOUNDATION_ENTITY_TYPES: readonly string[] =
  SCHOLAR_RUNTIME_MANIFEST.ontology.entityTypes.map((type) => type.name);