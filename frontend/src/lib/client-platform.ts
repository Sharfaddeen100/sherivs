/**
 * Sherivs — client platform detection (Phase 22/23 platform wiring).
 *
 * Pure, SSR-safe detection helpers that classify the ACTUAL runtime browser
 * into the Phase 22 (`platform-core`/`platform-device`) and Phase 23
 * (`web-core`) contract vocabulary. Previously those contracts were authored
 * and tested but never consumed by the app; this module is the first live
 * consumer that maps real browser signals onto the platform types.
 *
 * Boundary: classification only — no policy, no authorization. UI consumes
 * the resulting snapshot to adapt presentation (offline banner, responsive
 * chrome); backend enforcement is unchanged.
 */
import type { Breakpoint, ColorScheme } from "@/lib/platform-core";
import type { DevicePlatform } from "@/lib/platform-device";
import type { BrowserInfo } from "@/lib/web-core";
import { classifyBrowser } from "@/lib/web-core";

/** Classify a user agent string into the P22 device-platform vocabulary. */
export function classifyDevicePlatform(userAgent: string): DevicePlatform {
  if (/iPad|iPhone|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  if (/Windows/i.test(userAgent)) return "windows";
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "macos";
  if (/Linux|CrOS/i.test(userAgent)) return "linux";
  return "web";
}

/** Viewport breakpoint classification (Tailwind-ish, contract-typed). */
export function classifyBreakpoint(width: number): Breakpoint {
  if (width < 640) return "xs";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";
  if (width < 1536) return "xl";
  return "xxl";
}

export function isTouchPrimary(platform: DevicePlatform): boolean {
  return platform === "ios" || platform === "android";
}

export function classifyColorScheme(matchesDark: boolean): "light" | "dark" {
  return matchesDark ? "dark" : "light";
}

export interface BrowserClassification {
  browser: BrowserInfo;
  platform: DevicePlatform;
}

/** Full classification from a UA string (reuses the Phase 23 classifier). */
export function classifyRuntime(userAgent: string): BrowserClassification {
  return { browser: classifyBrowser(userAgent), platform: classifyDevicePlatform(userAgent) };
}

export type { Breakpoint, ColorScheme, DevicePlatform, BrowserInfo };
