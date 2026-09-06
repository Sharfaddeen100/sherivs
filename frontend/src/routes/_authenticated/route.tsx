import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { refreshPushTokenIfGranted } from "@/lib/push-client";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/app-context";
import { ROLE_LABEL, dashboardPathForRole } from "@/lib/roles";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PortalSidebar } from "@/components/portal-sidebar";
import { PortalPageSkeleton, RouteErrorBoundary } from "@/components/portal-shell";
import { MobileSwipeToOpen } from "@/components/mobile-swipe-to-open";
import { CommandCenterMount, openCommandCenter } from "@/components/command-center";
import { Search as SearchIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useModKeyLabel } from "@/lib/kbd";
import { PLATFORM_NAME, SCHOLAR_RUNTIME_NAME } from "@/lib/platform";
import { WorkspaceBottomNav } from "@/components/mobile-bottom-nav";
import {
  SCHOLAR_NAV_CONTRIBUTIONS,
  scholarCapabilitiesForPortal,
  type ScholarPortalKind,
} from "@/lib/workspace-engine/nav-catalog";
import { hasNavDestinations, resolveWorkspaceNav } from "@/lib/workspace-engine/navigation";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { authUser: data.user };
  },
  component: AuthenticatedLayout,
  pendingComponent: () => <PortalPageSkeleton />,
  errorComponent: AuthenticatedRouteErrorComponent,
});

function AuthenticatedRouteErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <RouteErrorBoundary
      error={error}
      reset={() => {
        reset();
        router.invalidate();
      }}
    />
  );
}

function AuthenticatedLayout() {
  const { profile, superAdmin, school, role, loading, signOut } = useApp();
  const navigate = useNavigate();
  const modKey = useModKeyLabel();

  // Keep the stored push subscription fresh for users who already opted in.
  useEffect(() => {
    if (!profile?.id) return;
    void refreshPushTokenIfGranted(profile.id);
  }, [profile?.id]);

  if (loading) {
    return <div className="min-h-dvh grid place-items-center text-muted-foreground">Loading…</div>;
  }

  if (!profile && !superAdmin) {
    return (
      <div className="min-h-dvh grid place-items-center px-4">
        <div className="max-w-md uos-card p-8 text-center">
          <h1 className="font-display text-xl font-bold">Account not yet linked</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your sign-in is valid, but your account has not been linked to a school yet. A school
            administrator (or a CoreGrid platform super admin) needs to assign you a role before you
            can open a portal.
          </p>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name ?? superAdmin?.full_name ?? "User";
  const dashHref = role ? dashboardPathForRole(role) : "/";

  // Workspace-dynamic chrome: the mobile quick-nav is derived from the active
  // runtime's contribution data + the viewer's authorized capabilities — no
  // fixed portal bars (Scholar R-001 is currently the only mobile runtime).
  const scholarPortalKind: ScholarPortalKind | null =
    role === "parent" ? "parent" : role === "student" ? "student" : null;
  const bottomNavSections = scholarPortalKind
    ? resolveWorkspaceNav(
        SCHOLAR_NAV_CONTRIBUTIONS,
        scholarCapabilitiesForPortal(scholarPortalKind),
      )
    : [];
  const hasBottomNav = hasNavDestinations(bottomNavSections);

  return (
    <SidebarProvider>
      <div className="min-h-dvh flex w-full">
        {role && <PortalSidebar role={role} />}
        <MobileSwipeToOpen />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden portal-content">
          <header className="border-b border-border">
            <div className="flex items-center justify-between px-4 py-2 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {role && <SidebarTrigger />}
                <Link to={dashHref} className="flex items-center gap-2 min-w-0">
                  <div className="size-8 rounded-lg uos-tenant-bg grid place-items-center font-bold shrink-0">
                    {(school?.name?.[0] ?? "U") as string}
                  </div>
                  <div className="leading-tight min-w-0">
                    <div className="font-display font-bold text-sm truncate">
                      {school?.name ?? `${PLATFORM_NAME} · ${SCHOLAR_RUNTIME_NAME}`}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {role ? ROLE_LABEL[role] : "Portal"}
                    </div>
                  </div>
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm sm:gap-3">
                <button
                  onClick={openCommandCenter}
                  className="hidden sm:inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                  title={`Command palette (${modKey}K)`}
                >
                  <SearchIcon className="size-3.5" />
                  <span>Search</span>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                    {modKey}K
                  </kbd>
                </button>
                <button
                  onClick={openCommandCenter}
                  className="inline-flex sm:hidden items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label={`Search (${modKey}+K)`}
                >
                  <SearchIcon className="size-4" />
                </button>
                <ThemeToggle className="hidden xs:inline-flex" />
                <span className="hidden sm:inline text-muted-foreground">{displayName}</span>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/auth", replace: true });
                  }}
                  className="rounded-md border border-border px-3 py-1.5 hover:bg-accent text-sm"
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>
          <main
            id="main-content"
            className={`flex-1 min-w-0 overflow-x-hidden ${hasBottomNav ? "pb-20 lg:pb-0" : ""}`}
          >
            <Outlet />
          </main>
        </div>
        {hasBottomNav && <WorkspaceBottomNav sections={bottomNavSections} />}

        <CommandCenterMount />
      </div>
    </SidebarProvider>
  );
}
