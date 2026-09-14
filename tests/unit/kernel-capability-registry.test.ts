/**
 * CoreGrid — kernel capability registry tests (domain-neutral snapshot).
 */
import { describe, expect, it } from "vitest";
import {
  KERNEL_CAPABILITIES,
  kernelCapabilitiesForPhase,
  kernelCapabilityById,
} from "../../frontend/src/lib/kernel/kernel-capability-registry";
import { scholarConsumedKernelCapabilities } from "../../frontend/src/lib/runtime/scholar-consumption";

describe("kernel capability registry", () => {
  it("covers the full platform capability graph with unique ids", () => {
    expect(KERNEL_CAPABILITIES.length).toBeGreaterThanOrEqual(50);
    const ids = new Set(KERNEL_CAPABILITIES.map((capability) => capability.id));
    expect(ids.size).toBe(KERNEL_CAPABILITIES.length);
  });

  it("attributes every capability to an owned phase (01–51)", () => {
    for (const capability of KERNEL_CAPABILITIES) {
      expect(capability.ownerPhase).toMatch(/^(0[1-9]|[1-4][0-9]|5[01])$/);
      expect(capability.label.trim().length).toBeGreaterThan(0);
      expect(capability.consumers.length).toBeGreaterThan(0);
    }
  });

  it("exposes id and phase lookups", () => {
    expect(kernelCapabilityById("security-enforcement")?.ownerPhase).toBe("08");
    expect(kernelCapabilitiesForPhase("06").map((capability) => capability.id)).toContain(
      "workspace-composition",
    );
    expect(kernelCapabilityById("not-a-capability")).toBeUndefined();
  });

  it("declares the capabilities Scholar R-001 consumes", () => {
    const scholar = scholarConsumedKernelCapabilities();
    const ids = new Set(scholar.map((capability) => capability.id));
    expect(scholar.length).toBeGreaterThanOrEqual(10);
    // Direct runtime consumers are explicit in the graph.
    expect(ids.has("mobile-client-platform")).toBe(true);
    expect(ids.has("web-client-platform")).toBe(true);
    expect(ids.has("onboarding-workforce-identity")).toBe(true);
    // Domain consumers arrive through the runtime's owner phases.
    expect(ids.has("education-reality-ontology")).toBe(true);
    expect(ids.has("communication-messaging")).toBe(true);
  });
});
