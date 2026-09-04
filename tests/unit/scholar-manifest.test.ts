/**
 * CoreGrid Scholar runtime manifest tests (Phase 04 reframe).
 *
 * Scholar is registered on the universal kernel through the generic
 * domain-runtime manifest contract. These tests pin the Scholar manifest
 * instance to that contract:
 * - the manifest validates structurally (the kernel gate accepts it);
 * - removing a required declaration makes the kernel reject it (the gate is
 *   real, not decorative);
 * - the manifest is a runtime artifact (not a kernel source) — it declares the
 *   education ontology as an extension, never as a kernel definition.
 */

import { describe, expect, it } from "vitest";
import { validateManifest } from "@/lib/kernel/domain-manifest";
import { SCHOLAR_RUNTIME_MANIFEST, validateScholarManifest } from "@/lib/runtime/scholar";

describe("Scholar runtime manifest (P04 reframe)", () => {
  it("validates against the generic domain-runtime manifest contract", () => {
    expect(validateManifest(SCHOLAR_RUNTIME_MANIFEST)).toEqual({ ok: true });
    expect(validateScholarManifest()).toBe(true);
  });

  it("is a proposed runtime with the canonical scholar id", () => {
    expect(SCHOLAR_RUNTIME_MANIFEST.id).toBe("runtime:scholar");
    expect(SCHOLAR_RUNTIME_MANIFEST.status).toBe("proposed");
    expect(SCHOLAR_RUNTIME_MANIFEST.ontology.entityTypes.length).toBeGreaterThan(0);
    expect(SCHOLAR_RUNTIME_MANIFEST.capabilities.length).toBeGreaterThan(0);
  });

  it("declares an education ontology as extensions (never kernel definitions)", () => {
    const names = SCHOLAR_RUNTIME_MANIFEST.ontology.entityTypes.map((t) => t.name);
    // The education ontology extends the universal substrate; it does not
    // redefine the universal pseudo-types the kernel already provides.
    expect(names).not.toContain("actor");
    expect(names).not.toContain("entity");
    expect(names).toContain("learner");
    expect(names).toContain("guardian");
  });

  it("is rejected by the kernel gate when a required declaration is removed", () => {
    const broken = {
      ...SCHOLAR_RUNTIME_MANIFEST,
      capabilities: [],
    };
    expect(validateManifest(broken).ok).toBe(false);
  });
});
