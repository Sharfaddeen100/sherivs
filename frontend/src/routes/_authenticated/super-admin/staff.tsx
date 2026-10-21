import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  invitePlatformStaff,
  listPlatformStaff,
  resendPlatformStaffInvite,
  setPlatformStaffRoles,
  setPlatformStaffStatus,
} from "@/lib/platform-staff/staff.functions";
import {
  PLATFORM_ROLE_CODES,
  PLATFORM_ROLE_LABELS,
  canTransition,
  type PlatformRoleCode,
  type PlatformStaffStatus,
} from "@/lib/platform-staff/catalogue";

/**
 * Sherivs internal console — Staff (SHERIVS-008). Super admin only (the
 * parent /super-admin route guard + every server function re-checks).
 */
export const Route = createFileRoute("/_authenticated/super-admin/staff")({
  ssr: false,
  component: StaffPage,
});

type StaffRow = Awaited<ReturnType<typeof listPlatformStaff>>[number];

function StaffPage() {
  const list = useServerFn(listPlatformStaff);
  const invite = useServerFn(invitePlatformStaff);
  const resend = useServerFn(resendPlatformStaffInvite);
  const setStatus = useServerFn(setPlatformStaffStatus);
  const setRoles = useServerFn(setPlatformStaffRoles);

  const [rows, setRows] = useState<StaffRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [roles, setRolesInput] = useState<PlatformRoleCode[]>(["support"]);

  const reload = useCallback(async () => {
    try {
      setRows(await list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load staff");
    }
  }, [list]);
  useEffect(() => {
    void reload();
  }, [reload]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
      setInfo(ok);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold">Staff</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal Sherivs staff. Invites send a set-password email; every change is audited.
        </p>
      </header>

      <form
        className="uos-card p-5 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () =>
              invite({
                data: { email, fullName, department: department || undefined, roles },
              }),
            `Invite sent to ${email}.`,
          ).then(() => {
            setEmail("");
            setFullName("");
            setDepartment("");
          });
        }}
      >
        <h2 className="sm:col-span-2 font-display font-semibold">Invite staff member</h2>
        <input
          required
          type="email"
          placeholder="Email"
          className="uos-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          placeholder="Full name"
          className="uos-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          placeholder="Department (optional)"
          className="uos-input"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
        <RolePicker value={roles} onChange={setRolesInput} />
        <button
          type="submit"
          disabled={busy || roles.length === 0}
          className="sm:col-span-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Working…" : "Send invite"}
        </button>
      </form>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">{info}</div>
      )}

      <div className="uos-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Roles</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  No staff yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="p-3">
                  {r.fullName}
                  {r.department ? (
                    <div className="text-xs text-muted-foreground">{r.department}</div>
                  ) : null}
                </td>
                <td className="p-3">{r.email}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  {r.status === "revoked" ? (
                    "—"
                  ) : (
                    <RolePicker
                      value={r.roles.filter((x): x is PlatformRoleCode =>
                        (PLATFORM_ROLE_CODES as readonly string[]).includes(x),
                      )}
                      onChange={(next) =>
                        void run(
                          () => setRoles({ data: { staffId: r.id, roles: next } }),
                          "Roles updated.",
                        )
                      }
                      disabled={busy}
                    />
                  )}
                </td>
                <td className="p-3 space-x-2 whitespace-nowrap">
                  {r.status === "invited" && (
                    <ActionButton
                      disabled={busy}
                      onClick={() =>
                        run(() => resend({ data: { staffId: r.id } }), "Invite re-sent.")
                      }
                    >
                      Resend
                    </ActionButton>
                  )}
                  {(["active", "suspended", "revoked"] as const)
                    .filter((to) => canTransition(r.status as PlatformStaffStatus, to))
                    .map((to) => (
                      <ActionButton
                        key={to}
                        disabled={busy}
                        onClick={() => {
                          if (to === "revoked" && !window.confirm(`Revoke ${r.email}?`)) return;
                          void run(
                            () => setStatus({ data: { staffId: r.id, status: to } }),
                            `Status set to ${to}.`,
                          );
                        }}
                      >
                        {to === "active" ? "Reactivate" : to === "suspended" ? "Suspend" : "Revoke"}
                      </ActionButton>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RolePicker({
  value,
  onChange,
  disabled,
}: {
  value: PlatformRoleCode[];
  onChange: (next: PlatformRoleCode[]) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="flex flex-wrap gap-2" disabled={disabled}>
      {PLATFORM_ROLE_CODES.map((code) => (
        <label key={code} className="inline-flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={value.includes(code)}
            onChange={(e) =>
              onChange(e.target.checked ? [...value, code] : value.filter((c) => c !== code))
            }
          />
          {PLATFORM_ROLE_LABELS[code]}
        </label>
      ))}
    </fieldset>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => unknown;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onClick()}
      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted/40 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
