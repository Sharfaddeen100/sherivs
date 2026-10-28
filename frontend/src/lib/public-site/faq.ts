import { PRODUCT_NAME } from "@/lib/public-site/company";

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  related: readonly { href: string; label: string }[];
}

export const FAQ_CATEGORIES = ["Sherivs Scholar", "Getting started", "Access and privacy"] as const;

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: "what-is-sherivs-scholar",
    category: "Sherivs Scholar",
    question: "What is Sherivs Scholar?",
    answer:
      "Sherivs Scholar — the school management product from Sherivs — brings school administration, academic operations, and the school community into one organized environment.",
    related: [
      { href: "/solutions/education", label: PRODUCT_NAME },
      { href: "/#platform", label: "Overview" },
    ],
  },
  {
    id: "who-is-scholar-for",
    category: "Sherivs Scholar",
    question: "Who is Sherivs Scholar for?",
    answer:
      "Schools use Sherivs Scholar for day-to-day operations. Administrators, teachers, students, and parents work in role-appropriate workspaces, subject to the features available in the product.",
    related: [
      { href: "/#community", label: "School community" },
      { href: "/solutions", label: "Solutions" },
    ],
  },
  {
    id: "how-to-start",
    category: "Getting started",
    question: "How can our school get started?",
    answer:
      "There is no self-service sign-up. Request an organization admin account through the Get started form or write to hello@sherivs.com. Sherivs creates that admin account; the admin then invites other users by email with login credentials.",
    related: [
      { href: "/onboarding", label: "Get started" },
      { href: "/request-demo", label: "Request a demo" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    id: "parent-access",
    category: "Access and privacy",
    question: "Can parents access their children's information?",
    answer:
      "Yes, when the school invites a parent or guardian into the organization with a parent role. The parent workspace shows information the school has made available about their children. Access follows membership and role — it is not a public directory.",
    related: [
      { href: "/#community", label: "School community" },
      { href: "/help/team", label: "People and roles" },
    ],
  },
  {
    id: "school-information",
    category: "Access and privacy",
    question: "How does Sherivs handle school information?",
    answer:
      "School records live inside the school's organization. Sign-in establishes identity; membership and role decide what someone may do. Tenant-sensitive data is designed to be isolated at the database layer. See the privacy policy for the current public notice.",
    related: [
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    id: "support-path",
    category: "Getting started",
    question: "How can we get help?",
    answer:
      "Existing customers can write to support@sherivs.com or use in-workspace support where it is enabled. The public support form opens your email client; it does not create a ticket in a helpdesk unless that mail is received.",
    related: [
      { href: "/support", label: "Support" },
      { href: "/help", label: "Help center" },
    ],
  },
];

export const FAQ_PREVIEW_IDS = [
  "what-is-sherivs-scholar",
  "who-is-scholar-for",
  "how-to-start",
  "parent-access",
  "school-information",
  "support-path",
] as const;
