/**
 * Sherivs Scholar — Phase 09 Security & Trust Fabric unit tests
 * (trust-entities).
 *
 * Validates:
 * - Device trust evaluation (S).
 * - Workload trust evaluation (T).
 * - Agent trust evaluation (U) — degradation never grants permissions.
 * - Model trust registration (V).
 * - Software provenance (W) and artifact integrity (X).
 * - Supply-chain trust reduction (Y).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import {
  evaluateDeviceTrust,
  evaluateWorkloadTrust,
  evaluateAgentTrust,
  registerModelTrust,
  registerSoftwareProvenance,
  verifyArtifactIntegrity,
  supplyChainTrustState,
} from "@/lib/trust-entities";

const TENANT_A = tenantId("tenant-a");
const NOW = "2026-01-01T00:00:00Z";

describe("evaluateDeviceTrust (S)", () => {
  it("never trusts an unenrolled or unattested device", () => {
    const record = evaluateDeviceTrust({
      deviceId: "d1",
      tenantId: TENANT_A,
      enrolled: false,
      postureOk: true,
      osIntegrityOk: true,
      encryptionEnabled: true,
      attestationVerified: true,
      recentAnomalies: 0,
      now: NOW,
    });
    expect(record.trustState).toBe("UNVERIFIED");
  });

  it("degrades a device with anomalies or failed posture", () => {
    const record = evaluateDeviceTrust({
      deviceId: "d1",
      tenantId: TENANT_A,
      enrolled: true,
      postureOk: false,
      osIntegrityOk: true,
      encryptionEnabled: true,
      attestationVerified: true,
      recentAnomalies: 0,
      now: NOW,
    });
    expect(record.trustState).toBe("DEGRADED");
  });

  it("trusts a fully verified, encrypted, anomaly-free device", () => {
    const record = evaluateDeviceTrust({
      deviceId: "d1",
      tenantId: TENANT_A,
      enrolled: true,
      postureOk: true,
      osIntegrityOk: true,
      encryptionEnabled: true,
      attestationVerified: true,
      recentAnomalies: 0,
      now: NOW,
    });
    expect(record.trustState).toBe("TRUSTED");
  });
});

describe("evaluateWorkloadTrust (T)", () => {
  it("trusts a workload with all integrity checks verified", () => {
    const record = evaluateWorkloadTrust({
      workloadId: "w1",
      deploymentOriginVerified: true,
      artifactIntegrityVerified: true,
      imageProvenanceVerified: true,
      configurationIntegrityVerified: true,
      now: NOW,
    });
    expect(record.trustState).toBe("TRUSTED");
  });

  it("conditionally trusts when artifact integrity is verified but provenance is not", () => {
    const record = evaluateWorkloadTrust({
      workloadId: "w1",
      deploymentOriginVerified: false,
      artifactIntegrityVerified: true,
      imageProvenanceVerified: false,
      configurationIntegrityVerified: true,
      now: NOW,
    });
    expect(record.trustState).toBe("CONDITIONALLY_TRUSTED");
  });

  it("leaves an artifact-integrity-failed workload unverified", () => {
    const record = evaluateWorkloadTrust({
      workloadId: "w1",
      deploymentOriginVerified: true,
      artifactIntegrityVerified: false,
      imageProvenanceVerified: true,
      configurationIntegrityVerified: true,
      now: NOW,
    });
    expect(record.trustState).toBe("UNVERIFIED");
  });
});

describe("evaluateAgentTrust (U)", () => {
  it("trusts a fully clean, compliant, identity-verified agent", () => {
    const record = evaluateAgentTrust({
      agentId: "a1",
      identityVerified: true,
      policyCompliant: true,
      toolBehaviorSuspicious: false,
      executionHistoryClean: true,
      promptIntegrityOk: true,
      now: NOW,
    });
    expect(record.trustState).toBe("TRUSTED");
  });

  it("quarantines an agent with suspicious tool behavior (U.3)", () => {
    const record = evaluateAgentTrust({
      agentId: "a1",
      identityVerified: true,
      policyCompliant: true,
      toolBehaviorSuspicious: true,
      executionHistoryClean: true,
      promptIntegrityOk: true,
      now: NOW,
    });
    expect(record.trustState).toBe("QUARANTINED");
  });

  it("degrades a policy-violating agent without granting permissions (U.3)", () => {
    const record = evaluateAgentTrust({
      agentId: "a1",
      identityVerified: true,
      policyCompliant: false,
      toolBehaviorSuspicious: false,
      executionHistoryClean: true,
      promptIntegrityOk: true,
      now: NOW,
    });
    expect(record.trustState).toBe("DEGRADED");
  });

  it("leaves an identity-unverified agent unverified", () => {
    const record = evaluateAgentTrust({
      agentId: "a1",
      identityVerified: false,
      policyCompliant: true,
      toolBehaviorSuspicious: false,
      executionHistoryClean: true,
      promptIntegrityOk: true,
      now: NOW,
    });
    expect(record.trustState).toBe("UNVERIFIED");
  });
});

describe("registerModelTrust (V)", () => {
  it("trusts only fully verified, evaluated models", () => {
    expect(
      registerModelTrust({
        modelId: "m1",
        version: "1.0",
        provenanceVerified: true,
        integrityVerified: true,
        evaluationPassed: true,
        approvedUseScope: null,
        rollbackVersion: null,
      }).trustState,
    ).toBe("TRUSTED");
    expect(
      registerModelTrust({
        modelId: "m1",
        version: "1.0",
        provenanceVerified: true,
        integrityVerified: false,
        evaluationPassed: true,
        approvedUseScope: null,
        rollbackVersion: null,
      }).trustState,
    ).toBe("UNVERIFIED");
  });
});

describe("registerSoftwareProvenance (W)", () => {
  it("requires source repository and commit", () => {
    const result = registerSoftwareProvenance({
      artifactId: "artifact-1",
      sourceRepository: "",
      commit: "",
      buildId: "build-1",
      dependencyVersions: [],
      signer: "signer-1",
      deploymentEnvironment: "production",
      deployedAt: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("registers complete provenance", () => {
    const result = registerSoftwareProvenance({
      artifactId: "artifact-1",
      sourceRepository: "github.com/coregrid/scholar",
      commit: "abc123",
      buildId: "build-1",
      dependencyVersions: ["react@19"],
      signer: "signer-1",
      deploymentEnvironment: "production",
      deployedAt: NOW,
    });
    expect(result.ok).toBe(true);
  });
});

describe("verifyArtifactIntegrity (X)", () => {
  it("verifies a matching hash with signature and provenance", () => {
    const verdict = verifyArtifactIntegrity({
      artifactId: "artifact-1",
      expectedHash: "sha256:abc",
      actualHash: "sha256:abc",
      signatureVerified: true,
      sourceVerified: true,
      buildIdentityVerified: true,
    });
    expect(verdict.verified).toBe(true);
  });

  it("rejects a hash mismatch even with everything else verified", () => {
    const verdict = verifyArtifactIntegrity({
      artifactId: "artifact-1",
      expectedHash: "sha256:abc",
      actualHash: "sha256:def",
      signatureVerified: true,
      sourceVerified: true,
      buildIdentityVerified: true,
    });
    expect(verdict.verified).toBe(false);
    expect(verdict.reason).toMatch(/mismatch/i);
  });

  it("rejects a missing signature", () => {
    const verdict = verifyArtifactIntegrity({
      artifactId: "artifact-1",
      expectedHash: "sha256:abc",
      actualHash: "sha256:abc",
      signatureVerified: false,
      sourceVerified: true,
      buildIdentityVerified: true,
    });
    expect(verdict.verified).toBe(false);
  });
});

describe("supplyChainTrustState (Y)", () => {
  it("never trusts without verified provenance", () => {
    expect(supplyChainTrustState(false, true)).toBe("UNVERIFIED");
  });

  it("degrades when provenance exists but integrity fails", () => {
    expect(supplyChainTrustState(true, false)).toBe("DEGRADED");
  });

  it("trusts only when both provenance and integrity are verified", () => {
    expect(supplyChainTrustState(true, true)).toBe("TRUSTED");
  });
});
