/**
 * Sherivs Scholar — Experience & website generation engine laws.
 *
 * The directive's Block 2 promises, locked as tests:
 *  - an organization's reality GENERATES its public presence and internal
 *    application (no static dashboard architecture, no institution-type branch);
 *  - sections exist only when the reality gives them a home (a day school has no
 *    boarding life section; a TVET institute has skills training);
 *  - personalization is derived from authorized roles, never from role names;
 *  - governance holds: tenant context is required, audience exposure is enforced,
 *    and AI-authored sections never publish without human approval.
 */

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultBrand, validateBrandIdentity } from "@/lib/scholar/experience/experience-brand";
import { generateExperience } from "@/lib/scholar/experience/experience-engine";
import {
  decidePublication,
  governExperience,
  type GeneratedContentItem,
} from "@/lib/scholar/experience/experience-governance";
import {
  audiencesForRoles,
  personaliseForAudience,
} from "@/lib/scholar/experience/experience-personalization";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const ENGINE_DIR = join(ROOT, "frontend/src/lib/scholar/experience");

const ISLAMIC_BOARDING = {
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

const PUBLIC_DAY = {
  featureKeys: ["curriculum.core", "schedule.day_full", "community.public_govt"],
  templateRefs: ["public_day"],
  educationLevels: ["primary"] as const,
};

const TVET = {
  featureKeys: ["curriculum.vocational", "curriculum.technical"],
  templateRefs: ["vocational_tvet", "technical_institute"],
  educationLevels: ["vocational"] as const,
};

describe("experience generation — reality generates the digital environment", () => {
  it("generates an Islamic boarding academy presence with the sections its reality implies", () => {
    const experience = generateExperience({ reality: { ...ISLAMIC_BOARDING } });
    const sections = experience.sections.map((section) => section.section);
    expect(sections).toContain("home");
    expect(sections).toContain("admissions");
    expect(sections).toContain("boarding_life");
    expect(sections).toContain("religious_life");
    expect(sections).not.toContain("skills_training");
    expect(experience.requiresApproval).toEqual(
      expect.arrayContaining(["admissions", "boarding_life", "religious_life"]),
    );
  });

  it("never gives a day school sections its reality does not contain", () => {
    const experience = generateExperience({ reality: { ...PUBLIC_DAY } });
    const sections = experience.sections.map((section) => section.section);
    expect(sections).not.toContain("boarding_life");
    expect(sections).not.toContain("religious_life");
    expect(sections).not.toContain("skills_training");
    expect(sections).not.toContain("agriculture");
    expect(sections).toContain("student_life");
  });

  it("gives a TVET institute its skills-training section", () => {
    const experience = generateExperience({ reality: { ...TVET } });
    expect(experience.sections.map((section) => section.section)).toContain("skills_training");
    expect(
      experience.sections.find((section) => section.section === "skills_training")?.rationale,
    ).toEqual(
      expect.arrayContaining(["feature:curriculum.vocational", "template:vocational_tvet"]),
    );
  });

  it("keeps private surfaces out of the public navigation", () => {
    const experience = generateExperience({ reality: { ...ISLAMIC_BOARDING } });
    expect(experience.publicNavigation).not.toContain("parent_portal");
    expect(experience.publicNavigation).not.toContain("student_portal");
    expect(experience.publicNavigation).toContain("home");
  });

  it("honours an audience filter without inventing sections", () => {
    const publicOnly = generateExperience({
      reality: { ...ISLAMIC_BOARDING },
      audiences: ["public_visitor"],
    });
    const sections = publicOnly.sections.map((section) => section.section);
    expect(sections).not.toContain("parent_portal");
    expect(sections).not.toContain("student_portal");
    expect(publicOnly.audiences).toContain("public_visitor");
    expect(publicOnly.publicNavigation).toEqual(sections);
  });

  it("generates the internal application from the reality's roles", () => {
    const boarding = generateExperience({ reality: { ...ISLAMIC_BOARDING } });
    const workspaces = boarding.internalApplication.workspaces.map((w) => w.workspace);
    expect(workspaces).toContain("boarding");
    expect(workspaces).toContain("leadership");
    expect(boarding.internalApplication.primary).not.toBeNull();

    const daySchool = generateExperience({ reality: { ...PUBLIC_DAY } });
    expect(daySchool.internalApplication.workspaces.map((w) => w.workspace)).not.toContain(
      "boarding",
    );

    const headless = generateExperience({
      reality: { ...ISLAMIC_BOARDING },
      includeInternalApplication: false,
    });
    expect(headless.internalApplication.workspaces).toEqual([]);
    expect(headless.internalApplication.primary).toBeNull();
  });
});

describe("brand engine — no custom frontend per organization", () => {
  it("defaults a valid brand", () => {
    expect(validateBrandIdentity(defaultBrand())).toEqual([]);
  });

  it("rejects malformed brand data", () => {
    const issues = validateBrandIdentity(
      defaultBrand({
        name: "",
        primaryColor: "blue",
        secondaryColor: "#fff",
        language: "English",
        domain: "not a domain",
        tone: "louder" as never,
      }),
    ).join(" ");
    expect(issues).toMatch(/name is required/);
    expect(issues).toMatch(/must be #RRGGBB/);
    expect(issues).toMatch(/must be BCP-47/);
    expect(issues).toMatch(/is not a hostname/);
    expect(issues).toMatch(/unknown brand tone/);
  });

  it("applies brand overrides to the generated experience", () => {
    const experience = generateExperience({
      reality: { ...PUBLIC_DAY },
      brand: { name: "Al-Hikmah Academy", domain: "alhikmah.example.com", tone: "faith_centred" },
    });
    expect(experience.brand.name).toBe("Al-Hikmah Academy");
    expect(experience.brand.domain).toBe("alhikmah.example.com");
  });
});

describe("personalization — surfaces derived from authorized roles", () => {
  it("gives anonymous visitors the marketing presence and relationships a portal", () => {
    expect(personaliseForAudience("public_visitor", []).surface).toBe("marketing_site");
    expect(personaliseForAudience("parent", []).surface).toBe("portal");
    expect(personaliseForAudience("student", []).surface).toBe("portal");
  });

  it("gives role holders the workspaces their roles unlock", () => {
    const teacher = personaliseForAudience("teacher", ["role:subject-teacher"]);
    expect(teacher.reached).toBe(true);
    expect(teacher.workspaces).toContain("teaching");

    const unassigned = personaliseForAudience("teacher", []);
    expect(unassigned.reached).toBe(false);
    expect(unassigned.workspaces).toEqual([]);

    const principal = personaliseForAudience("leadership", ["role:principal"]);
    expect(principal.reached).toBe(true);
    expect(principal.workspaces).toContain("leadership");

    const boarding = personaliseForAudience("staff", ["role:boarding-coordinator"]);
    expect(boarding.workspaces).toContain("boarding");
  });

  it("derives the audiences an identity belongs to from their roles", () => {
    expect(audiencesForRoles([])).toEqual(["public_visitor"]);
    const audiences = audiencesForRoles(["role:principal", "role:subject-teacher"]);
    expect(audiences).toEqual(expect.arrayContaining(["public_visitor", "leadership", "teacher"]));
    expect(audiences).not.toContain("regulator");
  });
});

describe("governance — tenant isolation, exposure and human approval", () => {
  const experience = generateExperience({ reality: { ...ISLAMIC_BOARDING } });

  const approvedItems: readonly GeneratedContentItem[] = [
    { section: "admissions", source: "reality", approvedBy: null },
    { section: "boarding_life", source: "ai_proposal", approvedBy: "user:head-teacher" },
    { section: "religious_life", source: "human", approvedBy: null },
  ];

  it("refuses to publish AI-authored content without human approval", () => {
    const decision = decidePublication({
      section: "boarding_life",
      source: "ai_proposal",
      approvedBy: null,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasons.join(" ")).toMatch(/without human approval/);

    expect(
      decidePublication({
        section: "boarding_life",
        source: "ai_proposal",
        approvedBy: "user:head-teacher",
      }).allowed,
    ).toBe(true);
  });

  it("requires a tenant context (an experience is never tenant-less)", () => {
    const result = governExperience({
      tenantId: null,
      audience: "public_visitor",
      experience,
      items: approvedItems,
    });
    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/tenant/);
  });

  it("blocks a section that is not exposed to the requesting audience", () => {
    const servedForStudent = governExperience({
      tenantId: "tenant:a",
      audience: "student",
      experience,
      items: approvedItems,
    });
    // The student audience is never served the parent portal.
    expect(servedForStudent.servedSections).not.toContain("parent_portal");
    expect(servedForStudent.ok).toBe(true);

    const requested = governExperience({
      tenantId: "tenant:a",
      audience: "student",
      experience,
      items: approvedItems,
      requestedSections: ["parent_portal"],
    });
    expect(requested.ok).toBe(false);
    expect(requested.issues.join(" ")).toMatch(/parent_portal is not exposed/);
  });

  it("requires approved content for every section that needs it", () => {
    const missing = governExperience({
      tenantId: "tenant:a",
      audience: "public_visitor",
      experience,
    });
    expect(missing.issues.join(" ")).toMatch(/requires an approved content item/);

    const unapproved = governExperience({
      tenantId: "tenant:a",
      audience: "public_visitor",
      experience,
      items: approvedItems.map((item) =>
        item.section === "boarding_life" ? { ...item, approvedBy: null } : item,
      ),
    });
    expect(unapproved.issues.join(" ")).toMatch(/without human approval/);

    const governed = governExperience({
      tenantId: "tenant:a",
      audience: "public_visitor",
      experience,
      items: approvedItems,
    });
    expect(governed.ok).toBe(true);
    expect(governed.issues).toEqual([]);
  });
});

describe("experience engine law — no static application architecture", () => {
  const sources = readdirSync(ENGINE_DIR)
    .filter((name) => name.endsWith(".ts"))
    .sort();

  it("ships engine sources to scan", () => {
    expect(sources.length).toBeGreaterThanOrEqual(6);
  });

  it("never branches on an institution type or renders a fixed portal component", () => {
    const offenders: string[] = [];
    for (const name of sources) {
      const raw = readFileSync(join(ENGINE_DIR, name), "utf8");
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      for (const pattern of [
        /schoolType\s*===/,
        /institutionType\s*===/,
        /if\s*\(\s*role\s*===/,
        /TeacherPortal|ParentPortal|AdminPortal|SchoolDashboard/,
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
          spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("@/lib/");
        if (!allowed) offenders.push(`${name}: ${spec}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
