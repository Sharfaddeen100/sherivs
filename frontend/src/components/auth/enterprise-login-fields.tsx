import { Lock, Mail } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PasswordInput } from "@/components/security/password-input";
import { SIGN_IN_IDENTIFIER_PLACEHOLDER } from "@/lib/auth/organization-access";
import { PasskeyConditionalLogin } from "./passkey-conditional-login";
import { PasskeySignInButton } from "./passkey-sign-in-button";

type ForgotSearch = { email?: string };

type Props = {
  identifier: string;
  password: string;
  remember: boolean;
  passkeyEligible: boolean;
  submitting: boolean;
  waitMs: number;
  identifierTestId?: string;
  rememberTestId?: string;
  forgotSearch?: ForgotSearch;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onPasskeyBusy: (busy: boolean) => void;
  onPasskeyError: (message: string) => void;
  onPasskeySignedIn: () => Promise<void> | void;
};

export function EnterpriseLoginFields({
  identifier,
  password,
  remember,
  passkeyEligible,
  submitting,
  waitMs,
  identifierTestId,
  rememberTestId,
  forgotSearch = {},
  onIdentifierChange,
  onPasswordChange,
  onRememberChange,
  onPasskeyBusy,
  onPasskeyError,
  onPasskeySignedIn,
}: Props) {
  const passwordField = (
    <label className="app-entry-login-field">
      <span className="sr-only">Password</span>
      <span className="app-entry-login-field-icon">
        <span className="app-entry-glass-icon" aria-hidden="true">
          <Lock />
        </span>
      </span>
      <PasswordInput
        required
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        autoComplete="current-password"
        name="password"
        fieldLabel="password"
        placeholder="Password"
        inputClassName="app-entry-login-input app-entry-login-input-password"
      />
    </label>
  );

  return (
    <>
      <label className="app-entry-login-field">
        <span className="sr-only">Email, ID number, or phone</span>
        <span className="app-entry-login-field-icon">
          <span className="app-entry-glass-icon" aria-hidden="true">
            <Mail />
          </span>
        </span>
        <input
          required
          type="text"
          inputMode="email"
          value={identifier}
          onChange={(e) => onIdentifierChange(e.target.value)}
          className="app-entry-login-input"
          placeholder={SIGN_IN_IDENTIFIER_PLACEHOLDER}
          autoComplete="username webauthn"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          name="username"
          data-testid={identifierTestId}
        />
      </label>
      <PasskeyConditionalLogin
        enabled={waitMs <= 0 && !submitting}
        onBusy={onPasskeyBusy}
        onError={onPasskeyError}
        onSignedIn={onPasskeySignedIn}
      />
      {passkeyEligible ? (
        <div className="app-entry-login-secret-row" data-testid="login-passkey-row">
          {passwordField}
          <PasskeySignInButton
            compact
            className="app-entry-login-passkey"
            iconClassName="app-entry-glass-icon"
            disabled={submitting || waitMs > 0}
            onBusy={onPasskeyBusy}
            onError={onPasskeyError}
            onSignedIn={onPasskeySignedIn}
          />
        </div>
      ) : (
        passwordField
      )}
      <div className="app-entry-login-forgot-row">
        <Link to="/forgot-password" search={forgotSearch} className="app-entry-login-forgot">
          Forgot password?
        </Link>
      </div>
      {passkeyEligible ? null : (
        <label className="app-entry-login-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => onRememberChange(e.target.checked)}
            data-testid={rememberTestId}
          />
          Remember for 30 days
        </label>
      )}
    </>
  );
}
