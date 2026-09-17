import { createFileRoute } from "@tanstack/react-router";

import { PortalPage } from "@/components/portal-shell";
import { projectWorkspaces } from "@/lib/workspace-projection";
import type { AppRole } from "@/lib/roles";

/**
 * Phase 06 — Workspace Engine: the composition surface.
 *
 * "The workspace is a projection of authority." This page computes that
 * projection with the real engine for every platform role — the navigation each
 * role actually receives, the capability count behind it, its home and quick nav,
 * and which roles resolve to nothing. An empty workspace is shown as empty.
 */
export const Route = createFileRoute("/_authenticated/super-admin/workspace-projection")({
  component: WorkspaceProjectionPage,
  head: () => ({ meta: [{ title: "Workspace projection — CoreGrid" }] }),
});

const ROLES: readonly AppRole[] = ["super_admin", "hq", "admin", "teacher", "student", "parent"];

function WorkspaceProjectionPage() {
  const projections = projectWorkspaces(ROLES);

  return (
    <PortalPage
      title="Workspace projection"
      subtitle="What each role actually receives, resolved by the workspace engine from its authorized capabilities."
    >
      <section className="uos-card p-6">
        <h2 className="font-display text-lg font-bold">Composition by role</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Navigation items are withheld when their required capabilities are absent — this table is
          derived from authorization, never from the UI.
        </p>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2">Role</th>
              <th className="py-2">Capabilities</th>
              <th className="py-2">Sections</th>
              <th className="py-2">Items</th>
              <th className="py-2">Home</th>
              <th className="py-2">Quick nav</th>
            </tr>
          </thead>
          <tbody>
            {projections.map((projection) => (
              <tr key={projection.role} className="border-t border-border">
                <td className="py-2 font-mono text-xs">{projection.role}</td>
                <td className="py-2">{projection.capabilityCount}</td>
                <td className="py-2">{projection.sectionCount}</td>
                <td className="py-2">{projection.itemCount}</td>
                <td className="py-2 font-mono text-xs">{projection.home ?? "—"}</td>
                <td className="py-2 text-xs text-muted-foreground">
                  {projection.quickNavKeys.join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projections.some((projection) => projection.empty) && (
          <p className="mt-4 text-xs text-muted-foreground">
            Roles with no destinations:{" "}
            {projections
              .filter((projection) => projection.empty)
              .map((projection) => projection.role)
              .join(", ")}
            . They resolve to an empty workspace rather than a default page.
          </p>
        )}
      </section>

      <section className="uos-card mt-6 p-6">
        <h2 className="font-display text-lg font-bold">Resolved navigation</h2>
        <div className="mt-4 space-y-4">
          {projections.map((projection) => (
            <div key={projection.role}>
              <h3 className="text-sm font-semibold">
                {projection.label} <span className="font-mono text-xs">({projection.role})</span>
              </h3>
              {projection.sections.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">No navigation authorized.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  {projection.sections.map((section) => (
                    <li key={section.key}>
                      <span className="font-mono">{section.key}</span>:{" "}
                      {section.items.map((item) => item.key).join(", ")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </PortalPage>
  );
}
