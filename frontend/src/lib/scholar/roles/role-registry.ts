/**
 * Sherivs Scholar — Educational Reality Role Engine: registry.
 *
 * Expands the reality GROUPS (data) into ROLE definitions, merging roles that
 * appear in more than one reality (one role, many homes — never a duplicate
 * definition) and LINKING staffed roles to the existing P25 Scholar workforce
 * catalog by title/alias instead of restating the job.
 *
 * This module owns no authorization and no UI.
 */

import { SCHOLAR_WORKFORCE_KINDS } from "@/lib/runtime/scholar-workforce";
import type { RoleCategory } from "./role-categories";
import { ALL_ROLE_GROUPS, type RoleGroup } from "./role-catalog-groups";
import { defineRole, type EducationRealityRole, type RolePriority } from "./role-definition";

/** Priority ordering used when a role belongs to several groups. */
const PRIORITY_RANK: Record<RolePriority, number> = {
  PRIMARY: 3,
  SECONDARY: 2,
  OPTIONAL: 1,
  CUSTOM: 0,
};

/**
 * Curated equivalences between reality role names and the P25 Scholar workforce
 * kinds — the "no role duplication" link. A reality role that IS an existing
 * post maps to it instead of restating the job. Names not listed here and not
 * matching a kind title/alias stay unstaffed and are reported by the audit as
 * "pending workforce kind" until the workforce-catalog wave registers them.
 */
export const ROLE_STAFFING_ALIASES: Readonly<Record<string, string>> = {
  "School Board Chairman": "board_chairperson",
  "School Governor": "board_member",
  "School Director": "head_of_school",
  "Secondary Principal": "head_of_school",
  "Vice Principal Academic": "deputy_head_of_school",
  "Vice Principal Administration": "deputy_head_of_school",
  "Vice Principal Student Affairs": "deputy_head_of_school",
  "Assistant Principal": "deputy_head_of_school",
  "Head of School": "head_of_school",
  "Campus Director": "campus_director",
  "Day School Director": "campus_director",
  "School Secretary": "secretary",
  "Administrative Officer": "secretary",
  "Curriculum Director": "director_of_studies",
  "Curriculum Coordinator": "director_of_studies",
  "Academic Coordinator": "director_of_studies",
  "Subject Coordinator": "head_of_department",
  "Department Head": "head_of_department",
  Dean: "head_of_department",
  "Faculty Dean": "head_of_department",
  "Engineering Department Head": "head_of_department",
  "Academic Quality Officer": "quality_assurance_officer",
  "Examination Coordinator": "examination_officer",
  "Learning Resource Coordinator": "media_resource_officer",
  "Class Teacher": "subject_teacher",
  "Homeroom Teacher": "subject_teacher",
  "Form Teacher": "subject_teacher",
  "Teaching Assistant": "learning_support_assistant",
  "Learning Support Teacher": "learning_support_assistant",
  "Special Education Teacher": "special_needs_teacher",
  "Laboratory Instructor": "laboratory_technician",
  "Laboratory Coordinator": "laboratory_technician",
  "Science Laboratory Technician": "laboratory_technician",
  "Laboratory Assistant": "laboratory_technician",
  "Research Assistant": "laboratory_technician",
  "Practical Instructor": "technical_workshop_instructor",
  "Workshop Instructor": "technical_workshop_instructor",
  "Technical Instructor": "technical_workshop_instructor",
  "Vocational Director": "vocational_skills_coordinator",
  "Vocational Trainer": "vocational_skills_coordinator",
  "Certification Officer": "vocational_skills_coordinator",
  "Trade Coordinator": "vocational_skills_coordinator",
  "Master Trainer": "vocational_skills_coordinator",
  "Craft Instructor": "vocational_skills_coordinator",
  "Craftsmanship Director": "vocational_skills_coordinator",
  "Technology Instructor": "computer_studies_instructor",
  "ICT Director": "ict_officer",
  "Technology Manager": "ict_officer",
  "System Administrator": "ict_officer",
  "Network Administrator": "ict_officer",
  "Database Administrator": "ict_officer",
  "IT Support Officer": "ict_officer",
  "Device Manager": "ict_officer",
  "Digital Learning Specialist": "ict_officer",
  "Educational Technology Coordinator": "ict_officer",
  "Digital Content Manager": "ict_officer",
  "Cybersecurity Officer": "ict_officer",
  "Library Director": "librarian",
  "Chief Librarian": "librarian",
  Librarian: "librarian",
  "Digital Librarian": "librarian",
  "Archive Officer": "media_resource_officer",
  "Knowledge Management Officer": "media_resource_officer",
  "Research Resource Officer": "media_resource_officer",
  Counselor: "guidance_counsellor",
  "Career Counselor": "careers_guidance_officer",
  "Career Guidance Officer": "careers_guidance_officer",
  "Psychological Support Officer": "school_psychologist",
  "Special Needs Counselor": "school_psychologist",
  "House Master": "boarding_care_master",
  "House Mistress": "boarding_care_officer",
  "Dormitory Supervisor": "boarding_care_officer",
  "Boarding Attendance Officer": "boarding_care_officer",
  "Boarding Director": "hostel_manager",
  "Boarding Coordinator": "hostel_manager",
  "Residence Manager": "hostel_manager",
  "Boarding Parent": "hostel_manager",
  "Boarding Activities Coordinator": "weekend_activities_coordinator",
  "Night Supervisor": "study_supervisor",
  "Boarding Safety Officer": "first_aid_officer",
  "School Nurse": "school_nurse",
  "Medical Officer": "school_nurse",
  Registrar: "registrar",
  "Admissions Officer": "registrar",
  "Enrollment Coordinator": "registrar",
  "Finance Director": "bursar",
  "Chief Financial Officer": "bursar",
  "Finance Officer": "bursar",
  "Fee Collection Officer": "cashier",
  "Billing Officer": "cashier",
  "Budget Officer": "accountant",
  "Financial Analyst": "accountant",
  "Audit Officer": "accountant",
  "Payroll Officer": "hr_admin_officer",
  "Payroll Coordinator": "hr_admin_officer",
  "HR Director": "hr_admin_officer",
  "HR Manager": "hr_admin_officer",
  "Recruitment Officer": "hr_admin_officer",
  "Performance Manager": "hr_admin_officer",
  "Employee Relations Officer": "hr_admin_officer",
  "Staff Welfare Officer": "hr_admin_officer",
  "Training Coordinator": "hr_admin_officer",
  "Transport Director": "transport_manager",
  "Route Coordinator": "transport_manager",
  "Bus Supervisor": "transport_manager",
  "Student Pickup Coordinator": "transport_manager",
  "Vehicle Maintenance Officer": "maintenance_technician",
  Driver: "driver",
  "Facilities Director": "grounds_estates_officer",
  "Facilities Manager": "grounds_estates_officer",
  "Grounds Manager": "grounds_estates_officer",
  "Environmental Officer": "grounds_estates_officer",
  "Campus Manager": "premises_officer",
  "Building Manager": "premises_officer",
  "Cleaner Supervisor": "premises_officer",
  "Space Allocation Officer": "premises_officer",
  "Catering Director": "catering_officer",
  "Kitchen Manager": "catering_officer",
  Chef: "catering_officer",
  "Nutrition Specialist": "catering_officer",
  "Food Safety Officer": "catering_officer",
  "Meal Coordinator": "catering_officer",
  "Food Inventory Officer": "stores_officer",
  "Supplier Coordinator": "procurement_officer",
  "Security Director": "security_supervisor",
  "Security Manager": "security_supervisor",
  "Emergency Coordinator": "security_supervisor",
  "Incident Response Officer": "security_supervisor",
  "Risk Management Officer": "security_supervisor",
  "Safeguarding Coordinator": "security_supervisor",
  "Security Officer": "security_guard",
  "Safeguarding Officer": "student_welfare_officer",
  "Child Protection Officer": "student_welfare_officer",
  "Social Worker": "student_welfare_officer",
  Chaplain: "chaplain",
  Imam: "chaplain",
  "Faith Counselor": "chaplain",
  "Religious Teacher": "religious_education_teacher",
  "Quran Teacher": "madrassa_instructor",
  "Madrasa Coordinator": "madrassa_instructor",
  "Sports Coordinator": "sports_officer",
  "Cultural Activities Coordinator": "music_cultural_arts_officer",
  "Events Coordinator": "music_cultural_arts_officer",
  "Religious Activities Coordinator": "music_cultural_arts_officer",
  "Community Relations Officer": "community_liaison_officer",
  "Community Outreach Officer": "community_liaison_officer",
  "Community Partnership Officer": "community_liaison_officer",
  "Education Partnership Officer": "education_ministry_liaison",
  "Education Records Officer": "records_officer",
  "Examination Data Analyst": "records_officer",
  "Entrepreneurship Instructor": "entrepreneurship_coordinator",
  "Entrepreneurship Education Director": "entrepreneurship_coordinator",
  "Enterprise Education Coordinator": "entrepreneurship_coordinator",
  "Financial Literacy Instructor": "entrepreneurship_coordinator",
  "Business Mentor": "entrepreneurship_coordinator",
  "Agricultural Education Director": "agricultural_instructor",
  "Farm Manager": "agricultural_instructor",
  "Crop Supervisor": "agricultural_instructor",
  "Livestock Instructor": "agricultural_instructor",
  "Agricultural Extension Officer": "agricultural_instructor",
  "Morning Session Coordinator": "shift_coordinator",
  "Afternoon Session Coordinator": "shift_coordinator",
  "Day Operations Coordinator": "shift_coordinator",
  "Early Childhood Director": "early_years_coordinator",
  "Nursery Coordinator": "early_years_coordinator",
  "Kindergarten Teacher": "early_years_coordinator",
  "Play-Based Learning Coordinator": "early_years_coordinator",
  "Child Development Specialist": "early_years_coordinator",
  "Child Welfare Officer": "student_welfare_officer",
};

/** Workforce kind codes indexed by title and aliases (case-insensitive). */
export function scholarWorkforceKindIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const kind of SCHOLAR_WORKFORCE_KINDS) {
    for (const label of [kind.title, ...kind.aliases]) {
      const key = label.trim().toLowerCase();
      if (!index.has(key)) index.set(key, kind.kindCode);
    }
  }
  return index;
}

const WORKFORCE_KIND_INDEX = scholarWorkforceKindIndex();

/**
 * Resolve the P25 workforce kind a reality role IS: curated equivalence first,
 * then the catalog's own titles/aliases. `null` means the post has no kind yet.
 */
export function resolveWorkforceKind(roleName: string): string | null {
  const curated = ROLE_STAFFING_ALIASES[roleName];
  if (curated) return curated;
  return WORKFORCE_KIND_INDEX.get(roleName.trim().toLowerCase()) ?? null;
}

interface GroupMembership {
  groups: string[];
  role: EducationRealityRole;
}

function mergedLevels(
  role: EducationRealityRole,
  group: RoleGroup,
): readonly EducationRealityRole["educationLevels"][number][] {
  const specific = role.educationLevels.filter((level) => level !== "any");
  const union = [...new Set([...specific, ...(group.educationLevels ?? [])])];
  return union.length > 0 ? union : role.educationLevels;
}

function mergeMembership(existing: GroupMembership, group: RoleGroup): EducationRealityRole {
  const role = existing.role;
  const declared = group.basePriority ?? "OPTIONAL";
  return {
    ...role,
    priority: PRIORITY_RANK[declared] > PRIORITY_RANK[role.priority] ? declared : role.priority,
    featureScope: [...new Set([...role.featureScope, ...(group.featureScope ?? [])])],
    templateRefs: [...new Set([...role.templateRefs, ...(group.templateRefs ?? [])])],
    educationLevels: mergedLevels(role, group),
    jurisdictions: [...new Set([...role.jurisdictions, ...(group.jurisdictions ?? [])])],
  };
}

/**
 * Build the catalog: group data → role definitions (deterministic order).
 * Exported so a synthetic group set can be expanded in isolation by tests.
 */
export function buildRolesFromGroups(groups: readonly RoleGroup[] = ALL_ROLE_GROUPS): {
  roles: EducationRealityRole[];
  mergedIds: string[];
  pendingPosts: string[];
  memberships: Map<string, GroupMembership>;
} {
  const memberships = new Map<string, GroupMembership>();
  const mergedIds: string[] = [];
  const pendingPosts: string[] = [];

  for (const group of groups) {
    for (const name of group.roles) {
      const declared = group.staffing ?? "non_staff";
      const linkedKind = resolveWorkforceKind(name);
      if (declared === "scholar_workforce" && !linkedKind) pendingPosts.push(name);

      const draft = defineRole({
        name,
        category: group.category,
        priority: group.basePriority ?? "OPTIONAL",
        featureScope: group.featureScope ?? [],
        templateRefs: group.templateRefs ?? [],
        educationLevels: group.educationLevels ?? ["any"],
        jurisdictions: group.jurisdictions ?? ["*"],
        staffing: linkedKind
          ? { kind: "scholar_workforce", kindCode: linkedKind }
          : declared === "platform_workforce"
            ? { kind: "platform_workforce", kindCode: null }
            : { kind: "non_staff", kindCode: null },
      });

      const existing = memberships.get(draft.id);
      if (existing) {
        existing.role = mergeMembership(existing, group);
        existing.groups.push(group.group);
        mergedIds.push(draft.id);
        continue;
      }
      memberships.set(draft.id, { groups: [group.group], role: draft });
    }
  }

  return {
    roles: [...memberships.values()].map((membership) => membership.role),
    mergedIds: [...new Set(mergedIds)],
    pendingPosts: [...new Set(pendingPosts)].sort(),
    memberships,
  };
}

const BUILD = buildRolesFromGroups();

/** The full Educational Reality role catalog. */
export const EDUCATION_REALITY_ROLES: readonly EducationRealityRole[] = BUILD.roles;

/** Roles that appear in more than one reality (documented, never silent). */
export const MULTI_REALITY_ROLE_IDS: readonly string[] = BUILD.mergedIds;

/**
 * Reality posts that have no P25 workforce kind yet. They stay unstaffed rather
 * than claiming a kind that does not exist; the workforce-catalog wave registers
 * them as data and they link automatically through `ROLE_STAFFING_ALIASES`.
 */
export const ROLE_PENDING_WORKFORCE_POSTS: readonly string[] = BUILD.pendingPosts;

export const EDUCATION_REALITY_ROLE_IDS: ReadonlySet<string> = new Set(
  EDUCATION_REALITY_ROLES.map((role) => role.id),
);

export const ROLE_GROUP_MEMBERSHIPS: ReadonlyMap<string, readonly string[]> = new Map(
  [...BUILD.memberships.entries()].map(([id, membership]) => [id, membership.groups]),
);

export function roleById(id: string): EducationRealityRole | undefined {
  return EDUCATION_REALITY_ROLES.find((role) => role.id === id);
}

export function rolesByCategory(category: RoleCategory): EducationRealityRole[] {
  return EDUCATION_REALITY_ROLES.filter((role) => role.category === category);
}

/** Roles a reality feature gives a home to (boarding, religious, TVET, ...). */
export function rolesForFeature(featureKey: string): EducationRealityRole[] {
  return EDUCATION_REALITY_ROLES.filter((role) => role.featureScope.includes(featureKey));
}

/** Roles an institution template installs. */
export function rolesForTemplate(templateId: string): EducationRealityRole[] {
  return EDUCATION_REALITY_ROLES.filter((role) => role.templateRefs.includes(templateId));
}

export function rolesByPriority(priority: RolePriority): EducationRealityRole[] {
  return EDUCATION_REALITY_ROLES.filter((role) => role.priority === priority);
}

export function rolesByGroupMember(group: string): EducationRealityRole[] {
  return EDUCATION_REALITY_ROLES.filter((role) =>
    (ROLE_GROUP_MEMBERSHIPS.get(role.id) ?? []).includes(group),
  );
}

/** Roles linked to the Scholar workforce catalog (staffed posts). */
export function staffedRoles(): EducationRealityRole[] {
  return EDUCATION_REALITY_ROLES.filter((role) => role.staffing.kind === "scholar_workforce");
}

/** Reality roles that ARE a given workforce kind (linkage reverse lookup). */
export function roleIdsForWorkforceKind(kindCode: string): readonly string[] {
  return EDUCATION_REALITY_ROLES.filter((role) => role.staffing.kindCode === kindCode).map(
    (role) => role.id,
  );
}
