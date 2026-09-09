/**
 * CoreGrid — platform & browser target registry (Phases 22/23 platform code).
 *
 * Code, per platform target and per browser, for the delivery surfaces the
 * phase documents list: iOS, Android, Web, PWA, native desktop (Windows,
 * macOS, Linux) and tablets — plus the browser family targets (Chrome, Edge,
 * Firefox, Safari, Opera, Samsung Internet). Pure domain-neutral DATA with
 * typed helpers; each target declares its runtime family and capability set so
 * downstream adapters and QA surfaces select behavior per target without
 * scattering platform strings through the app.
 *
 * Boundary: capability flags are ADVISORY capability profiles for adapters —
 * never authorization inputs. Security decisions stay in Phase 08/RLS.
 * Unknown targets/browsers fail closed (no flags, unsupported).
 */
import type { PlatformTarget } from "@/lib/platform-core";
import type { DevicePlatform } from "@/lib/platform-device";
import type { WebBrowser, WebEngine } from "@/lib/web-core";

export type PlatformRuntimeKind = "native" | "web" | "pwa";
export type PlatformCategory = "phone" | "tablet" | "desktop" | "other";

export interface PlatformCapabilitySet {
  pushNotifications: boolean;
  mediaCapture: boolean;
  geolocation: boolean;
  biometrics: boolean;
  offlineFirst: boolean;
  installable: boolean;
}

export interface PlatformTargetProfile {
  target: PlatformTarget;
  runtime: PlatformRuntimeKind;
  category: PlatformCategory;
  capability: PlatformCapabilitySet;
}

export interface BrowserTargetProfile {
  browser: WebBrowser;
  engine: WebEngine;
  /** Progressive web app support (manifest + service worker + offline UI). */
  pwaSupported: boolean;
  /** Web Push support (per browser; false when uncertain — fail closed). */
  pushSupported: boolean;
  mediaCapture: boolean;
  geolocation: boolean;
}

const PWA_CAPS: PlatformCapabilitySet = {
  pushNotifications: true,
  mediaCapture: true,
  geolocation: true,
  biometrics: false,
  offlineFirst: true,
  installable: true,
};
const WEB_CAPS: PlatformCapabilitySet = {
  pushNotifications: true,
  mediaCapture: true,
  geolocation: true,
  biometrics: false,
  offlineFirst: false,
  installable: false,
};
const NATIVE_PHONE_CAPS: PlatformCapabilitySet = {
  pushNotifications: true,
  mediaCapture: true,
  geolocation: true,
  biometrics: true,
  offlineFirst: true,
  installable: true,
};
const NATIVE_DESKTOP_CAPS: PlatformCapabilitySet = {
  pushNotifications: true,
  mediaCapture: true,
  geolocation: true,
  biometrics: false,
  offlineFirst: true,
  installable: true,
};

/** Per-target profiles covering every PlatformTarget in the P22 vocabulary. */
export const PLATFORM_TARGET_PROFILES: Readonly<Record<PlatformTarget, PlatformTargetProfile>> = {
  ios: { target: "ios", runtime: "native", category: "phone", capability: NATIVE_PHONE_CAPS },
  android: {
    target: "android",
    runtime: "native",
    category: "phone",
    capability: NATIVE_PHONE_CAPS,
  },
  tablet: {
    target: "tablet",
    runtime: "native",
    category: "tablet",
    capability: NATIVE_PHONE_CAPS,
  },
  web: { target: "web", runtime: "web", category: "other", capability: WEB_CAPS },
  windows: {
    target: "windows",
    runtime: "native",
    category: "desktop",
    capability: NATIVE_DESKTOP_CAPS,
  },
  macos: {
    target: "macos",
    runtime: "native",
    category: "desktop",
    capability: NATIVE_DESKTOP_CAPS,
  },
  linux: {
    target: "linux",
    runtime: "native",
    category: "desktop",
    capability: NATIVE_DESKTOP_CAPS,
  },
};

/** PWA is an installable, offline-first web delivery mode of the web target. */
export const PWA_PROFILE: PlatformTargetProfile = {
  target: "web",
  runtime: "pwa",
  category: "other",
  capability: PWA_CAPS,
};

const NO_BROWSER_CAPS: BrowserTargetProfile = {
  browser: "unknown",
  engine: "unknown",
  pwaSupported: false,
  pushSupported: false,
  mediaCapture: false,
  geolocation: false,
};

/**
 * Per-browser profiles (P23 vocabulary). Capability flags are conservative:
 * any uncertain capability is false (fail closed) so adapters never assume
 * support the runtime does not actually provide.
 */
export const BROWSER_TARGET_PROFILES: Readonly<Record<WebBrowser, BrowserTargetProfile>> = {
  chrome: {
    browser: "chrome",
    engine: "blink",
    pwaSupported: true,
    pushSupported: true,
    mediaCapture: true,
    geolocation: true,
  },
  edge: {
    browser: "edge",
    engine: "blink",
    pwaSupported: true,
    pushSupported: true,
    mediaCapture: true,
    geolocation: true,
  },
  firefox: {
    browser: "firefox",
    engine: "gecko",
    pwaSupported: false,
    pushSupported: true,
    mediaCapture: true,
    geolocation: true,
  },
  safari: {
    browser: "safari",
    engine: "webkit",
    pwaSupported: false,
    pushSupported: false,
    mediaCapture: true,
    geolocation: true,
  },
  opera: {
    browser: "opera",
    engine: "blink",
    pwaSupported: true,
    pushSupported: true,
    mediaCapture: true,
    geolocation: true,
  },
  samsung: {
    browser: "samsung",
    engine: "blink",
    pwaSupported: true,
    pushSupported: true,
    mediaCapture: true,
    geolocation: true,
  },
  unknown: NO_BROWSER_CAPS,
};

export function resolvePlatformTargetProfile(target: PlatformTarget): PlatformTargetProfile {
  const profile = PLATFORM_TARGET_PROFILES[target];
  if (!profile) throw new Error(`Unsupported platform target "${target}"`);
  return profile;
}

export function resolveBrowserTargetProfile(browser: WebBrowser): BrowserTargetProfile {
  const profile = BROWSER_TARGET_PROFILES[browser];
  return profile ?? NO_BROWSER_CAPS;
}

/** Map a detected runtime device platform to its delivery target. */
export function devicePlatformToTarget(platform: DevicePlatform): PlatformTarget {
  switch (platform) {
    case "ios":
      return "ios";
    case "android":
      return "android";
    case "windows":
      return "windows";
    case "macos":
      return "macos";
    case "linux":
      return "linux";
    default:
      return "web";
  }
}

export function isNativeInstallable(profile: PlatformTargetProfile): boolean {
  return profile.runtime === "native" || profile.runtime === "pwa";
}
