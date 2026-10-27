/**
 * Local visual-verification fixture for the Internal Console.
 *
 * Triple-gated: Vite DEV, VITE_CONSOLE_VISUAL_FIXTURE=1, and localhost.
 * Production builds never activate this path. It is not an authentication
 * bypass and must not be used against customer data.
 */
import { viewerCapabilities, presentationRoleFor, presentationRoleLabel } from "./roles";
import { workspacesForViewer } from "./workspaces";
import { REGISTERED_RUNTIMES } from "./runtime-contract";
import { CONSOLE_PATHS } from "./paths";
import { overallFromCards } from "./status";
import type { ConsoleOverview } from "./overview";

export const CONSOLE_FIXTURE_STORAGE_KEY = "sherivs:console-visual-fixture";

export const CONSOLE_FIXTURE_OPERATOR = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "console.fixture@localhost",
  name: "Fixture Operator",
  roles: ["platform_admin", "engineering"] as const,
};

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

export function consoleVisualFixtureConfigured(input: {
  dev: boolean;
  flag: string | undefined;
  hostname: string | null;
}): boolean {
  if (!input.dev) return false;
  if (input.flag !== "1") return false;
  if (!input.hostname || !LOCAL_HOSTS.has(input.hostname)) return false;
  return true;
}

export function consoleVisualFixtureEnabled(): boolean {
  return consoleVisualFixtureConfigured({
    dev: import.meta.env.DEV === true,
    flag: import.meta.env.VITE_CONSOLE_VISUAL_FIXTURE as string | undefined,
    hostname: typeof window === "undefined" ? null : window.location.hostname,
  });
}

export function consoleVisualFixtureActive(): boolean {
  if (!consoleVisualFixtureEnabled()) return false;
  try {
    return window.sessionStorage.getItem(CONSOLE_FIXTURE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function activateConsoleVisualFixture(): void {
  if (!consoleVisualFixtureEnabled()) return;
  window.sessionStorage.setItem(CONSOLE_FIXTURE_STORAGE_KEY, "1");
}

export function deactivateConsoleVisualFixture(): void {
  try {
    window.sessionStorage.removeItem(CONSOLE_FIXTURE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function buildConsoleVisualFixtureOverview(): ConsoleOverview {
  const roles = [...CONSOLE_FIXTURE_OPERATOR.roles];
  const capabilities = [...viewerCapabilities(roles, false)];
  const workspaces = workspacesForViewer({
    displayName: CONSOLE_FIXTURE_OPERATOR.name,
    isSuperAdmin: false,
    roles,
  });
  const healthCards = [
    {
      key: "platform",
      name: "Platform process",
      status: "unknown" as const,
      detail: "Process health is not queried in the local visual fixture.",
      lastCheck: null,
      href: CONSOLE_PATHS.activityMetrics,
      source: "local visual fixture",
    },
    {
      key: "scholar",
      name: "Sherivs Scholar",
      status: "unknown" as const,
      detail: "Runtime health is not queried in the local visual fixture.",
      lastCheck: null,
      href: CONSOLE_PATHS.scholar,
      source: "local visual fixture",
    },
    {
      key: "database",
      name: "Database",
      status: "unknown" as const,
      detail: "Persistent Internal Console storage is not connected in this fixture.",
      lastCheck: null,
      href: CONSOLE_PATHS.workspaces,
      source: "local visual fixture",
    },
    {
      key: "auth",
      name: "Authentication",
      status: "unknown" as const,
      detail: "This session is a local fixture operator, not a production identity.",
      lastCheck: null,
      href: CONSOLE_PATHS.account,
      source: "local visual fixture",
    },
  ];
  return {
    viewer: {
      id: CONSOLE_FIXTURE_OPERATOR.id,
      name: CONSOLE_FIXTURE_OPERATOR.name,
      email: CONSOLE_FIXTURE_OPERATOR.email,
      isSuperAdmin: false,
      roles,
      presentationRole: presentationRoleFor({ isSuperAdmin: false, roles }),
      presentationLabel: presentationRoleLabel({ isSuperAdmin: false, roles }),
      capabilities,
    },
    context: {
      organization: "Sherivs Internal",
      workspace: workspaces[0]?.name ?? "My Workspace",
      environment: "Development",
      environmentSource: "local visual fixture",
      host: "127.0.0.1",
      version: null,
    },
    health: {
      overall: overallFromCards(healthCards.map((card) => card.status)),
      cards: healthCards,
      caveat: "These statuses describe the local visual fixture, not a live environment.",
    },
    metrics: [
      {
        key: "active-staff",
        name: "Active Internal Staff",
        value: null,
        unit: "people",
        window: "current active memberships",
        source: "not queried",
        updatedAt: null,
        available: false,
        definition: "Not collected in the local visual fixture.",
      },
    ],
    attention: [
      {
        id: "fixture-store",
        severity: "medium",
        title: "Persistent workspace storage is not connected",
        description:
          "This local fixture uses compatibility workspaces from role membership. Custom members cannot be stored.",
        detectedAt: "2026-10-27T00:00:00.000Z",
        resource: "Workspaces",
        owner: null,
        nextAction: "Review workspace directory",
        href: CONSOLE_PATHS.workspaces,
      },
    ],
    activity: [],
    workspaces,
    workspaceStore: "derived-fallback",
    runtimes: [...REGISTERED_RUNTIMES],
    recent: [],
    staff: [],
    staffAvailable: true,
    pendingInvitations: 0,
    expiredInvitations: 0,
    activeStaff: 0,
    usageDefinition:
      "Fixture directory is empty. No synthetic staff rows are shown as if they were live records.",
    organizations: [],
    organizationStore: "fixture",
    organizationMetrics: {
      available: true,
      source: "local visual fixture organization store",
      total: 0,
      active: 0,
      onboarding: 0,
      suspended: 0,
      failedProvisioning: 0,
      submitted: 0,
      conversionRate: null,
      medianOnboardingHours: null,
    },
    assignments: [],
    scholarTenants: null,
    registeredUsers: null,
    activeUsers30d: null,
  };
}
