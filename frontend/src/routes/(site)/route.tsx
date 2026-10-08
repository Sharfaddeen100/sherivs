import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "@/lib/platform";

/**
 * Sherivs public site — pathless layout group `(site)`.
 *
 * Presents the company and platform to visitors: what Sherivs is, what it
 * provides, security posture, and real routes into engagement (request a demo,
 * sign in at /auth). Presentation only — no tenant context, no database
 * reads, no fake submissions; every interactive element links to a real route.
 * Internal architecture (phases, kernel contracts, registries) stays behind
 * authentication in the internal Sherivs operating environment.
 */

export const Route = createFileRoute("/(site)")({
  component: SiteLayout,
});

const SECTION_LINKS = [
  { href: "/#platform", label: "Platform" },
  { href: "/#ai-workforce", label: "AI Workforce" },
  { href: "/#solutions", label: "Solutions" },
  { href: "/#enterprise", label: "Enterprise" },
  { href: "/#security", label: "Security" },
] as const;

function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {PLATFORM_NAME}
          </Link>

          <nav aria-label="Site" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {SECTION_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/coregrid"
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Platform detail
            </Link>
          </nav>

          <nav aria-label="Account" className="flex items-center gap-2 text-sm">
            <Link
              to="/auth"
              className="rounded-md border border-border px-3 py-1.5 font-semibold transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Sign in
            </Link>
            <Link
              to="/request-demo"
              className="rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Request a demo
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <p className="font-display font-bold">{PLATFORM_NAME}</p>
            <p className="mt-1 text-muted-foreground">{PLATFORM_TAGLINE}</p>
          </div>
          <nav aria-label="Platform" className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Platform
            </p>
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Overview
            </Link>
            <Link
              to="/coregrid"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Platform detail
            </Link>
            <Link
              to="/request-demo"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Request a demo
            </Link>
          </nav>
          <nav aria-label="Company" className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Company
            </p>
            <Link
              to="/about"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Contact
            </Link>
          </nav>
          <nav aria-label="Legal" className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Legal
            </p>
            <Link
              to="/privacy-policy"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Privacy policy
            </Link>
            <Link
              to="/terms"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Terms of service
            </Link>
            <Link
              to="/auth"
              className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Sign in
            </Link>
          </nav>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {PLATFORM_NAME}. Intelligent operating infrastructure for
          organizations.
        </div>
      </footer>
    </div>
  );
}
