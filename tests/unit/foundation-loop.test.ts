import { describe, expect, it } from "vitest";
import { planFoundationLoop } from "@/lib/control-plane/foundation-loop";

const now = "2026-09-29T14:00:00.000Z";
const request = {
  executionId: "exec-1",
  idempotencyKey: "idem-12345678",
  missionId: "COREGRID-FOUNDATION-MISSION-001",
  version: "1",
  purpose: "bounded-reality-loop",
  authorityRef: "CONTROL-PLANE-06",
  contextRef: "context-1",
  ownerRef: "MISSIONS.md",
  action: "record-observation",
  requestedAt: now,
};

describe("foundation loop plan", () => {
  it("binds verification to a same-tenant reality reference", () => {
    const plan = planFoundationLoop({
      tenantId: "tenant-a",
      actorId: "actor-1",
      now,
      reality: { id: "11111111-1111-4111-8111-111111111111", tenantId: "tenant-a" },
      requestedRealityRef: "11111111-1111-4111-8111-111111111111",
      request,
    });
    expect(plan.admission.result.status).toBe("admitted");
    expect(plan.execution.tenant_id).toBe("tenant-a");
    expect(plan.evidence?.provenance).toContain("cg_entity:");
    expect(plan.verification?.decision).toBe("verified");
    expect(plan.verification?.execution_id).toBe(plan.execution.id);
    expect(plan.verification?.evidence_ids).toEqual([plan.evidence?.evidence_id]);
  });

  it("does not verify a reality reference outside the server tenant", () => {
    const plan = planFoundationLoop({
      tenantId: "tenant-a",
      actorId: "actor-1",
      now,
      reality: { id: "11111111-1111-4111-8111-111111111111", tenantId: "tenant-b" },
      requestedRealityRef: "11111111-1111-4111-8111-111111111111",
      request,
    });
    expect(plan.admission.result.reason).toBe("cross_tenant");
    expect(plan.verification).toBeNull();
    expect(plan.evidence).toBeNull();
    expect(plan.execution.external_effect).toBe("none");
  });

  it("does not verify a missing reality reference", () => {
    const plan = planFoundationLoop({
      tenantId: "tenant-a",
      actorId: "actor-1",
      now,
      reality: null,
      requestedRealityRef: "11111111-1111-4111-8111-111111111111",
      request,
    });
    expect(plan.admission.result.reason).toBe("missing_reality");
    expect(plan.verification).toBeNull();
  });
});
