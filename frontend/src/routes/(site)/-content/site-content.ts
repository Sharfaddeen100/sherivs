/**
 * Sherivs Scholar public product page — marketing content view-models.
 *
 * Presentation-only copy for the (site) public route group. Every string here
 * is static marketing presentation: no backend call, no form, no fake state.
 * Capabilities are limited to implemented Scholar functionality.
 */

export interface SiteCapability {
  /** Stable anchor-safe identifier. */
  id: string;
  title: string;
  description: string;
}

export interface GovernanceGuarantee {
  id: string;
  title: string;
  description: string;
}

export interface RuntimeProof {
  /** Manifest identifier from the runtime layer, e.g. runtime:scholar. */
  manifestId: string;
  name: string;
  description: string;
  /** What this installation proves about the product. */
  proof: string;
}

/** Scholar capabilities surfaced on the public product page. */
export const SITE_CAPABILITIES: readonly SiteCapability[] = [
  {
    id: "school-administration",
    title: "School administration",
    description:
      "Keep essential school records, organization settings, and administrative workflows organized in one place.",
  },
  {
    id: "academic-operations",
    title: "Academic operations",
    description:
      "Manage classes, subjects, attendance, and assessment information as part of everyday school operations.",
  },
  {
    id: "teacher-student",
    title: "Teacher and student workflows",
    description:
      "Give teachers and students role-appropriate workspaces connected to the academic information they need.",
  },
  {
    id: "parent-engagement",
    title: "Parent engagement",
    description:
      "Invite parents and guardians into a parent workspace for information the school has made available about their children.",
  },
];

/** Security and access practices surfaced on the public site. */
export const SECURITY_GUARANTEES: readonly GovernanceGuarantee[] = [
  {
    id: "tenant-isolation",
    title: "School data separation",
    description:
      "Each organization's records are designed to stay isolated at the database layer. Application code is never treated as the only security boundary.",
  },
  {
    id: "role-access",
    title: "Role-based access",
    description:
      "What someone can see and do follows from organization membership and role, not from hiding a control in the interface.",
  },
  {
    id: "authentication",
    title: "Authenticated accounts",
    description:
      "People sign in with authenticated accounts. Password recovery and optional passkeys are part of the sign-in experience.",
  },
  {
    id: "invites",
    title: "Account and access management",
    description:
      "Sherivs provisions the organization admin. That admin invites other users. Revoking membership is an administrative action inside the school.",
  },
  {
    id: "student-records",
    title: "Student information",
    description:
      "Student records live inside the school's organization and are available to people the school has invited, according to their role.",
  },
  {
    id: "privacy-notice",
    title: "Public privacy notice",
    description:
      "The privacy policy describes current product practices. Sherivs does not display certification badges or audit claims that are not on file.",
  },
];

/** The first installed runtime, named as a product — never as the company. */
export const INSTALLED_RUNTIME_PROOFS: readonly RuntimeProof[] = [
  {
    manifestId: "runtime:scholar",
    name: "Scholar",
    description: "Sherivs Scholar — the school management product available on Sherivs today.",
    proof:
      "Runtime-001 is installed as Scholar. The company remains Sherivs; the kernel stays fully valid without treating Scholar as the company platform.",
  },
];
