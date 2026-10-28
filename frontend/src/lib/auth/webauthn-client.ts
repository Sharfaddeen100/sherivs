/**
 * Browser helpers for Sherivs passkeys. Talks to server functions, then
 * @simplewebauthn/browser. Never treats a WebAuthn assertion as a session.
 */
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
  WebAuthnError,
} from "@simplewebauthn/browser";
import { supabase } from "@/integrations/supabase/client";
import { WEBAUTHN_PUBLIC_ERROR } from "./webauthn-policy";
import {
  getPasskeyAuthenticationOptions,
  getPasskeyRegistrationOptions,
  listPasskeys,
  removePasskey,
  renamePasskey,
  verifyPasskeyAuthentication,
  verifyPasskeyRegistration,
} from "./webauthn.functions";
import type { PasskeyListItem } from "./webauthn-store";

export type { PasskeyListItem };

export const PASSKEY_DEVICE_HELP =
  "Sign-in uses the passkey method this device already offers — fingerprint, face unlock, device PIN, or a security key. Sherivs never stores a fingerprint or face image.";

export async function passkeysSupported(): Promise<boolean> {
  return browserSupportsWebAuthn();
}

export async function platformPasskeyAvailable(): Promise<boolean> {
  if (!browserSupportsWebAuthn()) return false;
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

function mapBrowserError(err: unknown): string {
  if (err instanceof WebAuthnError) {
    if (err.code === "ERROR_CEREMONY_ABORTED") return WEBAUTHN_PUBLIC_ERROR.cancelled;
    if (err.name === "NotAllowedError" || err.code === "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY") {
      const cause = err.cause;
      if (cause instanceof DOMException && cause.name === "NotAllowedError") {
        return WEBAUTHN_PUBLIC_ERROR.cancelled;
      }
    }
    if (err.code === "ERROR_INVALID_DOMAIN" || err.code === "ERROR_INVALID_RP_ID") {
      return WEBAUTHN_PUBLIC_ERROR.unavailable;
    }
    if (err.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") {
      return WEBAUTHN_PUBLIC_ERROR.already_registered;
    }
  }
  if (
    err instanceof DOMException &&
    (err.name === "NotAllowedError" || err.name === "AbortError")
  ) {
    return WEBAUTHN_PUBLIC_ERROR.cancelled;
  }
  if (err instanceof Error && err.message) {
    if (
      Object.values(WEBAUTHN_PUBLIC_ERROR).includes(
        err.message as (typeof WEBAUTHN_PUBLIC_ERROR)[keyof typeof WEBAUTHN_PUBLIC_ERROR],
      )
    ) {
      return err.message;
    }
  }
  return WEBAUTHN_PUBLIC_ERROR.auth_failed;
}

export async function registerPasskey(label?: string): Promise<PasskeyListItem> {
  if (!browserSupportsWebAuthn()) throw new Error(WEBAUTHN_PUBLIC_ERROR.unsupported);
  try {
    const optionsJSON = await getPasskeyRegistrationOptions();
    const response = await startRegistration({ optionsJSON });
    return await verifyPasskeyRegistration({ data: { response, label } });
  } catch (err) {
    const mapped = mapBrowserError(err);
    throw new Error(
      mapped === WEBAUTHN_PUBLIC_ERROR.auth_failed ? WEBAUTHN_PUBLIC_ERROR.register_failed : mapped,
    );
  }
}

export async function authenticateWithPasskey(): Promise<{ userId: string }> {
  if (!browserSupportsWebAuthn()) throw new Error(WEBAUTHN_PUBLIC_ERROR.unsupported);
  try {
    const optionsJSON = await getPasskeyAuthenticationOptions();
    const response = await startAuthentication({ optionsJSON });
    const session = await verifyPasskeyAuthentication({ data: { response } });
    const { error } = await supabase.auth.setSession({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });
    if (error) throw new Error(WEBAUTHN_PUBLIC_ERROR.session_failed);
    return { userId: session.userId };
  } catch (err) {
    throw new Error(mapBrowserError(err));
  }
}

export async function loadPasskeys(): Promise<PasskeyListItem[]> {
  return listPasskeys();
}

export async function savePasskeyLabel(
  credentialId: string,
  label: string,
): Promise<PasskeyListItem> {
  return renamePasskey({ data: { credentialId, label } });
}

export async function deletePasskey(credentialId: string): Promise<void> {
  await removePasskey({ data: { credentialId } });
}
