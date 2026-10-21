/**
 * Security P2 — MFA page flow helpers. Every Supabase MFA call (assurance
 * level, list factors, enrol, challenge + verify) can fail by returning an
 * error OR by throwing (network, unexpected shape). These helpers turn both
 * into a plain-English message so the page shows "try again", never crashes.
 */
export type MfaStage = "setup" | "verify";

export type MfaFailure = { ok: false; stage: MfaStage; message: string };
export type MfaResult<T> = { ok: true; value: T } | MfaFailure;

const STAGE_MESSAGES: Record<MfaStage, string> = {
  setup: "We couldn't set up two-factor verification. Check your connection and try again.",
  verify: "That code couldn't be verified. Check the code in your authenticator app and try again.",
};

export function mfaFailureMessage(stage: MfaStage, detail?: string | null): string {
  const base = STAGE_MESSAGES[stage];
  const clean = (detail ?? "").trim();
  return clean ? `${base} (${clean})` : base;
}

type SupabaseLike<T> = { data: T | null; error: { message?: string } | null };

/** Run one MFA call; never throws. `pick` validates and extracts the value. */
export async function runMfaStep<T, V>(
  stage: MfaStage,
  call: () => Promise<SupabaseLike<T>>,
  pick: (data: T) => V | null | undefined,
): Promise<MfaResult<V>> {
  try {
    const { data, error } = await call();
    if (error) return { ok: false, stage, message: mfaFailureMessage(stage, error.message) };
    const value = data == null ? null : pick(data);
    if (value == null) return { ok: false, stage, message: mfaFailureMessage(stage) };
    return { ok: true, value };
  } catch (e) {
    return {
      ok: false,
      stage,
      message: mfaFailureMessage(stage, e instanceof Error ? e.message : null),
    };
  }
}

export type EnrolledTotp = { id: string; qr: string | null };

/** Extract a TOTP enrolment; tolerant of a missing qr_code but not a missing id. */
export function pickEnrolment(data: unknown): EnrolledTotp | null {
  const d = data as { id?: unknown; totp?: { qr_code?: unknown } | null } | null;
  if (!d || typeof d.id !== "string" || !d.id) return null;
  const qr = typeof d.totp?.qr_code === "string" ? d.totp.qr_code : null;
  return { id: d.id, qr };
}

export function pickVerifiedFactorId(data: unknown): string | null | undefined {
  const d = data as { totp?: Array<{ id?: string; status?: string }> | null } | null;
  const f = (d?.totp ?? []).find((x) => x?.status === "verified" && typeof x.id === "string");
  return f?.id ?? null;
}
