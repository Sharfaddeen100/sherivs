/**
 * Console host routing (console.sherivs.com).
 *
 * Routing only, never authorization: every console surface keeps its own
 * role / capability / MFA guards. This module decides WHERE a signed-in user
 * may be on a given host:
 *   - console host: only console surfaces render (/internal*, /mfa, super-admin
 *     governance, control centre); anything else goes to /internal.
 *     Users who are not console operators see a "not authorised" screen.
 *   - app / public / tenant hosts: /internal* is not served (the console
 *     lives on its own subdomain).
 *   - local / preview hosts: unrestricted, unless VITE_SHERIVS_HOST_KIND_OVERRIDE
 *     simulates another host kind (honoured ONLY on local / preview hosts).
 */
import {
  CANONICAL_CONSOLE_HOST,
  EXPERIENCE_HOST_KINDS,
  resolveExperienceHost,
  type ExperienceHostKind,
} from "./experience-host";

export const CONSOLE_HOME_PATH = "/internal";
export const CONSOLE_ORIGIN = `https://${CANONICAL_CONSOLE_HOST}`;

export function parseHostKindOverride(value: string | null | undefined): ExperienceHostKind | null {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return null;
  return (EXPERIENCE_HOST_KINDS as readonly string[]).includes(v)
    ? (v as ExperienceHostKind)
    : null;
}

/** Host kind after applying the local/preview-only override. */
export function effectiveExperienceHostKind(
  hostname: string,
  override?: string | null,
): ExperienceHostKind {
  const real = resolveExperienceHost(hostname);
  if (real !== "local") return real; // production hosts can never be overridden
  return parseHostKindOverride(override) ?? real;
}

export function currentEffectiveHostKind(): ExperienceHostKind {
  if (typeof window === "undefined") return "local";
  const override = (import.meta.env?.VITE_SHERIVS_HOST_KIND_OVERRIDE as string | undefined) ?? null;
  return effectiveExperienceHostKind(window.location.hostname, override);
}

export function isConsolePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (
    p === CONSOLE_HOME_PATH ||
    p.startsWith(`${CONSOLE_HOME_PATH}/`) ||
    p.startsWith(`${CONSOLE_HOME_PATH}_`)
  );
}

/**
 * Surfaces the console host may render: the /internal workspace plus the
 * internal pages it links to (MFA step-up, super-admin governance, control
 * centre, platform registries). Each keeps its own guard.
 */
export const CONSOLE_SURFACE_PREFIXES = [
  CONSOLE_HOME_PATH,
  "/mfa",
  "/super-admin",
  "/command-centre",
  "/platform",
  "/reality",
  "/runtime",
] as const;

export function isConsoleSurfacePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (isConsolePath(p)) return true;
  return CONSOLE_SURFACE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/** Internal workforce: super admins, plus active platform staff once that exists. */
export function isConsoleOperator(state: {
  superAdmin?: unknown;
  platformStaff?: unknown;
}): boolean {
  return Boolean(state.superAdmin) || Boolean(state.platformStaff);
}

export type HostRouteDecision =
  | { kind: "allow" }
  | { kind: "redirect"; to: string }
  | { kind: "not_authorised" }
  | { kind: "console_elsewhere" };

export function decideHostRoute(input: {
  hostKind: ExperienceHostKind;
  pathname: string;
  signedIn: boolean;
  isConsoleOperator: boolean;
}): HostRouteDecision {
  const { hostKind, pathname, signedIn } = input;
  if (hostKind === "local") return { kind: "allow" };
  if (hostKind === "internal") {
    if (!signedIn) return { kind: "redirect", to: "/auth" };
    if (!input.isConsoleOperator) return { kind: "not_authorised" };
    if (!isConsoleSurfacePath(pathname)) return { kind: "redirect", to: CONSOLE_HOME_PATH };
    return { kind: "allow" };
  }
  if (isConsolePath(pathname)) return { kind: "console_elsewhere" };
  return { kind: "allow" };
}
