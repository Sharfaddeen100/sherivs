/**
 * CoreGrid Scholar — Phase 08 Security Engine unit tests (security-core).
 *
 * Validates:
 * - Security Decision Contract construction and expiration (Section F.1).
 * - Decision-state granting semantics (Section F.2).
 * - Security Gateway fail-closed enforcement (Sections H, I.5, AT.9).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import { correlationId } from "@/lib/runtime-core";
import {
  createSecurityDecision,
  isSecurityDecisionExpired,
  isGrantingDecision,
  evaluateSecurityGateway,
  NON_GRANTING_DECISION_STATES,
  type SecurityDecisionContext,
} from "@/lib/security-core";

const TENANT_A = tenantId("tenant-a");
const NOW = "2026-01-01T00:00:00Z";

function baseContext(overrides: Partial<SecurityDecisionContext> = {}): SecurityDecisionContext {
  return {
    requestId: "req-1",
    actorId: "user-1",
    actorType: "human",
    tenantId: TENANT_A,
    resource: "student",
    action: "read",
    context: {},
    policyVersion: "v1",
    riskScore: 10,
    correlationId: correlationId("corr-1"),
    now: NOW,
    ttlSeconds: 60,
    ...overrides,
  };
}

describe("createSecurityDecision (Section F.1)", () => {
  it("carries all required contract fields", () => {
    const decision = createSecurityDecision(baseContext(), "ALLOW", "granted");
    expect(decision.requestId).toBe("req-1");
    expect(decision.actorId).toBe("user-1");
    expect(decision.tenantId).toBe(TENANT_A);
    expect(decision.decision).toBe("ALLOW");
    expect(decision.reason).toBe("granted");
    expect(decision.policyVersion).toBe("v1");
  });

  it("computes an expiration based on ttlSeconds", () => {
    const decision = createSecurityDecision(baseContext({ ttlSeconds: 30 }), "ALLOW", "ok");
    expect(Date.parse(decision.expiresAt) - Date.parse(NOW)).toBe(30_000);
  });
});

describe("isSecurityDecisionExpired", () => {
  it("is not expired before the expiration time", () => {
    const decision = createSecurityDecision(baseContext({ ttlSeconds: 60 }), "ALLOW", "ok");
    expect(isSecurityDecisionExpired(decision, "2026-01-01T00:00:30Z")).toBe(false);
  });

  it("is expired at or after the expiration time", () => {
    const decision = createSecurityDecision(baseContext({ ttlSeconds: 60 }), "ALLOW", "ok");
    expect(isSecurityDecisionExpired(decision, "2026-01-01T00:01:00Z")).toBe(true);
  });
});

describe("isGrantingDecision (Section F.2)", () => {
  it("only ALLOW grants access", () => {
    expect(isGrantingDecision("ALLOW")).toBe(true);
    for (const state of NON_GRANTING_DECISION_STATES) {
      expect(isGrantingDecision(state)).toBe(false);
    }
  });
});

describe("evaluateSecurityGateway (Sections H, I.5, AT.9 fail-closed)", () => {
  function baseInput() {
    return {
      identityValid: true,
      tenantContextValid: true,
      sessionValid: true,
      withinRateLimit: true,
      requestIntegrityValid: true,
      authorizationDecision: "ALLOW" as const,
    };
  }

  it("denies when identity is invalid", () => {
    const result = evaluateSecurityGateway({ ...baseInput(), identityValid: false });
    expect(result.decision).toBe("deny");
  });

  it("denies when tenant context could not be resolved", () => {
    const result = evaluateSecurityGateway({ ...baseInput(), tenantContextValid: false });
    expect(result.decision).toBe("deny");
  });

  it("denies when request integrity validation fails", () => {
    const result = evaluateSecurityGateway({ ...baseInput(), requestIntegrityValid: false });
    expect(result.decision).toBe("deny");
  });

  it("challenges when the session is not valid", () => {
    const result = evaluateSecurityGateway({ ...baseInput(), sessionValid: false });
    expect(result.decision).toBe("challenge");
  });

  it("throttles when rate limit is exceeded", () => {
    const result = evaluateSecurityGateway({ ...baseInput(), withinRateLimit: false });
    expect(result.decision).toBe("throttle");
  });

  it("allows when authorization is ALLOW and all gates pass", () => {
    const result = evaluateSecurityGateway(baseInput());
    expect(result.decision).toBe("allow");
  });

  it("denies when authorization is DENY", () => {
    const result = evaluateSecurityGateway({ ...baseInput(), authorizationDecision: "DENY" });
    expect(result.decision).toBe("deny");
  });

  it("challenges when authorization requires approval", () => {
    const result = evaluateSecurityGateway({
      ...baseInput(),
      authorizationDecision: "REQUIRE_APPROVAL",
    });
    expect(result.decision).toBe("challenge");
  });

  it("quarantines when authorization is escalated", () => {
    const result = evaluateSecurityGateway({ ...baseInput(), authorizationDecision: "ESCALATE" });
    expect(result.decision).toBe("quarantine");
  });

  it("allows with redaction responsibility deferred to the resource layer", () => {
    const result = evaluateSecurityGateway({ ...baseInput(), authorizationDecision: "REDACT" });
    expect(result.decision).toBe("allow");
  });

  it("fails closed on identity+tenant both invalid (identity checked first)", () => {
    const result = evaluateSecurityGateway({
      ...baseInput(),
      identityValid: false,
      tenantContextValid: false,
    });
    expect(result.decision).toBe("deny");
  });
});
