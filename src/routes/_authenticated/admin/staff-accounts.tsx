import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { PortalPage } from "@/components/portal-shell";
import { RoleGuard } from "@/components/role-guard";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/app-context";
import {
  createStaffAccount,
  resetStaffPassword,
  CREATABLE_STAFF_ROLES,
  type CreatableStaffRole,
  type CreateStaffAccountResult,
} from "@/lib/staff-accounts.functions";

export const Route = createFileRoute("/_authenticated/admin/staff-accounts")({
  ssr: false,
  component: () => (
    <RoleGuard allow={["admin", "principal"]}>
      <StaffAccountsPage />
    </RoleGuard>
  ),
});

const ROLE_LABEL: Record<CreatableStaffRole, string> = {
  admin: "School admin",
  principal: "Principal",
  teacher: "Teacher",
  bursar: "Bursar",
  parent: "Parent",
  student: "Student",
  driver: "Bus driver",
  hq: "HQ",
};

function StaffAccountsPage() {
  const { school } = useApp();
  const qc = useQueryClient();
  const create = useServerFn(createStaffAccount);
  const reset = useServerFn(resetStaffPassword);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreatableStaffRole>("teacher");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<CreateStaffAccountResult | null>(null);

  const list = useQuery({
    queryKey: ["staff-accounts", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email, role, is_active, created_at")
        .eq("school_id", school!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setIssued(null);
    try {
      const result = await create({
        data: {
          fullName: fullName.trim(),
          email: email.trim(),
          role,
          phone: phone.trim() || null,
          password: password.trim() || null,
        },
      });
      setIssued(result);
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["staff-accounts"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(userId: string) {
    setError(null);
    try {
      const result = await reset({ data: { userId } });
      setIssued({
        userId: result.userId,
        email: result.email ?? "(unknown)",
        password: result.password,
        role,
        fullName: "Existing user",
        reused: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    }
  }

  return (
    <PortalPage
      title="Staff & user accounts"
      subtitle="Create real portal logins for teachers, parents, students, drivers and every other role. Credentials are shown once — copy them for the person."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="uos-card lg:col-span-2 space-y-4 p-5">
          <h2 className="font-display text-lg font-semibold">Create account</h2>

          <Field label="Full name">
            <input
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="uos-input"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="uos-input"
              autoComplete="off"
            />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CreatableStaffRole)}
              className="uos-input"
            >
              {CREATABLE_STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Phone (optional)">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="uos-input" />
          </Field>
          <Field label="Password (optional — leave blank to auto-generate)">
            <input
              type="text"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Auto-generate"
              className="uos-input"
            />
          </Field>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create account"}
          </button>

          {issued && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-500">
                ✓ {issued.reused ? "Password reset" : "Account created"}
              </div>
              <div className="space-y-1 text-xs">
                <Copyable label="Email" value={issued.email} />
                <Copyable label="Password" value={issued.password} />
                <div>
                  <span className="text-muted-foreground">Role:</span>{" "}
                  <span className="font-medium">{ROLE_LABEL[issued.role]}</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                These credentials work immediately on the sign-in page. This is the only
                time the password is displayed — copy it now.
              </p>
            </div>
          )}
        </form>

        <div className="lg:col-span-3">
          <h2 className="mb-3 font-display text-lg font-semibold">
            Existing accounts {school?.name ? `at ${school.name}` : ""}
          </h2>
          <div className="uos-card divide-y divide-border">
            {list.isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : (list.data ?? []).length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No accounts yet.</div>
            ) : (
              (list.data ?? []).map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{u.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {u.email} · {u.role}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReset(u.id)}
                    className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted/40"
                  >
                    Reset password
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PortalPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Copyable({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-muted-foreground">{label}:</span>
      <code className="flex-1 rounded bg-muted/40 px-2 py-1 font-mono text-[11px]">{value}</code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        }}
        className="rounded border border-border px-2 py-1 text-[10px] hover:bg-muted/40"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}