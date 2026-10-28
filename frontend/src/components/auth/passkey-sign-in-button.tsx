import { useState } from "react";
import { Fingerprint } from "lucide-react";
import { authenticateWithPasskey, passkeysSupported } from "@/lib/auth/webauthn-client";
import { WEBAUTHN_PUBLIC_ERROR } from "@/lib/auth/webauthn-policy";

type Props = {
  disabled?: boolean;
  className: string;
  iconClassName?: string;
  onBusy?: (busy: boolean) => void;
  onError?: (message: string) => void;
  onSignedIn: () => Promise<void> | void;
};

export function PasskeySignInButton({
  disabled,
  className,
  iconClassName,
  onBusy,
  onError,
  onSignedIn,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy || disabled) return;
    setBusy(true);
    onBusy?.(true);
    try {
      if (!(await passkeysSupported())) {
        onError?.(WEBAUTHN_PUBLIC_ERROR.unsupported);
        return;
      }
      const session = await authenticateWithPasskey();
      if (!session) return;
      await onSignedIn();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : WEBAUTHN_PUBLIC_ERROR.auth_failed);
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || busy}
      onClick={() => void handleClick()}
      data-testid="auth-passkey"
    >
      <span className={iconClassName} aria-hidden="true">
        <Fingerprint size={16} />
      </span>
      {busy ? "Waiting for this device…" : "Sign in with a passkey"}
    </button>
  );
}
