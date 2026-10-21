/**
 * Shared settings page available to every signed-in role.
 *
 * - Profile: name, phone, address, avatar URL, emergency contact.
 * - Security: change password via Supabase auth.
 * - Privacy: digital-twin opt-out (any role can disable AI calls
 *   that reference their data).
 *
 * Super-admins have their own /super-admin/settings, but this route
 * is still reachable for them — they only see the password card.
 */
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Save, Shield, User2, Lock, Bot } from "lucide-react";

import { PortalPage, GlassCard, PortalPageSkeleton } from "@/components/portal-shell";
import { useApp } from "@/contexts/app-context";
import { supabase } from "@/integrations/supabase/client";
import { PasswordInput } from "@/components/security/password-input";
import { PasswordStrengthMeter } from "@/components/security/password-strength-meter";
import { Turnstile, captchaRequired } from "@/components/security/turnstile";
import { turnstileEnabled } from "@/lib/security/turnstile-config";
import { PASSWORD_MIN_LENGTH } from "@/lib/security/password-policy";
import { newPasswordError } from "@/lib/security/password-strength";
import {
  GENERIC_LOGIN_ERROR,
  loginErrorMessage,
  newPasswordServerMessage,
} from "@/lib/security/auth-feedback";
import {
  getMyProfile,
  setDigitalTwinOptOut,
  updateMyProfile,
  type MyProfile,
} from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { superAdmin } = useApp();
  const qc = useQueryClient();

  const getProfileFn = useServerFn(getMyProfile);
  const updateProfileFn = useServerFn(updateMyProfile);
  const setOptOutFn = useServerFn(setDigitalTwinOptOut);

  const { data: profile, isLoading } = useQuery<MyProfile | null>({
    queryKey: ["me", "profile"],
    queryFn: () => getProfileFn(),
    enabled: !superAdmin,
  });

  const saveProfile = useMutation({
    mutationFn: (patch: Partial<MyProfile>) =>
      updateProfileFn({
        data: {
          full_name: patch.full_name,
          phone: patch.phone ?? null,
          address: patch.address ?? null,
          emergency_contact_name: patch.emergency_contact_name ?? null,
          emergency_contact: patch.emergency_contact ?? null,
          avatar_url: patch.avatar_url ?? null,
        },
      }),
    onSuccess: () => {
      toast.success("Profile saved");
      void qc.invalidateQueries({ queryKey: ["me", "profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const optOutMut = useMutation({
    mutationFn: (opt_out: boolean) => setOptOutFn({ data: { opt_out } }),
    onSuccess: () => {
      toast.success("Privacy preference saved");
      void qc.invalidateQueries({ queryKey: ["me", "profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!superAdmin && isLoading) {
    return <PortalPageSkeleton title="Settings" rows={3} showStats={false} />;
  }

  return (
    <PortalPage title="Settings" subtitle="Manage your profile, password, and privacy">
      {!superAdmin && profile && (
        <ProfileCard
          profile={profile}
          saving={saveProfile.isPending}
          onSave={(p) => saveProfile.mutate(p)}
        />
      )}
      {!superAdmin && profile && (
        <PrivacyCard
          optedOut={!!profile.digital_twin_opt_out}
          saving={optOutMut.isPending}
          onChange={(v) => optOutMut.mutate(v)}
        />
      )}
      <PasswordCard />
    </PortalPage>
  );
}

function ProfileCard({
  profile,
  saving,
  onSave,
}: {
  profile: MyProfile;
  saving: boolean;
  onSave: (p: Partial<MyProfile>) => void;
}) {
  const [form, setForm] = useState<Partial<MyProfile>>(profile);
  useEffect(() => setForm(profile), [profile]);

  return (
    <GlassCard className="flex flex-col gap-4">
      <SectionTitle icon={<User2 className="size-4" />} title="Profile" />
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <Field label="Full name">
          <input
            className="uos-input"
            required
            value={form.full_name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          />
        </Field>
        <Field label="Email">
          <input className="uos-input" value={profile.email ?? ""} disabled />
        </Field>
        <Field label="Phone">
          <input
            className="uos-input"
            value={form.phone ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </Field>
        <Field label="Avatar URL">
          <input
            className="uos-input"
            placeholder="https://…"
            value={form.avatar_url ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
          />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <textarea
            rows={2}
            className="uos-input"
            value={form.address ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </Field>
        <Field label="Emergency contact name">
          <input
            className="uos-input"
            value={form.emergency_contact_name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, emergency_contact_name: e.target.value }))}
          />
        </Field>
        <Field label="Emergency contact phone">
          <input
            className="uos-input"
            value={form.emergency_contact ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, emergency_contact: e.target.value }))}
          />
        </Field>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="uos-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function PrivacyCard({
  optedOut,
  saving,
  onChange,
}: {
  optedOut: boolean;
  saving: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <GlassCard className="flex flex-col gap-4">
      <SectionTitle icon={<Bot className="size-4" />} title="AI & privacy" />
      <p className="text-sm text-[color:var(--text-secondary)]">
        The platform may use a Digital Twin to draft AI-assisted summaries and parent calls based on
        your linked data. Opting out blocks the school from including you in any AI-generated
        communication.
      </p>
      <label className="flex items-center justify-between gap-4 rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] px-4 py-3">
        <span className="text-sm font-medium">Opt out of Digital Twin AI calls</span>
        <input
          type="checkbox"
          className="size-5 accent-[color:var(--tenant-primary)]"
          checked={optedOut}
          disabled={saving}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    </GlassCard>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [email, setEmail] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [captchaUnavailable, setCaptchaUnavailable] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? undefined));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pwErr = newPasswordError(pw1, email);
    if (pwErr) return setError(pwErr);
    if (pw1 !== pw2) return setError("Passwords do not match.");
    if (pw1 === current) return setError("Your new password must be different from your current one.");
    if (!email) return setError("Could not load your account. Refresh and try again.");
    if (captchaRequired(turnstileEnabled(), captchaToken, captchaUnavailable)) {
      return setError("Please complete the security check.");
    }
    setBusy(true);
    try {
      // Re-authenticate with the current password before allowing the change.
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
        options: { captchaToken: captchaToken ?? undefined },
      });
      if (reauthErr) {
        const msg = loginErrorMessage(reauthErr);
        throw new Error(msg === GENERIC_LOGIN_ERROR ? "Your current password is incorrect." : msg);
      }
      const { error } = await supabase.auth.updateUser({ password: pw1, current_password: current });
      if (error) throw new Error(newPasswordServerMessage(error));
      // Sign out every other device; this one stays signed in.
      await supabase.auth.signOut({ scope: "others" }).catch(() => {});
      setCurrent("");
      setPw1("");
      setPw2("");
      toast.success("Password changed. Other devices have been signed out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change your password.");
    } finally {
      setBusy(false);
      setCaptchaToken(null);
      setCaptchaNonce((n) => n + 1);
    }
  }

  return (
    <GlassCard className="flex flex-col gap-4">
      <SectionTitle icon={<Lock className="size-4" />} title="Change password" />
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit} data-testid="change-password">
        {email && <input type="email" autoComplete="username" value={email} readOnly hidden />}
        <Field label="Current password" className="sm:col-span-2">
          <PasswordInput
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            fieldLabel="current password"
          />
        </Field>
        <Field label="New password">
          <PasswordInput
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            autoComplete="new-password"
            fieldLabel="new password"
          />
        </Field>
        <Field label="Confirm new password">
          <PasswordInput
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            autoComplete="new-password"
            fieldLabel="confirmation password"
          />
        </Field>
        <div className="sm:col-span-2">
          <PasswordStrengthMeter password={pw1} email={email} />
        </div>
        <p className="sm:col-span-2 text-xs text-[color:var(--text-muted)]">
          Changing your password signs you out on all your other devices.
        </p>
        <div className="sm:col-span-2">
          <Turnstile
            onToken={setCaptchaToken}
            onUnavailable={() => setCaptchaUnavailable(true)}
            resetKey={captchaNonce}
          />
        </div>
        {error && (
          <div
            role="alert"
            className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
          >
            {error}
          </div>
        )}
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="uos-btn-primary inline-flex w-full items-center justify-center gap-2 disabled:opacity-50 sm:w-auto"
          >
            <Shield className="size-4" />
            {busy ? "Updating…" : "Change password"}
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-[color:var(--text-muted)]">
      {icon}
      {title}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs uppercase tracking-widest text-[color:var(--text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
