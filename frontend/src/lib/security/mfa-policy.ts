/**
 * Security P2 — MFA (AAL2) and session-expiry policy for internal users
 * (super admins and platform staff). Pure functions, shared by the server
 * gate and the client gate so both enforce the same rule.
 *
 * Escape hatch: SHERIVS_MFA_REQUIRED=false (server) /
 * VITE_SHERIVS_MFA_REQUIRED=false (client) disables the AAL2 requirement
 * (e.g. while the first super admin enrols). Default: required.
 */
export const INTERNAL_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const INTERNAL_ABSOLUTE_SESSION_MS = 12 * 60 * 60 * 1000;

export function mfaRequiredFromEnv(value: string | undefined | null): boolean {
  if (value == null || value === "") return true;
  return !["false", "0", "off", "no"].includes(value.trim().toLowerCase());
}

/** True when the JWT/assurance level satisfies the internal-user requirement. */
export function satisfiesAal2(aal: unknown, required: boolean): boolean {
  if (!required) return true;
  return aal === "aal2";
}

/** Throws unless the caller's claims carry aal2 (when MFA is required). */
export function assertAal2(claims: { aal?: unknown } | null | undefined, required: boolean): void {
  if (!satisfiesAal2(claims?.aal, required)) {
    throw new Error("MFA required: verify with your authenticator app (AAL2) and retry");
  }
}

export type SessionExpiryReason = "idle" | "absolute" | null;

/** Decide whether an internal session must end, given times in epoch ms. */
export function sessionExpiryReason(input: {
  nowMs: number;
  lastActivityMs: number;
  sessionStartMs: number;
  idleMs?: number;
  absoluteMs?: number;
}): SessionExpiryReason {
  const idle = input.idleMs ?? INTERNAL_IDLE_TIMEOUT_MS;
  const absolute = input.absoluteMs ?? INTERNAL_ABSOLUTE_SESSION_MS;
  if (input.nowMs - input.sessionStartMs >= absolute) return "absolute";
  if (input.nowMs - input.lastActivityMs >= idle) return "idle";
  return null;
}
