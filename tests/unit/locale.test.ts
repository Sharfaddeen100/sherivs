/**
 * CoreGrid — locale resolution tests.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  normalizeLocaleCandidate,
  resolveLocale,
} from "../../frontend/src/lib/locale";

describe("locale resolution", () => {
  it("normalizes regional tags to the language code", () => {
    expect(normalizeLocaleCandidate("en-US")).toBe("en");
    expect(normalizeLocaleCandidate("  EN_GB ")).toBe("en");
    expect(normalizeLocaleCandidate("fr-FR")).toBe("fr");
  });

  it("resolves the first supported candidate", () => {
    expect(resolveLocale(["fr-FR", "en-GB"])).toBe("en");
    expect(resolveLocale(["en-US"])).toBe("en");
    expect(resolveLocale([])).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(["sw-KE", "fr"])).toBe(DEFAULT_LOCALE);
  });
});
