/**
 * CoreGrid Scholar — Experience engine: governance.
 *
 * Every generated experience must respect security, permissions, policies,
 * tenant isolation, audit and privacy. And AI does not silently publish: a
 * generated/proposed section may only be published after a human approves it.
 *
 * Exposure law: an audience is served only the sections its templates expose.
 * Asking for a section the audience is not exposed to is a violation, and only
 * served sections are subject to the approval check.
 */

import type { ExperienceAudience, SiteSection } from "./experience-catalog";
import type { GeneratedExperience } from "./experience-engine";

export const CONTENT_SOURCES = ["reality", "human", "ai_proposal"] as const;
export type ContentSource = (typeof CONTENT_SOURCES)[number];

export interface GeneratedContentItem {
  section: SiteSection;
  source: ContentSource;
  /** Human identity that approved publication (required for AI proposals). */
  approvedBy: string | null;
}

export interface PublicationDecision {
  allowed: boolean;
  reasons: readonly string[];
}

/** May this item be published? Fail-closed for AI proposals. */
export function decidePublication(item: GeneratedContentItem): PublicationDecision {
  const reasons: string[] = [];
  if (!CONTENT_SOURCES.includes(item.source)) {
    return { allowed: false, reasons: [`unknown content source "${item.source}"`] };
  }
  if (item.source === "ai_proposal") {
    if (!item.approvedBy) {
      return {
        allowed: false,
        reasons: ["AI proposals are not published without human approval"],
      };
    }
    reasons.push(`approved by ${item.approvedBy}`);
  } else {
    reasons.push(`${item.source} content`);
  }
  return { allowed: true, reasons };
}

export interface ExperienceGovernanceInput {
  tenantId: string | null;
  audience: ExperienceAudience;
  experience: GeneratedExperience;
  /** Content items for served sections that require approval. */
  items?: readonly GeneratedContentItem[];
  /** Sections the caller explicitly wants; a non-exposed request is a violation. */
  requestedSections?: readonly SiteSection[];
}

export interface ExperienceGovernanceResult {
  ok: boolean;
  issues: readonly string[];
  /** Sections the audience is actually served. */
  servedSections: readonly SiteSection[];
}

/** Govern one generated experience for one audience. */
export function governExperience(input: ExperienceGovernanceInput): ExperienceGovernanceResult {
  const issues: string[] = [];
  if (!input.tenantId) issues.push("no tenant context — an experience is never tenant-less");

  const served = input.experience.sections.filter((section) =>
    section.audiences.includes(input.audience),
  );
  const servedIds = new Set(served.map((section) => section.section));

  for (const requested of input.requestedSections ?? []) {
    if (!servedIds.has(requested)) {
      issues.push(`section ${requested} is not exposed to audience ${input.audience}`);
    }
  }

  for (const section of served) {
    if (!section.requiresApproval) continue;
    const item = (input.items ?? []).find((candidate) => candidate.section === section.section);
    if (!item) {
      issues.push(`section ${section.section} requires an approved content item`);
      continue;
    }
    const decision = decidePublication(item);
    if (!decision.allowed)
      issues.push(`section ${section.section}: ${decision.reasons.join("; ")}`);
  }

  return {
    ok: issues.length === 0,
    issues,
    servedSections: served.map((section) => section.section),
  };
}
