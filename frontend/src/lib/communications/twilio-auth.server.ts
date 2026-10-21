/**
 * Twilio REST credential resolution (names only, never values — §30).
 *
 * Preferred: an API key pair — `TWILIO_API_KEY` (key SID, `SK…`) +
 * `TWILIO_API_SECRET` — used as Basic `SK…:secret` against the account named
 * by `TWILIO_ACCOUNT_SID`. API keys are revocable and scoped per key, so a
 * leak does not expose the account's primary auth token.
 * Fallback: the account auth token — Basic `AC…:TWILIO_AUTH_TOKEN`.
 *
 * Note: inbound webhook signatures (`x-twilio-signature`) are always signed
 * with the ACCOUNT auth token; an API secret cannot validate them. Inbound
 * webhook routes therefore still need `TWILIO_AUTH_TOKEN`.
 */
export const TWILIO_ACCOUNT_SID_ENV = "TWILIO_ACCOUNT_SID";
export const TWILIO_AUTH_TOKEN_ENV = "TWILIO_AUTH_TOKEN";
export const TWILIO_API_KEY_ENV = "TWILIO_API_KEY";
export const TWILIO_API_SECRET_ENV = "TWILIO_API_SECRET";

export type TwilioAuthScheme = "api_key" | "auth_token";

export interface TwilioRestAuth {
  accountSid: string;
  username: string;
  password: string;
  scheme: TwilioAuthScheme;
}

type Env = Record<string, string | undefined>;

function nonBlank(v: string | undefined): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** True when TWILIO_API_KEY is a REST API key SID (not a legacy gateway key). */
export function hasTwilioApiKeyPair(env: Env): boolean {
  const key = env[TWILIO_API_KEY_ENV];
  return nonBlank(key) && key.trim().startsWith("SK") && nonBlank(env[TWILIO_API_SECRET_ENV]);
}

export function twilioRestAuthFromEnv(env: Env): TwilioRestAuth | null {
  const accountSid = env[TWILIO_ACCOUNT_SID_ENV];
  if (!nonBlank(accountSid)) return null;
  if (hasTwilioApiKeyPair(env)) {
    return {
      accountSid: accountSid.trim(),
      username: (env[TWILIO_API_KEY_ENV] as string).trim(),
      password: env[TWILIO_API_SECRET_ENV] as string,
      scheme: "api_key",
    };
  }
  const token = env[TWILIO_AUTH_TOKEN_ENV];
  if (!nonBlank(token)) return null;
  return { accountSid: accountSid.trim(), username: accountSid.trim(), password: token, scheme: "auth_token" };
}

export function twilioBasicAuthHeader(auth: TwilioRestAuth): string {
  return `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}`;
}
