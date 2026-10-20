/**
 * Staging target identity. A generic database URL is not sufficient.
 * Never falls back to DATABASE_URL / SUPABASE_URL / service role.
 * Does not connect.
 */

import {
  ALLOWED_DIRECT_HOST,
  ALLOWED_POOLER_HOST_SUFFIX,
  ALLOWED_POOLER_USER,
  FORBIDDEN_FALLBACK_ENV_NAMES,
  PRODUCTION_HOST_MARKERS,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
  STAGING_URL_ENV_NAMES,
} from "./constants.mjs";
import { redactUrl } from "./redact.mjs";

function fail(code, detail) {
  const err = new Error(`${code}: ${detail}`);
  err.code = code;
  throw err;
}

function containsMarker(value, marker) {
  return String(value ?? "").toLowerCase().includes(String(marker).toLowerCase());
}

export function collectForbiddenFallbacks(env = process.env) {
  return FORBIDDEN_FALLBACK_ENV_NAMES.filter((name) => {
    const v = env[name];
    return v != null && String(v).trim() !== "";
  });
}

export function stagingUrlsFromEnv(env = process.env) {
  const found = [];
  for (const name of STAGING_URL_ENV_NAMES) {
    const value = String(env[name] ?? "").trim();
    if (value) found.push({ name, value });
  }
  return found;
}

function parsePostgresUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail("TARGET_URL_UNPARSEABLE", "staging URL is not a valid URL");
  }
  if (!/^postgres(ql)?:$/i.test(url.protocol)) {
    fail("TARGET_PROTOCOL_REFUSED", `protocol ${url.protocol} is not postgres`);
  }
  return url;
}

function assertNotProduction(haystacks) {
  for (const text of haystacks) {
    if (containsMarker(text, PRODUCTION_PROJECT_REF)) {
      fail(
        "TARGET_PRODUCTION_REF",
        `production project ref ${PRODUCTION_PROJECT_REF} is refused`,
      );
    }
    for (const marker of PRODUCTION_HOST_MARKERS) {
      if (containsMarker(text, marker)) {
        fail("TARGET_PRODUCTION_HOST", `production host marker ${marker} is refused`);
      }
    }
  }
}

function classifyHost(url) {
  const host = url.hostname.toLowerCase();
  const user = decodeURIComponent(url.username || "");
  if (host === ALLOWED_DIRECT_HOST) {
    return { kind: "direct", host, user };
  }
  if (host.endsWith(ALLOWED_POOLER_HOST_SUFFIX)) {
    if (user !== ALLOWED_POOLER_USER) {
      fail(
        "TARGET_POOLER_USER_MISMATCH",
        `pooler username must be ${ALLOWED_POOLER_USER}`,
      );
    }
    return { kind: "pooler", host, user };
  }
  fail(
    "TARGET_HOST_NOT_ALLOWLISTED",
    `hostname ${host} is not on the staging allowlist`,
  );
}

/**
 * Positively pin staging identity from a URL. Does not treat fixture hosts
 * as live staging unless extraAllowHosts is provided by tests.
 */
export function assertStagingTarget(rawUrl, options = {}) {
  if (!rawUrl || !String(rawUrl).trim()) {
    fail("TARGET_MISSING", "no staging-prefixed URL configured");
  }
  const raw = String(rawUrl).trim();
  assertNotProduction([raw]);
  const extraAllowHosts = new Set(options.extraAllowHosts ?? []);
  let url;
  try {
    url = parsePostgresUrl(raw);
  } catch (err) {
    throw err;
  }
  assertNotProduction([
    raw,
    url.hostname,
    url.username,
    url.password,
    url.href,
  ]);

  const host = url.hostname.toLowerCase();
  const user = decodeURIComponent(url.username || "");
  let kind;
  if (extraAllowHosts.has(host)) {
    if (!containsMarker(host, STAGING_PROJECT_REF) && user !== ALLOWED_POOLER_USER) {
      fail(
        "TARGET_FIXTURE_UNPINNED",
        "fixture host is not accepted as live staging identity",
      );
    }
    kind = "fixture";
  } else {
    const classified = classifyHost(url);
    kind = classified.kind;
  }

  const identityHaystack = `${host} ${user}`;
  if (!containsMarker(identityHaystack, STAGING_PROJECT_REF)) {
    fail(
      "TARGET_STAGING_REF_MISSING",
      `staging project ref ${STAGING_PROJECT_REF} is not present in hostname or username`,
    );
  }
  if (url.pathname && url.pathname !== "/" && url.pathname !== "/postgres") {
    fail("TARGET_DATABASE_NAME", "database name must be postgres");
  }

  return {
    ok: true,
    projectRef: STAGING_PROJECT_REF,
    kind,
    hostname: host,
    username: user,
    redactedUrl: redactUrl(raw),
    liveIdentity: kind === "direct" || kind === "pooler",
  };
}

export function resolveStagingTarget(env = process.env, options = {}) {
  const forbidden = collectForbiddenFallbacks(env);
  if (forbidden.length && options.refuseUnprefixed !== false) {
    fail(
      "TARGET_UNPREFIXED_PRESENT",
      `unprefixed ${forbidden.join(", ")} is set; refused (no fallback)`,
    );
  }
  const urls = stagingUrlsFromEnv(env);
  if (urls.length === 0) {
    fail(
      "TARGET_MISSING",
      `set one of ${STAGING_URL_ENV_NAMES.join(" or ")}`,
    );
  }
  const parsed = urls.map((u) => ({
    ...u,
    identity: assertStagingTarget(u.value, options),
  }));
  const refs = new Set(parsed.map((p) => p.identity.projectRef));
  const hosts = new Set(parsed.map((p) => p.identity.hostname));
  if (refs.size !== 1) {
    fail("TARGET_URLS_DISAGREE", "staging URL names disagree on project ref");
  }
  if (hosts.size !== 1) {
    fail("TARGET_URLS_DISAGREE", "staging URL names disagree on hostname");
  }
  return {
    ok: true,
    sourceEnv: parsed[0].name,
    ...parsed[0].identity,
    usedFallback: false,
    forbiddenPresent: forbidden,
  };
}
