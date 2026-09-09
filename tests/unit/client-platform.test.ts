/**
 * CoreGrid — client platform classification tests (Phase 22/23 wiring).
 */
import { describe, expect, it } from "vitest";
import {
  classifyBreakpoint,
  classifyColorScheme,
  classifyDevicePlatform,
  classifyRuntime,
  isTouchPrimary,
} from "../../frontend/src/lib/client-platform";

describe("classifyDevicePlatform", () => {
  it("maps real device UA strings into the P22 vocabulary", () => {
    expect(classifyDevicePlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("ios");
    expect(classifyDevicePlatform("Mozilla/5.0 (iPad; CPU OS 16_0)")).toBe("ios");
    expect(classifyDevicePlatform("Mozilla/5.0 (Linux; Android 14; SM-S918B)")).toBe("android");
    expect(classifyDevicePlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("windows");
    expect(classifyDevicePlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toBe("macos");
    expect(classifyDevicePlatform("Mozilla/5.0 (X11; Linux x86_64)")).toBe("linux");
    expect(classifyDevicePlatform("Mozilla/5.0 (X11; CrOS x86_64)")).toBe("linux");
    expect(classifyDevicePlatform("Unknown-Embedded-UA")).toBe("web");
  });

  it("flags touch-primary platforms", () => {
    expect(isTouchPrimary("ios")).toBe(true);
    expect(isTouchPrimary("android")).toBe(true);
    expect(isTouchPrimary("windows")).toBe(false);
    expect(isTouchPrimary("web")).toBe(false);
  });
});

describe("classifyBreakpoint", () => {
  it("returns the responsive breakpoint for a viewport width", () => {
    expect(classifyBreakpoint(480)).toBe("xs");
    expect(classifyBreakpoint(640)).toBe("sm");
    expect(classifyBreakpoint(800)).toBe("md");
    expect(classifyBreakpoint(1100)).toBe("lg");
    expect(classifyBreakpoint(1400)).toBe("xl");
    expect(classifyBreakpoint(1800)).toBe("xxl");
  });
});

describe("classifyColorScheme", () => {
  it("maps the media query to a concrete scheme", () => {
    expect(classifyColorScheme(true)).toBe("dark");
    expect(classifyColorScheme(false)).toBe("light");
  });
});

describe("classifyRuntime (reuses the Phase 23 web classifier)", () => {
  it("returns browser info + device platform together", () => {
    const chrome = classifyRuntime(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    );
    expect(chrome.platform).toBe("windows");
    expect(chrome.browser.browser).toBe("chrome");
    expect(chrome.browser.supported).toBe(true);

    const safari = classifyRuntime(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    );
    expect(safari.platform).toBe("macos");
    expect(safari.browser.browser).toBe("safari");
  });
});
