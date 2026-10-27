/**
 * V1 internal workspaces.
 *
 * Personal workspace: implicit working environment for each staff member.
 * Shared workspaces: one team workspace per platform role the viewer holds
 * (Engineering, Operations, Support, …). Arbitrary named workspaces are
 * postponed — a decorative create-workspace form would have no backend.
 */
import { PLATFORM_ROLE_LABELS, isPlatformRoleCode } from "@/lib/platform-staff/catalogue";
import { CONSOLE_PATHS } from "./paths";

export type InternalWorkspaceType = "personal" | "shared";
export type InternalWorkspaceAccess = "owner" | "member";

export interface InternalWorkspace {
  id: string;
  name: string;
  description: string;
  type: InternalWorkspaceType;
  access: InternalWorkspaceAccess;
  team: string;
  href: string;
}

export const PERSONAL_WORKSPACE_ID = "me";

export function personalWorkspace(displayName: string): InternalWorkspace {
  return {
    id: PERSONAL_WORKSPACE_ID,
    name: "My Workspace",
    description: `${displayName}'s personal working environment. Private by default.`,
    type: "personal",
    access: "owner",
    team: displayName,
    href: CONSOLE_PATHS.myWorkspace,
  };
}

export function sharedWorkspaceForRole(role: string): InternalWorkspace | null {
  if (!isPlatformRoleCode(role)) return null;
  const name = PLATFORM_ROLE_LABELS[role];
  return {
    id: `role:${role}`,
    name: `${name} Workspace`,
    description: `Shared workspace for the ${name} team. Membership follows the assigned platform role.`,
    type: "shared",
    access: "member",
    team: name,
    href: CONSOLE_PATHS.workspace(`role:${role}`),
  };
}

export function workspacesForViewer(input: {
  displayName: string;
  isSuperAdmin: boolean;
  roles: readonly string[];
}): InternalWorkspace[] {
  const personal = personalWorkspace(input.displayName);
  const shared = input.isSuperAdmin
    ? Object.keys(PLATFORM_ROLE_LABELS)
        .map((role) => sharedWorkspaceForRole(role))
        .filter((row): row is InternalWorkspace => row !== null)
    : input.roles
        .map((role) => sharedWorkspaceForRole(role))
        .filter((row): row is InternalWorkspace => row !== null);
  const seen = new Set<string>();
  return [personal, ...shared].filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

export function parseWorkspaceId(raw: string): { kind: "personal" } | { kind: "role"; role: string } | null {
  if (raw === PERSONAL_WORKSPACE_ID) return { kind: "personal" };
  if (raw.startsWith("role:")) {
    const role = raw.slice("role:".length);
    if (!isPlatformRoleCode(role)) return null;
    return { kind: "role", role };
  }
  return null;
}

export function workspaceById(
  id: string,
  viewer: { displayName: string; isSuperAdmin: boolean; roles: readonly string[] },
): InternalWorkspace | null {
  const parsed = parseWorkspaceId(id);
  if (!parsed) return null;
  if (parsed.kind === "personal") return personalWorkspace(viewer.displayName);
  const ws = sharedWorkspaceForRole(parsed.role);
  if (!ws) return null;
  if (viewer.isSuperAdmin || viewer.roles.includes(parsed.role)) return ws;
  return null;
}

/** Active workspace from the console path, if the path names one. */
export function workspaceIdFromPath(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === CONSOLE_PATHS.myWorkspace) return PERSONAL_WORKSPACE_ID;
  const prefix = `${CONSOLE_PATHS.workspaces}/`;
  if (!path.startsWith(prefix)) return null;
  const id = decodeURIComponent(path.slice(prefix.length).split("/")[0] ?? "");
  return parseWorkspaceId(id) ? id : null;
}
