/**
 * CoreGrid Scholar — Phase 09 Security & Trust Fabric unit tests
 * (trust-assertions).
 *
 * Validates:
 * - Assertion creation requirements (F.1, L.2).
 * - Assertion verification: integrity, revocation, expiration, issuer, scope
 *   (L, O, AA, AB, BR.7).
 * - Evidence quality constraints (M.2) and freshness.
 * - Provenance chains must trace to evidence (N.3).
 * - Revocation records require attribution and conditions (AA, BR.14).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import {
  createTrustAssertion,
  verifyTrustAssertion,
  revokeTrustAssertion,
  createTrustEvidence,
  isTrustEvidenceFresh,
  buildProvenanceChain,
  createTrustRevocation,
  type TrustAssertion,
} from "@/lib/trust-assertions";

const TENANT_A = tenantId("tenant-a");
const NOW = "2026-01-01T00:00:00Z";
const FUTURE = "2027-01-01T00:00:00Z";

function makeAssertion(overrides: Partial<TrustAssertion> = {}): TrustAssertion {
  const created = createTrustAssertion({
    issuer: "issuer-1",
    subject: "device-1",
    type: "device",
    trustLevel: "high",
    evidence: ["evt-attestation"],
    scope: "production",
    tenantId: TENANT_A,
    integrityReference: "sig-1",
    provenanceRef: "prov-1",
    issuedAt: NOW,
    expiresAt: FUTURE,
  });
  if (!created.ok) throw new Error("fixture failed");
  return { ...created.assertion, ...overrides };
}

describe("createTrustAssertion (F.1, L.2)", () => {
  it("creates an assertion with all contract fields", () => {
    const assertion = makeAssertion();
    expect(assertion.issuer).toBe("issuer-1");
    expect(assertion.revokedAt).toBeNull();
  });

  it("rejects an empty issuer", () => {
    const result = createTrustAssertion({
      issuer: "",
      subject: "device-1",
      type: "device",
      trustLevel: "high",
      evidence: ["evt"],
      scope: null,
      tenantId: TENANT_A,
      integrityReference: "sig-1",
      provenanceRef: null,
      issuedAt: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an assertion without evidence (L.2, BR.2)", () => {
    const result = createTrustAssertion({
      issuer: "issuer-1",
      subject: "device-1",
      type: "device",
      trustLevel: "high",
      evidence: [],
      scope: null,
      tenantId: TENANT_A,
      integrityReference: "sig-1",
      provenanceRef: null,
      issuedAt: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an assertion without integrity protection (L.2)", () => {
    const result = createTrustAssertion({
      issuer: "issuer-1",
      subject: "device-1",
      type: "device",
      trustLevel: "high",
      evidence: ["evt"],
      scope: null,
      tenantId: TENANT_A,
      integrityReference: "",
      provenanceRef: null,
      issuedAt: NOW,
    });
    expect(result.ok).toBe(false);
  });
});

describe("verifyTrustAssertion (L, O, AA, AB, BR.7)", () => {
  it("accepts a valid, unexpired, non-revoked assertion from an accepted issuer", () => {
    const result = verifyTrustAssertion(makeAssertion(), true, ["issuer-1"], "production", NOW);
    expect(result.ok).toBe(true);
  });

  it("rejects when integrity cannot be verified (O.2)", () => {
    const result = verifyTrustAssertion(makeAssertion(), false, ["issuer-1"], "production", NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects a revoked assertion (AA)", () => {
    const revoked = revokeTrustAssertion(makeAssertion(), NOW);
    const result = verifyTrustAssertion(revoked, true, ["issuer-1"], "production", NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects an expired assertion (AB)", () => {
    const assertion = makeAssertion({ expiresAt: "2025-12-31T00:00:00Z" });
    const result = verifyTrustAssertion(assertion, true, ["issuer-1"], "production", NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects an issuer that is not accepted", () => {
    const result = verifyTrustAssertion(makeAssertion(), true, ["issuer-2"], "production", NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects a scope mismatch (BR.7 external trust scoping)", () => {
    const result = verifyTrustAssertion(makeAssertion(), true, ["issuer-1"], "staging", NOW);
    expect(result.ok).toBe(false);
  });
});

describe("createTrustEvidence (M.2)", () => {
  it("rejects out-of-range reliability", () => {
    const result = createTrustEvidence({
      id: "evt-1",
      source: "attestation",
      capturedAt: NOW,
      reliability: 1.5,
      integrityRef: "sig",
      provenanceRef: "prov",
      confidence: 0.5,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects out-of-range confidence", () => {
    const result = createTrustEvidence({
      id: "evt-1",
      source: "attestation",
      capturedAt: NOW,
      reliability: 0.8,
      integrityRef: "sig",
      provenanceRef: "prov",
      confidence: -0.2,
    });
    expect(result.ok).toBe(false);
  });

  it("creates valid evidence", () => {
    const result = createTrustEvidence({
      id: "evt-1",
      source: "attestation",
      capturedAt: NOW,
      reliability: 0.9,
      integrityRef: "sig",
      provenanceRef: "prov",
      confidence: 0.8,
    });
    expect(result.ok).toBe(true);
  });

  it("evaluates evidence freshness against the window", () => {
    const result = createTrustEvidence({
      id: "evt-1",
      source: "attestation",
      capturedAt: "2026-01-01T00:00:00Z",
      freshnessMs: 60_000,
      reliability: 0.9,
      integrityRef: "sig",
      provenanceRef: "prov",
      confidence: 0.8,
    });
    if (!result.ok) throw new Error("fixture failed");
    expect(isTrustEvidenceFresh(result.evidence, "2026-01-01T00:00:30Z")).toBe(true);
    expect(isTrustEvidenceFresh(result.evidence, "2026-01-01T00:02:00Z")).toBe(false);
  });
});

describe("buildProvenanceChain (N)", () => {
  it("rejects an empty chain (N.3)", () => {
    const result = buildProvenanceChain([]);
    expect(result.ok).toBe(false);
  });

  it("rejects a chain that does not start with a trust decision", () => {
    const result = buildProvenanceChain([
      { kind: "evidence", id: "evt-1", detail: "evidence", at: NOW },
    ]);
    expect(result.ok).toBe(false);
  });

  it("rejects a chain without evidence (N.3)", () => {
    const result = buildProvenanceChain([
      { kind: "trust_decision", id: "d1", detail: "decision", at: NOW },
      { kind: "issuer", id: "i1", detail: "issuer", at: NOW },
    ]);
    expect(result.ok).toBe(false);
  });

  it("accepts a complete chain decision -> ... -> evidence", () => {
    const result = buildProvenanceChain([
      { kind: "trust_decision", id: "d1", detail: "decision", at: NOW },
      { kind: "trust_assertion", id: "a1", detail: "assertion", at: NOW },
      { kind: "evidence", id: "e1", detail: "evidence", at: NOW },
    ]);
    expect(result.ok).toBe(true);
  });
});

describe("createTrustRevocation (AA)", () => {
  it("requires an attributable actor (BR.14)", () => {
    const result = createTrustRevocation({
      subjectId: "device-1",
      reason: "compromise",
      kind: "permanent_revocation",
      revokedBy: "",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("requires a condition for conditional restoration (AA.2)", () => {
    const result = createTrustRevocation({
      subjectId: "device-1",
      reason: "compromise",
      kind: "conditional_restoration",
      revokedBy: "admin-1",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("creates a permanent revocation with attribution", () => {
    const result = createTrustRevocation({
      subjectId: "device-1",
      reason: "credential_compromise",
      kind: "permanent_revocation",
      revokedBy: "admin-1",
      now: NOW,
    });
    expect(result.ok).toBe(true);
  });
});
