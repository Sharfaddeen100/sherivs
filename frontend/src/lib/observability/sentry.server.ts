/** Server (Vercel function) Sentry init. No-op without SENTRY_DSN. */
import * as Sentry from "@sentry/tanstackstart-react";
import { sentryOptions } from "./sentry-config";

export const serverSentryEnabled = (() => {
  const opts = sentryOptions({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  });
  if (!opts) return false;
  try {
    Sentry.init(opts as never);
    return true;
  } catch {
    return false;
  }
})();

type Entry = { fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response };

/** Wrap the server entry with Sentry request tracing only when enabled. */
export function withServerSentry<T extends Entry>(entry: T): T {
  if (!serverSentryEnabled) return entry;
  const wrapped = Sentry.wrapFetchWithSentry({
    fetch: (request: Request, opts?: { env?: unknown; ctx?: unknown }) =>
      entry.fetch(request, opts?.env, opts?.ctx),
  });
  return {
    ...entry,
    fetch: (request: Request, env: unknown, ctx: unknown) => wrapped.fetch(request, { env, ctx }),
  };
}

export function captureServerError(error: unknown): void {
  if (!serverSentryEnabled) return;
  try {
    Sentry.captureException(error);
  } catch {
    /* ignore */
  }
}
