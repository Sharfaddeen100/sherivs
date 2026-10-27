import { Link } from "@tanstack/react-router";
import { SherivsLogo } from "@/components/brand/sherivs-logo";
import { CANONICAL_CONSOLE_HOST } from "@/lib/experience/experience-host";
import { useApp } from "@/contexts/app-context";
import "./console.css";

export function ConsoleNotAuthorised() {
  const app = useApp();
  return (
    <div className="sherivs-console">
      <div className="sherivs-console-orbs" aria-hidden="true">
        <span className="sherivs-console-orb sherivs-console-orb-cyan" />
        <span className="sherivs-console-orb sherivs-console-orb-blue" />
        <span className="sherivs-console-orb sherivs-console-orb-violet" />
      </div>
      <main className="sherivs-console-main">
        <div className="sherivs-console-sheet">
          <section className="sherivs-console-card" data-testid="console-not-authorised">
            <SherivsLogo size={32} />
            <h1>Not authorised</h1>
            <p>
              This host is the Sherivs Internal Console. Access is limited to active Sherivs staff.
              Signing in with a school account does not grant console access.
            </p>
            <div className="sherivs-console-actions" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className="sherivs-console-btn secondary"
                onClick={() => void app.signOut()}
              >
                Sign out
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export function ConsoleElsewhere() {
  return (
    <div className="sherivs-console">
      <div className="sherivs-console-orbs" aria-hidden="true">
        <span className="sherivs-console-orb sherivs-console-orb-cyan" />
        <span className="sherivs-console-orb sherivs-console-orb-blue" />
        <span className="sherivs-console-orb sherivs-console-orb-violet" />
      </div>
      <main className="sherivs-console-main">
        <div className="sherivs-console-sheet">
          <section className="sherivs-console-card" data-testid="console-elsewhere">
            <SherivsLogo size={32} />
            <h1>Internal Console lives on its own host</h1>
            <p>
              The Sherivs Internal Console is served at {CANONICAL_CONSOLE_HOST}. This application
              host is for organization workspaces.
            </p>
            <div className="sherivs-console-actions" style={{ marginTop: "1rem" }}>
              <Link to="/" className="sherivs-console-btn secondary">
                Back
              </Link>
              <a className="sherivs-console-btn" href={`https://${CANONICAL_CONSOLE_HOST}/console`}>
                Open console host
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
