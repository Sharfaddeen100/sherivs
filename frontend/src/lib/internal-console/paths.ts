/**
 * Sherivs Internal Console (Plane D) paths.
 *
 * Canonical home is `/console`. The retired `/internal`, `/super-admin`, and
 * `/command-centre` prototypes are not restored.
 */
export const CONSOLE_HOME_PATH = "/console" as const;

export const CONSOLE_PATHS = {
  home: CONSOLE_HOME_PATH,
  team: `${CONSOLE_HOME_PATH}/team`,
  teamInvitations: `${CONSOLE_HOME_PATH}/team/invitations`,
  teamAccess: `${CONSOLE_HOME_PATH}/team/access`,
  workspaces: `${CONSOLE_HOME_PATH}/workspaces`,
  myWorkspace: `${CONSOLE_HOME_PATH}/workspaces/me`,
  workspace: (id: string) => `${CONSOLE_HOME_PATH}/workspaces/${encodeURIComponent(id)}`,
  runtimes: `${CONSOLE_HOME_PATH}/runtimes`,
  scholar: `${CONSOLE_HOME_PATH}/runtimes/scholar`,
  activity: `${CONSOLE_HOME_PATH}/activity`,
  activityAdmin: `${CONSOLE_HOME_PATH}/activity/admin`,
  activitySecurity: `${CONSOLE_HOME_PATH}/activity/security`,
  activityLogs: `${CONSOLE_HOME_PATH}/activity/logs`,
  activityMetrics: `${CONSOLE_HOME_PATH}/activity/metrics`,
  account: `${CONSOLE_HOME_PATH}/account`,
  settings: `${CONSOLE_HOME_PATH}/settings`,
  help: `${CONSOLE_HOME_PATH}/help`,
} as const;

export const SCHOLAR_APP_ORIGIN = "https://app.sherivs.com";
export const SCHOLAR_ENTRY_PATH = "/home";
export const SCHOLAR_ENTRY_URL = `${SCHOLAR_APP_ORIGIN}${SCHOLAR_ENTRY_PATH}`;
