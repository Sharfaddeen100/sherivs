/**
 * Sherivs Scholar — Educational Reality Role Engine: borrowing engine.
 *
 * Institutions borrow roles across frameworks (a vocational school staffing
 * workshop supervision, a day school adding boarding later) without breaking
 * their own model and without redefining anything: a borrowed role keeps its
 * single definition and gains PROVENANCE (from → into).
 *
 * Laws:
 *  - the source and target institution templates must exist;
 *  - a role already present in the target is never borrowed twice;
 *  - every borrow carries a reason (audit) and both template refs on the role.
 */

import { SCHOLAR_SCHOOL_TEMPLATES } from "@/lib/runtime/scholar-school-templates";
import { EDUCATION_REALITY_ROLES, rolesForTemplate } from "./role-registry";
import type { EducationRealityRole } from "./role-definition";

export interface RoleBorrowing {
  roleId: string;
  /** Institution template the role came from. */
  from: string;
  /** Institution template it is borrowed into. */
  into: string;
  reason: string;
}

export interface BorrowingResult {
  ok: boolean;
  issues: readonly string[];
  borrowed: readonly EducationRealityRole[];
  borrowings: readonly RoleBorrowing[];
  /** Roles both templates already share (nothing to borrow). */
  alreadyPresent: readonly string[];
}

const TEMPLATE_IDS: ReadonlySet<string> = new Set(SCHOLAR_SCHOOL_TEMPLATES.map((t) => t.id));

/**
 * Borrow the roles of `sourceTemplateId` into `targetTemplateId`.
 * Deterministic: template order preserved, ids deduplicated.
 */
export function borrowRolesInto(
  sourceTemplateId: string,
  targetTemplateId: string,
  reason: string,
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): BorrowingResult {
  const issues: string[] = [];
  if (!TEMPLATE_IDS.has(sourceTemplateId))
    issues.push(`unknown source template "${sourceTemplateId}"`);
  if (!TEMPLATE_IDS.has(targetTemplateId)) {
    issues.push(`unknown target template "${targetTemplateId}"`);
  }
  if (reason.trim().length === 0) issues.push("a borrow must carry a reason (audit)");
  if (issues.length > 0) {
    return { ok: false, issues, borrowed: [], borrowings: [], alreadyPresent: [] };
  }

  const source = roles.filter((role) => role.templateRefs.includes(sourceTemplateId));
  const target = new Set(
    roles.filter((role) => role.templateRefs.includes(targetTemplateId)).map((role) => role.id),
  );

  const borrowed: EducationRealityRole[] = [];
  const borrowings: RoleBorrowing[] = [];
  const alreadyPresent: string[] = [];

  for (const role of source) {
    if (target.has(role.id)) {
      alreadyPresent.push(role.id);
      continue;
    }
    borrowed.push({
      ...role,
      origin: "borrowed",
      templateRefs: [...new Set([...role.templateRefs, targetTemplateId])],
    });
    borrowings.push({ roleId: role.id, from: sourceTemplateId, into: targetTemplateId, reason });
  }

  return { ok: true, issues, borrowed, borrowings, alreadyPresent };
}

/** Roles two institution templates already share (no borrow needed). */
export function sharedRoles(
  templateA: string,
  templateB: string,
  roles: readonly EducationRealityRole[] = EDUCATION_REALITY_ROLES,
): readonly string[] {
  const a = new Set(rolesForTemplate(templateA).map((role) => role.id));
  return roles
    .filter((role) => role.templateRefs.includes(templateB) && a.has(role.id))
    .map((role) => role.id);
}

/** Propose the borrowings an institution should consider for a target template. */
export function borrowableTemplatePairs(): readonly { from: string; into: string }[] {
  return SCHOLAR_SCHOOL_TEMPLATES.flatMap((source) =>
    SCHOLAR_SCHOOL_TEMPLATES.filter((target) => target.id !== source.id)
      .map((target) => ({ from: source.id, into: target.id }))
      .filter(({ from, into }) =>
        EDUCATION_REALITY_ROLES.some(
          (role) =>
            role.templateRefs.includes(from) &&
            role.templateRefs.includes(into) &&
            role.templateRefs.length === 1,
        ),
      ),
  );
}
