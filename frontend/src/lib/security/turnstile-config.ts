/** Turnstile is on only when the public site key is configured. */
export const TURNSTILE_SITE_KEY: string | undefined =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || undefined;
export const turnstileEnabled = (): boolean => Boolean(TURNSTILE_SITE_KEY);
