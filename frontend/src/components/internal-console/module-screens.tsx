import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  invitePlatformStaff,
  resendPlatformStaffInvite,
  setPlatformStaffRoles,
  setPlatformStaffStatus,
} from "@/lib/platform-staff/staff.functions";
import {
  PLATFORM_ROLE_CODES,
  PLATFORM_ROLE_LABELS,
  PRIVILEGED_PLATFORM_ROLES,
} from "@/lib/platform-staff/catalogue";
import { getAccessReview } from "@/lib/platform-staff/support-access.functions";
import { listConsoleAudit } from "@/lib/internal-console/activity.functions";
import { CONSOLE_PATHS, SCHOLAR_ENTRY_URL } from "@/lib/internal-console/paths";
import { workspaceById } from "@/lib/internal-console/workspaces";
import {
  REGISTERED_RUNTIMES,
  SCHOLAR_RUNTIME_CONTRACT,
} from "@/lib/internal-console/runtime-contract";
import { CONSOLE_HELP_ARTICLES } from "@/lib/internal-console/help-catalog";
import { CONSOLE_HEALTH_LABELS } from "@/lib/internal-console/status";
import { useApp } from "@/contexts/app-context";
import { useConsole } from "./console-shell";
import type { ConsoleActivityItem, ConsoleStaffRow } from "@/lib/internal-console/overview";

function canManage(overviewCapabilities: string[]): boolean {
  return overviewCapabilities.includes("platform.staff.manage");
}

export function ConsoleTeamDirectory() {
  const { overview, reload } = useConsole();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!overview) return <section className="sherivs-console-card">Loading team…</section>;
  if (!overview.staffAvailable) {
    return (
      <section className="sherivs-console-card">
        <h1>Team Directory</h1>
        <p>Team records are limited to authorized administrators.</p>
      </section>
    );
  }

  async function changeStatus(staffId: string, status: "active" | "suspended" | "revoked") {
    setBusy(staffId);
    setError(null);
    try {
      await setPlatformStaffStatus({ data: { staffId, status } });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status change failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="sherivs-console-card" data-testid="console-team">
      <h1>Team Directory</h1>
      <p>
        Active internal staff: {overview.activeStaff ?? "unavailable"}. Pending invitations:{" "}
        {overview.pendingInvitations ?? "unavailable"}. {overview.usageDefinition}
      </p>
      {error ? <p className="sherivs-console-error">{error}</p> : null}
      <div style={{ overflowX: "auto" }}>
        <table className="sherivs-console-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {overview.staff.map((row) => (
              <StaffRow
                key={row.id}
                row={row}
                busy={busy === row.id}
                canManage={canManage(overview.viewer.capabilities)}
                isOwner={overview.viewer.isSuperAdmin}
                onStatus={changeStatus}
                onReload={reload}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StaffRow({
  row,
  busy,
  canManage: manage,
  isOwner,
  onStatus,
  onReload,
}: {
  row: ConsoleStaffRow;
  busy: boolean;
  canManage: boolean;
  isOwner: boolean;
  onStatus: (id: string, status: "active" | "suspended" | "revoked") => void;
  onReload: () => Promise<void>;
}) {
  const [roles, setRoles] = useState(row.roles);
  const [savingRoles, setSavingRoles] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  useEffect(() => {
    setRoles(row.roles);
  }, [row.id, row.roles]);
  const roleOptions = PLATFORM_ROLE_CODES.filter(
    (role) => isOwner || !PRIVILEGED_PLATFORM_ROLES.has(role),
  );
  const dirty = [...roles].sort().join(",") !== [...row.roles].sort().join(",");

  async function saveRoles() {
    if (!roles.length) {
      setRoleError("Assign at least one role.");
      return;
    }
    setSavingRoles(true);
    setRoleError(null);
    try {
      await setPlatformStaffRoles({
        data: { staffId: row.id, roles: roles as (typeof PLATFORM_ROLE_CODES)[number][] },
      });
      await onReload();
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : "Role update failed");
    } finally {
      setSavingRoles(false);
    }
  }

  return (
    <tr>
      <td>
        {row.fullName}
        {row.department ? <small> · {row.department}</small> : null}
      </td>
      <td>{row.email}</td>
      <td>
        {manage ? (
          <div>
            <div className="sherivs-console-roles">
              {roleOptions.map((role) => (
                <label key={role}>
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() =>
                      setRoles((current) =>
                        current.includes(role)
                          ? current.filter((item) => item !== role)
                          : [...current, role],
                      )
                    }
                    aria-label={`${PLATFORM_ROLE_LABELS[role]} for ${row.fullName}`}
                  />
                  {PLATFORM_ROLE_LABELS[role]}
                </label>
              ))}
            </div>
            {roleError ? <p className="sherivs-console-error">{roleError}</p> : null}
            <button
              type="button"
              className="sherivs-console-btn secondary"
              disabled={!dirty || savingRoles || busy}
              onClick={() => void saveRoles()}
            >
              {savingRoles ? "Saving…" : "Save roles"}
            </button>
          </div>
        ) : (
          row.roles
            .map((role) => PLATFORM_ROLE_LABELS[role as keyof typeof PLATFORM_ROLE_LABELS] ?? role)
            .join(", ")
        )}
      </td>
      <td>{row.status}</td>
      <td>
        {manage && row.status === "invited" ? (
          <button
            type="button"
            className="sherivs-console-btn secondary"
            disabled={busy}
            onClick={() => void resendPlatformStaffInvite({ data: { staffId: row.id } })}
          >
            Resend
          </button>
        ) : null}
        {manage && row.status === "active" ? (
          <button
            type="button"
            className="sherivs-console-btn secondary"
            disabled={busy}
            onClick={() => onStatus(row.id, "suspended")}
          >
            Suspend
          </button>
        ) : null}
        {manage && row.status === "suspended" ? (
          <button
            type="button"
            className="sherivs-console-btn secondary"
            disabled={busy}
            onClick={() => onStatus(row.id, "active")}
          >
            Restore
          </button>
        ) : null}
        {isOwner && row.status !== "revoked" ? (
          <button
            type="button"
            className="sherivs-console-btn secondary"
            disabled={busy}
            onClick={() => onStatus(row.id, "revoked")}
          >
            Revoke
          </button>
        ) : null}
      </td>
    </tr>
  );
}

export function ConsoleInvitations() {
  const { overview, reload } = useConsole();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [roles, setRoles] = useState<string[]>(["operations"]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const manage = overview ? canManage(overview.viewer.capabilities) : false;
  const pending = overview?.staff.filter((row) => row.status === "invited") ?? [];

  async function invite(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await invitePlatformStaff({
        data: {
          email,
          fullName,
          department: department || undefined,
          roles: roles as (typeof PLATFORM_ROLE_CODES)[number][],
        },
      });
      setEmail("");
      setFullName("");
      setInfo(
        "Invitation created. Delivery follows the configured auth provider; this page does not mark it delivered.",
      );
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  }

  const roleOptions = PLATFORM_ROLE_CODES.filter(
    (role) => overview?.viewer.isSuperAdmin || !PRIVILEGED_PLATFORM_ROLES.has(role),
  );

  return (
    <section className="sherivs-console-card">
      <h1>Invitations</h1>
      <p>
        An invitation is not access. Membership activates only after the invitee accepts and the
        staff row is active.
      </p>
      {manage ? (
        <form
          className="sherivs-console-form"
          onSubmit={(event) => void invite(event)}
          style={{ marginTop: "1rem" }}
        >
          <label>
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              minLength={2}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Department
            <input value={department} onChange={(event) => setDepartment(event.target.value)} />
          </label>
          <div>
            <span>Roles</span>
            <div className="sherivs-console-roles">
              {roleOptions.map((role) => (
                <label key={role}>
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() =>
                      setRoles((current) =>
                        current.includes(role)
                          ? current.filter((item) => item !== role)
                          : [...current, role],
                      )
                    }
                  />
                  {PLATFORM_ROLE_LABELS[role]}
                </label>
              ))}
            </div>
          </div>
          {error ? <p className="sherivs-console-error">{error}</p> : null}
          {info ? <p>{info}</p> : null}
          <button
            type="submit"
            className="sherivs-console-btn"
            disabled={busy || roles.length === 0}
          >
            {busy ? "Sending…" : "Create invitation"}
          </button>
        </form>
      ) : (
        <p className="sherivs-console-empty">
          You can view invitations you are authorized to see. Creating invitations requires
          staff.manage.
        </p>
      )}
      <h2 style={{ marginTop: "1.4rem" }}>Pending</h2>
      {pending.length ? (
        <div className="sherivs-console-list">
          {pending.map((row) => (
            <div key={row.id} className="sherivs-console-row">
              <strong>{row.fullName}</strong>
              <small>
                {row.email} · invited{" "}
                {row.invitedAt ? new Date(row.invitedAt).toLocaleString() : "at unknown time"}
              </small>
            </div>
          ))}
        </div>
      ) : (
        <p className="sherivs-console-empty">No pending invitations in the authorized directory.</p>
      )}
    </section>
  );
}

export function ConsoleAccessReview() {
  const { overview } = useConsole();
  const [data, setData] = useState<Awaited<ReturnType<typeof getAccessReview>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!overview?.viewer.capabilities.includes("platform.audit.read")) return;
    void getAccessReview()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Access review unavailable"));
  }, [overview]);

  if (!overview?.viewer.capabilities.includes("platform.audit.read")) {
    return (
      <section className="sherivs-console-card">
        <h1>Access Review</h1>
        <p>Access review requires the audit capability.</p>
      </section>
    );
  }

  return (
    <section className="sherivs-console-card">
      <h1>Access Review</h1>
      <p>Privileged identities, active support grants, and recent administrative events.</p>
      {error ? <p className="sherivs-console-error">{error}</p> : null}
      {!data ? <p>Loading authorized review…</p> : null}
      {data ? (
        <>
          <h2>Super admins</h2>
          <div className="sherivs-console-list">
            {data.superAdmins.map((row) => (
              <div key={row.id} className="sherivs-console-row">
                <strong>{row.full_name || row.email}</strong>
                <small>{row.email}</small>
              </div>
            ))}
          </div>
          <h2 style={{ marginTop: "1rem" }}>Active support grants</h2>
          {data.activeGrants.length ? (
            <div className="sherivs-console-list">
              {data.activeGrants.map((row) => (
                <div key={row.id} className="sherivs-console-row">
                  <strong>{row.staff_id}</strong>
                  <small>
                    Tenant {row.tenant_id} · expires {row.expires_at}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="sherivs-console-empty">No active support grants.</p>
          )}
          <h2 style={{ marginTop: "1rem" }}>Security alerts</h2>
          <p>
            {data.alertsAvailable
              ? `${data.alerts.length} alert${data.alerts.length === 1 ? "" : "s"} in the last 24 hours.`
              : "Alert scan is not available in this environment."}
          </p>
        </>
      ) : null}
    </section>
  );
}

export function ConsoleWorkspaces() {
  const { overview } = useConsole();
  if (!overview) return <section className="sherivs-console-card">Loading workspaces…</section>;
  return (
    <section className="sherivs-console-card">
      <h1>Workspaces</h1>
      <p>
        V1 shared workspaces are the staff role teams. Arbitrary named workspaces are postponed so
        this directory stays backed by real membership data.
      </p>
      <div className="sherivs-console-list">
        {overview.workspaces.map((workspace) => (
          <Link key={workspace.id} to={workspace.href as never} className="sherivs-console-row">
            <strong>{workspace.name}</strong>
            <small>
              {workspace.type} · {workspace.access} · {workspace.team}
            </small>
            <small>{workspace.description}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ConsoleWorkspaceDetail() {
  const params = useParams({ strict: false }) as { workspaceId?: string };
  const { overview } = useConsole();
  if (!overview) return <section className="sherivs-console-card">Loading workspace…</section>;
  const workspace = workspaceById(params.workspaceId ?? "me", {
    displayName: overview.viewer.name,
    isSuperAdmin: overview.viewer.isSuperAdmin,
    roles: overview.viewer.roles,
  });
  if (!workspace) {
    return (
      <section className="sherivs-console-card">
        <h1>Workspace unavailable</h1>
        <p>This workspace is not in your authorized set.</p>
      </section>
    );
  }
  const members =
    workspace.type === "personal"
      ? [{ name: overview.viewer.name, access: "owner" }]
      : overview.staff
          .filter((row) => row.roles.some((role) => workspace.id === `role:${role}`))
          .map((row) => ({ name: row.fullName, access: "member" }));
  return (
    <section className="sherivs-console-card">
      <h1>{workspace.name}</h1>
      <p>{workspace.description}</p>
      <p>
        Type: {workspace.type}. Access: {workspace.access}. Team: {workspace.team}.
      </p>
      <h2 style={{ marginTop: "1rem" }}>Members</h2>
      {members.length ? (
        <div className="sherivs-console-list">
          {members.map((member) => (
            <div key={member.name} className="sherivs-console-row">
              <strong>{member.name}</strong>
              <small>{member.access}</small>
            </div>
          ))}
        </div>
      ) : (
        <p className="sherivs-console-empty">
          Member names appear when you are authorized to read the staff directory.
        </p>
      )}
    </section>
  );
}

export function ConsoleRuntimes() {
  return (
    <section className="sherivs-console-card">
      <h1>Runtime directory</h1>
      <p>
        Only registered, existing runtimes appear here. Future products are not listed as
        operational.
      </p>
      <div className="sherivs-console-list">
        {REGISTERED_RUNTIMES.map((runtime) => (
          <Link
            key={runtime.id}
            to={CONSOLE_PATHS.scholar as never}
            className="sherivs-console-row"
          >
            <strong>{runtime.name}</strong>
            <small>
              {runtime.id} · {runtime.status.replace("_", " ")}
            </small>
            <small>{runtime.description}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ConsoleScholarRuntime() {
  const { overview } = useConsole();
  const scholar = overview?.health.cards.find((card) => card.key === "scholar");
  return (
    <section className="sherivs-console-card">
      <h1>{SCHOLAR_RUNTIME_CONTRACT.name}</h1>
      <p>{SCHOLAR_RUNTIME_CONTRACT.description}</p>
      <p>
        Status: {scholar ? CONSOLE_HEALTH_LABELS[scholar.status] : "Unknown"}. {scholar?.detail}
      </p>
      <div className="sherivs-console-actions" style={{ marginTop: "1rem" }}>
        <a className="sherivs-console-btn" href={SCHOLAR_ENTRY_URL} rel="noreferrer">
          Launch Sherivs Scholar
        </a>
      </div>
      <p style={{ marginTop: "1rem" }}>
        Launch opens the Scholar application host. Platform staff without a school membership will
        not receive a school dashboard, by design.
      </p>
    </section>
  );
}

function AuditList({ scope }: { scope: "all" | "admin" | "security" }) {
  const [events, setEvents] = useState<ConsoleActivityItem[] | null>(null);
  const [source, setSource] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void listConsoleAudit({ data: { scope, limit: 80 } })
      .then((result) => {
        setEvents(result.events);
        setSource(result.source);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Audit records unavailable"));
  }, [scope]);
  if (error) return <p className="sherivs-console-error">{error}</p>;
  if (!events) return <p>Loading authorized records…</p>;
  if (!events.length) return <p className="sherivs-console-empty">No matching audit records.</p>;
  return (
    <>
      <p>Source: {source}. These are audit records, not application logs.</p>
      <div className="sherivs-console-list">
        {events.map((event) => (
          <div key={event.id} className="sherivs-console-row">
            <strong>{event.description}</strong>
            <small>
              {event.action} · {event.outcome} · {event.actor ?? "unknown actor"} ·{" "}
              {new Date(event.at).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </>
  );
}

export function ConsoleActivity({ scope = "all" }: { scope?: "all" | "admin" | "security" }) {
  const { overview } = useConsole();
  const allowed = overview?.viewer.capabilities.includes("platform.audit.read");
  const title =
    scope === "security"
      ? "Security events"
      : scope === "admin"
        ? "Administrative events"
        : "Activity overview";
  return (
    <section className="sherivs-console-card">
      <h1>{title}</h1>
      <p>
        Audit records answer who performed an important action. They are not request logs, metrics,
        or a security operations centre.
      </p>
      {allowed ? <AuditList scope={scope} /> : <p>Audit records require the audit capability.</p>}
    </section>
  );
}

export function ConsoleLogs() {
  return (
    <section className="sherivs-console-card">
      <h1>Logs</h1>
      <p>
        This application does not store a queryable log index. Request logs belong in the configured
        observability provider. The process health report is available at <code>/health.json</code>.
      </p>
      <p className="sherivs-console-empty">
        A proprietary log-storage platform is a V1 exclusion. This page does not invent log rows.
      </p>
    </section>
  );
}

export function ConsoleMetrics() {
  const { overview } = useConsole();
  return (
    <section className="sherivs-console-card">
      <h1>Metrics</h1>
      <p>Measured values include a definition, window, source, and last-updated time.</p>
      <div className="sherivs-console-grid" style={{ marginTop: "0.9rem" }}>
        {(overview?.metrics ?? []).map((metric) => (
          <div key={metric.key} className="sherivs-console-row">
            <strong>{metric.name}</strong>
            <p>{metric.available ? `${metric.value} ${metric.unit}` : "Unavailable"}</p>
            <small>
              {metric.window} · {metric.source}
            </small>
            <small>{metric.definition}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ConsoleAccount() {
  const app = useApp();
  const { overview } = useConsole();
  return (
    <section className="sherivs-console-card">
      <h1>Account & Preferences</h1>
      <p>
        {overview?.viewer.name} · {overview?.viewer.email} · {overview?.viewer.presentationLabel}
      </p>
      <p>Roles: {overview?.viewer.roles.join(", ") || "none assigned beyond owner status"}.</p>
      <div className="sherivs-console-actions" style={{ marginTop: "1rem" }}>
        <button
          type="button"
          className="sherivs-console-btn secondary"
          onClick={() => void app.signOut()}
        >
          Sign out
        </button>
      </div>
      <p className="sherivs-console-empty" style={{ marginTop: "1rem" }}>
        Notification and workspace preferences appear here only when the supporting controls exist.
        Profile fields other than the authenticated identity are not editable from this page.
      </p>
    </section>
  );
}

export function ConsoleSettings() {
  const { overview } = useConsole();
  return (
    <section className="sherivs-console-card">
      <h1>Platform settings</h1>
      <p>Sherivs Internal. This is not a tenant and not a school.</p>
      <div className="sherivs-console-list">
        <div className="sherivs-console-row">
          <strong>Environment</strong>
          <small>
            {overview?.context.environment} · source {overview?.context.environmentSource}
          </small>
        </div>
        <div className="sherivs-console-row">
          <strong>Application version</strong>
          <small>{overview?.context.version ?? "Not reported by the health snapshot"}</small>
        </div>
        <div className="sherivs-console-row">
          <strong>Host</strong>
          <small>{overview?.context.host ?? "Unknown"}</small>
        </div>
      </div>
    </section>
  );
}

export function ConsoleHelp() {
  return (
    <section className="sherivs-console-card">
      <h1>Help & Support</h1>
      <div className="sherivs-console-list">
        {CONSOLE_HELP_ARTICLES.map((article) => (
          <Link key={article.id} to={article.href as never} className="sherivs-console-row">
            <strong>{article.title}</strong>
            <small>{article.description}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
