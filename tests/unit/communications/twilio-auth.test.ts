import { afterEach, describe, expect, it, vi } from "vitest";
import { hasTwilioApiKeyPair, twilioBasicAuthHeader, twilioRestAuthFromEnv } from "@/lib/communications/twilio-auth.server";
import { createTwilioSmsSender, missingTwilioSmsEnvVars, twilioSmsConfigFromEnv } from "@/lib/communications/twilio-sms.server";
import { twilioVoiceConfigFromEnv } from "@/lib/communications/twilio-voice.server";
import { checkTwilioHealth } from "@/lib/observability/provider-health.server";

const SID = "AC" + "0".repeat(32);
const KEY = "SK" + "1".repeat(32);
const KEY_ENV = { TWILIO_ACCOUNT_SID: SID, TWILIO_API_KEY: KEY, TWILIO_API_SECRET: "fixture-secret", TWILIO_FROM_NUMBER: "+15550000001" };
const TOKEN_ENV = { TWILIO_ACCOUNT_SID: SID, TWILIO_AUTH_TOKEN: "fixture-token", TWILIO_FROM_NUMBER: "+15550000001" };
const basic = (u: string, p: string) => `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`;

afterEach(() => vi.unstubAllGlobals());

describe("twilio REST auth resolution", () => {
  it("prefers API key + secret over the auth token", () => {
    const a = twilioRestAuthFromEnv({ ...KEY_ENV, TWILIO_AUTH_TOKEN: "fixture-token" });
    expect(a).toMatchObject({ scheme: "api_key", username: KEY, accountSid: SID });
    expect(twilioBasicAuthHeader(a!)).toBe(basic(KEY, "fixture-secret"));
  });
  it("falls back to the auth token", () => {
    expect(twilioRestAuthFromEnv(TOKEN_ENV)).toMatchObject({ scheme: "auth_token", username: SID });
  });
  it("ignores a non-SK legacy TWILIO_API_KEY and needs the account SID", () => {
    expect(hasTwilioApiKeyPair({ TWILIO_API_KEY: "legacy-gateway", TWILIO_API_SECRET: "x" })).toBe(false);
    expect(twilioRestAuthFromEnv({ TWILIO_API_KEY: KEY, TWILIO_API_SECRET: "x" })).toBeNull();
    expect(twilioRestAuthFromEnv({ TWILIO_ACCOUNT_SID: SID })).toBeNull();
  });
});

describe("adapters use the API key pair", () => {
  it("SMS: no auth token required and Basic SK:secret is sent", async () => {
    expect(missingTwilioSmsEnvVars(KEY_ENV)).toEqual([]);
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ sid: "SM1", status: "queued" }), { status: 201 }));
    const send = createTwilioSmsSender(twilioSmsConfigFromEnv(KEY_ENV), fetchImpl as unknown as typeof fetch);
    await send({ to: "+2348000000000", body: "hi" } as never);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain(`/Accounts/${SID}/Messages.json`);
    expect((init.headers as Record<string, string>).Authorization).toBe(basic(KEY, "fixture-secret"));
  });
  it("SMS: auth-token fallback still uses SID:token", async () => {
    const cfg = twilioSmsConfigFromEnv(TOKEN_ENV)!;
    expect(cfg.authScheme).toBe("auth_token");
    expect(cfg.authUsername).toBe(SID);
  });
  it("voice: direct REST config when the key pair is present", () => {
    const cfg = twilioVoiceConfigFromEnv(KEY_ENV)!;
    expect(cfg.rest?.scheme).toBe("api_key");
    expect(twilioVoiceConfigFromEnv({ ...KEY_ENV, TWILIO_GATEWAY_URL: "https://gw.example.test" })?.rest).toBeUndefined();
  });
  it("health probe authenticates with the key pair", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    await checkTwilioHealth(KEY_ENV, fetchImpl as unknown as typeof fetch);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/Balance.json");
    expect((init.headers as Record<string, string>).Authorization).toBe(basic(KEY, "fixture-secret"));
  });
});
