import { POSITIONING_TAGLINE, PRODUCT_NAME } from "@/lib/public-site/company";

/**
 * Public navigation and footer model. Links only to real public routes
 * or homepage section anchors. Internal `/platform` (engineering) and
 * console hosts are never linked.
 */
export interface NavLink {
  href: string;
  label: string;
  description?: string;
  status?: "available" | "in_development" | "planned";
}

export interface NavGroup {
  id: string;
  label: string;
  href?: string;
  items: readonly NavLink[];
}

export const PRODUCT_NAV: NavGroup = {
  id: "product",
  label: "Product",
  href: "/solutions/education",
  items: [
    {
      href: "/solutions/education",
      label: PRODUCT_NAME,
      description: "The school management platform from Sherivs.",
    },
    {
      href: "/#platform",
      label: "Overview",
      description: "How Sherivs Scholar brings school operations together.",
    },
    {
      href: "/#capabilities",
      label: "Product capabilities",
      description: "Administration, academics, and school community workflows.",
    },
  ],
};

export const SOLUTIONS_NAV: NavGroup = {
  id: "solutions",
  label: "Solutions",
  href: "/solutions",
  items: [
    {
      href: "/solutions/education",
      label: "Schools",
      description: "Sherivs Scholar for the people and processes that run a school.",
    },
    {
      href: "/#administration",
      label: "School administration",
      description: "Records, organization settings, and administrative workflows.",
    },
    {
      href: "/#academic",
      label: "Academic operations",
      description: "Classes, subjects, attendance, and academic information.",
    },
  ],
};

export const ABOUT_NAV: NavGroup = {
  id: "about",
  label: "About",
  href: "/about",
  items: [
    { href: "/about", label: "Company overview", description: "Who Sherivs is and what we are introducing." },
    { href: "/company/vision", label: "Vision and mission", description: "The direction behind Sherivs Scholar." },
    { href: "/contact", label: "Contact", description: "Write to the Sherivs team." },
  ],
};

export const RESOURCES_NAV: NavGroup = {
  id: "resources",
  label: "Resources",
  href: "/help",
  items: [
    { href: "/help", label: "Help and support", description: "Guides that match implemented functionality." },
    { href: "/faq", label: "Frequently asked questions", description: "Short answers about Sherivs Scholar." },
    { href: "/docs", label: "Documentation", description: "Help, FAQs, and product references." },
    { href: "/support", label: "Contact support", description: "Existing-customer support at support@sherivs.com." },
  ],
};

export const FOOTER_PRODUCT: NavGroup = {
  id: "footer-product",
  label: "Product",
  items: [
    { href: "/solutions/education", label: PRODUCT_NAME },
    { href: "/#platform", label: "Product overview" },
    { href: "/onboarding", label: "Get started" },
  ],
};

export const FOOTER_SOLUTIONS: NavGroup = {
  id: "footer-solutions",
  label: "Solutions",
  items: [
    { href: "/#administration", label: "School administration" },
    { href: "/#academic", label: "Academic operations" },
    { href: "/#community", label: "School community" },
  ],
};

export const FOOTER_RESOURCES: NavGroup = {
  id: "footer-resources",
  label: "Resources",
  items: [
    { href: "/faq", label: "Frequently asked questions" },
    { href: "/help", label: "Help and support" },
    { href: "/docs", label: "Documentation" },
    { href: "/support", label: "Support" },
  ],
};

export const FOOTER_COMPANY: NavGroup = {
  id: "footer-company",
  label: "Company",
  items: [
    { href: "/about", label: "About Sherivs" },
    { href: "/company/vision", label: "Vision and mission" },
    { href: "/contact", label: "Contact" },
  ],
};

export const FOOTER_LEGAL: NavGroup = {
  id: "footer-legal",
  label: "Legal",
  items: [
    { href: "/privacy-policy", label: "Privacy policy" },
    { href: "/terms", label: "Terms of service" },
    { href: "/legal/acceptable-use", label: "Acceptable use policy" },
  ],
};

/** Header groups for the public marketing chrome. */
export const HEADER_GROUPS: readonly NavGroup[] = [
  PRODUCT_NAV,
  SOLUTIONS_NAV,
  ABOUT_NAV,
  RESOURCES_NAV,
];

export const FOOTER_GROUPS: readonly NavGroup[] = [
  FOOTER_PRODUCT,
  FOOTER_SOLUTIONS,
  FOOTER_RESOURCES,
  FOOTER_COMPANY,
  FOOTER_LEGAL,
];

/** @deprecated Use ABOUT_NAV. Kept so older imports fail loudly in review if revived. */
export const COMPANY_NAV = ABOUT_NAV;

export const LEGAL_NAV = FOOTER_LEGAL;

/** Primary public sitemap entries (indexable, canonical company site). */
export const PUBLIC_SITEMAP_PATHS: readonly string[] = [
  "/",
  "/solutions/education",
  "/solutions",
  "/sherivs",
  "/about",
  "/company/vision",
  "/contact",
  "/request-demo",
  "/insights",
  "/faq",
  "/help",
  "/docs",
  "/support",
  "/status",
  "/security",
  "/trust",
  "/privacy-policy",
  "/terms",
  "/legal/acceptable-use",
  "/legal/contact",
  "/accessibility",
  "/security/disclosure",
];

export { POSITIONING_TAGLINE };
