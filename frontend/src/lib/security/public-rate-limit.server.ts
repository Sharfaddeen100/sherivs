/**
 * SHERIVS-004 — shared limiter for public/unauthenticated server endpoints.
 *
 * Reuses the existing limiter (`rateLimiterFromEnv`): distributed when the
 * REDIS_REST_* connection is configured, in-process otherwise.
 */
import { rateLimiterFromEnv } from "../rate-limit/redis-rate-limiter.server";
import type { RateLimiter, RateLimitConfig } from "../ai-gateway.server";

const limiters = new Map<string, RateLimiter>();

export type PublicRateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export async function checkPublicRateLimit(
  bucket: string,
  key: string,
  config: RateLimitConfig,
): Promise<PublicRateLimitResult> {
  let limiter = limiters.get(bucket);
  if (!limiter) {
    limiter = rateLimiterFromEnv(config, process.env).limiter;
    limiters.set(bucket, limiter);
  }
  const decision = await limiter.check(`${bucket}:${key}`);
  if (decision.decision === "allow") return { allowed: true };
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(decision.retryAfterMs / 1000)) };
}
