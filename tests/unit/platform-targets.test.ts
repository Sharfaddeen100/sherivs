/**
 * Sherivs — platform & browser target registry tests (Phases 22/23).
 */
import { describe, expect, it } from "vitest";
import {
  BROWSER_TARGET_PROFILES,
  PWA_PROFILE,
  PLATFORM_TARGET_PROFILES,
  devicePlatformToTarget,
  isNativeInstallable,
  resolveBrowserTargetProfile,
  resolvePlatformTargetProfile,
} from "../../frontend/src/lib/platform/platform-targets";

const TARGETS = ["ios", "android", "web", "windows", "macos", "linux", "tablet"] as const;

describe("platform target profiles (every target in the P22 vocabulary)", () => {
  it("covers every delivery target the phases list", () => {
    for (const target of TARGETS) {
      const profile = resolvePlatformTargetProfile(target);
      expect(profile.target).toBe(target);
      expect(profile.runtime).toMatch(/^(native|web|pwa)$/);
    }
    expect(Object.keys(PLATFORM_TARGET_PROFILES).length).toBeGreaterThanOrEqual(7);
  });

  it("classifies runtime families and installability", () => {
    expect(PLATFORM_TARGET_PROFILES.ios.runtime).toBe("native");
    expect(PLATFORM_TARGET_PROFILES.ios.category).toBe("phone");
    expect(PLATFORM_TARGET_PROFILES.android.capability.biometrics).toBe(true);
    expect(PLATFORM_TARGET_PROFILES.web.runtime).toBe("web");
    expect(isNativeInstallable(PLATFORM_TARGET_PROFILES.android)).toBe(true);
    expect(isNativeInstallable(PLATFORM_TARGET_PROFILES.web)).toBe(false);
    expect(isNativeInstallable(PWA_PROFILE)).toBe(true);
    expect(PWA_PROFILE.capability.offlineFirst).toBe(true);
  });

  it("fails closed for unknown targets", () => {
    expect(() => resolvePlatformTargetProfile("xbox" as never)).toThrow();
  });

  it("maps a detected device platform to a delivery target", () => {
    expect(devicePlatformToTarget("ios")).toBe("ios");
    expect(devicePlatformToTarget("android")).toBe("android");
    expect(devicePlatformToTarget("windows")).toBe("windows");
    expect(devicePlatformToTarget("macos")).toBe("macos");
    expect(devicePlatformToTarget("linux")).toBe("linux");
    expect(devicePlatformToTarget("web")).toBe("web");
  });
});

describe("browser target profiles (Chrome, Edge, Firefox, Safari, Opera, Samsung)", () => {
  it("covers every browser family in the P23 vocabulary", () => {
    for (const browser of [
      "chrome",
      "edge",
      "firefox",
      "safari",
      "opera",
      "samsung",
      "unknown",
    ] as const) {
      expect(resolveBrowserTargetProfile(browser).browser).toBe(browser);
    }
    expect(Object.keys(BROWSER_TARGET_PROFILES).length).toBeGreaterThanOrEqual(7);
  });

  it("flags PWA support only where the browser truly supports it", () => {
    expect(BROWSER_TARGET_PROFILES.chrome.pwaSupported).toBe(true);
    expect(BROWSER_TARGET_PROFILES.edge.pwaSupported).toBe(true);
    expect(BROWSER_TARGET_PROFILES.opera.pwaSupported).toBe(true);
    expect(BROWSER_TARGET_PROFILES.samsung.pwaSupported).toBe(true);
    expect(BROWSER_TARGET_PROFILES.firefox.pwaSupported).toBe(false);
    expect(BROWSER_TARGET_PROFILES.safari.pwaSupported).toBe(false);
  });

  it("fails closed on Safari web push and on unknown browsers", () => {
    expect(BROWSER_TARGET_PROFILES.safari.pushSupported).toBe(false);
    expect(BROWSER_TARGET_PROFILES.unknown.pushSupported).toBe(false);
    expect(BROWSER_TARGET_PROFILES.unknown.pwaSupported).toBe(false);
    expect(resolveBrowserTargetProfile("unknown" as never).geolocation).toBe(false);
  });
});
