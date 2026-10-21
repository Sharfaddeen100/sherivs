/**
 * Sherivs — P33 Universal Reality Kernel purity enforcement.
 *
 * Implements the Scholar Independence Test and the Runtime Installation Test
 * (Constitution §111/§117, Correction Order §12) as a mechanical guard:
 *
 * - Scholar Independence: if the Scholar runtime disappeared, Sherivs must
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
import { readdirSync, readFileSync } from "node:fs";
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

describe("P33 universal kernel — runtime neutrality (Constitution §111)", () => {
  /**
   * The runtime-consumption extraction (2026-09-13) removed a runtime-named
   * helper and a hardcoded runtime phase set from the kernel. This law keeps the
   * regression class closed: the kernel answers generically, the consuming
   * runtime declares its own consumption, and the dependency arrow only ever
   * points runtime → kernel.
   *
   * The broad vocabulary law above is deliberately NOT applied to these files:
   * they legitimately carry platform vocabulary mirrored from the registry (for
   * example the `academic-intelligence` capability id owned by Phase 11). The law
   * here targets the defect class precisely instead of forcing a false positive.
   */
  const NEUTRAL_QUERY_MODULES = [
    join(ROOT, "frontend/src/lib/kernel/kernel-capability-registry.ts"),
    join(ROOT, "frontend/src/lib/kernel/phase-contract.ts"),
  ];
  const RUNTIME_MARKERS = [/runtime:scholar/i, /SCHOLAR_/, /\bScholar\b/];

  it("names no installed runtime in a kernel module", () => {
    const offenders: string[] = [];
    for (const file of NEUTRAL_QUERY_MODULES) {
      const source = readFileSync(file, "utf8");
      for (const marker of RUNTIME_MARKERS) {
        if (marker.test(source)) {
          offenders.push(`${file.replace(/\\/g, "/").split("kernel/")[1]}: ${marker}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("records consumption by opaque reference, never by domain name", () => {
    // The kernel MAY record that some consumer uses a capability — but only as an
    // opaque reference (a registry id), never as a runtime's name. This is what
    // keeps the capability graph neutral while still being informative.
    const registry = readFileSync(
      join(ROOT, "frontend/src/lib/kernel/kernel-capability-registry.ts"),
      "utf8",
    );
    const refs = [...registry.matchAll(/consumers:\s*\[([^\]]*)\]/g)]
      .flatMap((match) => [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]))
      .filter(Boolean);
    expect(refs.length).toBeGreaterThan(0);
    const opaque = /^(all|control-plane|coregrid|runtime-\d+|phase-\d+|\d{2})$/;
    const named = refs.filter((ref) => !opaque.test(ref));
    expect(named, `consumer refs must be opaque ids, found: ${named.join(", ")}`).toEqual([]);
  });

  it("exposes a generic consumer query instead of a runtime-named helper", () => {
    const registry = readFileSync(
      join(ROOT, "frontend/src/lib/kernel/kernel-capability-registry.ts"),
      "utf8",
    );
    expect(registry).toContain("export function kernelCapabilitiesByConsumer(");
    expect(registry).not.toMatch(/kernelCapabilitiesConsumedBy\w+\(/);
  });

  it("keeps runtime consumption in the runtime layer, declared and neutral", () => {
    const consumption = readFileSync(
      join(ROOT, "frontend/src/lib/runtime/scholar-consumption.ts"),
      "utf8",
    );
    expect(consumption).toContain("export function scholarConsumedKernelCapabilities(");
    expect(consumption).toContain("kernelCapabilitiesByConsumer(");
    // Declaration only: it must not own capability or grant authority.
    expect(consumption).toMatch(/owns no capability|grants no authority/i);
  });

  it("keeps the dependency arrow one-way: no kernel module imports a runtime module", () => {
    const kernelDir = join(ROOT, "frontend/src/lib/kernel");
    const offenders: string[] = [];
    for (const full of readdirSync(kernelDir)) {
      if (!/\.tsx?$/.test(full)) continue;
      const source = readFileSync(join(kernelDir, full), "utf8");
      for (const spec of [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1])) {
        if (spec.includes("/runtime/") || spec.startsWith("@/lib/runtime")) {
          offenders.push(`${full} → ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
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
  const SCHOLAR_RUNTIME_DIR = join(ROOT, "frontend/src/lib/runtime");
  /**
   * Globbed, not hand-listed: a new `runtime/scholar-*.ts` module can never
   * escape the boundary law by being forgotten in an inventory.
   */
  const SCHOLAR_RUNTIME_SOURCES = readdirSync(SCHOLAR_RUNTIME_DIR)
    .filter((name) => /^scholar(-[a-z0-9-]+)?\.ts$/.test(name))
    .sort()
    .map((name) => join(SCHOLAR_RUNTIME_DIR, name));
  /**
   * The runtime's entry contracts must consume a kernel contract directly
   * (installed on Sherivs, never standalone).
   */
  const KERNEL_CONSUMING_SCHOLAR_MODULES = [
    join(ROOT, "frontend/src/lib/runtime/scholar.ts"),
    join(ROOT, "frontend/src/lib/runtime/scholar-events.ts"),
    join(ROOT, "frontend/src/lib/runtime/scholar-reality.ts"),
    join(ROOT, "frontend/src/lib/runtime/scholar-vertical-bindings.ts"),
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

  it("guards every Scholar runtime module (globbed, never a hand-kept list)", () => {
    expect(SCHOLAR_RUNTIME_SOURCES.length).toBeGreaterThanOrEqual(12);
    for (const file of SCHOLAR_RUNTIME_SOURCES) {
      expect(readFileSync(file, "utf8").length).toBeGreaterThan(0);
    }
  });

  it("keeps Scholar runtime modules inside the library layer (no UI, shell or provider reach)", () => {
    const offenders: string[] = [];
    for (const file of SCHOLAR_RUNTIME_SOURCES) {
      const name = file.replace(/\\/g, "/").split("/").pop();
      for (const spec of importSpecifiers(file)) {
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

  it("keeps the kernel-consumption law on the runtime entry modules", () => {
    for (const file of KERNEL_CONSUMING_SCHOLAR_MODULES) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} must import a @/lib/kernel contract`).toMatch(/@\/lib\/kernel\//);
    }
  });
});
