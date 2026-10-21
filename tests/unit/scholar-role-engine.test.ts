/**
 * Sherivs Scholar — Educational Reality Role Engine: engine laws.
 *
 * These tests lock the architectural promises the directive makes:
 *  - roles are data-driven (feature keys + templates), never `if (role === …)`;
 *  - a role can never invent permission the kernel does not own;
 *  - reality determines the role set, priorities and naming alternatives;
 *  - inheritance can never escalate, borrowing keeps provenance;
 *  - no identity / no tenant / no grant = DENY (fail closed).
 */

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { KERNEL_CAPABILITIES } from "@/lib/kernel/kernel-capability-registry";
import {
  defineRole,
  roleIdFromName,
  validateRoleDefinition,
  type EducationRealityRole,
} from "@/lib/scholar/roles/role-definition";
import {
  roleDisplayName,
  suggestRolesForInstitution,
  workspacesForSuggestions,
} from "@/lib/scholar/roles/role-template-engine";
import { borrowRolesInto } from "@/lib/scholar/roles/role-borrowing-engine";
import {
  effectivePermissionSet,
  resolveInheritance,
  validateRoleHierarchy,
} from "@/lib/scholar/roles/role-inheritance-engine";
import { evaluatePermission } from "@/lib/scholar/roles/role-permission-engine";
import {
  primaryWorkspaceForRoles,
  workspacesForRoles,
} from "@/lib/scholar/roles/role-workspace-engine";
import { resolveRoleContext } from "@/lib/scholar/roles/role-context-engine";
import { roleById } from "@/lib/scholar/roles/role-registry";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ENGINE_DIR = join(ROOT, "frontend/src/lib/scholar/roles");

/** Synthetic roles so engine laws are tested without depending on catalog data. */
const HEAD_ROLE: EducationRealityRole = defineRole({
  name: "Test Head",
  category: "INSTITUTIONAL_LEADERSHIP",
  staffing: { kind: "non_staff", kindCode: null },
  permissions: ["education-reality-ontology", "financial-ledger:read"],
});
const DEPUTY_ROLE: EducationRealityRole = defineRole({
  name: "Test Deputy",
  category: "ACADEMIC",
  staffing: { kind: "non_staff", kindCode: null },
  permissions: ["financial-ledger:read"],
});
const TEACHER_ROLE: EducationRealityRole = defineRole({
  name: "Test Teacher",
  category: "TEACHING",
  staffing: { kind: "non_staff", kindCode: null },
  permissions: ["academic-intelligence"],
});
const SYNTHETIC = [HEAD_ROLE, DEPUTY_ROLE, TEACHER_ROLE];

describe("role definition — id and validation laws", () => {
  it("derives a kebab-case id from the name", () => {
    expect(roleIdFromName("Vice Principal Student Affairs")).toBe(
      "role:vice-principal-student-affairs",
    );
    expect(roleIdFromName("Quran Teacher")).toBe("role:quran-teacher");
  });

  it("applies category-derived defaults", () => {
    const role = defineRole({ name: "Test Principal", category: "INSTITUTIONAL_LEADERSHIP" });
    expect(role.securityLevel).toBe("sensitive");
    expect(role.tenantScope).toBe("tenant");
    expect(role.authority.rbac).toBe(true);
    expect(role.authority.pbac).toBe(true);
    expect(role.authority.rls).toBe(true);
    expect(role.workspaceRequirements).toContain("leadership");
    const sovereign = defineRole({ name: "Test Minister", category: "GOVERNMENT" });
    expect(sovereign.securityLevel).toBe("sovereign");
    expect(sovereign.tenantScope).toBe("jurisdiction");
  });

  it("rejects a permission the kernel does not own", () => {
    const role = defineRole({
      name: "Test Inventor",
      category: "TEACHING",
      permissions: ["invented-ability"],
    });
    expect(validateRoleDefinition(role).join(" ")).toMatch(/unknown capability/);
  });

  it("rejects unknown reality vocabulary", () => {
    const role = defineRole({
      name: "Test Scoped",
      category: "TEACHING",
      featureScope: ["curriculum.astrology"],
      templateRefs: ["invented_template"],
    });
    const issues = validateRoleDefinition(role).join(" ");
    expect(issues).toMatch(/unknown feature key/);
    expect(issues).toMatch(/unknown institution template/);
  });

  it("rejects a staffed role whose kind is not in the Scholar workforce catalog", () => {
    const role = defineRole({
      name: "Test Invented Post",
      category: "TEACHING",
      staffing: { kind: "scholar_workforce", kindCode: "invented_post" },
    });
    expect(validateRoleDefinition(role).join(" ")).toMatch(/not in the Scholar workforce catalog/);
  });

  it("rejects a kind code on a non-staffed role and bad jurisdictions", () => {
    const role = defineRole({
      name: "Test Bad Staffing",
      category: "TEACHING",
      jurisdictions: ["nigeria"],
      staffing: { kind: "non_staff", kindCode: "class_teacher" },
    });
    const issues = validateRoleDefinition(role).join(" ");
    expect(issues).toMatch(/only valid for scholar_workforce/);
    expect(issues).toMatch(/invalid jurisdiction/);
  });
});

describe("reality template engine — reality determines the role set", () => {
  const islamicBoarding = {
    featureKeys: [
      "curriculum.core",
      "curriculum.religious",
      "schedule.boarding",
      "community.private",
    ],
    templateRefs: ["islamic_madrassa", "boarding_school"],
    educationLevels: ["senior_secondary"] as const,
    jurisdictions: ["NG"],
    curriculumFlavour: "islamic" as const,
  };

  it("suggests the leadership, boarding and religious roles the reality implies", () => {
    const suggestions = suggestRolesForInstitution({
      ...islamicBoarding,
      educationLevels: [...islamicBoarding.educationLevels],
    });
    const primary = suggestions.primary.map((suggestion) => suggestion.displayName.toLowerCase());
    expect(primary.some((name) => name.includes("principal"))).toBe(true);
    expect(
      suggestions.primary.some((suggestion) =>
        ["boarding_coordinator", "house_master"].includes(
          suggestion.role.id.replace("role:", "").replace(/-/g, "_"),
        ),
      ),
    ).toBe(true);
    expect(primary.some((name) => name.includes("islamic"))).toBe(true);
    expect(suggestions.total).toBeGreaterThan(20);
  });

  it("names religious roles the way the institution names them", () => {
    const suggestions = suggestRolesForInstitution({
      ...islamicBoarding,
      educationLevels: [...islamicBoarding.educationLevels],
    });
    const coordinator = [
      ...suggestions.primary,
      ...suggestions.secondary,
      ...suggestions.optional,
    ].find((suggestion) => suggestion.role.id === "role:faith-studies-coordinator");
    expect(coordinator?.displayName).toBe("Islamic Studies Coordinator");
    const christian = roleDisplayName(
      roleById("role:faith-studies-coordinator") as EducationRealityRole,
      "christian",
    );
    expect(christian).toBe("Religious Education Coordinator");
  });

  it("never suggests boarding roles to a day school that has no boarding reality", () => {
    const daySchool = suggestRolesForInstitution({
      featureKeys: ["curriculum.core", "schedule.day_full", "community.public_govt"],
      templateRefs: ["public_day"],
      educationLevels: ["primary"],
    });
    const all = [...daySchool.primary, ...daySchool.secondary, ...daySchool.optional];
    expect(all.some((suggestion) => suggestion.role.category === "BOARDING")).toBe(false);
    expect(all.some((suggestion) => suggestion.role.category === "RELIGIOUS")).toBe(false);
    expect(workspacesForSuggestions(daySchool)).not.toContain("boarding");
  });

  it("gives a TVET reality its workshop roles and a boarding reality its boarding workspaces", () => {
    const tvet = suggestRolesForInstitution({
      featureKeys: ["curriculum.vocational", "curriculum.technical"],
      templateRefs: ["vocational_tvet", "technical_institute"],
      educationLevels: ["vocational"],
    });
    const ids = [...tvet.primary, ...tvet.secondary, ...tvet.optional].map((s) => s.role.id);
    expect(ids).toContain("role:workshop-manager");
    expect(workspacesForSuggestions(tvet)).toContain("vocational");

    const boarding = suggestRolesForInstitution({
      featureKeys: ["curriculum.core", "schedule.boarding"],
      templateRefs: ["boarding_school"],
    });
    expect(workspacesForSuggestions(boarding)).toEqual(
      expect.arrayContaining(["boarding", "student_welfare"]),
    );
  });

  it("carries the matched reality facts as rationale", () => {
    const suggestions = suggestRolesForInstitution({
      featureKeys: ["curriculum.religious"],
      templateRefs: ["islamic_madrassa"],
    });
    const founder = suggestions.primary.find((suggestion) =>
      suggestion.rationale.includes("feature:curriculum.religious"),
    );
    expect(founder).toBeDefined();
  });
});

describe("borrowing engine — one definition, many frameworks", () => {
  it("borrows roles into another framework with provenance and no duplication", () => {
    const result = borrowRolesInto(
      "technical_institute",
      "public_day",
      "public day school adding a workshop stream",
    );
    expect(result.ok).toBe(true);
    expect(result.borrowed.length).toBeGreaterThan(0);
    for (const role of result.borrowed) {
      expect(role.origin).toBe("borrowed");
      expect(role.templateRefs).toContain("technical_institute");
      expect(role.templateRefs).toContain("public_day");
    }
    expect(result.borrowings.every((borrowing) => borrowing.reason.length > 0)).toBe(true);
  });

  it("refuses unknown frameworks and reasons without a reason", () => {
    expect(borrowRolesInto("nope", "public_day", "x").ok).toBe(false);
    expect(borrowRolesInto("technical_institute", "public_day", "  ").issues.join(" ")).toMatch(
      /must carry a reason/,
    );
  });
});

describe("inheritance engine — hierarchy can never escalate", () => {
  const hierarchy = {
    edges: [
      { parent: HEAD_ROLE.id, child: DEPUTY_ROLE.id },
      { parent: DEPUTY_ROLE.id, child: TEACHER_ROLE.id },
    ],
  };

  it("rejects unknown roles, self edges, duplicates and cycles", () => {
    const issues = validateRoleHierarchy(
      {
        edges: [
          { parent: HEAD_ROLE.id, child: HEAD_ROLE.id },
          { parent: HEAD_ROLE.id, child: DEPUTY_ROLE.id },
          { parent: HEAD_ROLE.id, child: DEPUTY_ROLE.id },
          { parent: DEPUTY_ROLE.id, child: HEAD_ROLE.id },
          { parent: "role:does-not-exist", child: TEACHER_ROLE.id },
        ],
      },
      new Set(SYNTHETIC.map((role) => role.id)),
    ).join(" ");
    expect(issues).toMatch(/itself is not allowed/);
    expect(issues).toMatch(/duplicate edge/);
    expect(issues).toMatch(/cycle detected/);
    expect(issues).toMatch(/unknown role/);
  });

  it("resolves ancestors and descendants", () => {
    const teacher = resolveInheritance(TEACHER_ROLE.id, hierarchy);
    expect(teacher.ancestors).toEqual([DEPUTY_ROLE.id, HEAD_ROLE.id]);
    expect(teacher.descendants).toEqual([]);
    const head = resolveInheritance(HEAD_ROLE.id, hierarchy);
    expect(head.descendants).toEqual([DEPUTY_ROLE.id, TEACHER_ROLE.id]);
  });

  it("unions declared grants and invents nothing", () => {
    const effective = effectivePermissionSet(
      [HEAD_ROLE.id, DEPUTY_ROLE.id, TEACHER_ROLE.id],
      hierarchy,
      SYNTHETIC,
    );
    const declared = new Set(SYNTHETIC.flatMap((role) => role.permissions));
    for (const permission of effective.keys()) {
      expect(declared.has(permission), `${permission} must be declared by a role`).toBe(true);
    }
    expect(effective.get("education-reality-ontology")).toEqual([HEAD_ROLE.id]);
    expect(effective.get("financial-ledger:read")).toEqual([HEAD_ROLE.id, DEPUTY_ROLE.id]);
  });
});

describe("permission engine — fail closed", () => {
  it("denies unknown capabilities and unassigned identities", () => {
    expect(
      evaluatePermission(
        { roleIds: [TEACHER_ROLE.id], capability: "not-a-capability" },
        [],
        SYNTHETIC,
      ).outcome,
    ).toBe("DENY");
    expect(
      evaluatePermission({ roleIds: [], capability: "scheduling" }, [], SYNTHETIC).outcome,
    ).toBe("DENY");
  });

  it("allows only what a role declares, action-aware", () => {
    const allowed = evaluatePermission(
      { roleIds: [HEAD_ROLE.id], capability: "financial-ledger", action: "read" },
      [],
      SYNTHETIC,
    );
    expect(allowed.outcome).toBe("ALLOW");
    expect(allowed.grantedBy).toEqual([HEAD_ROLE.id]);
    expect(allowed.models).toContain("RBAC");
    const wrongAction = evaluatePermission(
      { roleIds: [HEAD_ROLE.id], capability: "financial-ledger", action: "approve" },
      [],
      SYNTHETIC,
    );
    expect(wrongAction.outcome).toBe("DENY");
  });

  it("lets the most restrictive applicable policy win", () => {
    const denied = evaluatePermission(
      { roleIds: [HEAD_ROLE.id], capability: "financial-ledger" },
      [
        {
          id: "policy.no-finance-view",
          capability: "financial-ledger",
          outcome: "DENY",
          reason: "segregation of duties",
        },
      ],
      SYNTHETIC,
    );
    expect(denied.outcome).toBe("DENY");
    expect(denied.appliedPolicies).toEqual(["policy.no-finance-view"]);

    const approval = evaluatePermission(
      { roleIds: [HEAD_ROLE.id], capability: "financial-ledger" },
      [{ id: "policy.approval", capability: "financial-ledger", outcome: "REQUIRE_APPROVAL" }],
      SYNTHETIC,
    );
    expect(approval.outcome).toBe("REQUIRE_APPROVAL");
  });

  it("reports the authorization models that participated", () => {
    const decision = evaluatePermission(
      { roleIds: [HEAD_ROLE.id, TEACHER_ROLE.id], capability: "academic-intelligence" },
      [],
      SYNTHETIC,
    );
    expect(decision.models).toEqual(expect.arrayContaining(["RBAC", "RLS"]));
    expect(decision.grantedBy).toEqual([TEACHER_ROLE.id]);
  });
});

describe("workspace engine — composition from roles, not role names", () => {
  it("traces every workspace back to the roles that unlock it", () => {
    const assignments = workspacesForRoles([HEAD_ROLE.id, DEPUTY_ROLE.id], SYNTHETIC);
    const leadership = assignments.find((assignment) => assignment.workspace === "leadership");
    expect(leadership?.sourceRoles).toEqual([HEAD_ROLE.id]);
    expect(assignments.every((assignment) => assignment.sourceRoles.length > 0)).toBe(true);
  });

  it("picks the best-supported workspace as the landing and refuses to invent one", () => {
    // Both roles unlock "academic", so it is the best-supported landing here —
    // the landing is computed from support, not from a role name.
    expect(primaryWorkspaceForRoles([HEAD_ROLE.id, TEACHER_ROLE.id], SYNTHETIC)).toBe("academic");
    const assignments = workspacesForRoles([HEAD_ROLE.id, TEACHER_ROLE.id], SYNTHETIC);
    expect(assignments.find((a) => a.workspace === "leadership")?.sourceRoles).toEqual([
      HEAD_ROLE.id,
    ]);
    expect(primaryWorkspaceForRoles([], SYNTHETIC)).toBeNull();
    expect(primaryWorkspaceForRoles(["role:not-registered"], SYNTHETIC)).toBeNull();
  });
});

describe("context engine — fail closed and tenant-isolated", () => {
  const assignments = [
    { roleId: HEAD_ROLE.id, tenantId: "tenant:a" },
    { roleId: TEACHER_ROLE.id, tenantId: "tenant:b" },
  ];

  it("refuses to resolve without an identity or a tenant", () => {
    const noIdentity = resolveRoleContext({ identityId: null, tenantId: "tenant:a", assignments });
    expect(noIdentity.ok).toBe(false);
    const noTenant = resolveRoleContext({ identityId: "user:1", tenantId: null, assignments });
    expect(noTenant.ok).toBe(false);
  });

  it("never uses another tenant's assignment", () => {
    const context = resolveRoleContext(
      {
        identityId: "user:1",
        tenantId: "tenant:a",
        assignments,
      },
      SYNTHETIC,
    );
    expect(context.ok).toBe(true);
    if (!context.ok) return;
    expect(context.roleIds).toEqual([HEAD_ROLE.id]);
    expect(context.workspaces.some((assignment) => assignment.workspace === "teaching")).toBe(
      false,
    );
  });

  it("honours time-bounded assignments and reports unknown role ids", () => {
    const context = resolveRoleContext(
      {
        identityId: "user:1",
        tenantId: "tenant:a",
        now: "2026-09-07T00:00:00.000Z",
        assignments: [
          { roleId: TEACHER_ROLE.id, tenantId: "tenant:a", activeTo: "2026-09-01T00:00:00.000Z" },
          { roleId: HEAD_ROLE.id, tenantId: "tenant:a", activeFrom: "2026-09-01T00:00:00.000Z" },
          { roleId: "role:not-registered", tenantId: "tenant:a" },
        ],
      },
      SYNTHETIC,
    );
    expect(context.ok).toBe(true);
    if (!context.ok) return;
    expect(context.roleIds).toEqual([HEAD_ROLE.id]);
    expect(context.unknownRoleIds).toEqual(["role:not-registered"]);
    expect(context.models).toEqual(expect.arrayContaining(["RBAC", "PBAC", "RLS"]));
  });

  it("carries reality suggestions when a reality is supplied", () => {
    const context = resolveRoleContext(
      {
        identityId: "user:1",
        tenantId: "tenant:a",
        assignments: [{ roleId: HEAD_ROLE.id, tenantId: "tenant:a" }],
        reality: { featureKeys: ["curriculum.core"], templateRefs: ["public_day"] },
      },
      SYNTHETIC,
    );
    expect(context.ok).toBe(true);
    if (!context.ok) return;
    expect(context.suggestions?.total).toBeGreaterThan(0);
  });
});

describe("engine law — no hardcoded role or institution branches", () => {
  const sources = readdirSync(ENGINE_DIR)
    .filter((name) => name.endsWith(".ts"))
    .sort();

  it("ships engine sources to scan", () => {
    expect(sources.length).toBeGreaterThanOrEqual(12);
  });

  it("never branches on a role name, a school type or a fixed dashboard", () => {
    const offenders: string[] = [];
    for (const name of sources) {
      const raw = readFileSync(join(ENGINE_DIR, name), "utf8");
      // Comments explain the anti-pattern the engine forbids; only code counts.
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      for (const pattern of [
        /if\s*\(\s*role\s*===/,
        /role\s*===\s*"/,
        /schoolType\s*===/,
        /institutionType\s*===/,
        /\.role\s*===\s*["'](teacher|principal|admin|student|parent)["']/,
      ]) {
        if (pattern.test(code)) offenders.push(`${name}: ${pattern}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the engine inside the library layer (no UI, no routes, no react)", () => {
    const offenders: string[] = [];
    for (const name of sources) {
      const source = readFileSync(join(ENGINE_DIR, name), "utf8");
      for (const spec of [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1])) {
        const allowed =
          spec.startsWith("./") ||
          spec.startsWith("../") ||
          spec.startsWith("@/lib/") ||
          spec === "zod";
        if (!allowed) offenders.push(`${name}: ${spec}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps every declared capability real in the kernel registry", () => {
    const registered = new Set(KERNEL_CAPABILITIES.map((capability) => capability.id));
    for (const [permission] of effectivePermissionSet(
      SYNTHETIC.map((role) => role.id),
      { edges: [] },
      SYNTHETIC,
    )) {
      const capability = permission.split(":")[0];
      expect(registered.has(capability), `${capability} must be a kernel capability`).toBe(true);
    }
  });
});
