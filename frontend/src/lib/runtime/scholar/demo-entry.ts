/**
 * Public auth demo-entry control (SHERIVS-PRODUCTION-DEMO-UI-AND-METRIC-CORRECTION-001).
 *
 * The production-facing /auth experience hides the Enterprise demo CTA by
 * default. Showing it requires an explicit search-parameter opt-in. That is
 * not a substitute for the server gate: provisionDemoEnterprise still
 * refuses unless ALLOW_DEMO_PROVISIONING === "true".
 *
 * Do not use NODE_ENV / import.meta.env.DEV as production identity.
 */

export const DEMO_ENTRY_SEARCH_PARAM = "demoEntry";
export const DEMO_ENTRY_ENABLED_VALUE = "true";

export function isDemoEntryRequested(
  search: string | URLSearchParams | Record<string, unknown> | undefined | null,
): boolean {
  if (search == null) return false;
  if (typeof search === "string") {
    const trimmed = search.startsWith("?") ? search.slice(1) : search;
    if (trimmed === "") return false;
    return new URLSearchParams(trimmed).get(DEMO_ENTRY_SEARCH_PARAM) === DEMO_ENTRY_ENABLED_VALUE;
  }
  if (search instanceof URLSearchParams) {
    return search.get(DEMO_ENTRY_SEARCH_PARAM) === DEMO_ENTRY_ENABLED_VALUE;
  }
  const raw = search[DEMO_ENTRY_SEARCH_PARAM];
  return raw === DEMO_ENTRY_ENABLED_VALUE || raw === true;
}

/** Client default: hidden until isDemoEntryRequested is proven true. */
export function shouldShowPublicDemoEntry(search: Parameters<typeof isDemoEntryRequested>[0]): boolean {
  return isDemoEntryRequested(search) === true;
}
