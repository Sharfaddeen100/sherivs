import { Link } from "@tanstack/react-router";
import { PLATFORM_NAME, PLATFORM_PAGE_DESCRIPTION, PLATFORM_TAGLINE } from "@/lib/platform";

/**
 * Public platform home for unauthenticated visitors on `/` when no tenant
 * school is resolved. This is the production-facing Sherivs/CoreGrid landing:
 * existing brand chrome, real routes, no in-memory Command Centre, no
 * fictional operational metrics.
 *
 * The in-memory Command Centre remains in the codebase as isolated demo
 * machinery and is not mounted here.
 */
export function PublicPlatformHome() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt={`${PLATFORM_NAME} logo`}
              width={40}
              height={40}
              className="size-10 rounded-md"
            />
            <div>
              <p className="font-display text-lg font-bold leading-tight">{PLATFORM_NAME}</p>
              <p className="text-xs text-muted-foreground">{PLATFORM_TAGLINE}</p>
            </div>
          </div>
          <nav aria-label="Account" className="flex items-center gap-2 text-sm">
            <Link
              to="/auth"
              className="rounded-md border border-border px-3 py-1.5 font-semibold transition-colors hover:bg-accent"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <section aria-labelledby="platform-home-heading" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {PLATFORM_TAGLINE}
          </p>
          <h1
            id="platform-home-heading"
            className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {PLATFORM_NAME}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {PLATFORM_PAGE_DESCRIPTION}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/coregrid"
              className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              Platform overview
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
