import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/security/turnstile-config";

/**
 * Cloudflare Turnstile widget, feature-flagged by VITE_TURNSTILE_SITE_KEY.
 *
 * Fail-open on the client by design:
 *  - key unset            -> renders nothing, callers send no captchaToken;
 *  - script fails to load -> onUnavailable() fires so callers can still submit
 *    (Supabase is the enforcer: if captcha is enabled there it rejects the
 *    request, otherwise sign-in works as before).
 * The client never blocks a login on its own; only Supabase Auth's captcha
 * setting does. See docs/ops/AUTH-SECURITY-SETUP.md for the rollout order.
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
const LOAD_TIMEOUT_MS = 10_000;
let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    const timer = setTimeout(() => {
      scriptPromise = null;
      reject(new Error("Captcha load timed out"));
    }, LOAD_TIMEOUT_MS);
    s.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    s.onerror = () => {
      clearTimeout(timer);
      scriptPromise = null;
      reject(new Error("Could not load the captcha"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function Turnstile({
  onToken,
  onUnavailable,
  resetKey,
}: {
  onToken: (token: string | null) => void;
  /** Called when the widget cannot load or errors; callers should stop requiring a token. */
  onUnavailable?: () => void;
  /** Change this value to force a fresh challenge (tokens are single-use). */
  resetKey?: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  const unavailable = useRef(onUnavailable);
  cb.current = onToken;
  unavailable.current = onUnavailable;

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
          // "flexible" stretches to the container (min 300px); below that use the
          // 150px "compact" widget so the iframe can never overflow a phone card.
          size: turnstileSize(ref.current.clientWidth),
          callback: (t: string) => cb.current(t),
          "expired-callback": () => cb.current(null),
          "error-callback": () => {
            cb.current(null);
            unavailable.current?.();
          },
        });
      })
      .catch(() => {
        cb.current(null);
        unavailable.current?.();
      });
    return () => {
      cancelled = true;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <div className="turnstile-slot" data-testid="turnstile-slot">
      <div ref={ref} className="turnstile-host" data-testid="turnstile" />
    </div>
  );
}

/** Widget size for a container width: Cloudflare's flexible widget needs at least 300px. */
export function turnstileSize(containerWidth: number): "flexible" | "compact" {
  return containerWidth >= 300 ? "flexible" : "compact";
}

/** True when the form must wait for a token before submitting. */
export function captchaRequired(enabled: boolean, token: string | null, unavailable: boolean): boolean {
  return enabled && !token && !unavailable;
}
