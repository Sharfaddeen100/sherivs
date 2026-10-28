/**
 * Owner-provided public company facts for Sherivs Technologies Limited.
 *
 * Do not invent street addresses, phone numbers, registration numbers, or
 * social URLs. Mailbox SMTP delivery was not proven; sherivs.com has MX
 * records at privateemail.com (audited 2026-10-26). Forms still use mailto
 * and never claim a ticket exists.
 *
 * V1 public positioning (2026-10-28): Sherivs is the company; Sherivs Scholar
 * is the first product; schools are the initial customer segment. Directional
 * language describes company intent, not a claim that every future capability
 * is generally available today.
 */
export const LEGAL_ENTITY_NAME = "Sherivs Technologies Limited";
export const PUBLIC_BRAND_NAME = "Sherivs";
export const PRODUCT_NAME = "Sherivs Scholar";
export const COMPANY_LOCALITY = "Maiduguri";
export const COMPANY_REGION = "Borno State";
export const COMPANY_COUNTRY = "Nigeria";
export const COMPANY_COUNTRY_CODE = "NG";
export const COMPANY_LOCATION_LINE = "Maiduguri, Borno State, Nigeria";
export const PUBLIC_WEBSITE_HOST = "www.sherivs.com";

/**
 * Internal operational fact only. Must never render as a homepage
 * availability announcement, badge, or banner (owner 002).
 */
export const ACCEPTING_CUSTOMERS = true;

export const POSITIONING_TAGLINE = "Thoughtful technology for better-run schools";
export const POSITIONING_STATEMENT =
  "Sherivs is introducing Sherivs Scholar, a school management platform that brings school administration, academic operations, and the school community into one connected environment.";
export const POSITIONING_RETHINKING =
  "We focus on the people and processes that keep schools moving — administrators, teachers, students, and parents — rather than presenting a catalogue of future product families.";
export const POSITIONING_PROGRAMMABLE =
  "Sherivs may introduce additional products over time. The V1 public website presents the product schools can use today: Sherivs Scholar.";
export const POSITIONING_FOUNDATIONS =
  "Sherivs Scholar focuses on practical school needs, coherent workflows, responsible access, and product experiences that respect the people who use them.";
export const COMPANY_MISSION =
  "Build dependable software that helps schools manage their everyday responsibilities with greater clarity and coordination.";
export const COMPANY_VISION =
  "Make school operations more connected, accessible, and organized through thoughtful technology.";
export const COMPANY_APPROACH =
  "We focus on practical school needs, coherent workflows, responsible access, and product experiences that respect the people who use them.";
export const BRAND_STATEMENT = "Thoughtful technology for better-run schools.";
export const BRAND_SUPPORTING =
  "Sherivs builds practical software for the people and processes that keep schools moving.";

export const EMAIL_ROUTING = {
  info: {
    address: "info@sherivs.com",
    purpose: "General company and administrative inquiries",
  },
  hello: {
    address: "hello@sherivs.com",
    purpose: "Demo requests, prospective customers, partnerships, business development",
  },
  support: {
    address: "support@sherivs.com",
    purpose: "Existing-customer support, technical problems, account help",
  },
} as const;

export const MAIL_DELIVERY_NOTE =
  "Public forms open the visitor's email client. Sherivs does not confirm that a message was delivered or that a ticket was created until that mail is received. Dedicated privacy@ and legal@ mailboxes have not been owner-confirmed; those topics use info@sherivs.com.";
