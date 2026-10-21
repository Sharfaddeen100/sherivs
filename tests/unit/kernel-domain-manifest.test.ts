/**
 * Sherivs — Phase 33 Universal Reality Kernel: domain-runtime manifest tests.
 *
 * The kernel accepts any domain runtime through a validated manifest. These
 * tests pin the structural contract: ids, versions, statuses, ontology
 * references, capability consumption and interface kinds. A valid manifest is
 * domain-agnostic in shape yet open to any domain's ontology values — that is
 * what makes runtime installation a data operation, not a kernel change.
 */

import { describe, expect, it } from "vitest";
import {
  isValidManifestId,
  isValidManifestVersion,
  isValidTypeName,
  RUNTIME_INTERFACE_KINDS,
  RUNTIME_MANIFEST_STATUSES,
  validateManifest,
  type RuntimeManifest,
} from "@/lib/kernel/domain-manifest";

function manifest(overrides: Partial<RuntimeManifest> = {}): RuntimeManifest {
  return {
    id: "runtime:education",
    name: "Education Runtime",
    version: "0.1.0",
    status: "proposed",
    ontology: {
      entityTypes: [{ name: "learner" }, { name: "educator" }],
      relationshipTypes: [{ name: "teaches", sourceTypes: ["educator"], targetTypes: ["learner"] }],
    },
    capabilities: ["identity", "tenancy"],
    policies: ["policy-set:default"],
    interfaces: [{ name: "portal", kind: "ui" }],
    ...overrides,
  };
}

describe("domain-runtime manifest — value contracts", () => {
  it("registers statuses and interface kinds", () => {
    expect(RUNTIME_MANIFEST_STATUSES).toContain("active");
    expect(RUNTIME_INTERFACE_KINDS).toEqual(["api", "event", "ui"]);
  });

  it("accepts valid ids, versions and type names", () => {
    expect(isValidManifestId("runtime:education")).toBe(true);
    expect(isValidManifestVersion("0.1.0")).toBe(true);
    expect(isValidTypeName("learner")).toBe(true);
  });

  it("rejects malformed ids, versions and type names", () => {
    expect(isValidManifestId("education")).toBe(false);
    expect(isValidManifestId("runtime:Education")).toBe(false);
    expect(isValidManifestId("1runtime:education")).toBe(false);
    expect(isValidManifestVersion("1.0")).toBe(false);
    expect(isValidTypeName("Learner")).toBe(false);
  });
});

describe("domain-runtime manifest — validation", () => {
  it("accepts a minimal valid manifest", () => {
    expect(validateManifest(manifest())).toEqual({ ok: true });
  });

  it("accepts universal pseudo-types without declaring them", () => {
    const m = manifest({
      ontology: {
        entityTypes: [],
        relationshipTypes: [{ name: "relates", sourceTypes: ["actor"], targetTypes: ["entity"] }],
      },
    });
    expect(validateManifest(m)).toEqual({ ok: true });
  });

  it("rejects a manifest with an invalid id or version", () => {
    expect(validateManifest(manifest({ id: "education" })).ok).toBe(false);
    expect(validateManifest(manifest({ version: "v1" })).ok).toBe(false);
  });

  it("rejects an unregistered status", () => {
    const m = manifest({ status: "live" as never });
    expect(validateManifest(m).ok).toBe(false);
  });

  it("requires at least one consumed capability", () => {
    const m = manifest({ capabilities: [] });
    expect(validateManifest(m).ok).toBe(false);
  });

  it("rejects duplicate or malformed entity types", () => {
    const duplicate = manifest({
      ontology: {
        entityTypes: [{ name: "learner" }, { name: "learner" }],
        relationshipTypes: [],
      },
    });
    expect(validateManifest(duplicate).ok).toBe(false);

    const malformed = manifest({
      ontology: {
        entityTypes: [{ name: "Learner" }],
        relationshipTypes: [],
      },
    });
    expect(validateManifest(malformed).ok).toBe(false);
  });

  it("rejects relationship types referencing undeclared types", () => {
    const m = manifest({
      ontology: {
        entityTypes: [{ name: "learner" }],
        relationshipTypes: [{ name: "guides", sourceTypes: ["mentor"], targetTypes: ["learner"] }],
      },
    });
    expect(validateManifest(m).ok).toBe(false);
  });

  it("rejects empty relationship source/target sets", () => {
    const m = manifest({
      ontology: {
        entityTypes: [],
        relationshipTypes: [{ name: "relates", sourceTypes: [], targetTypes: [] }],
      },
    });
    expect(validateManifest(m).ok).toBe(false);
  });

  it("rejects interfaces with an unregistered kind", () => {
    const m = manifest({ interfaces: [{ name: "feed", kind: "socket" as never }] });
    expect(validateManifest(m).ok).toBe(false);
  });
});
