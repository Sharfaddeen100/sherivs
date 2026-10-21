/** Browser Sentry init. No-op without VITE_SENTRY_DSN. */
import * as Sentry from "@sentry/tanstackstart-react";
import { sentryOptions } from "./sentry-config";

let started = false;

export function initClientSentry(router: unknown): boolean {
  if (started || typeof window === "undefined") return started;
  const opts = sentryOptions({
    dsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined,
    release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
  });
  if (!opts) return false;
  try {
    Sentry.init({
      ...opts,
      integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router as never)],
    } as never);
    started = true;
  } catch {
    // Monitoring must never break the app.
  }
  return started;
}

export function captureClientError(error: unknown): void {
  if (!started) return;
  try {
    Sentry.captureException(error);
  } catch {
    /* ignore */
  }
}
