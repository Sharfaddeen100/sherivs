/**
 * CoreGrid Scholar runtime → kernel event-flow tests.
 *
 * These tests prove the runtime consumes the universal kernel: every Scholar
 * domain event passes through the kernel `eventDraft` contract and is bound to
 * an aggregate declared in the Scholar ontology. The kernel validates
 * structure; the runtime owns the domain vocabulary.
 */

import { describe, expect, it } from "vitest";
import {
  SCHOLAR_EVENT_TYPES,
  scholarEventDraft,
  isScholarEventType,
} from "@/lib/runtime/scholar-events";
import { SCHOLAR_RUNTIME_MANIFEST } from "@/lib/runtime/scholar";

const NOW = "2026-09-03T00:00:00.000Z";

describe("Scholar domain event vocabulary", () => {
  it("declares only kernel-valid event types", () => {
    for (const type of SCHOLAR_EVENT_TYPES) {
      expect(type.length).toBeGreaterThan(0);
      expect(type.length).toBeLessThanOrEqual(200);
      expect(isScholarEventType(type)).toBe(true);
    }
  });

  it("maps every event aggregate onto an entity type declared in the Scholar ontology", () => {
    const declared = SCHOLAR_RUNTIME_MANIFEST.ontology.entityTypes.map((t) => t.name);
    for (const type of SCHOLAR_EVENT_TYPES) {
      const draft = scholarEventDraft(type, "entity-1", { now: NOW });
      expect(declared).toContain(draft.aggregate_type);
    }
  });

  it("produces kernel-valid event drafts (pending, versioned, idempotent)", () => {
    const draft = scholarEventDraft("learner.enrolled", "learner-42", {
      now: NOW,
      tenantId: "tenant-1",
      idempotencyKey: "enroll-1",
      actorIdentity: "user-9",
    });
    expect(draft.event_type).toBe("learner.enrolled");
    expect(draft.aggregate_type).toBe("learner");
    expect(draft.aggregate_id).toBe("learner-42");
    expect(draft.state).toBe("pending");
    expect(draft.payload_version).toBe(1);
    expect(draft.attempts).toBe(0);
    expect(draft.idempotency_key).toBe("enroll-1");
    expect(draft.tenant_id).toBe("tenant-1");
    expect(draft.actor_identity).toBe("user-9");
    expect(draft.recorded_at).toBe(NOW);
  });

  it("rejects event types outside the Scholar vocabulary", () => {
    expect(isScholarEventType("unknown.type")).toBe(false);
    expect(() => scholarEventDraft("unknown.type" as never, "entity-1", { now: NOW })).toThrow(
      /not a registered Scholar event/,
    );
  });
});
