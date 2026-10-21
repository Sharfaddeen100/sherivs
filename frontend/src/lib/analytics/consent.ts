/**
 * Product-analytics consent (pure + localStorage). Analytics is an optional
 * purpose: default DENY until the user explicitly accepts, never for student
 * accounts (children's data, NDPA 2023), and never when Do Not Track is on.
 */
export const ANALYTICS_CONSENT_KEY = "sherivs.analytics-consent";
export const ANALYTICS_CONSENT_VERSION = "2026-10-v1";

export type AnalyticsConsent = "granted" | "denied" | "unset";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readAnalyticsConsent(storage: StorageLike | null | undefined): AnalyticsConsent {
  try {
    const raw = storage?.getItem(ANALYTICS_CONSENT_KEY);
    if (!raw) return "unset";
    const parsed = JSON.parse(raw) as { v?: string; c?: string };
    if (parsed.v !== ANALYTICS_CONSENT_VERSION) return "unset"; // policy changed → ask again
    return parsed.c === "granted" ? "granted" : parsed.c === "denied" ? "denied" : "unset";
  } catch {
    return "unset";
  }
}

export function writeAnalyticsConsent(
  storage: StorageLike | null | undefined,
  choice: "granted" | "denied",
): void {
  try {
    storage?.setItem(
      ANALYTICS_CONSENT_KEY,
      JSON.stringify({ v: ANALYTICS_CONSENT_VERSION, c: choice }),
    );
  } catch {
    /* storage unavailable: treated as unset (= no analytics) */
  }
}

export function doNotTrackEnabled(nav: Partial<Navigator> | null | undefined, win?: unknown): boolean {
  const n = nav as { doNotTrack?: string | null; msDoNotTrack?: string; globalPrivacyControl?: boolean } | null;
  const w = win as { doNotTrack?: string } | undefined;
  const v = n?.doNotTrack ?? w?.doNotTrack ?? n?.msDoNotTrack;
  return v === "1" || v === "yes" || n?.globalPrivacyControl === true;
}

/** Roles whose activity is never sent to analytics. */
export const ANALYTICS_EXCLUDED_ROLES = new Set(["student"]);

export function analyticsAllowed(input: {
  key: string | null | undefined;
  consent: AnalyticsConsent;
  doNotTrack: boolean;
  role?: string | null;
}): boolean {
  if (!input.key?.trim()) return false;
  if (input.doNotTrack) return false;
  if (input.role && ANALYTICS_EXCLUDED_ROLES.has(input.role)) return false;
  return input.consent === "granted";
}

/** Should the consent banner be shown at all? */
export function shouldAskForAnalyticsConsent(input: {
  key: string | null | undefined;
  consent: AnalyticsConsent;
  doNotTrack: boolean;
  role?: string | null;
}): boolean {
  if (!input.key?.trim() || input.doNotTrack) return false;
  if (input.role && ANALYTICS_EXCLUDED_ROLES.has(input.role)) return false;
  return input.consent === "unset";
}
