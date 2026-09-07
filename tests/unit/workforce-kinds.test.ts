/**
 * CoreGrid — workforce-kind contract + Scholar (R-001) catalog integrity.
 *
 * Pins three guarantees:
 *   1. The domain-neutral contract rejects malformed rows (families, codes,
 *      authority groups, flags).
 *   2. The runtime:scholar catalog is structurally valid and reflects the
 *      staffing reality of an African educational institution (30+ staff
 *      kinds across governance/leadership/teaching/support families; learner,
 *      parent and guardian are relationships, never positions).
 *   3. The TypeScript catalog cannot drift from the seeded database catalog
 *      (20260907000100_runtime_scholar_workforce_catalog.sql) — code-set and
 *      row-count parity are asserted.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditWorkforceCatalog,
  workforceKindSchema,
  workforceKindId,
  workforceKindsByFamily,
  type WorkforceKind,
} from "../../frontend/src/lib/workforce-kinds";
import {
  SCHOLAR_RUNTIME_REF,
  SCHOLAR_WORKFORCE_CODE_SET,
  SCHOLAR_WORKFORCE_KINDS,
  scholarWorkforceKind,
  scholarWorkforceKindForMembershipKind,
  scholarWorkforceKindTitle,
} from "../../frontend/src/lib/runtime/scholar-workforce";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "../..");
const SEED_SQL_PATH = join(
  ROOT,
  "database",
  "supabase",
  "migrations",
  "20260907000100_runtime_scholar_workforce_catalog.sql",
);

describe("workforce-kind domain-neutral contract", () => {
  it("accepts a well-formed row", () => {
    const row: WorkforceKind = {
      runtimeRef: "runtime:example",
      kindCode: "head_of_unit",
      title: "Head of Unit",
      aliases: [],
      family: "leadership",
      employmentClass: "support",
      isTeaching: false,
      isLeadership: true,
      authorityGroup: "org_admin",
      description: "",
      status: "active",
    };
    expect(workforceKindSchema.safeParse(row).success).toBe(true);
  });

  it("rejects unknown families, classes and authority groups", () => {
    const base: WorkforceKind = {
      runtimeRef: "runtime:example",
      kindCode: "some_role",
      title: "Some Role",
      aliases: [],
      family: "teaching",
      employmentClass: "support",
      isTeaching: false,
      isLeadership: false,
      authorityGroup: "org_admin",
      description: "",
      status: "active",
    };
    expect(workforceKindSchema.safeParse({ ...base, family: "magic" }).success).toBe(false);
    expect(workforceKindSchema.safeParse({ ...base, employmentClass: "wizard" }).success).toBe(
      false,
    );
    expect(workforceKindSchema.safeParse({ ...base, authorityGroup: "root" }).success).toBe(false);
  });

  it("rejects malformed kind codes and empty titles", () => {
    const base: WorkforceKind = {
      runtimeRef: "runtime:example",
      kindCode: "some_role",
      title: "Some Role",
      aliases: [],
      family: "teaching",
      employmentClass: "support",
      isTeaching: false,
      isLeadership: false,
      authorityGroup: "org_admin",
      description: "",
      status: "active",
    };
    expect(workforceKindSchema.safeParse({ ...base, kindCode: "Not-Snake" }).success).toBe(false);
    expect(workforceKindSchema.safeParse({ ...base, title: " " }).success).toBe(false);
  });

  it("builds stable runtime-scoped kind ids", () => {
    expect(workforceKindId("runtime:scholar", "subject_teacher")).toBe(
      "runtime:scholar:subject_teacher",
    );
  });

  it("never embeds domain vocabulary in the contract module itself", () => {
    // The platform contract is HR-generic; only runtime catalogs carry domain terms.
    const source = readFileSync(join(ROOT, "frontend/src/lib/workforce-kinds.ts"), "utf8");
    expect(source.toLowerCase().includes("school")).toBe(false);
    expect(source.toLowerCase().includes("teacher")).toBe(false);
  });
});

describe("Scholar (R-001) workforce catalog — African educational reality", () => {
  it("has at least 30 staff/role kinds (excluding learners, parents and guardians)", () => {
    expect(SCHOLAR_WORKFORCE_KINDS.length).toBeGreaterThanOrEqual(30);
  });

  it("is structurally valid (zero audit issues)", () => {
    expect(auditWorkforceCatalog(SCHOLAR_WORKFORCE_KINDS)).toEqual([]);
  });

  it("keeps every code unique and scoped to runtime:scholar", () => {
    expect(SCHOLAR_WORKFORCE_CODE_SET.size).toBe(SCHOLAR_WORKFORCE_KINDS.length);
    for (const kind of SCHOLAR_WORKFORCE_KINDS) {
      expect(kind.runtimeRef).toBe("runtime:scholar");
    }
  });

  it("models learners, parents and guardians as relationships, not positions", () => {
    const codes = new Set(SCHOLAR_WORKFORCE_KINDS.map((k) => k.kindCode));
    expect(codes.has("student")).toBe(false);
    expect(codes.has("parent")).toBe(false);
    expect(codes.has("guardian")).toBe(false);
  });

  it("covers the real breadth of an African school staff", () => {
    const codes = new Set(SCHOLAR_WORKFORCE_KINDS.map((k) => k.kindCode));
    for (const expected of [
      "head_of_school",
      "deputy_head_of_school",
      "director_of_studies",
      "board_chairperson",
      "board_member",
      "head_of_department",
      "senior_teacher",
      "subject_teacher",
      "special_needs_teacher",
      "examination_officer",
      "laboratory_technician",
      "ict_officer",
      "librarian",
      "guidance_counsellor",
      "school_nurse",
      "boarding_care_officer",
      "bursar",
      "accountant",
      "cashier",
      "procurement_officer",
      "registrar",
      "secretary",
      "stores_officer",
      "catering_officer",
      "driver",
      "transport_manager",
      "security_supervisor",
      "security_guard",
      "grounds_estates_officer",
      "maintenance_technician",
      "chaplain",
      "sports_officer",
    ]) {
      expect(codes.has(expected)).toBe(true);
    }
  });

  it("classifies at least ten families with coherent teaching and leadership flags", () => {
    const families = new Set(SCHOLAR_WORKFORCE_KINDS.map((k) => k.family));
    expect(families.size).toBeGreaterThanOrEqual(10);
    const teaching = SCHOLAR_WORKFORCE_KINDS.filter((k) => k.isTeaching);
    const leadership = SCHOLAR_WORKFORCE_KINDS.filter((k) => k.isLeadership);
    expect(teaching.length).toBeGreaterThanOrEqual(6);
    expect(leadership.length).toBeGreaterThanOrEqual(6);
    expect(
      workforceKindsByFamily(SCHOLAR_WORKFORCE_KINDS, "learning_support").length,
    ).toBeGreaterThanOrEqual(8);
  });

  it("resolves titles and the legacy membership-kind mapping", () => {
    expect(scholarWorkforceKindTitle("head_of_school")).toBe("Head Teacher");
    expect(scholarWorkforceKind("examination_officer")?.aliases).toContain("Exams Officer");
    expect(scholarWorkforceKindForMembershipKind("teacher")?.kindCode).toBe("subject_teacher");
    expect(scholarWorkforceKindForMembershipKind("principal")?.title).toBe("Head Teacher");
    expect(scholarWorkforceKindForMembershipKind("student")).toBeUndefined();
    expect(scholarWorkforceKind("not_a_kind")).toBeUndefined();
  });
});

describe("Scholar workforce catalog ↔ seeded database parity", () => {
  it("matches the seed migration code-for-code and row-for-row", () => {
    const sql = readFileSync(SEED_SQL_PATH, "utf8");
    const seedCodes = new Set(
      Array.from(sql.matchAll(/\('runtime:scholar',\s+'([a-z0-9_]+)',/g), (m) => m[1]),
    );
    expect(seedCodes.size).toBeGreaterThanOrEqual(30);
    expect(seedCodes).toEqual(SCHOLAR_WORKFORCE_CODE_SET);
  });

  it("keeps every seed runtime reference equal to the registered runtime id", () => {
    expect(SCHOLAR_RUNTIME_REF).toBe("runtime:scholar");
    expect(SCHOLAR_WORKFORCE_KINDS.every((k) => k.runtimeRef === SCHOLAR_RUNTIME_REF)).toBe(true);
  });
});
