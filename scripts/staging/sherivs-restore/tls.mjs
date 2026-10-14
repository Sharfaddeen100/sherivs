/**
 * Strict TLS for the staging restore runner.
 *
 * Does not use scripts/lib/pg-ssl.mjs as-is: that helper honours
 * COREGRID_DB_INSECURE_TLS=1 and sslmode=disable. Those escapes are
 * refused here.
 *
 * Does not print CA PEM or private key material.
 */

import { readFileSync } from "node:fs";
import { CA_ENV_NAMES, INSECURE_TLS_ENV } from "./constants.mjs";

function fail(code, detail) {
  const err = new Error(`${code}: ${detail}`);
  err.code = code;
  throw err;
}

function resolveCa(env) {
  for (const name of CA_ENV_NAMES) {
    const value = String(env[name] ?? "").trim();
    if (!value) continue;
    if (value.startsWith("-----BEGIN")) return { source: name, present: true };
    try {
      const text = readFileSync(value, "utf8");
      if (!text.includes("-----BEGIN CERTIFICATE-----")) {
        fail(
          "TLS_CA_UNREADABLE",
          `${name} path does not contain a certificate header`,
        );
      }
      return { source: name, present: true };
    } catch (err) {
      if (err && err.code === "TLS_CA_UNREADABLE") throw err;
      fail("TLS_CA_UNREADABLE", `${name} path could not be read`);
    }
  }
  return { source: null, present: false };
}

function loadCaPem(env) {
  for (const name of CA_ENV_NAMES) {
    const value = String(env[name] ?? "").trim();
    if (!value) continue;
    if (value.startsWith("-----BEGIN")) return value;
    return readFileSync(value, "utf8");
  }
  return undefined;
}

/**
 * Offline / preflight TLS posture. Never returns an insecure config.
 * @returns {{ ok: true, ssl: { rejectUnauthorized: true, ca: string }, caPresent: true, caSource: string } | never}
 */
export function strictTlsConfig(connectionString, env = process.env) {
  if (env[INSECURE_TLS_ENV] === "1") {
    fail(
      "TLS_INSECURE_FORBIDDEN",
      `${INSECURE_TLS_ENV}=1 is refused for staging restore`,
    );
  }
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
  const caMeta = resolveCa(env);
  if (!caMeta.present) {
    fail(
      "TLS_CA_REQUIRED",
      `pinned CA required via ${CA_ENV_NAMES.join(" or ")}`,
    );
  }
  const ca = loadCaPem(env);
  if (!ca) {
    fail("TLS_CA_REQUIRED", "pinned CA resolved empty");
  }
  return {
    ok: true,
    rejectUnauthorized: true,
    ssl: { rejectUnauthorized: true, ca },
    caPresent: true,
    caSource: caMeta.source,
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
      insecureFlag: false,
    };
  } catch (err) {
    return {
      ok: false,
      code: err.code ?? "TLS_REFUSED",
      detail: err.message,
      rejectUnauthorized: true,
      caPresent: resolveCa(env).present,
      insecureFlag: env[INSECURE_TLS_ENV] === "1",
    };
  }
}
