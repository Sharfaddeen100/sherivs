import { CONSOLE_PATHS } from "./paths";
import type { ConsoleHelpArticle } from "./search";

export const CONSOLE_HELP_ARTICLES: readonly ConsoleHelpArticle[] = [
  {
    id: "console-vs-scholar",
    title: "Internal Console and Sherivs Scholar",
    description:
      "The Internal Console is for Sherivs staff. Sherivs Scholar serves schools. They share a shell language, not a dashboard.",
    href: CONSOLE_PATHS.help,
  },
  {
    id: "invitations",
    title: "Inviting staff",
    description:
      "Only authorized administrators can invite staff. An invitation is not access until it is accepted and the membership is active.",
    href: CONSOLE_PATHS.teamInvitations,
  },
  {
    id: "organizations",
    title: "Organization lifecycle",
    description:
      "Organizations move from draft through review and provisioning before they become active. Activation is a separate authorized step.",
    href: CONSOLE_PATHS.organizations,
  },
  {
    id: "workspaces",
    title: "Personal and shared workspaces",
    description:
      "Every staff member has a personal workspace. Role workspaces are shared operating environments. Membership is not a permission grant.",
    href: CONSOLE_PATHS.workspaces,
  },
  {
    id: "health",
    title: "How platform health is measured",
    description:
      "Status cards use verified checks. Unknown means there is not enough evidence. A loaded page is not a health check.",
    href: CONSOLE_PATHS.activityMetrics,
  },
  {
    id: "audit",
    title: "Audit records",
    description:
      "Administrative actions are recorded through trusted backend paths. Ordinary users cannot edit or delete them.",
    href: CONSOLE_PATHS.activity,
  },
];
