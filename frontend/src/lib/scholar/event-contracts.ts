/**
 * CoreGrid Scholar — event contracts + idempotency (Phase-04 §131–133, I6).
 *
 * Every Scholar event is emitted through the universal kernel event contract
 * (`kernel/reality.ts` eventDraft). This module is the runtime's wrapper layer:
 * it stamps every event with a stable, deterministic EVENT KEY so consumers
 * and the event fabric can deduplicate (§133) — a replayed or retried event
 * never double-counts, and the same key always derives the same identity.
 */

import { eventDraft } from "@/lib/kernel/reality";

export interface ScholarEventInput {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  actorIdentity?: string | null;
  tenantId?: string | null;
  idempotencyKey?: string | null;
  payload?: Record<string, unknown>;
  occurredAt?: string | null;
}

/** Deterministic pure checksum (base-36) over arbitrary stable strings. */
export function stableChecksum(parts: readonly string[]): string {
  let hash = 0;
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 1) {
      hash = (hash * 31 + part.charCodeAt(i)) >>> 0;
    }
  }
  return hash.toString(36);
}

/** The stable identity of an event — independent of recording time. */
export function eventKey(
  input: Pick<ScholarEventInput, "eventType" | "aggregateType" | "aggregateId">,
): string {
  return `${input.eventType}::${input.aggregateType}::${input.aggregateId}`;
}

/** A deterministic idempotency key when the runtime did not supply one. */
export function deriveIdempotencyKey(
  input: Pick<ScholarEventInput, "eventType" | "aggregateType" | "aggregateId" | "payload">,
): string {
  const payloadParts = input.payload
    ? Object.keys(input.payload)
        .sort()
        .map((k) => `${k}:${JSON.stringify((input.payload as Record<string, unknown>)[k])}`)
    : [];
  return stableChecksum([eventKey(input), ...payloadParts]);
}

/** Emit a Scholar event through the kernel contract with dedup identity. */
export function scholarEventDraft(input: ScholarEventInput, now: string) {
  const key = eventKey(input);
  const idempotencyKey = input.idempotencyKey ?? deriveIdempotencyKey(input);
  const { occurredAt, ...rest } = input;
  return {
    key,
    event: eventDraft({ ...rest, idempotencyKey, occurredAt: occurredAt ?? undefined }, now),
  };
}

/** Pure replay guard: has this event key already been recorded? */
export function isDuplicate(key: string, seenKeys: ReadonlySet<string>): boolean {
  return seenKeys.has(key);
}
