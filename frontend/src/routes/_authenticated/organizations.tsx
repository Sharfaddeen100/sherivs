import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/contexts/app-context";
import { identityFromAppState } from "@/lib/identity/context";
import { scholarWorkspaceLabelForRole } from "@/lib/runtime/nav-registry";
import { Initial } from "@/components/public/_shared";

/**
 * Organization selector (§11 — multi-organization members).
 *
 * Shown when a signed-in user resolves to more than one organization
 * membership: they choose which organization's workspace to enter. With the
 * current single-membership identity store this page currently lists one
 * organization; the destination law never sends single-membership users here.
 */
export const Route = createFileRoute("/_authenticated/organizations")({
  ssr: false,
  component: OrganizationSelectorPage,
});

function OrganizationSelectorPage() {
  const { profile, superAdmin, school, loading } = useApp();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-muted-foreground">Loading…</div>
    );
  }

  const identity = identityFromAppState({ superAdmin, profile, school });

  if (identity.kind === "sherivs_internal") {
    void navigate({ to: "/internal", replace: true });
    return null;
  }

  if (identity.kind === "unlinked") {
    void navigate({ to: "/welcome", replace: true });
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Choose a workspace
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Your organizations
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          You&apos;re a member of more than one organization. Select the one you want to work in.
        </p>
      </header>

      <ul className="mt-10 grid gap-4">
        {identity.organizations.map((org) => (
          <li key={org.organizationId}>
            <button
              type="button"
              onClick={() => void navigate({ to: org.homePath, replace: true })}
              className="uos-card flex w-full items-center gap-4 p-5 text-left transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Initial name={org.name} size={44} className="rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-semibold">
                  {org.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {scholarWorkspaceLabelForRole(org.role)} · {org.runtimeName} workspace
                </span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-sm font-semibold text-primary">
                Open →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
