/**
 * CoreGrid Scholar — student & teacher portfolios (Phase-04 §104–105).
 *
 * Students accumulate work, projects, certificates, competencies and
 * practical evidence (§104). Teachers accumulate qualifications, lesson
 * evidence, training, professional development and performance evidence —
 * subject to policy (§105).
 */

export type PortfolioOwnerKind = "student" | "teacher";

export type PortfolioItemKind =
  | "work"
  | "project"
  | "certificate"
  | "competency"
  | "practical_evidence"
  | "qualification"
  | "lesson_evidence"
  | "training"
  | "professional_development"
  | "performance_evidence"
  | "custom";

export const PORTFOLIO_ITEM_KINDS: readonly PortfolioItemKind[] = [
  "work",
  "project",
  "certificate",
  "competency",
  "practical_evidence",
  "qualification",
  "lesson_evidence",
  "training",
  "professional_development",
  "performance_evidence",
  "custom",
] as const;

export const PORTFOLIO_ITEM_KINDS_BY_OWNER: Record<
  PortfolioOwnerKind,
  readonly PortfolioItemKind[]
> = {
  student: ["work", "project", "certificate", "competency", "practical_evidence", "custom"],
  teacher: [
    "qualification",
    "lesson_evidence",
    "training",
    "professional_development",
    "performance_evidence",
    "certificate",
    "custom",
  ],
} as const;

export interface PortfolioItem {
  id: string;
  kind: PortfolioItemKind;
  capturedAt: string;
  artifactRef?: string | null;
  note?: string | null;
}

export interface Portfolio {
  ownerId: string;
  ownerKind: PortfolioOwnerKind;
  items: PortfolioItem[];
}

export function validatePortfolio(portfolio: Portfolio): string[] {
  const issues: string[] = [];
  if (!portfolio.ownerId.trim()) issues.push("a portfolio requires an ownerId");
  if (portfolio.ownerKind !== "student" && portfolio.ownerKind !== "teacher") {
    issues.push("ownerKind must be student or teacher");
  }
  const allowed = PORTFOLIO_ITEM_KINDS_BY_OWNER[portfolio.ownerKind] ?? [];
  const ids = new Set<string>();
  for (const item of portfolio.items) {
    if (!item.id.trim()) {
      issues.push("a portfolio item requires an id");
      continue;
    }
    if (ids.has(item.id)) issues.push(`duplicate portfolio item id "${item.id}"`);
    ids.add(item.id);
    if (!allowed.includes(item.kind)) {
      issues.push(
        `portfolio item "${item.id}": kind "${item.kind}" is not valid for a ${portfolio.ownerKind} portfolio`,
      );
    }
    if (!Number.isFinite(Date.parse(item.capturedAt))) {
      issues.push(`portfolio item "${item.id}": capturedAt must be a valid timestamp`);
    }
  }
  return issues;
}
