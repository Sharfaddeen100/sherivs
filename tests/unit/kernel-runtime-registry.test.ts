/**
 * CoreGrid — Phase 33 Universal Kernel: domain-runtime registry lifecycle tests.
 */

import { describe, expect, it } from "vitest";
import {
  applyRuntimeStatusTransition,
  canTransitionRuntimeStatus,
  registryRowFromManifest,
} from "@/lib/kernel/runtime-registry";
import { SCHOLAR_RUNTIME_MANIFEST } from "@/lib/runtime/scholar";

const NOW = "2026-09-03T00:00:00.000Z";

describe("kernel runtime registry — status lifecycle", () => {
  it("enforces the documented transition set", () => {
    expect(canTransitionRuntimeStatus("proposed", "review")).toBe(true);
    expect(canTransitionRuntimeStatus("review", "approved")).toBe(true);
    expect(canTransitionRuntimeStatus("approved", "active")).toBe(true);
    expect(canTransitionRuntimeStatus("active", "suspended")).toBe(true);
    expect(canTransitionRuntimeStatus("suspended", "active")).toBe(true);
    expect(canTransitionRuntimeStatus("active", "active")).toBe(false);
    expect(canTransitionRuntimeStatus("retired", "active")).toBe(false);
  });

  it("builds a registry row from a validated manifest", () => {
    const row = registryRowFromManifest(SCHOLAR_RUNTIME_MANIFEST, NOW);
    expect(row.id).toBe("runtime:scholar");
    expect(row.version).toBe("0.1.0");
    expect(row.status).toBe("proposed");
    expect(row.created_at).toBe(NOW);
    expect(row.updated_at).toBe(NOW);
  });

  it("rejects an invalid manifest at registration time", () => {
    const broken = { ...SCHOLAR_RUNTIME_MANIFEST, capabilities: [] };
    expect(() => registryRowFromManifest(broken, NOW)).toThrow(/invalid manifest/);
  });

  it("applies valid status transitions", () => {
    const proposed = registryRowFromManifest(SCHOLAR_RUNTIME_MANIFEST, NOW);
    const review = applyRuntimeStatusTransition(proposed, "review", NOW);
    expect(review.ok).toBe(true);
    if (review.ok) expect(review.row.status).toBe("review");

    const active = applyRuntimeStatusTransition(review.ok ? review.row : proposed, "approved", NOW);
    expect(active.ok).toBe(true);
  });

  it("refuses invalid status transitions with an explicit reason", () => {
    const row = registryRowFromManifest(SCHOLAR_RUNTIME_MANIFEST, NOW);
    const result = applyRuntimeStatusTransition(row, "active", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("proposed → active");
  });
});
