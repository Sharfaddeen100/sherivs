/**
 * CoreGrid — Phase 06/25: workspace navigation DATA seeds.
 *
 * This module is the single home for navigation metadata. Scholar R-001 is
 * the first runtime to publish contributions — as DATA, capability-coded,
 * with no UI logic and no other hard-coded navigation anywhere in the shell.
 * Future runtimes (commerce, government, …) publish their own contributions
 * exactly the same way.
 *
 * Labels here are display data owned by the contributing runtime. The icons
 * are registry KEYS; the UI maps keys to components.
 */
import type { NavContribution } from "./navigation";

export const RUNTIME_SCHOLAR = "runtime:scholar";

export type ScholarPortalKind = "parent" | "student";

/** R-001 portal capability codes (authorization data, P08 resolves later). */
const P = "r001:parent";
const S = "r001:student";

export const SCHOLAR_PORTAL_CAPABILITIES: Readonly<Record<ScholarPortalKind, readonly string[]>> = {
  parent: [
    `${P}.dashboard`,
    `${P}.children`,
    `${P}.grades`,
    `${P}.attendance`,
    `${P}.fees`,
    `${P}.report_cards`,
    `${P}.bus`,
    `${P}.ai_assistant`,
    `${P}.calendar`,
    `${P}.news`,
    `${P}.messages`,
    `${P}.notifications`,
    `${P}.settings`,
  ],
  student: [
    `${S}.dashboard`,
    `${S}.timetable`,
    `${S}.grades`,
    `${S}.attendance`,
    `${S}.report_card`,
    `${S}.fees`,
    `${S}.ai_tutor`,
    `${S}.calendar`,
    `${S}.news`,
    `${S}.messages`,
    `${S}.notifications`,
    `${S}.settings`,
  ],
};

/** Initial allowed set for a Scholar portal member (legacy role substitute). */
export function scholarCapabilitiesForPortal(kind: ScholarPortalKind): ReadonlySet<string> {
  return new Set(SCHOLAR_PORTAL_CAPABILITIES[kind]);
}

/**
 * Scholar R-001 contribution seeds. item.orderHint 0–4 select the mobile
 * quick-nav; higher hints feed the full workspace sidebar later.
 */
export const SCHOLAR_NAV_CONTRIBUTIONS: readonly NavContribution[] = [
  {
    runtimeRef: RUNTIME_SCHOLAR,
    sectionKey: "scholar",
    sectionLabel: "Scholar workspace",
    items: [
      {
        key: "r001.parent.dashboard",
        label: "Home",
        iconKey: "home",
        url: "/parent/dashboard",
        capabilities: [`${P}.dashboard`],
        orderHint: 0,
      },
      {
        key: "r001.parent.children",
        label: "Children",
        iconKey: "children",
        url: "/parent/children",
        capabilities: [`${P}.children`],
        orderHint: 1,
      },
      {
        key: "r001.parent.fees",
        label: "Fees",
        iconKey: "fees",
        url: "/parent/fees",
        capabilities: [`${P}.fees`],
        orderHint: 2,
      },
      {
        key: "r001.parent.bus",
        label: "Bus",
        iconKey: "bus",
        url: "/parent/bus-tracking",
        capabilities: [`${P}.bus`],
        orderHint: 3,
      },
      {
        key: "r001.parent.ai",
        label: "AI Assistant",
        iconKey: "ai",
        url: "/parent/ai-assistant",
        capabilities: [`${P}.ai_assistant`],
        orderHint: 4,
      },
      {
        key: "r001.parent.grades",
        label: "Grades",
        iconKey: "grades",
        url: "/parent/grades",
        capabilities: [`${P}.grades`],
        orderHint: 10,
      },
      {
        key: "r001.parent.attendance",
        label: "Attendance",
        iconKey: "attendance",
        url: "/parent/attendance",
        capabilities: [`${P}.attendance`],
        orderHint: 11,
      },
      {
        key: "r001.parent.report_cards",
        label: "Report cards",
        iconKey: "report",
        url: "/parent/report-cards",
        capabilities: [`${P}.report_cards`],
        orderHint: 12,
      },
      {
        key: "r001.parent.calendar",
        label: "Calendar",
        iconKey: "calendar",
        url: "/parent/calendar",
        capabilities: [`${P}.calendar`],
        orderHint: 13,
      },
      {
        key: "r001.parent.news",
        label: "News",
        iconKey: "news",
        url: "/parent/news",
        capabilities: [`${P}.news`],
        orderHint: 14,
      },
      {
        key: "r001.parent.messages",
        label: "Messages",
        iconKey: "messages",
        url: "/messages",
        capabilities: [`${P}.messages`],
        orderHint: 15,
      },
      {
        key: "r001.parent.notifications",
        label: "Notifications",
        iconKey: "notifications",
        url: "/notifications",
        capabilities: [`${P}.notifications`],
        orderHint: 16,
      },
      {
        key: "r001.parent.settings",
        label: "Settings",
        iconKey: "settings",
        url: "/settings",
        capabilities: [`${P}.settings`],
        orderHint: 17,
      },

      {
        key: "r001.student.dashboard",
        label: "Home",
        iconKey: "home",
        url: "/student/dashboard",
        capabilities: [`${S}.dashboard`],
        orderHint: 0,
      },
      {
        key: "r001.student.timetable",
        label: "Timetable",
        iconKey: "timetable",
        url: "/student/timetable",
        capabilities: [`${S}.timetable`],
        orderHint: 1,
      },
      {
        key: "r001.student.grades",
        label: "Grades",
        iconKey: "grades",
        url: "/student/grades",
        capabilities: [`${S}.grades`],
        orderHint: 2,
      },
      {
        key: "r001.student.ai_tutor",
        label: "AI Tutor",
        iconKey: "ai",
        url: "/student/ai-tutor",
        capabilities: [`${S}.ai_tutor`],
        orderHint: 3,
      },
      {
        key: "r001.student.fees",
        label: "Fees",
        iconKey: "fees",
        url: "/student/fees",
        capabilities: [`${S}.fees`],
        orderHint: 4,
      },
      {
        key: "r001.student.attendance",
        label: "Attendance",
        iconKey: "attendance",
        url: "/student/attendance",
        capabilities: [`${S}.attendance`],
        orderHint: 10,
      },
      {
        key: "r001.student.report_card",
        label: "Report Card",
        iconKey: "report",
        url: "/student/report-card",
        capabilities: [`${S}.report_card`],
        orderHint: 11,
      },
      {
        key: "r001.student.calendar",
        label: "Calendar",
        iconKey: "calendar",
        url: "/student/calendar",
        capabilities: [`${S}.calendar`],
        orderHint: 12,
      },
      {
        key: "r001.student.news",
        label: "News",
        iconKey: "news",
        url: "/student/news",
        capabilities: [`${S}.news`],
        orderHint: 13,
      },
      {
        key: "r001.student.messages",
        label: "Messages",
        iconKey: "messages",
        url: "/messages",
        capabilities: [`${S}.messages`],
        orderHint: 14,
      },
      {
        key: "r001.student.notifications",
        label: "Notifications",
        iconKey: "notifications",
        url: "/notifications",
        capabilities: [`${S}.notifications`],
        orderHint: 15,
      },
      {
        key: "r001.student.settings",
        label: "Settings",
        iconKey: "settings",
        url: "/settings",
        capabilities: [`${S}.settings`],
        orderHint: 16,
      },
    ],
  },
];
