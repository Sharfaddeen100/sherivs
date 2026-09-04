/**
 * CoreGrid — Phase 08 Security Engine: server-function enforcement surface.
 *
 * Machine-checked inventory of `frontend/src/lib/*.functions.ts` against the
 * canonical runtime role gate (`security-role-gate.ts`).
 *
 * Law: a server-function family that performs a *pure school-admin* check
 * (role IN admin/principal — exactly the semantics of the database
 * `public.is_school_admin()` RPC) MUST route that decision through the
 * canonical gate. Duplicated inline role reads/checks are the debt class the
 * gate exists to remove (§17.2 PROGRESS; §26/§38 of the constitution).
 *
 * Two honest exceptions exist, and only with a reason recorded:
 * - COMPOSITE_ROLE_TRACKED: families whose authorization legitimately spans
 *   roles BEYOND the school-admin kind (teacher-owner, bursar, ...). These
 *   need a future gate extension (e.g. a school-staff kind), not a silent
 *   inline check.
 * - No admin gate at all (self-scoped / public / service / driver paths) is
 *   outside this rule by construction.
 *
 * If a new role-scoped family is added without the canonical gate, this test
 * fails with the family name.
 */

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const LIB_DIR = join(ROOT, "frontend/src/lib");

/** Families that have adopted the canonical gate (import must be present). */
const ADOPTED = [
  "attendance.functions.ts",
  "digital-twin.functions.ts",
  "expense-insights.functions.ts",
  "facilities.functions.ts",
  "messages-broadcast.functions.ts",
  "notification-digest.functions.ts",
  "notifications-fanout.functions.ts",
  "provisioning.functions.ts",
  "school-settings.functions.ts",
  "staff-accounts.functions.ts",
  "teachers.functions.ts",
  "timetable.functions.ts",
] as const;

/**
 * Composite role-set families that still need the canonical gate. EMPTY since
 * 2026-09-03: attendance (school_admin/school_teacher/teaching_staff),
 * expense-insights (finance_staff) and messages-broadcast (teaching_staff
 * with audience policy) were adopted via the school-staff context kinds in
 * `security-role-gate.ts`. A new composite family must be added here with a
 * reason until a gate kind covers it — never silently.
 */
const COMPOSITE_ROLE_TRACKED: Readonly<Record<string, string>> = {};

/** Inline pure school-admin gate detectors (both dialects in use). */
const INLINE_ADMIN_ARRAY_RE = /\[\s*["']admin["']\s*,\s*["']principal["']\s*\]/;
const INLINE_ADMIN_COMPARISON_RE =
  /(?:me\.role|role|data\.role)\s*===\s*["']admin["']\s*\|\|\s*(?:me\.role|role|data\.role)\s*===\s*["']principal["']/;
const GATE_IMPORT_RE = /security-role-gate/;

describe("P08 security engine — server-function enforcement surface", () => {
  const families = readdirSync(LIB_DIR)
    .filter((f) => f.endsWith(".functions.ts"))
    .sort();

  it("every adopted family imports the canonical gate (no silent revert)", () => {
    for (const name of ADOPTED) {
      const source = readFileSync(join(LIB_DIR, name), "utf8");
      expect(source, `${name} must import security-role-gate`).toMatch(GATE_IMPORT_RE);
    }
  });

  it("no pure school-admin gate is duplicated inline outside the canonical gate", () => {
    const offenders: string[] = [];
    const inventory: string[] = [];

    for (const name of families) {
      const source = readFileSync(join(LIB_DIR, name), "utf8");
      const hasInlinePureAdmin =
        INLINE_ADMIN_ARRAY_RE.test(source) || INLINE_ADMIN_COMPARISON_RE.test(source);
      const importsGate = GATE_IMPORT_RE.test(source);

      if (hasInlinePureAdmin && !importsGate && !COMPOSITE_ROLE_TRACKED[name]) {
        offenders.push(name);
      }

      const status = importsGate
        ? "ADOPTED"
        : hasInlinePureAdmin
          ? `COMPOSITE_TRACKED (${COMPOSITE_ROLE_TRACKED[name] ?? "unclassified!"})`
          : "no admin gate";
      inventory.push(`  ${name.padEnd(38)} ${status}`);
    }

    console.log(
      `P08 enforcement-surface inventory (${families.length} families):\n${inventory.join("\n")}`,
    );
    expect(offenders).toEqual([]);
  });

  it("records no undocumented composite families (full adoption via staff kinds)", () => {
    // When a family is adopted, move it from COMPOSITE_ROLE_TRACKED to ADOPTED.
    expect(Object.keys(COMPOSITE_ROLE_TRACKED).sort()).toEqual([]);
  });
});
