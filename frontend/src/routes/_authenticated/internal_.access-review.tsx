import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useApp } from "@/contexts/app-context";
import { getAccessReview } from "@/lib/platform-staff/support-access.functions";
import { capabilitiesForRoles, isPlatformRoleCode } from "@/lib/platform-staff/catalogue";

/**
 * Internal console — access review (phase 4). Who holds platform access,
 * which roles, which live support grants, and the recent staff / support
 * audit trail. Requires platform.audit.read (re-checked server-side).
 */
export const Route = createFileRoute("/_authenticated/internal_/access-review")({
  ssr: false,
  component: AccessReviewPage,
});

type Review = Awaited<ReturnType<typeof getAccessReview>>;

function AccessReviewPage() {
  const { superAdmin, platformStaff } = useApp();
  const caps = capabilitiesForRoles((platformStaff?.roles ?? []).filter(isPlatformRoleCode));
  const allowed = Boolean(superAdmin) || caps.has("platform.audit.read");
  const load = useServerFn(getAccessReview);
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    load()
      .then(setReview)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load"));
  }, [allowed, load]);

  if (!allowed) return <Navigate to="/internal" replace />;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 text-sm">
      <h1 className="font-display text-2xl font-bold">Access review</h1>
      {error && <p className="text-destructive">{error}</p>}
      {review && (
        <>
          <section className="uos-card p-5">
            <h2 className="font-display font-semibold">Super admins</h2>
            <ul className="mt-2 space-y-1">
              {review.superAdmins.map((s) => (
                <li key={s.id}>
                  {s.full_name} — {s.email} {s.is_active ? "" : "(inactive)"}
                </li>
              ))}
            </ul>
          </section>
          <section className="uos-card p-5">
            <h2 className="font-display font-semibold">Platform staff</h2>
            <ul className="mt-2 space-y-1">
              {review.staff.map((s) => (
                <li key={s.id}>
                  {s.full_name} — {s.email} — {s.status} — {s.roles.join(", ") || "no roles"}
                </li>
              ))}
            </ul>
          </section>
          <section className="uos-card p-5">
            <h2 className="font-display font-semibold">Active support grants</h2>
            <ul className="mt-2 space-y-1">
              {review.activeGrants.length === 0 && <li>None.</li>}
              {review.activeGrants.map((g) => (
                <li key={g.id}>
                  {g.staff_id} → {g.tenant_id} until {g.expires_at}: {g.reason}
                </li>
              ))}
            </ul>
          </section>
          <section className="uos-card p-5">
            <h2 className="font-display font-semibold">Recent staff &amp; support events</h2>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              {review.recentEvents.map((e) => (
                <li key={e.id}>
                  {e.created_at} {e.action} actor={e.user_id} record={e.record_id}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
