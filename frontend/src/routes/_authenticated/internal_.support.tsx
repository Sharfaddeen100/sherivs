import { createFileRoute, Navigate } from "@tanstack/react-router";
import { InternalSecurityGate } from "@/components/security/internal-security-gate";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/contexts/app-context";
import {
  grantSupportAccess,
  listSupportGrants,
  readSupportTenantSummary,
  revokeSupportAccess,
  SUPPORT_GRANT_MAX_HOURS,
} from "@/lib/platform-staff/support-access.functions";
import { capabilitiesForRoles, isPlatformRoleCode } from "@/lib/platform-staff/catalogue";

/**
 * Internal console — Support access (SHERIVS-009). Super admins grant
 * time-limited access; Support staff open the tenant summary only while a
 * grant is active. Every grant, revoke and read is audited server-side.
 */
export const Route = createFileRoute("/_authenticated/internal_/support")({
  ssr: false,
  component: GatedSupportPage,
});

type Grant = Awaited<ReturnType<typeof listSupportGrants>>[number];
type Summary = Awaited<ReturnType<typeof readSupportTenantSummary>>;

function SupportPage() {
  const { superAdmin, platformStaff } = useApp();
  const caps = capabilitiesForRoles((platformStaff?.roles ?? []).filter(isPlatformRoleCode));
  const allowed = Boolean(superAdmin) || caps.has("platform.support.handle");

  const list = useServerFn(listSupportGrants);
  const grant = useServerFn(grantSupportAccess);
  const revoke = useServerFn(revokeSupportAccess);
  const read = useServerFn(readSupportTenantSummary);

  const [grants, setGrants] = useState<Grant[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ staffId: "", schoolId: "", reason: "", hours: 2 });

  const reload = useCallback(async () => {
    try {
      setGrants(await list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load grants");
    }
  }, [list]);
  useEffect(() => {
    if (allowed) void reload();
  }, [allowed, reload]);

  if (!allowed) return <Navigate to="/internal" replace />;

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="font-display text-2xl font-bold">Support access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Time-limited (max {SUPPORT_GRANT_MAX_HOURS}h), read-only access to one organization. Every
          grant, revoke and read is audited.
        </p>
      </header>

      {superAdmin && (
        <form
          className="uos-card grid gap-3 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void act(() => grant({ data: form }));
          }}
        >
          <h2 className="font-display font-semibold sm:col-span-2">Grant access</h2>
          <input
            required
            placeholder="Staff user id"
            className="uos-input"
            value={form.staffId}
            onChange={(e) => setForm({ ...form, staffId: e.target.value })}
          />
          <input
            required
            placeholder="Organization id"
            className="uos-input"
            value={form.schoolId}
            onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
          />
          <input
            required
            minLength={10}
            placeholder="Reason (ticket / incident)"
            className="uos-input sm:col-span-2"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
          <input
            type="number"
            min={1}
            max={SUPPORT_GRANT_MAX_HOURS}
            className="uos-input"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Grant
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="uos-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Organization</th>
              <th className="p-3">Staff</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Expires</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {grants.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-muted-foreground">
                  No grants.
                </td>
              </tr>
            )}
            {grants.map((g) => {
              const active = g.active;
              return (
                <tr key={g.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{g.tenant_id}</td>
                  <td className="p-3 font-mono text-xs">{g.staff_id}</td>
                  <td className="p-3">{g.reason}</td>
                  <td className="p-3">
                    {g.revoked_at ? "revoked" : active ? g.expires_at : "expired"}
                  </td>
                  <td className="space-x-2 whitespace-nowrap p-3">
                    {active && (
                      <button
                        type="button"
                        className="rounded-md border border-border px-2 py-1 text-xs"
                        onClick={() =>
                          void act(async () =>
                            setSummary(await read({ data: { schoolId: g.tenant_id } })),
                          )
                        }
                      >
                        Open
                      </button>
                    )}
                    {active && superAdmin && (
                      <button
                        type="button"
                        className="rounded-md border border-border px-2 py-1 text-xs"
                        onClick={() => void act(() => revoke({ data: { grantId: g.id } }))}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {summary?.school && (
        <section className="uos-card p-5 text-sm" aria-label="Organization summary">
          <h2 className="font-display font-semibold">{summary.school.name}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <dt className="text-muted-foreground">Slug</dt>
            <dd>{summary.school.slug}</dd>
            <dt className="text-muted-foreground">Active</dt>
            <dd>{String(summary.school.is_active)}</dd>
            <dt className="text-muted-foreground">Plan</dt>
            <dd>
              {summary.school.subscription_tier} / {summary.school.subscription_status}
            </dd>
            <dt className="text-muted-foreground">Members</dt>
            <dd>{summary.memberCount}</dd>
          </dl>
        </section>
      )}
    </div>
  );
}

function GatedSupportPage() {
  return (
    <InternalSecurityGate>
      <SupportPage />
    </InternalSecurityGate>
  );
}
