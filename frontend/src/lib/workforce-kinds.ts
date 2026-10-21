/**
 * Sherivs — domain-neutral workforce-kind contract (Phase 25 Workforce
 * Identity / Phase 02 workforce reality).
 *
 * A workforce KIND is the canonical post a person can hold inside an
 * organization (data — reality). A workforce POSITION is a tenant-scoped,
 * time-bounded appointment of an identity to a kind.
 *
 * Architectural boundary:
 *  - These rows are workforce REALITY data. They are NEVER authorization
 *    inputs. Authorization stays in Phase 08 (role/capability gate) and the
 *    legacy membership kind on the identity record.
 *  - This module contains NO domain vocabulary: families, employment classes
 *    and authority groups are generic HR/access groupings. Domain runtimes
 *    (e.g. runtime:scholar) install their own catalogs as DATA against this
 *    contract.
 *
 * Levels: L2 typed contract (consumed by server functions and admin UI),
 * mirrored by migration 20260907000000 (cg_workforce_kind substrate).
 */
import { z } from "zod";

export const WORKFORCE_FAMILIES = [
  "governance",
  "leadership",
  "teaching",
  "learning_support",
  "learner_welfare",
  "health",
  "administration",
  "finance",
  "operations",
  "facilities",
  "transport",
  "security",
  "extended_services",
] as const;
export type WorkforceFamily = (typeof WORKFORCE_FAMILIES)[number];

export const WORKFORCE_FAMILY_LABELS: Record<WorkforceFamily, string> = {
  governance: "Governance & Oversight",
  leadership: "Leadership",
  teaching: "Teaching",
  learning_support: "Learning Support & Academic Services",
  learner_welfare: "Learner Welfare & Pastoral Care",
  health: "Health Services",
  administration: "Administration",
  finance: "Finance & Accounts",
  operations: "Operations",
  facilities: "Facilities & Estates",
  transport: "Transport",
  security: "Security",
  extended_services: "Extended & Community Services",
};

export const WORKFORCE_EMPLOYMENT_CLASSES = [
  "governance_volunteer",
  "teaching",
  "support",
  "non_teaching",
  "intern",
  "volunteer",
  "contract",
] as const;
export type WorkforceEmploymentClass = (typeof WORKFORCE_EMPLOYMENT_CLASSES)[number];

export const WORKFORCE_AUTHORITY_GROUPS = [
  "org_admin",
  "teaching_leadership",
  "teaching_staff",
  "learning_support",
  "learner_welfare",
  "administration",
  "finance_officer",
  "operations",
  "facilities",
  "transport",
  "security",
  "governance",
  "extended_services",
] as const;
export type WorkforceAuthorityGroup = (typeof WORKFORCE_AUTHORITY_GROUPS)[number];

export const WORKFORCE_KIND_CODES = /^[a-z][a-z0-9_]{2,63}$/;
export const WORKFORCE_KIND_STATUSES = ["active", "deprecated"] as const;
export type WorkforceKindStatus = (typeof WORKFORCE_KIND_STATUSES)[number];

export const workforceKindSchema = z.object({
  /** Domain-runtime ref that owns this catalog entry (e.g. "runtime:scholar"). */
  runtimeRef: z.string().min(1).max(128),
  /** Stable snake_case kind code (platform-scoped only per runtime). */
  kindCode: z.string().regex(WORKFORCE_KIND_CODES, "kindCode must be snake_case"),
  title: z.string().trim().min(2).max(140),
  /** Regional/alternate titles (data, never translated strings in UI logic). */
  aliases: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  family: z.enum(WORKFORCE_FAMILIES),
  employmentClass: z.enum(WORKFORCE_EMPLOYMENT_CLASSES),
  isTeaching: z.boolean(),
  isLeadership: z.boolean(),
  /**
   * Advisory access grouping for future capability-installation waves.
   * No layer derives authorization from this value today.
   */
  authorityGroup: z.enum(WORKFORCE_AUTHORITY_GROUPS),
  description: z.string().max(500).default(""),
  status: z.enum(WORKFORCE_KIND_STATUSES).default("active"),
});

export type WorkforceKind = z.infer<typeof workforceKindSchema>;

export function isWorkforceFamily(value: string): value is WorkforceFamily {
  return (WORKFORCE_FAMILIES as readonly string[]).includes(value);
}

export function workforceFamilyLabel(family: WorkforceFamily): string {
  return WORKFORCE_FAMILY_LABELS[family];
}

/** Stable platform-wide identity of a kind: "<runtimeRef>:<kindCode>". */
export function workforceKindId(runtimeRef: string, kindCode: string): string {
  return `${runtimeRef}:${kindCode}`;
}

/**
 * Structural audit of a runtime catalog. Returns a list of issues (empty when
 * clean). Used at module load of runtime catalogs and by the unit suite so a
 * malformed catalog row can never reach a UI surface silently.
 */
export function auditWorkforceCatalog(rows: ReadonlyArray<WorkforceKind>): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const kind of rows) {
    const id = workforceKindId(kind.runtimeRef, kind.kindCode);
    const parsed = workforceKindSchema.safeParse(kind);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      issues.push(`${id}: invalid row — ${first?.path.join(".") ?? "root"}: ${first?.message}`);
    }
    if (seen.has(id)) issues.push(`${id}: duplicate kind`);
    seen.add(id);

    if (kind.isTeaching && !["teaching", "learning_support", "leadership"].includes(kind.family)) {
      issues.push(`${id}: isTeaching=true is not allowed on family "${kind.family}"`);
    }
    if (
      kind.isLeadership &&
      !["org_admin", "governance", "finance_officer", "teaching_leadership"].includes(
        kind.authorityGroup,
      )
    ) {
      issues.push(`${id}: isLeadership=true requires a senior authority group`);
    }
    if (new Set(kind.aliases).size !== kind.aliases.length) {
      issues.push(`${id}: duplicate alias`);
    }
  }

  return issues;
}

/** Generic catalog selectors (never role-authorization logic). */
export function workforceKindsByFamily(
  rows: ReadonlyArray<WorkforceKind>,
  family: WorkforceFamily,
): WorkforceKind[] {
  return rows.filter((k) => k.family === family);
}

export function workforceKindByCode(
  rows: ReadonlyArray<WorkforceKind>,
  runtimeRef: string,
  kindCode: string,
): WorkforceKind | undefined {
  return rows.find((k) => k.runtimeRef === runtimeRef && k.kindCode === kindCode);
}
