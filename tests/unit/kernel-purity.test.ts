/**
 * CoreGrid — P33 Universal Reality Kernel purity enforcement.
 *
 * Implements the Scholar Independence Test and the Runtime Installation Test
 * (Constitution §111/§117, Correction Order §12) as a mechanical guard:
 *
 * - Scholar Independence: if the Scholar runtime disappeared, CoreGrid must
 *   remain architecturally valid. The kernel substrate therefore contains no
 *   domain vocabulary — not even the name of a domain runtime.
 * - Runtime Installation: healthcare, government, agriculture, manufacturing,
 *   or any future domain must be installable without changing the kernel. The
 *   kernel exposes only universal primitives (entity, relationship, event,
 *   observation) and never references legacy domain tables.
 *
 * This test guards the kernel boundary on every CI run. If a kernel author
 * introduces a domain term, the test fails and the term is moved into the
 * owning domain runtime's migration instead.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** Files that belong to the universal kernel and must stay domain-agnostic. */
const KERNEL_SOURCES = [
  join(ROOT, "database/supabase/migrations/20260903000000_coregrid_universal_kernel_substrate.sql"),
  join(ROOT, "frontend/src/lib/kernel/reality.ts"),
  join(ROOT, "frontend/src/lib/kernel/domain-manifest.ts"),
  join(ROOT, "frontend/src/lib/kernel/outbox.ts"),
  join(ROOT, "frontend/src/lib/kernel/runtime-registry.ts"),
];

/** Education-domain vocabulary that must never appear inside the kernel. */
const DOMAIN_TERMS = [
  "scholar",
  "student",
  "teacher",
  "parent",
  "school",
  "classroom",
  "class",
  "curriculum",
  "exam",
  "examination",
  "grade",
  "grading",
  "attendance",
  "fee",
  "fees",
  "tuition",
  "timetable",
  "portal",
  "admission",
  "lesson",
  "homework",
  "library",
  "hostel",
  "transport",
  "bursar",
  "principal",
  "enrollment",
  "enrolment",
  "academic",
  "discipline",
  "payroll",
  "textbook",
] as const;

const DOMAIN_TERM_RE = new RegExp(`\\b(?:${DOMAIN_TERMS.join("|")})\\b`, "i");

const LEGACY_DOMAIN_TABLE_RE =
  /REFERENCES public\.(?:schools|students|classes|fees|grades|attendance|attendance_logs|timetables|timetable_slots|lesson_plans|parent_student_map|super_admins|users)\b/i;

describe("P33 universal kernel — Scholar Independence Test", () => {
  it("declares at least one kernel substrate file under test", () => {
    expect(KERNEL_SOURCES.length).toBeGreaterThan(0);
    for (const file of KERNEL_SOURCES) {
      expect(readFileSync(file, "utf8").length).toBeGreaterThan(0);
    }
  });

  it("defines the universal primitives (entity, relationship, event, observation)", () => {
    const sql = readFileSync(KERNEL_SOURCES[0], "utf8");
    for (const table of [
      "public.cg_entity",
      "public.cg_relationship",
      "public.cg_event",
      "public.cg_observation",
    ]) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it("contains no domain vocabulary in any kernel source, including runtime names", () => {
    for (const file of KERNEL_SOURCES) {
      const source = readFileSync(file, "utf8");
      const hits = source
        .split("\n")
        .map((line, index) => ({ line, index: index + 1 }))
        .filter(({ line }) => DOMAIN_TERM_RE.test(line))
        .map(({ line, index }) => `${index}: ${line.trim()}`);
      expect(hits).toEqual([]);
    }
  });
});

describe("P33 universal kernel — Runtime Installation Test", () => {
  it("never references legacy domain tables", () => {
    const sql = readFileSync(KERNEL_SOURCES[0], "utf8");
    expect(sql).not.toMatch(LEGACY_DOMAIN_TABLE_RE);
  });

  it("is deny-by-default at the database boundary (no implicit grants)", () => {
    const sql = readFileSync(KERNEL_SOURCES[0], "utf8");
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/REVOKE ALL ON TABLE public\.cg_entity/);
    expect(sql).not.toMatch(/GRANT .* TO anon|GRANT .* TO authenticated/i);
  });
});

describe("P33 universal kernel — dependency boundary (platform CoreGrid first)", () => {
  const TS_KERNEL_SOURCES = KERNEL_SOURCES.filter((f) => f.endsWith(".ts"));
  const SCHOLAR_RUNTIME_SOURCES = [
    join(ROOT, "frontend/src/lib/runtime/scholar.ts"),
    join(ROOT, "frontend/src/lib/runtime/scholar-events.ts"),
    join(ROOT, "frontend/src/lib/runtime/scholar-reality.ts"),
  ];

  function importSpecifiers(file: string): string[] {
    const source = readFileSync(file, "utf8");
    return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  }

  it("kernel sources never import outside the kernel directory", () => {
    const offenders: string[] = [];
    for (const file of TS_KERNEL_SOURCES) {
      for (const spec of importSpecifiers(file)) {
        const allowed = spec.startsWith("./") || spec.startsWith("@/lib/kernel/");
        if (!allowed) offenders.push(`${file.replace(/\\/g, "/").split("kernel/")[1]}: ${spec}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("Scholar runtime imports only kernel contracts or its own runtime module set", () => {
    const offenders: string[] = [];
    for (const file of SCHOLAR_RUNTIME_SOURCES) {
      for (const spec of importSpecifiers(file)) {
        const allowed =
          spec.startsWith("./") ||
          spec.startsWith("@/lib/kernel/") ||
          spec.startsWith("@/lib/runtime/");
        if (!allowed) {
          offenders.push(`${file.replace(/\\/g, "/").split("runtime/")[1]}: ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every Scholar runtime module consumes at least one kernel contract (installed on CoreGrid, never standalone)", () => {
    for (const file of SCHOLAR_RUNTIME_SOURCES) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} must import a @/lib/kernel contract`).toMatch(
        /@\/lib\/kernel\/[a-z-]+/,
      );
    }
  });
});
