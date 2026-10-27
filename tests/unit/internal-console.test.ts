import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import {
  presentationRoleFor,
  quickActionsFor,
  filterNav,
  CONSOLE_NAV,
  viewerCapabilities,
} from "@/lib/internal-console/roles";
import {
  workspacesForViewer,
  workspaceById,
  workspaceIdFromPath,
} from "@/lib/internal-console/workspaces";
import { searchConsole } from "@/lib/internal-console/search";
import { mapProcessHealth, overallFromCards } from "@/lib/internal-console/status";
import {
  REGISTERED_RUNTIMES,
  SCHOLAR_RUNTIME_CONTRACT,
} from "@/lib/internal-console/runtime-contract";
import { CONSOLE_PATHS } from "@/lib/internal-console/paths";
import {
  decideHostRoute,
  isConsolePath,
  isConsoleSurfacePath,
  isPublicConsolePath,
} from "@/lib/experience/console-host-routing";
import { SHERIVS_INTERNAL_HOME } from "@/lib/identity/identity";
import { isRetiredApplicationHostname } from "@/lib/experience/retired-application-host";

const operator = { signedIn: true, isConsoleOperator: true };

describe("internal console V1 contract", () => {
  it("routes internal workforce to /console, not the retired /internal shell", () => {
    expect(SHERIVS_INTERNAL_HOME).toBe("/console");
    expect(CONSOLE_PATHS.home).toBe("/console");
    expect(existsSync("frontend/src/routes/_authenticated/internal.tsx")).toBe(false);
    expect(existsSync("frontend/src/routes/console/route.tsx")).toBe(true);
    expect(existsSync("frontend/src/routes/console/index.tsx")).toBe(true);
  });

  it("un-retires the canonical console host and keeps gov/head/group retired", () => {
    expect(isRetiredApplicationHostname("console.sherivs.com")).toBe(false);
    expect(isRetiredApplicationHostname("internal.sherivs.com")).toBe(false);
    expect(isRetiredApplicationHostname("gov.sherivs.com")).toBe(true);
    expect(isRetiredApplicationHostname("head.sherivs.com")).toBe(true);
    expect(isRetiredApplicationHostname("group.sherivs.com")).toBe(true);
    expect(isRetiredApplicationHostname("admin.sherivs.com")).toBe(true);
  });

  it("registers only Sherivs Scholar as an operational runtime", () => {
    expect(REGISTERED_RUNTIMES).toHaveLength(1);
    expect(SCHOLAR_RUNTIME_CONTRACT.status).toBe("operational_product");
    expect(SCHOLAR_RUNTIME_CONTRACT.entryUrl).toContain("app.sherivs.com");
  });

  it("maps platform roles onto V1 presentation roles", () => {
    expect(presentationRoleFor({ isSuperAdmin: true, roles: [] })).toBe("platform_owner");
    expect(presentationRoleFor({ isSuperAdmin: false, roles: ["platform_admin"] })).toBe(
      "platform_administrator",
    );
    expect(presentationRoleFor({ isSuperAdmin: false, roles: ["engineering"] })).toBe("engineer");
    expect(presentationRoleFor({ isSuperAdmin: false, roles: ["support"] })).toBe(
      "support_specialist",
    );
    expect(presentationRoleFor({ isSuperAdmin: false, roles: ["finance"] })).toBe(
      "standard_team_member",
    );
  });

  it("hides unauthorized navigation and quick actions", () => {
    const support = {
      isSuperAdmin: false,
      capabilities: viewerCapabilities(["support"], false),
    };
    expect(filterNav(CONSOLE_NAV, support).map((item) => item.key)).toEqual([
      "home",
      "workspaces",
      "runtimes",
    ]);
    expect(quickActionsFor(support).some((item) => item.key === "invite")).toBe(false);
    expect(
      quickActionsFor({ isSuperAdmin: true, capabilities: new Set() }).some(
        (item) => item.key === "invite",
      ),
    ).toBe(true);
  });

  it("does not list shared workspaces the viewer cannot access", () => {
    const workspaces = workspacesForViewer({
      displayName: "Ada",
      isSuperAdmin: false,
      roles: ["engineering"],
    });
    expect(workspaces.map((row) => row.id)).toEqual(["me", "role:engineering"]);
    expect(
      workspaceById("role:operations", {
        displayName: "Ada",
        isSuperAdmin: false,
        roles: ["engineering"],
      }),
    ).toBeNull();
  });

  it("resolves the active workspace from the console path", () => {
    expect(workspaceIdFromPath("/console/workspaces/me")).toBe("me");
    expect(workspaceIdFromPath("/console/workspaces/role:engineering")).toBe("role:engineering");
    expect(workspaceIdFromPath("/console/workspaces/secret")).toBeNull();
    expect(workspaceIdFromPath("/console")).toBeNull();
  });

  it("keeps search permission-aware", () => {
    const hits = searchConsole({
      query: "secret",
      canReadStaff: false,
      staff: [
        { id: "1", fullName: "Secret Staff", email: "s@x", department: null, status: "active" },
      ],
      workspaces: [],
      runtimes: REGISTERED_RUNTIMES,
      pages: [],
      help: [],
    });
    expect(hits.some((hit) => hit.kind === "staff")).toBe(false);
  });

  it("never treats a missing health signal as operational", () => {
    expect(mapProcessHealth("ok")).toBe("operational");
    expect(mapProcessHealth("failing")).toBe("unavailable");
    expect(mapProcessHealth(undefined)).toBe("unknown");
    expect(overallFromCards(["unknown", "unknown"])).toBe("unknown");
    expect(overallFromCards(["operational", "unknown"])).toBe("degraded");
  });
});

describe("console host routing for /console", () => {
  it("matches console paths and public auth paths", () => {
    expect(isConsolePath("/console")).toBe(true);
    expect(isConsolePath("/console/team")).toBe(true);
    expect(isConsolePath("/internal")).toBe(false);
    expect(isConsoleSurfacePath("/super-admin")).toBe(false);
    expect(isConsoleSurfacePath("/command-centre")).toBe(false);
    expect(isPublicConsolePath("/auth")).toBe(true);
  });

  it("sends operators to /console and blocks non-staff", () => {
    expect(decideHostRoute({ hostKind: "internal", pathname: "/", ...operator })).toEqual({
      kind: "redirect",
      to: "/console",
    });
    expect(
      decideHostRoute({ hostKind: "internal", pathname: "/console/team", ...operator }),
    ).toEqual({ kind: "allow" });
    expect(
      decideHostRoute({
        hostKind: "internal",
        pathname: "/console",
        signedIn: true,
        isConsoleOperator: false,
      }),
    ).toEqual({ kind: "not_authorised" });
    expect(
      decideHostRoute({
        hostKind: "internal",
        pathname: "/auth",
        signedIn: false,
        isConsoleOperator: false,
      }),
    ).toEqual({ kind: "allow" });
  });

  it("does not serve /console on app, public or tenant hosts", () => {
    for (const hostKind of ["app", "public_platform", "tenant"] as const) {
      expect(decideHostRoute({ hostKind, pathname: "/console", ...operator }).kind).toBe(
        "console_elsewhere",
      );
    }
    expect(decideHostRoute({ hostKind: "local", pathname: "/console", ...operator }).kind).toBe(
      "allow",
    );
  });
});

describe("console pages do not restore deleted prototypes", () => {
  it("keeps the sign-in page intact", () => {
    const auth = readFileSync("frontend/src/routes/auth.tsx", "utf8");
    expect(auth).toContain("authPageExperience");
    expect(auth).toContain("app-entry.css");
  });
});
