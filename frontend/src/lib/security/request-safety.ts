/**
 * SHERIVS-004 — pure request-safety helpers (no I/O, no clock).
 *
 * - safeRelativePath: open-redirect guard (same-origin relative paths only).
 * - safeMapEmbedSrc: only a Google Maps embed https URL may reach an <iframe src>.
 * - escapeXmlText: correct XML text escaping (ampersand first).
 * - clientIpFromHeaders: caller address for rate-limit keys.
 */
const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/;

/** Returns `value` only when it is a same-origin relative path, else `fallback`. */
export function safeRelativePath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (CONTROL_OR_BACKSLASH.test(value) || CONTROL_OR_BACKSLASH.test(decoded)) return fallback;
  if (decoded.startsWith("//")) return fallback;
  return value;
}

const MAP_HOST = /^(www\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/;

/** Extracts and validates a Google Maps embed src from a URL or an <iframe> snippet. */
export function safeMapEmbedSrc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  const candidate = (match ? match[1] : raw).trim();
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (!MAP_HOST.test(url.hostname)) return null;
  if (!url.pathname.startsWith("/maps/embed")) return null;
  return url.toString();
}

export function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function clientIpFromHeaders(headers: Headers): string {
  const ip =
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip");
  return ip && ip.length <= 64 ? ip : "unknown";
}
