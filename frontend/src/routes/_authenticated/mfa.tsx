import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Security P2 — TOTP enrolment + challenge. Internal users (super admins,
 * platform staff) must reach AAL2 before /internal/* opens.
 */
export const Route = createFileRoute("/_authenticated/mfa")({
  ssr: false,
  component: MfaPage,
});

function MfaPage() {
  const navigate = useNavigate();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") return navigate({ to: "/internal", replace: true });
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (verified) return setFactorId(verified.id);
      const { data: enrolled, error: e } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Sherivs authenticator",
      });
      if (e || !enrolled) return setError(e?.message ?? "Could not start enrolment");
      setFactorId(enrolled.id);
      setQr(enrolled.totp.qr_code);
    })();
  }, [navigate]);

  async function verify() {
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const { error: e } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    setBusy(false);
    if (e) return setError(e.message);
    navigate({ to: "/internal", replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-10 text-sm">
      <h1 className="font-display text-2xl font-bold">Two-factor verification</h1>
      <p className="text-muted-foreground">
        Internal access requires an authenticator app (TOTP).
        {qr ? " Scan this code, then enter the 6-digit code." : " Enter the 6-digit code."}
      </p>
      {qr && <img src={qr} alt="Authenticator QR code" className="h-48 w-48" />}
      <input
        className="w-full rounded border px-3 py-2"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-label="6-digit code"
      />
      {error && <p className="text-destructive">{error}</p>}
      <button
        type="button"
        className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        disabled={busy || code.trim().length !== 6 || !factorId}
        onClick={verify}
      >
        Verify
      </button>
    </div>
  );
}
