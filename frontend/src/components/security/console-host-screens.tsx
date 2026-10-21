import { SherivsLogo } from "@/components/brand/sherivs-logo";
import { CONSOLE_ORIGIN } from "@/lib/experience/console-host-routing";

/** Shown on the console host to signed-in users who are not internal staff. */
export function ConsoleNotAuthorised({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="min-h-dvh grid place-items-center px-4" data-testid="console-not-authorised">
      <div className="max-w-md uos-card p-8 text-center flex flex-col items-center gap-4">
        <SherivsLogo size={44} wordmarkClassName="text-xl" />
        <h1 className="font-display text-xl font-bold">Not authorised</h1>
        <p className="text-sm text-muted-foreground">
          The Sherivs console is for Sherivs staff only. Your account does not have console access.
          If you expected access, ask a platform administrator for an invite.
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/** Shown when /internal is opened on the app, public or a tenant host. */
export function ConsoleNotServedHere() {
  return (
    <div className="min-h-dvh grid place-items-center px-4" data-testid="console-not-served-here">
      <div className="max-w-md uos-card p-8 text-center flex flex-col items-center gap-4">
        <SherivsLogo size={44} wordmarkClassName="text-xl" />
        <h1 className="font-display text-xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This page is not available on this address. Sherivs staff use the console at its own
          address.
        </p>
        <div className="flex gap-3">
          <a href="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            Go to app home
          </a>
          <a
            href={CONSOLE_ORIGIN}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Open console
          </a>
        </div>
      </div>
    </div>
  );
}
