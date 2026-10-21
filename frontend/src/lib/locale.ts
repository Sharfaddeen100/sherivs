/**
 * Sherivs — locale resolution (domain-neutral, i18n foundation).
 *
 * Language-negotiation over the supported locale set. English ships today;
 * adding a locale is a data change in the same style as every other platform
 * catalog. Unknown or missing candidates fail safe to the default locale.
 */
export const SUPPORTED_LOCALES = ["en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

/** Normalize a single candidate ("en-US", "EN", "fr_FR" → language tag). */
export function normalizeLocaleCandidate(candidate: string): string {
  return candidate.trim().split(/[-_]/)[0]?.toLowerCase() ?? "";
}

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

/** Resolve the best supported locale from an ordered candidate list. */
export function resolveLocale(candidates: readonly string[]): SupportedLocale {
  for (const candidate of candidates) {
    const normalized = normalizeLocaleCandidate(candidate);
    if (isSupportedLocale(normalized)) return normalized;
  }
  return DEFAULT_LOCALE;
}
