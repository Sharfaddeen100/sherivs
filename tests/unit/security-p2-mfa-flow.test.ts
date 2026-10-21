import { describe, expect, it } from "vitest";
import {
  mfaFailureMessage,
  pickEnrolment,
  pickVerifiedFactorId,
  runMfaStep,
} from "@/lib/security/mfa-flow";

describe("MFA page flow", () => {
  it("returns the value on success", async () => {
    const r = await runMfaStep(
      "setup",
      async () => ({ data: { id: "f1" }, error: null }),
      (d) => d.id,
    );
    expect(r).toEqual({ ok: true, value: "f1" });
  });

  it("turns a returned error into a retryable message (enrol / challenge / verify)", async () => {
    for (const stage of ["setup", "verify"] as const) {
      const r = await runMfaStep(
        stage,
        async () => ({ data: null, error: { message: "boom" } }),
        () => 1,
      );
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.stage).toBe(stage);
        expect(r.message).toContain("try again");
        expect(r.message).toContain("(boom)");
      }
    }
  });

  it("never throws when the call throws (network failure)", async () => {
    const r = await runMfaStep(
      "verify",
      async () => {
        throw new TypeError("Failed to fetch");
      },
      () => 1,
    );
    expect(r).toEqual({
      ok: false,
      stage: "verify",
      message: mfaFailureMessage("verify", "Failed to fetch"),
    });
  });

  it("treats a malformed enrolment (no totp / no id) as a failure, not a crash", async () => {
    const empty = await runMfaStep("setup", async () => ({ data: {}, error: null }), pickEnrolment);
    expect(empty.ok).toBe(false);
    expect(pickEnrolment({ id: "f2" })).toEqual({ id: "f2", qr: null });
    expect(pickEnrolment({ id: "f3", totp: { qr_code: "data:x" } })).toEqual({
      id: "f3",
      qr: "data:x",
    });
  });

  it("finds only verified TOTP factors", () => {
    expect(
      pickVerifiedFactorId({
        totp: [
          { id: "a", status: "unverified" },
          { id: "b", status: "verified" },
        ],
      }),
    ).toBe("b");
    expect(pickVerifiedFactorId({})).toBeNull();
    expect(pickVerifiedFactorId(null)).toBeNull();
  });
});
