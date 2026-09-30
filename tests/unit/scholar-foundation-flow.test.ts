import { describe, expect, it } from "vitest";
import {
  buildScholarFoundationEntity,
  SCHOLAR_FOUNDATION_ACTION,
  SCHOLAR_FOUNDATION_ENTITY_TYPES,
  SCHOLAR_FOUNDATION_MISSION_ID,
  scholarFoundationRequest,
} from "@/lib/runtime/scholar-foundation-flow";
import { SCHOLAR_RUNTIME_ID } from "@/lib/runtime/scholar-consumption";

const NOW = "2026-09-30T06:00:00.000Z";

describe("scholar foundation flow — ontology boundary", () => {
  it("declares Scholar ontology entity types including learner", () => {
    expect(SCHOLAR_FOUNDATION_ENTITY_TYPES).toContain("learner");
    expect(SCHOLAR_FOUNDATION_ENTITY_TYPES).toContain("institution");
  });

  it("builds an insert-ready row through the universal kernel contract", () => {
    const row = buildScholarFoundationEntity(
      { entityType: "learner", state: "enrolled", attributes: { probe: true } },
      "school-1",
      NOW,
    );
    expect(row.entity_type).toBe("learner");
    expect(row.tenant_id).toBe("school-1");
    expect(row.classification).toBe("INTERNAL");
    expect(row.source_type).toBe(`cg:${SCHOLAR_RUNTIME_ID}:foundation-validation`);
    expect(row.recorded_at).toBe(NOW);
  });

  it("rejects entity types outside the declared Scholar ontology", () => {
    expect(() =>
      buildScholarFoundationEntity({ entityType: "restaurant" }, "school-1", NOW),
    ).toThrow(/not declared in the Scholar ontology/);
  });

  it("keeps the governed mission envelope bounded", () => {
    const request = scholarFoundationRequest({
      executionId: "exec-1",
      idempotencyKey: "idem-12345678",
      requestedAt: NOW,
    });
    expect(request.missionId).toBe(SCHOLAR_FOUNDATION_MISSION_ID);
    expect(request.action).toBe(SCHOLAR_FOUNDATION_ACTION);
    expect(request.ownerRef).toContain(SCHOLAR_RUNTIME_ID);
    expect(request.authorityRef).toBe("CONTROL-PLANE-06");
  });
});