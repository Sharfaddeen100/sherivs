/**
 * Shared Sentry options (client + server). Returns null when no DSN is set,
 * so the app runs unchanged without Sentry. No session replay, no default PII.
 */
import { scrubEvent, scrubString, scrubValue } from "./scrub";

export const SENTRY_TRACES_SAMPLE_RATE = 0.1;

export type SentryEnv = {
  dsn?: string | null;
  environment?: string | null;
  release?: string | null;
};

export function sentryOptions(env: SentryEnv) {
  const dsn = (env.dsn ?? "").trim();
  if (!dsn) return null;
  return {
    dsn,
    environment: (env.environment ?? "").trim() || "development",
    release: (env.release ?? "").trim() || undefined,
    sendDefaultPii: false,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    // No session replay: neither replaysSessionSampleRate nor the integration.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    maxBreadcrumbs: 50,
    beforeSend<E extends Record<string, unknown>>(event: E): E {
      return scrubEvent(event as never) as E;
    },
    /** Streamed spans (default traceLifecycle) are scrubbed here (beforeSendTransaction is ignored). */
    beforeSendSpan<S extends Record<string, unknown>>(span: S): S {
      const out: Record<string, unknown> = { ...span };
      for (const k of ["description", "name"]) {
        if (typeof out[k] === "string") out[k] = scrubString((out[k] as string).split("?")[0] ?? "");
      }
      for (const k of ["data", "attributes"]) {
        if (out[k] && typeof out[k] === "object") out[k] = scrubValue(out[k]);
      }
      return out as S;
    },
    beforeBreadcrumb<B extends Record<string, unknown>>(crumb: B): B | null {
      // UI breadcrumbs can carry typed text; keep only their category.
      if (crumb.category === "ui.input") return null;
      return scrubEvent(crumb as never) as B;
    },
  };
}
