/**
 * V1 public marketing content for Sherivs Scholar.
 *
 * Cards, audiences, and trust statements are limited to capabilities that
 * exist in the Scholar application: organization/school administration,
 * academic records and workflows, role workspaces for administrators,
 * teachers, students, and parents, authentication, and tenant isolation.
 * Frozen V2/V3 scope (devices/IoT, digital twins, standalone intelligence
 * products) is not advertised here.
 */

export interface ScholarCapability {
  id: string;
  title: string;
  body: string;
  href: string;
}

export interface ScholarPrinciple {
  id: string;
  title: string;
  body: string;
}

export interface ScholarAudience {
  id: string;
  title: string;
  body: string;
}

export interface ScholarStep {
  step: string;
  title: string;
  body: string;
}

export interface ScholarTrustItem {
  id: string;
  title: string;
  body: string;
}

export const SCHOLAR_CAPABILITIES: readonly ScholarCapability[] = [
  {
    id: "administration",
    title: "School administration",
    body: "Keep essential school records, organization settings, and administrative workflows organized in one place.",
    href: "/#administration",
  },
  {
    id: "academic",
    title: "Academic operations",
    body: "Manage the academic records and everyday processes your school uses — classes, subjects, attendance, and assessment information.",
    href: "/#academic",
  },
  {
    id: "classroom",
    title: "Teacher and student workflows",
    body: "Give teachers and students role-appropriate workspaces so classroom responsibilities sit next to the academic information they need.",
    href: "/#community",
  },
  {
    id: "families",
    title: "Parent engagement",
    body: "Invite parents and guardians into a parent workspace so they can access information the school has made available about their children.",
    href: "/#community",
  },
];

export const SCHOLAR_PRINCIPLES: readonly ScholarPrinciple[] = [
  {
    id: "connected",
    title: "One connected environment",
    body: "Keep essential school information and workflows organized around the same institution, instead of spreading them across disconnected tools.",
  },
  {
    id: "roles",
    title: "Clear responsibilities",
    body: "Help administrators, teachers, students, and parents work within the access and responsibilities appropriate to their roles.",
  },
  {
    id: "practical",
    title: "Practical school operations",
    body: "Focus on the processes schools actually need to manage, rather than adding unnecessary complexity.",
  },
];

export const SCHOLAR_AUDIENCES: readonly ScholarAudience[] = [
  {
    id: "administrators",
    title: "School administrators",
    body: "Set up the organization, manage school records, invite staff and families, and keep day-to-day administration in one workspace.",
  },
  {
    id: "teachers",
    title: "Teachers",
    body: "Work from a teacher workspace with the classes, attendance, and academic information available to your role.",
  },
  {
    id: "students",
    title: "Students",
    body: "Sign in to a student workspace for the timetable, grades, attendance, and other records the school has made available.",
  },
  {
    id: "parents",
    title: "Parents and guardians",
    body: "Use a parent workspace to view information about your children that the school has authorized you to see.",
  },
];

export const SCHOLAR_PATH_STEPS: readonly ScholarStep[] = [
  {
    step: "01",
    title: "Set up your school",
    body: "Request an organization admin account. Sherivs provisions that account, then you configure the school information supported by the product.",
  },
  {
    step: "02",
    title: "Organize your operations",
    body: "Set up the academic records, roles, and workflows available in Sherivs Scholar for your institution.",
  },
  {
    step: "03",
    title: "Bring your school community in",
    body: "The admin invites administrators, teachers, students, and parents by email. Invited people sign in with the access appropriate to their role.",
  },
];

export const SCHOLAR_TRUST: readonly ScholarTrustItem[] = [
  {
    id: "roles",
    title: "Role-based access",
    body: "What someone can see and do follows from organization membership and role, not from hiding a button in the interface.",
  },
  {
    id: "tenancy",
    title: "School data separation",
    body: "Each organization's records are designed to stay isolated at the database layer, so one school cannot read another school's information.",
  },
  {
    id: "students",
    title: "Responsible handling of student information",
    body: "Student records live inside the school's organization. Access is granted to people the school has invited, with the responsibilities of their role.",
  },
  {
    id: "auth",
    title: "Secure authentication",
    body: "People sign in with authenticated accounts. Password recovery, session controls, and optional passkeys are part of the sign-in experience.",
  },
  {
    id: "accounts",
    title: "Account and access management",
    body: "Organization admins invite users and control membership. Revoking access is an administrative action inside the school, not a public-website setting.",
  },
];
