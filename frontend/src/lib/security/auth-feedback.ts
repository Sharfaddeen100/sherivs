/**
 * User-facing auth feedback: generic login errors (no account enumeration)
 * and a client-side backoff after repeated failures. The client backoff is UX
 * only; Supabase Auth rate limits are the real control.
 */
import { PASSWORD_RULE_SUMMARY } from "./password-policy";

type AuthErrorLike = { message?: string; status?: number; code?: string } | null | undefined;

export const GENERIC_LOGIN_ERROR = "The email or password you entered is incorrect.";

export function loginErrorMessage(err: AuthErrorLike): string {
  const code = err?.code ?? "";
  const msg = (err?.message ?? "").toLowerCase();
  if (err?.status === 429 || code.includes("rate_limit") || msg.includes("rate limit"))
    return "Too many attempts. Please wait a few minutes and try again.";
  if (code.startsWith("captcha") || msg.includes("captcha"))
    return "The security check failed. Please try again.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed"))
    return "Please confirm your email address first. Check your inbox for the confirmation link.";
  return GENERIC_LOGIN_ERROR;
}

export function newPasswordServerMessage(err: AuthErrorLike & { reasons?: string[] }): string {
  const code = err?.code ?? "";
  if (code === "weak_password") {
    if (err?.reasons?.includes("pwned"))
      return "This password has appeared in a data breach. Please choose a different one.";
    return `That password doesn't meet the requirements. ${PASSWORD_RULE_SUMMARY}`;
  }
  if (code === "same_password") return "Your new password must be different from your current one.";
  if (code === "reauthentication_needed" || code === "current_password_mismatch")
    return "Your current password is incorrect.";
  if (err?.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  return err?.message || "Could not update your password. Please try again.";
}

/** Free attempts before a delay is imposed, then 15s, 30s, 60s … capped at 5 minutes. */
export const FREE_ATTEMPTS = 3;
export function backoffMs(failures: number): number {
  if (failures < FREE_ATTEMPTS) return 0;
  return Math.min(15_000 * 2 ** (failures - FREE_ATTEMPTS), 5 * 60_000);
}

type BackoffState = { failures: number; until: number };
const KEY = "sherivs.auth.backoff";

function load(store: Storage | undefined): BackoffState {
  try {
    const raw = store?.getItem(KEY);
    if (raw) return JSON.parse(raw) as BackoffState;
  } catch {
    /* ignore */
  }
  return { failures: 0, until: 0 };
}

export function createLoginBackoff(store: Storage | undefined, now: () => number = Date.now) {
  return {
    remainingMs(): number {
      return Math.max(0, load(store).until - now());
    },
    failures(): number {
      return load(store).failures;
    },
    recordFailure(): number {
      const s = load(store);
      const failures = s.failures + 1;
      const until = now() + backoffMs(failures);
      store?.setItem(KEY, JSON.stringify({ failures, until }));
      return until - now();
    },
    reset(): void {
      store?.removeItem(KEY);
    },
  };
}

export function formatSeconds(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

/** Client cooldown before another reset link may be requested (Supabase also rate-limits). */
export const RESEND_COOLDOWN_MS = 60_000;

/** Shown whether or not the account exists: no account enumeration. */
export const NEUTRAL_SENT_MESSAGE =
  "If an account exists for that email, we've sent a link to reset your password. It may take a few minutes to arrive. Check your spam folder too.";

/** Parse Supabase's error redirect (#error=...&error_code=otp_expired) from a reset link. */
export function recoveryLinkError(hash: string, search = ""): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const q = new URLSearchParams(search.replace(/^\?/, ""));
  const code = params.get("error_code") ?? q.get("error_code");
  const err = params.get("error") ?? q.get("error");
  if (!code && !err) return null;
  if (code === "otp_expired") return "This password reset link has expired.";
  return "This password reset link is invalid or has already been used.";
}
