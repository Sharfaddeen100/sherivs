/**
 * CoreGrid — client platform runtime hook (Phase 22/23 live wiring).
 *
 * SSR-safe snapshot of the actual runtime: connectivity, viewport breakpoint,
 * color scheme, reduced-motion and device platform. SSR renders safe defaults;
 * the effect that attaches real listeners runs only on the client, so server
 * and client markup never diverge. Consumed by adaptive UI (offline banner,
 * responsive chrome); never by authorization.
 */
import { useEffect, useState } from "react";
import {
  classifyBreakpoint,
  classifyColorScheme,
  classifyDevicePlatform,
} from "@/lib/client-platform";
import type { Breakpoint, ColorScheme, DevicePlatform } from "@/lib/client-platform";

export interface ClientPlatformSnapshot {
  platform: DevicePlatform | null;
  online: boolean;
  isOffline: boolean;
  breakpoint: Breakpoint;
  colorScheme: Exclude<ColorScheme, "system">;
  reducedMotion: boolean;
}

const SSR_DEFAULTS: ClientPlatformSnapshot = {
  platform: null,
  online: true,
  isOffline: false,
  breakpoint: "lg",
  colorScheme: "light",
  reducedMotion: false,
};

export function useClientPlatform(): ClientPlatformSnapshot {
  const [snapshot, setSnapshot] = useState<ClientPlatformSnapshot>(SSR_DEFAULTS);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const refresh = () => {
      setSnapshot({
        platform: classifyDevicePlatform(window.navigator.userAgent),
        online: window.navigator.onLine,
        isOffline: !window.navigator.onLine,
        breakpoint: classifyBreakpoint(window.innerWidth),
        colorScheme: classifyColorScheme(media.matches),
        reducedMotion: motion.matches,
      });
    };

    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("resize", refresh);
    media.addEventListener?.("change", refresh);
    motion.addEventListener?.("change", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("resize", refresh);
      media.removeEventListener?.("change", refresh);
      motion.removeEventListener?.("change", refresh);
    };
  }, []);

  return snapshot;
}
