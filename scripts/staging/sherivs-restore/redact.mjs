/**
 * Redact secrets from logs and error strings. Never print credentials.
 */

const URL_WITH_PASSWORD = /([a-z][a-z0-9+.-]*:\/\/[^:/?#\s]+:)[^@/\s]+@/gi;
const PEM_BODY =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g;
const CERT_BODY =
  /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
const TOKENISH =
  /\b(sbp_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|service_role|sk_live_[A-Za-z0-9]+)\b/gi;

export function redactText(value) {
  if (value == null) return value;
  let text = String(value);
  text = text.replace(URL_WITH_PASSWORD, "$1***@");
  text = text.replace(PEM_BODY, "[redacted-private-key]");
  text = text.replace(CERT_BODY, "[redacted-certificate]");
  text = text.replace(TOKENISH, "[redacted-token]");
  return text;
}

export function redactUrl(raw) {
  if (!raw) return "";
  try {
    const url = new URL(String(raw));
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return redactText(raw);
  }
}

export function redactError(err) {
  const message = redactText(err instanceof Error ? err.message : String(err));
  return { message, name: err instanceof Error ? err.name : "Error" };
}

export function createLogger(sink = console) {
  const lines = [];
  function emit(level, event, fields = {}) {
    const record = {
      level,
      event,
      ts: new Date().toISOString(),
      ...Object.fromEntries(
        Object.entries(fields).map(([k, v]) => {
          if (
            /password|secret|token|credential|connectionstring|database_url|ca[_-]?cert|private/i.test(
              k,
            )
          ) {
            return [k, "[redacted]"];
          }
          if (typeof v === "string") return [k, redactText(v)];
          return [k, v];
        }),
      ),
    };
    const serialized = JSON.stringify(record);
    if (/postgresql:\/\/[^@\s]+:(?!\*\*\*)[^@/\s]+@/i.test(serialized)) {
      throw new Error("REFUSED: logger attempted to emit a credentialed URL");
    }
    lines.push(record);
    if (level === "error") sink.error?.(serialized);
    else sink.log?.(serialized);
    return record;
  }
  return {
    info: (event, fields) => emit("info", event, fields),
    warn: (event, fields) => emit("warn", event, fields),
    error: (event, fields) => emit("error", event, fields),
    lines: () => lines.slice(),
  };
}
