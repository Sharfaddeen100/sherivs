/**
 * CoreGrid Scholar — Experience & website generation engine.
 *
 * Reality in, digital environment out: an organization does not pick modules, it
 * declares its reality, and CoreGrid generates its public presence and its
 * internal application from that reality.
 *
 * No static application rule: there is no `SchoolDashboard.tsx` /
 * `TeacherPortal.tsx` architecture here — sections, navigation, components and
 * internal workspaces are all derived from reality data (feature keys, template
 * ids, education levels, jurisdictions) plus the role engine.
 */

import { suggestRolesForInstitution, type InstitutionReality } from "../roles/role-template-engine";
import { workspacesForRoles, type WorkspaceAssignment } from "../roles/role-workspace-engine";
import { primaryWorkspaceForRoles } from "../roles/role-workspace-engine";
import type { RoleWorkspaceKey } from "../roles/role-workspaces";
import {
  SECTION_TEMPLATES,
  type ExperienceAudience,
  type SectionTemplate,
  type SiteComponent,
  type SiteSection,
} from "./experience-catalog";
import { defaultBrand, type BrandIdentity } from "./experience-brand";

export interface GeneratedSection {
  section: SiteSection;
  label: string;
  components: readonly SiteComponent[];
  audiences: readonly ExperienceAudience[];
  /** Why the section exists in THIS reality (matched fact or universal). */
  rationale: readonly string[];
  requiresApproval: boolean;
}

export interface GeneratedExperience {
  reality: InstitutionReality;
  brand: BrandIdentity;
  sections: readonly GeneratedSection[];
  /** Navigation for anonymous visitors (marketing presence). */
  publicNavigation: readonly SiteSection[];
  internalApplication: {
    workspaces: readonly WorkspaceAssignment[];
    primary: RoleWorkspaceKey | null;
  };
  requiresApproval: readonly SiteSection[];
  /** Audiences the generated sections serve (union of section audiences). */
  audiences: readonly ExperienceAudience[];
}

/** Does a section template belong to this reality, and why? */
export function sectionFitsReality(
  template: SectionTemplate,
  reality: InstitutionReality,
): { applies: boolean; rationale: readonly string[] } {
  const features = new Set(reality.featureKeys);
  const templates = new Set(reality.templateRefs ?? []);
  const rationale: string[] = [];

  for (const key of template.featureKeys ?? []) {
    if (features.has(key)) rationale.push(`feature:${key}`);
  }
  for (const id of template.templateRefs ?? []) {
    if (templates.has(id)) rationale.push(`template:${id}`);
  }

  const scoped = (template.featureKeys?.length ?? 0) + (template.templateRefs?.length ?? 0) > 0;
  if (!scoped) return { applies: true, rationale: ["universal-section"] };
  if (rationale.length > 0) return { applies: true, rationale };
  return { applies: false, rationale: [] };
}

export interface ExperienceRequest {
  reality: InstitutionReality;
  /** Brand overrides; a generated environment never needs custom frontend work. */
  brand?: Partial<BrandIdentity>;
  /** Audiences the environment is generated for (defaults to all). */
  audiences?: readonly ExperienceAudience[];
  includeInternalApplication?: boolean;
}

/**
 * Generate the digital environment for a reality. Deterministic ordering.
 */
export function generateExperience(request: ExperienceRequest): GeneratedExperience {
  const reality = request.reality;
  const audiences = request.audiences ?? [];
  const sections: GeneratedSection[] = [];

  for (const template of SECTION_TEMPLATES) {
    const fit = sectionFitsReality(template, reality);
    if (!fit.applies) continue;
    if (audiences.length > 0 && !template.audiences.some((a) => audiences.includes(a))) continue;
    sections.push({
      section: template.section,
      label: template.label,
      components: template.components,
      audiences: template.audiences,
      rationale: fit.rationale,
      requiresApproval: template.requiresApproval ?? false,
    });
  }

  sections.sort((left, right) => {
    const leftOrder = SECTION_TEMPLATES.find((t) => t.section === left.section)?.order ?? 0;
    const rightOrder = SECTION_TEMPLATES.find((t) => t.section === right.section)?.order ?? 0;
    return leftOrder - rightOrder;
  });

  const publicNavigation = sections
    .filter((section) => section.audiences.includes("public_visitor"))
    .map((section) => section.section);

  const suggestions = suggestRolesForInstitution(reality);
  const roleIds = [...suggestions.primary, ...suggestions.secondary, ...suggestions.optional].map(
    (suggestion) => suggestion.role.id,
  );
  const workspaces = workspacesForRoles(roleIds);

  return {
    reality,
    brand: defaultBrand(request.brand),
    sections,
    publicNavigation,
    internalApplication: {
      workspaces: request.includeInternalApplication === false ? [] : workspaces,
      primary:
        request.includeInternalApplication === false ? null : primaryWorkspaceForRoles(roleIds),
    },
    requiresApproval: sections.filter((s) => s.requiresApproval).map((s) => s.section),
    audiences: sections.length > 0 ? [...new Set(sections.flatMap((s) => s.audiences))].sort() : [],
  };
}
