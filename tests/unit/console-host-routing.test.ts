import { describe, expect, it } from "vitest";
import {
  decideHostRoute,
  effectiveExperienceHostKind,
  isConsoleOperator,
  isConsolePath,
  isConsoleSurfacePath,
  parseHostKindOverride,
  postLoginDestination,
} from "@/lib/experience/console-host-routing";

const operator = { signedIn: true, isConsoleOperator: true };

describe("console host routing", () => {
  it("classifies console hosts and ignores the override on production hosts", () => {
    expect(effectiveExperienceHostKind("console.sherivs.com")).toBe("internal");
    expect(effectiveExperienceHostKind("internal.sherivs.com")).toBe("internal");
    expect(effectiveExperienceHostKind("app.sherivs.com", "internal")).toBe("app");
    expect(effectiveExperienceHostKind("console.sherivs.com", "app")).toBe("internal");
    expect(effectiveExperienceHostKind("www.sherivs.com", "internal")).toBe("public_platform");
  });

  it("honours the override only on local and preview hosts", () => {
    expect(effectiveExperienceHostKind("localhost", "internal")).toBe("internal");
    expect(effectiveExperienceHostKind("x-git-y.vercel.app", "app")).toBe("app");
    expect(effectiveExperienceHostKind("localhost", "bogus")).toBe("local");
    expect(effectiveExperienceHostKind("localhost", undefined)).toBe("local");
    expect(parseHostKindOverride(" INTERNAL ")).toBe("internal");
    expect(parseHostKindOverride("")).toBeNull();
  });

  it("matches console paths exactly", () => {
    for (const p of ["/internal", "/internal/", "/internal/support", "/internal_/access-review"])
      expect(isConsolePath(p)).toBe(true);
    for (const p of ["/", "/internals", "/admin", "/super-admin/staff"])
      expect(isConsolePath(p)).toBe(false);
  });

  it("keeps console-linked surfaces on the console host", () => {
    for (const p of ["/mfa", "/super-admin/staff", "/command-centre", "/platform/org", "/runtime"])
      expect(isConsoleSurfacePath(p)).toBe(true);
    for (const p of ["/admin", "/teacher/lesson-plans", "/welcome", "/mfa-x"])
      expect(isConsoleSurfacePath(p)).toBe(false);
    expect(decideHostRoute({ hostKind: "internal", pathname: "/mfa", ...operator }).kind).toBe(
      "allow",
    );
    expect(
      decideHostRoute({ hostKind: "app", pathname: "/super-admin/tenants", ...operator }).kind,
    ).toBe("allow");
  });

  it("on the console host sends operators to /internal and blocks non-staff", () => {
    expect(decideHostRoute({ hostKind: "internal", pathname: "/admin", ...operator })).toEqual({
      kind: "redirect",
      to: "/internal",
    });
    expect(
      decideHostRoute({ hostKind: "internal", pathname: "/internal/support", ...operator }),
    ).toEqual({ kind: "allow" });
    expect(
      decideHostRoute({
        hostKind: "internal",
        pathname: "/internal",
        signedIn: true,
        isConsoleOperator: false,
      }),
    ).toEqual({ kind: "not_authorised" });
    expect(
      decideHostRoute({
        hostKind: "internal",
        pathname: "/x",
        signedIn: false,
        isConsoleOperator: false,
      }),
    ).toEqual({ kind: "redirect", to: "/auth" });
  });

  it("does not serve /internal on app, public or tenant hosts", () => {
    for (const hostKind of ["app", "public_platform", "tenant"] as const) {
      expect(decideHostRoute({ hostKind, pathname: "/internal", ...operator }).kind).toBe(
        "console_elsewhere",
      );
      expect(decideHostRoute({ hostKind, pathname: "/admin", ...operator }).kind).toBe("allow");
    }
    expect(decideHostRoute({ hostKind: "local", pathname: "/internal", ...operator }).kind).toBe(
      "allow",
    );
  });

  it("routes post-login by host", () => {
    expect(postLoginDestination("internal", "/admin")).toBe("/internal");
    expect(postLoginDestination("app", "/internal")).toBe("/");
    expect(postLoginDestination("app", "/admin")).toBe("/admin");
    expect(postLoginDestination("local", "/internal")).toBe("/internal");
  });

  it("treats super admins and platform staff as operators", () => {
    expect(isConsoleOperator({ superAdmin: { id: "a" } })).toBe(true);
    expect(isConsoleOperator({ platformStaff: { id: "b" } })).toBe(true);
    expect(isConsoleOperator({ superAdmin: null, platformStaff: null })).toBe(false);
  });
});
