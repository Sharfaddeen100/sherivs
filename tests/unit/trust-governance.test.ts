/**
 * CoreGrid Scholar — Phase 09 Security & Trust Fabric unit tests
 * (trust-governance).
 *
 * Validates:
 * - Key trust metadata registry: no private material, expiry (P).
 * - Certificate trust registration/validation (Q).
 * - Federation scoping, expiration, distinct parties (AC, AD).
 * - Delegation constraints (AG).
 * - Trust anchors require an administrator (AI).
 * - Trust policy minimums and attestation requirements (AE).
 * - Zero-trust evaluation (AK) and the Phase 08 integration contract (AL).
 */

import { describe, expect, it } from "vitest";
import {
  registerKeyTrust,
  isKeyTrustUsable,
  registerCertificateTrust,
  evaluateCertificateTrust,
  createFederation,
  isFederationActive,
  createTrustDelegation,
  isDelegationActive,
  registerTrustAnchor,
  revokeTrustAnchor,
  createTrustPolicy,
  evaluateTrustPolicy,
  evaluateZeroTrust,
  trustStateToUsable,
} from "@/lib/trust-governance";

const NOW = "2026-01-01T00:00:00Z";
const FUTURE = "2027-01-01T00:00:00Z";

describe("registerKeyTrust (P)", () => {
  it("requires a key fingerprint", () => {
    const result = registerKeyTrust({
      keyId: "key-1",
      kind: "signing",
      fingerprint: "",
      subjectId: "subject-1",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("registers public-key metadata only (never private material)", () => {
    const result = registerKeyTrust({
      keyId: "key-1",
      kind: "signing",
      fingerprint: "sha256:abc",
      subjectId: "subject-1",
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.fingerprint).toBe("sha256:abc");
      expect("privateKey" in result.record).toBe(false);
    }
  });

  it("marks an expired key as unusable", () => {
    const result = registerKeyTrust({
      keyId: "key-1",
      kind: "signing",
      fingerprint: "sha256:abc",
      subjectId: "subject-1",
      expiresAt: "2025-12-31T00:00:00Z",
      now: NOW,
    });
    if (!result.ok) throw new Error("fixture failed");
    expect(isKeyTrustUsable(result.record, NOW)).toBe(false);
  });
});

describe("Certificate trust (Q)", () => {
  it("rejects an already-expired certificate at registration", () => {
    const result = registerCertificateTrust({
      certificateId: "cert-1",
      subjectId: "subject-1",
      issuerId: "ca-1",
      chainVerified: true,
      expiresAt: "2025-12-31T00:00:00Z",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("accepts a valid future certificate", () => {
    const result = registerCertificateTrust({
      certificateId: "cert-1",
      subjectId: "subject-1",
      issuerId: "ca-1",
      chainVerified: true,
      expiresAt: FUTURE,
      now: NOW,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects expired or unverified-chain certificates at evaluation", () => {
    const expired = {
      certificateId: "cert-1",
      subjectId: "subject-1",
      issuerId: "ca-1",
      status: "valid" as const,
      chainVerified: true,
      expiresAt: "2025-12-31T00:00:00Z",
      createdAt: NOW,
    };
    expect(evaluateCertificateTrust(expired, NOW).ok).toBe(false);

    const unverifiedChain = {
      certificateId: "cert-2",
      subjectId: "subject-1",
      issuerId: "ca-1",
      status: "valid" as const,
      chainVerified: false,
      expiresAt: FUTURE,
      createdAt: NOW,
    };
    expect(evaluateCertificateTrust(unverifiedChain, NOW).ok).toBe(false);
  });
});

describe("Trust federation (AC, AD)", () => {
  it("rejects federation between identical parties", () => {
    const result = createFederation({
      parties: ["coregrid", "coregrid"],
      trustScope: "identity",
      acceptedAssertionTypes: ["identity"],
      verificationMethods: ["signature"],
      expiresAt: FUTURE,
      auditRequired: true,
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("requires accepted assertions and a scope (AC.2)", () => {
    const noScope = createFederation({
      parties: ["coregrid", "school-a"],
      trustScope: "",
      acceptedAssertionTypes: ["identity"],
      verificationMethods: ["signature"],
      expiresAt: FUTURE,
      auditRequired: true,
      now: NOW,
    });
    expect(noScope.ok).toBe(false);

    const noAssertions = createFederation({
      parties: ["coregrid", "school-a"],
      trustScope: "identity",
      acceptedAssertionTypes: [],
      verificationMethods: ["signature"],
      expiresAt: FUTURE,
      auditRequired: true,
      now: NOW,
    });
    expect(noAssertions.ok).toBe(false);
  });

  it("rejects expired federations (AB)", () => {
    const result = createFederation({
      parties: ["coregrid", "school-a"],
      trustScope: "identity",
      acceptedAssertionTypes: ["identity"],
      verificationMethods: ["signature"],
      expiresAt: "2025-12-31T00:00:00Z",
      auditRequired: true,
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("creates an active federation that expires", () => {
    const result = createFederation({
      parties: ["coregrid", "school-a"],
      trustScope: "identity",
      acceptedAssertionTypes: ["identity"],
      verificationMethods: ["signature"],
      expiresAt: FUTURE,
      auditRequired: true,
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(isFederationActive(result.relationship, NOW)).toBe(true);
      expect(isFederationActive(result.relationship, "2028-01-01T00:00:00Z")).toBe(false);
    }
  });
});

describe("Trust delegation (AG)", () => {
  it("rejects self-delegation", () => {
    const result = createTrustDelegation({
      delegatorId: "admin-1",
      delegateId: "admin-1",
      authority: "manage",
      scope: "school-1",
      expiresAt: FUTURE,
      restrictions: [],
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects expired delegations (AB)", () => {
    const result = createTrustDelegation({
      delegatorId: "admin-1",
      delegateId: "agent-1",
      authority: "manage",
      scope: "school-1",
      expiresAt: "2025-12-31T00:00:00Z",
      restrictions: [],
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("creates an active delegation with scope and restrictions", () => {
    const result = createTrustDelegation({
      delegatorId: "admin-1",
      delegateId: "agent-1",
      authority: "manage",
      scope: "school-1",
      expiresAt: FUTURE,
      restrictions: ["no_financial_ops"],
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(isDelegationActive(result.delegation, NOW)).toBe(true);
      expect(result.delegation.restrictions).toContain("no_financial_ops");
    }
  });
});

describe("Trust anchors (AI)", () => {
  it("requires a managing administrator", () => {
    const result = registerTrustAnchor({
      id: "anchor-1",
      kind: "root_certificate",
      managedBy: "",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("registers and revokes an anchor", () => {
    const result = registerTrustAnchor({
      id: "anchor-1",
      kind: "approved_issuer",
      managedBy: "sec-owner-1",
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const revoked = revokeTrustAnchor(result.anchor, NOW);
      expect(revoked.revokedAt).toBe(NOW);
    }
  });
});

describe("Trust policy registry (AE)", () => {
  it("requires at least one accepted issuer", () => {
    const result = createTrustPolicy({
      id: "policy-1",
      version: 1,
      acceptedIssuers: [],
      acceptableEvidenceKinds: ["attestation"],
      defaultTrustLifetimeMs: 60_000,
      minimumAssurance: 0.5,
      requireAttestation: true,
      effectiveAt: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an out-of-range minimum assurance", () => {
    const result = createTrustPolicy({
      id: "policy-1",
      version: 1,
      acceptedIssuers: ["issuer-1"],
      acceptableEvidenceKinds: ["attestation"],
      defaultTrustLifetimeMs: 60_000,
      minimumAssurance: 2,
      requireAttestation: true,
      effectiveAt: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("evaluates policy: issuer, evidence, attestation, minimum assurance", () => {
    const created = createTrustPolicy({
      id: "policy-1",
      version: 1,
      acceptedIssuers: ["issuer-1"],
      acceptableEvidenceKinds: ["attestation"],
      defaultTrustLifetimeMs: 60_000,
      minimumAssurance: 0.5,
      requireAttestation: true,
      effectiveAt: NOW,
    });
    if (!created.ok) throw new Error("fixture failed");

    expect(
      evaluateTrustPolicy({
        policy: created.policy,
        assurance: 0.9,
        issuerAccepted: true,
        evidenceAccepted: true,
        attestationOk: true,
      }).ok,
    ).toBe(true);

    expect(
      evaluateTrustPolicy({
        policy: created.policy,
        assurance: 0.9,
        issuerAccepted: true,
        evidenceAccepted: true,
        attestationOk: false,
      }).ok,
    ).toBe(false);

    expect(
      evaluateTrustPolicy({
        policy: created.policy,
        assurance: 0.2,
        issuerAccepted: true,
        evidenceAccepted: true,
        attestationOk: true,
      }).ok,
    ).toBe(false);
  });
});

describe("evaluateZeroTrust (AK) and Phase 08 integration (AL)", () => {
  it("denies when identity or session is unverified", () => {
    expect(
      evaluateZeroTrust({
        identityVerified: false,
        deviceTrusted: true,
        sessionValid: true,
        riskAction: "allow",
      }).verdict,
    ).toBe("deny");
  });

  it("challenges when the device is not trusted", () => {
    expect(
      evaluateZeroTrust({
        identityVerified: true,
        deviceTrusted: false,
        sessionValid: true,
        riskAction: "allow",
      }).verdict,
    ).toBe("challenge");
  });

  it("denies when the risk action blocks (assume breach)", () => {
    expect(
      evaluateZeroTrust({
        identityVerified: true,
        deviceTrusted: true,
        sessionValid: true,
        riskAction: "quarantine",
      }).verdict,
    ).toBe("deny");
  });

  it("trusts only when every signal is verified and risk allows", () => {
    expect(
      evaluateZeroTrust({
        identityVerified: true,
        deviceTrusted: true,
        sessionValid: true,
        riskAction: "allow",
      }).verdict,
    ).toBe("trusted");
  });

  it("exposes usable trust states to Phase 08 (trust.get_state)", () => {
    expect(trustStateToUsable("TRUSTED")).toBe(true);
    expect(trustStateToUsable("CONDITIONALLY_TRUSTED")).toBe(true);
    expect(trustStateToUsable("DEGRADED")).toBe(false);
  });
});
