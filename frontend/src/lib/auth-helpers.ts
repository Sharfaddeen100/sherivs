/**
 * Pure helpers for the auth flow. Kept side-effect free so they can be unit
 * tested without a browser, network, or database.
 */

export const PASSWORD_RESET_RATE_LIMIT = {
  /** Max reset requests per email in the window below. */
  maxRequests: 3,
  /** Window in milliseconds. */
  windowMs: 15 * 60 * 1000, // 15 minutes
} as const;

export type ResetAttempt = { created_at: string | Date };

/**
 * Returns the milliseconds the caller must wait before another reset request
 * is allowed. 0 means "go ahead".
 *
 * Counts attempts strictly within the window ending at `now`.
 */
export function passwordResetRetryAfterMs(
  attempts: ResetAttempt[],
  now: Date = new Date(),
  cfg = PASSWORD_RESET_RATE_LIMIT,
): number {
  const cutoff = now.getTime() - cfg.windowMs;
  const recent = attempts
    .map((a) => new Date(a.created_at).getTime())
    .filter((t) => Number.isFinite(t) && t > cutoff)
    .sort((a, b) => a - b);

  if (recent.length < cfg.maxRequests) return 0;

  // Block until the oldest in-window attempt falls off.
  const oldest = recent[recent.length - cfg.maxRequests];
  const retryAt = oldest + cfg.windowMs;
  return Math.max(0, retryAt - now.getTime());
}

/**
 * Token (session) expiry helper. Supabase recovery sessions expose
 * `expires_at` as a unix epoch in seconds. Returns ms remaining, clamped to 0.
 */
export function tokenMsRemaining(
  expiresAt: number | null | undefined,
  now: Date = new Date(),
): number {
  if (!expiresAt) return 0;
  return Math.max(0, expiresAt * 1000 - now.getTime());
}

/** Human-readable "Xm Ys" form used for both expiry and retry-after UIs. */
export function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
