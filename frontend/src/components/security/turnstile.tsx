import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/security/turnstile-config";

/**
 * Cloudflare Turnstile widget, feature-flagged by VITE_TURNSTILE_SITE_KEY.
 * When the key is unset the widget renders nothing and callers send no
 * captchaToken, so behaviour is unchanged until the owner enables captcha in
 * Supabase (Auth → Attack Protection → Captcha: Turnstile + secret key).
 */

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the captcha"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function Turnstile({
  onToken,
  resetKey,
}: {
  onToken: (token: string | null) => void;
  /** Change this value to force a fresh challenge (tokens are single-use). */
  resetKey?: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ref.current) return;
    let id: string | undefined;
    let cancelled = false;
    cb.current(null);
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        id = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (t: string) => cb.current(t),
          "expired-callback": () => cb.current(null),
          "error-callback": () => cb.current(null),
        });
      })
      .catch(() => cb.current(null));
    return () => {
      cancelled = true;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} className="min-h-[65px]" data-testid="turnstile" />;
}
