/**
 * Security P2 client gate for internal surfaces (/internal/*):
 *  - MFA: super admins / staff whose session is not AAL2 are sent to /mfa.
 *  - Session expiry: idle 30 min or absolute 12 h ⇒ sign out to /login.
 * The server functions enforce AAL2 independently (mfa-server.ts); this gate
 * is the UX half.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SystemClock, TimeAuthority } from "@/lib/kernel/time-authority";
import { mfaRequiredFromEnv, satisfiesAal2, sessionExpiryReason } from "@/lib/security/mfa-policy";

const timeAuthority = new TimeAuthority(new SystemClock());
const START_KEY = "sherivs.internal.sessionStart";
const ACTIVITY_KEY = "sherivs.internal.lastActivity";

export function InternalSecurityGate({ children }: { children: ReactNode }) {
  const required = mfaRequiredFromEnv(import.meta.env.VITE_SHERIVS_MFA_REQUIRED as string);
  const [state, setState] = useState<"checking" | "ok" | "mfa">("checking");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    supabase.auth.mfa
      .getAuthenticatorAssuranceLevel()
      .then(({ data }) => {
        if (cancelled) return;
        setState(satisfiesAal2(data?.currentLevel, required) ? "ok" : "mfa");
      })
      .catch(() => !cancelled && setState(required ? "mfa" : "ok"));
    return () => {
      cancelled = true;
    };
  }, [required]);

  useEffect(() => {
    const now = () => timeAuthority.now().atMs;
    if (!sessionStorage.getItem(START_KEY)) sessionStorage.setItem(START_KEY, String(now()));
    const touch = () => sessionStorage.setItem(ACTIVITY_KEY, String(now()));
    touch();
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(() => {
      const reason = sessionExpiryReason({
        nowMs: now(),
        lastActivityMs: Number(sessionStorage.getItem(ACTIVITY_KEY) ?? now()),
        sessionStartMs: Number(sessionStorage.getItem(START_KEY) ?? now()),
      });
      if (reason) {
        sessionStorage.removeItem(START_KEY);
        sessionStorage.removeItem(ACTIVITY_KEY);
        void supabase.auth.signOut().finally(() => navigate({ to: "/login", replace: true }));
      }
    }, 60_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      window.clearInterval(timer);
    };
  }, [navigate]);

  if (state === "checking") return null;
  if (state === "mfa") return <Navigate to="/mfa" replace />;
  return <>{children}</>;
}
