/**
 * Strict TLS for the staging restore runner.
 *
 * Does not use scripts/lib/pg-ssl.mjs: that helper honours
 * COREGRID_DB_INSECURE_TLS=1 and sslmode=disable.
 *
 * pg@8.23.1 ConnectionParameters does Object.assign({}, config,
 * parse(connectionString)), so a URL sslmode *overwrites* an explicit
 * ssl object. sslmode=no-verify becomes { rejectUnauthorized: false }.
 *
 * Therefore this module:
 * - parses the URL itself and allowlists query keys
 * - refuses sslmode other than absent / verify-full
 * - never returns a config that includes `connectionString`
 * - pins ssl to { rejectUnauthorized: true, ca } after X.509 parse
 *
 * Does not print CA PEM, private keys, or credentialed URLs.
 */

import { readFileSync } from "node:fs";
import { X509Certificate } from "node:crypto";
import {
  ALLOWED_SSLMODE,
  ALLOWED_URL_QUERY_KEYS,
  CA_ENV_NAMES,
  FORBIDDEN_PG_SSL_ENV,
  FORBIDDEN_SSLMODE,
  INSECURE_TLS_ENV,
  REQUIRED_PG_PORT,
} from "./constants.mjs";
import { redactText, redactUrl } from "./redact.mjs";

function fail(code, detail) {
  const err = new Error(`${code}: ${redactText(detail)}`);
  err.code = code;
  throw err;
}

function rejectForbiddenPgEnv(env) {
  for (const name of FORBIDDEN_PG_SSL_ENV) {
    const value = String(env[name] ?? "").trim();
    if (value) {
      fail(
        "TLS_PG_ENV_REFUSED",
        `${name} is set; restore TLS is pinned in code and cannot be overridden by libpq environment`,
      );
    }
  }
}

function loadCaCandidate(env) {
  for (const name of CA_ENV_NAMES) {
    const value = String(env[name] ?? "").trim();
    if (!value) continue;
    if (/-----BEGIN /.test(value)) {
      return { source: name, pem: value, fromPath: false };
    }
    try {
      const text = readFileSync(value, "utf8");
      return { source: name, pem: text, fromPath: true };
    } catch (err) {
      if (err && err.code && String(err.code).startsWith("TLS_")) throw err;
      fail("TLS_CA_UNREADABLE", `${name} path could not be read`);
    }
  }
  return { source: null, pem: null, fromPath: false };
}

function parsePinnedCa(env) {
  const candidate = loadCaCandidate(env);
  if (!candidate.pem) {
    fail(
      "TLS_CA_REQUIRED",
      `pinned CA required via ${CA_ENV_NAMES.join(" or ")}`,
    );
  }
  const pem = candidate.pem.trim();
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(pem)) {
    fail("TLS_CA_NOT_CERTIFICATE", "pinned material is a private key, not a CA certificate");
  }
  if (!/-----BEGIN CERTIFICATE-----/.test(pem)) {
    fail(
      "TLS_CA_NOT_CERTIFICATE",
      "pinned material does not contain a CERTIFICATE block",
    );
  }
  let x509;
  try {
    x509 = new X509Certificate(pem);
  } catch {
    fail("TLS_CA_INVALID", "pinned CA is not a parseable X.509 certificate");
  }
  if (x509.ca === false) {
    fail("TLS_CA_NOT_CA", "pinned certificate is not a CA (basicConstraints CA is false)");
  }
  return {
    pem,
    source: candidate.source,
    subject: x509.subject,
    fingerprint256: x509.fingerprint256,
    serial: x509.serialNumber,
  };
}

function parseUrlSafe(connectionString) {
  const raw = String(connectionString ?? "");
  if (!raw.trim()) fail("TARGET_MISSING", "no staging connection string");
  try {
    return new URL(raw);
  } catch {
    fail("TARGET_URL_UNPARSEABLE", "staging URL is not a valid URL");
  }
}

/**
 * Discrete connection identity taken from URL *components*, never from
 * query-string host/user/password/ssl overrides that pg would honour.
 */
export function parseDiscreteConnection(connectionString) {
  const url = parseUrlSafe(connectionString);
  if (!/^postgres(ql)?:$/i.test(url.protocol)) {
    fail("TARGET_PROTOCOL_REFUSED", "protocol is not postgres");
  }

  const unexpected = [];
  const sslmodes = [];
  for (const [key, value] of url.searchParams.entries()) {
    const lowered = key.toLowerCase();
    if (!ALLOWED_URL_QUERY_KEYS.includes(lowered)) {
      unexpected.push(lowered);
      continue;
    }
    if (lowered === "sslmode") sslmodes.push(String(value).toLowerCase());
  }
  if (unexpected.length) {
    fail(
      "TLS_URL_PARAM_REFUSED",
      `unexpected connection parameter(s): ${unexpected.join(", ")}`,
    );
  }

  for (const mode of sslmodes) {
    if (mode === "disable") {
      fail("TLS_DISABLED_FORBIDDEN", "sslmode=disable is refused for staging restore");
    }
    if (mode === "no-verify") {
      fail("TLS_NO_VERIFY_FORBIDDEN", "sslmode=no-verify is refused for staging restore");
    }
    if (FORBIDDEN_SSLMODE.includes(mode) || !ALLOWED_SSLMODE.includes(mode)) {
      fail(
        "TLS_SSLMODE_REFUSED",
        `sslmode=${mode} is refused; only omitted or verify-full is permitted`,
      );
    }
  }

  const port = url.port === "" ? REQUIRED_PG_PORT : Number(url.port);
  if (!Number.isInteger(port) || port !== REQUIRED_PG_PORT) {
    fail("TLS_PORT_REFUSED", `only port ${REQUIRED_PG_PORT} is permitted`);
  }

  const databasePath = decodeURIComponent(url.pathname || "/").replace(/^\//, "");
  const database = databasePath === "" ? "postgres" : databasePath;
  if (database !== "postgres") {
    fail("TARGET_DATABASE_NAME", "database name must be postgres");
  }

  return {
    host: url.hostname,
    port,
    user: decodeURIComponent(url.username || ""),
    password: decodeURIComponent(url.password || ""),
    database,
    sslmode: sslmodes[0] ?? "verify-full",
    redactedUrl: redactUrl(url.toString()),
  };
}

function assertTlsTokens(connectionString) {
  const raw = String(connectionString ?? "");
  if (
    /(?:[?&])sslmode=disable(?:[&'"]|$)/i.test(raw) ||
    /(?:[?&])ssl=(?:false|0)(?:[&'"]|$)/i.test(raw)
  ) {
    fail(
      "TLS_DISABLED_FORBIDDEN",
      "sslmode=disable / ssl=false is refused for staging restore",
    );
  }
  if (/(?:[?&])sslmode=no-verify(?:[&'"]|$)/i.test(raw)) {
    fail("TLS_NO_VERIFY_FORBIDDEN", "sslmode=no-verify is refused for staging restore");
  }
  if (/(?:[?&])ssl=no-verify(?:[&'"]|$)/i.test(raw)) {
    fail("TLS_NO_VERIFY_FORBIDDEN", "ssl=no-verify is refused for staging restore");
  }
  if (/(?:[?&])uselibpqcompat=/i.test(raw)) {
    fail("TLS_URL_PARAM_REFUSED", "uselibpqcompat is refused");
  }
}

/**
 * Offline / preflight TLS posture. Never returns an insecure config.
 * Never includes connectionString (pg would let URL sslmode overwrite ssl).
 */
export function strictTlsConfig(connectionString, env = process.env) {
  if (env[INSECURE_TLS_ENV] === "1") {
    fail(
      "TLS_INSECURE_FORBIDDEN",
      `${INSECURE_TLS_ENV}=1 is refused for staging restore`,
    );
  }
  rejectForbiddenPgEnv(env);
  assertTlsTokens(connectionString);
  const identity = parseDiscreteConnection(connectionString);
  const ca = parsePinnedCa(env);
  const ssl = Object.freeze({
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
    ca: ca.pem,
  });
  return {
    ok: true,
    rejectUnauthorized: true,
    ssl,
    caPresent: true,
    caSource: ca.source,
    caSubject: ca.subject,
    caFingerprint256: ca.fingerprint256,
    sslmode: identity.sslmode,
    host: identity.host,
    port: identity.port,
    database: identity.database,
  };
}

/**
 * Discrete pg.Client config. Intentionally omits `connectionString` so
 * pg@8.23.1 cannot parse URL sslmode over the pinned ssl object.
 */
export function buildPinnedClientConfig(connectionString, env = process.env) {
  const tls = strictTlsConfig(connectionString, env);
  const identity = parseDiscreteConnection(connectionString);
  const config = {
    host: identity.host,
    port: identity.port,
    user: identity.user,
    password: identity.password,
    database: identity.database,
    ssl: tls.ssl,
    application_name: "sherivs-staging-restore",
  };
  Object.defineProperty(config, "password", {
    enumerable: false,
    configurable: true,
    writable: true,
    value: identity.password,
  });
  return {
    config,
    tls,
    identity: {
      host: identity.host,
      port: identity.port,
      user: identity.user,
      database: identity.database,
      redactedUrl: identity.redactedUrl,
    },
  };
}

export function inspectTlsPosture(connectionString, env = process.env) {
  try {
    const cfg = strictTlsConfig(connectionString, env);
    return {
      ok: true,
      rejectUnauthorized: true,
      caPresent: true,
      caSource: cfg.caSource,
      caSubject: cfg.caSubject,
      caFingerprint256: cfg.caFingerprint256,
      sslmode: cfg.sslmode,
      insecureFlag: false,
      usesConnectionString: false,
    };
  } catch (err) {
    return {
      ok: false,
      code: err.code ?? "TLS_REFUSED",
      detail: redactText(err.message),
      rejectUnauthorized: true,
      caPresent: Boolean(loadCaCandidate(env).pem),
      insecureFlag: env[INSECURE_TLS_ENV] === "1",
      usesConnectionString: false,
    };
  }
}

export { redactUrl };
