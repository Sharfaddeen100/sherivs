/**
 * CoreGrid — Phase 33 Universal Reality Kernel: typed reality contracts.
 *
 * Typed contracts for the kernel substrate tables (cg_entity, cg_relationship,
 * cg_event, cg_observation) authored in the kernel substrate migration
 * (20260903000000_coregrid_universal_kernel_substrate.sql).
 *
 * The DATABASE is the source of truth for constraints (CHECK clauses, indexes,
 * RLS). These contracts mirror that truth so application code never invents
 * values the database would reject. `kernel-reality.test.ts` pins both sides
 * together mechanically.
 *
 * Boundary: this module performs NO persistence and owns NO state. Server
 * functions will write through service-role adapters once the substrate
 * migration is applied. Until then this layer is an authored contract,
 * explicitly incomplete at the persistence level.
 */

/* ─────────────────────────────────────────────────────────────
 * Enumerated domains (must match the SQL CHECK clauses exactly)
 * ────────────────────────────────────────────────────────────*/

export type DataClassification =
  "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "SENSITIVE" | "RESTRICTED" | "HIGHLY_RESTRICTED";

export const DATA_CLASSIFICATIONS: readonly DataClassification[] = [
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "SENSITIVE",
  "RESTRICTED",
  "HIGHLY_RESTRICTED",
] as const;

export type ObservationKind = "observed" | "reported" | "inferred" | "predicted" | "simulated";

/** Truth-hierarchy kinds are never collapsed (phase-01 §56 / kernel). */
export const OBSERVATION_KINDS: readonly ObservationKind[] = [
  "observed",
  "reported",
  "inferred",
  "predicted",
  "simulated",
] as const;

export type EventDeliveryState = "pending" | "published" | "failed" | "acknowledged" | "dead";

export const EVENT_DELIVERY_STATES: readonly EventDeliveryState[] = [
  "pending",
  "published",
  "failed",
  "acknowledged",
  "dead",
] as const;

/* ─────────────────────────────────────────────────────────────
 * Guards
 * ────────────────────────────────────────────────────────────*/

export function isDataClassification(value: unknown): value is DataClassification {
  return (DATA_CLASSIFICATIONS as readonly unknown[]).includes(value);
}

export function isObservationKind(value: unknown): value is ObservationKind {
  return (OBSERVATION_KINDS as readonly unknown[]).includes(value);
}

export function isEventDeliveryState(value: unknown): value is EventDeliveryState {
  return (EVENT_DELIVERY_STATES as readonly unknown[]).includes(value);
}

export function isConfidence(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

/** Mirrors CHECK (length(entity_type) BETWEEN 1 AND 128). */
export function isEntityType(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 128;
}

/** Mirrors CHECK (length(relation_type) BETWEEN 1 AND 128). */
export function isRelationType(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 128;
}

/** Mirrors CHECK (jsonb_typeof(payload) = 'object'). */
export function isPayloadObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Mirrors CHECK (source_entity_id <> target_entity_id). */
export function areDistinctEntityIds(sourceId: string, targetId: string): boolean {
  return sourceId !== targetId;
}

/* ─────────────────────────────────────────────────────────────
 * Draft builders (insert-ready rows; database defaults still apply)
 * ────────────────────────────────────────────────────────────*/

export interface EntityDraftInput {
  entityType: string;
  tenantId?: string | null;
  state?: string | null;
  classification?: DataClassification;
  attributes?: Record<string, unknown>;
  sourceType?: string | null;
  sourceRef?: string | null;
  observedAt?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  confidence?: number | null;
}

export function entityDraft(input: EntityDraftInput, now: string) {
  if (!isEntityType(input.entityType)) {
    throw new Error("entity_type must be 1–128 characters");
  }
  const classification = input.classification ?? "INTERNAL";
  if (!isDataClassification(classification)) {
    throw new Error("classification is not a registered data classification");
  }
  if (input.confidence != null && !isConfidence(input.confidence)) {
    throw new Error("confidence must be a finite number between 0 and 1");
  }
  if (input.attributes != null && !isPayloadObject(input.attributes)) {
    throw new Error("attributes must be a JSON object");
  }
  return {
    entity_type: input.entityType.trim(),
    tenant_id: input.tenantId?.trim() || null,
    state: input.state?.trim() || null,
    classification,
    attributes: input.attributes ?? {},
    source_type: input.sourceType ?? null,
    source_ref: input.sourceRef ?? null,
    observed_at: input.observedAt ?? null,
    recorded_at: now,
    valid_from: input.validFrom ?? null,
    valid_to: input.validTo ?? null,
    confidence: input.confidence ?? null,
  };
}

export interface EventDraftInput {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  actorIdentity?: string | null;
  tenantId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  payload?: Record<string, unknown>;
  occurredAt?: string;
}

export function eventDraft(input: EventDraftInput, now: string) {
  if (!input.eventType || input.eventType.length > 200) {
    throw new Error("event_type must be 1–200 characters");
  }
  if (!input.aggregateType || input.aggregateType.length > 200) {
    throw new Error("aggregate_type must be 1–200 characters");
  }
  if (!input.aggregateId) {
    throw new Error("aggregate_id is required");
  }
  const payload = input.payload ?? {};
  if (!isPayloadObject(payload)) {
    throw new Error("payload must be a JSON object");
  }
  return {
    event_type: input.eventType,
    aggregate_type: input.aggregateType,
    aggregate_id: input.aggregateId,
    actor_identity: input.actorIdentity ?? null,
    tenant_id: input.tenantId?.trim() || null,
    occurred_at: input.occurredAt ?? now,
    recorded_at: now,
    correlation_id: input.correlationId ?? null,
    idempotency_key: input.idempotencyKey ?? null,
    payload,
    payload_version: 1,
    state: "pending",
    attempts: 0,
  };
}

export interface ObservationDraftInput {
  subjectEntityId: string;
  kind: ObservationKind;
  statement?: Record<string, unknown>;
  observerIdentity?: string | null;
  tenantId?: string | null;
  sourceType?: string | null;
  sourceRef?: string | null;
  confidence?: number | null;
  observedAt?: string | null;
}

export function observationDraft(input: ObservationDraftInput, now: string) {
  if (!input.subjectEntityId) {
    throw new Error("subject_entity_id is required");
  }
  if (!isObservationKind(input.kind)) {
    throw new Error("kind is not a registered observation kind");
  }
  const statement = input.statement ?? {};
  if (!isPayloadObject(statement)) {
    throw new Error("statement must be a JSON object");
  }
  if (input.confidence != null && !isConfidence(input.confidence)) {
    throw new Error("confidence must be a finite number between 0 and 1");
  }
  return {
    subject_entity_id: input.subjectEntityId,
    kind: input.kind,
    statement,
    observer_identity: input.observerIdentity ?? null,
    tenant_id: input.tenantId?.trim() || null,
    source_type: input.sourceType ?? null,
    source_ref: input.sourceRef ?? null,
    confidence: input.confidence ?? null,
    evidence_entity_ids: [],
    observed_at: input.observedAt ?? null,
    recorded_at: now,
  };
}

export interface RelationshipDraftInput {
  sourceEntityId: string;
  targetEntityId: string;
  relationType: string;
  tenantId?: string | null;
  attributes?: Record<string, unknown>;
  sourceRef?: string | null;
  observedAt?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  confidence?: number | null;
}

/** Mirrors CHECK (source_entity_id <> target_entity_id) plus type/scope rules. */
export function relationshipDraft(input: RelationshipDraftInput, now: string) {
  if (!input.sourceEntityId || !input.targetEntityId) {
    throw new Error("source and target entity ids are required");
  }
  if (!areDistinctEntityIds(input.sourceEntityId, input.targetEntityId)) {
    throw new Error("source and target entity ids must differ");
  }
  if (!isRelationType(input.relationType)) {
    throw new Error("relation_type must be 1–128 characters");
  }
  if (input.confidence != null && !isConfidence(input.confidence)) {
    throw new Error("confidence must be a finite number between 0 and 1");
  }
  if (input.attributes != null && !isPayloadObject(input.attributes)) {
    throw new Error("attributes must be a JSON object");
  }
  return {
    source_entity_id: input.sourceEntityId,
    target_entity_id: input.targetEntityId,
    relation_type: input.relationType.trim(),
    tenant_id: input.tenantId?.trim() || null,
    attributes: input.attributes ?? {},
    source_ref: input.sourceRef ?? null,
    observed_at: input.observedAt ?? null,
    recorded_at: now,
    valid_from: input.validFrom ?? null,
    valid_to: input.validTo ?? null,
    confidence: input.confidence ?? null,
  };
}
