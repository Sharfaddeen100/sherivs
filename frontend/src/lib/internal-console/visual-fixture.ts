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
import type {
  ConsoleActivityItem,
  ConsoleAttentionItem,
  ConsoleMetric,
  ConsoleOverview,
} from "./overview";
import { formatRatio } from "./metrics";
import {
  isOrganizationLifecycleState,
  summarizeOrganizationStates,
  type OrganizationAssignmentRecord,
  type OrganizationLifecycleState,
} from "./organization-lifecycle";

export const CONSOLE_FIXTURE_STORAGE_KEY = "sherivs:console-visual-fixture";
export const CONSOLE_FIXTURE_ORGS_KEY = "sherivs:console-visual-fixture-orgs";

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

type FixtureOrganizationRow = {
  id: string;
  displayName: string;
  lifecycleState: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  enabledRuntime?: "scholar" | null;
  schoolId?: string | null;
  slug?: string | null;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string | null;
  provisionedAt?: string | null;
  activatedAt?: string | null;
  onboardingOwnerName?: string | null;
  assignmentCount?: number;
  assignments?: OrganizationAssignmentRecord[];
  transitions?: Array<{
    id: string;
    fromState: OrganizationLifecycleState | null;
    toState: OrganizationLifecycleState;
    actorId: string | null;
    reason: string | null;
    at: string;
  }>;
};

function emptyOrganizationMetrics() {
  return {
    available: true as const,
    source: "local visual fixture organization store",
    total: 0,
    active: 0,
    onboarding: 0,
    suspended: 0,
    failedProvisioning: 0,
    submitted: 0,
    conversionRate: null as number | null,
    medianOnboardingHours: null as number | null,
  };
}

export function readFixtureOrganizationSnapshot(raw: string | null): {
  metrics: ReturnType<typeof emptyOrganizationMetrics>;
  organizations: ConsoleOverview["organizations"];
  assignments: OrganizationAssignmentRecord[];
  activity: ConsoleActivityItem[];
} {
  const empty = {
    metrics: emptyOrganizationMetrics(),
    organizations: [] as ConsoleOverview["organizations"],
    assignments: [] as OrganizationAssignmentRecord[],
    activity: [] as ConsoleActivityItem[],
  };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw) as { organizations?: FixtureOrganizationRow[] };
    const rows = Array.isArray(parsed.organizations) ? parsed.organizations : [];
    const states = rows.map((row) => row.lifecycleState).filter(isOrganizationLifecycleState);
    const assignments = rows.flatMap((row) =>
      (row.assignments ?? []).filter((item) => item.status === "active"),
    );
    const activity = rows
      .flatMap((row) =>
        (row.transitions ?? []).map((item) => ({
          id: item.id,
          description: `${row.displayName}: ${item.fromState ?? "none"} → ${item.toState}`,
          actor:
            item.actorId === CONSOLE_FIXTURE_OPERATOR.id
              ? CONSOLE_FIXTURE_OPERATOR.name
              : item.actorId,
          target: row.displayName,
          at: item.at,
          outcome: "recorded",
          action: item.reason ?? item.toState,
        })),
      )
      .sort((left, right) => (left.at < right.at ? 1 : -1))
      .slice(0, 12);
    return {
      metrics: {
        ...empty.metrics,
        ...summarizeOrganizationStates(states),
      },
      organizations: rows.map((row) => {
        const lifecycleState = isOrganizationLifecycleState(row.lifecycleState)
          ? row.lifecycleState
          : ("draft" as const);
        const activeAssignments = (row.assignments ?? []).filter((item) => item.status === "active");
        return {
          id: row.id,
          displayName: row.displayName,
          orgType: "school" as const,
          lifecycleState,
          country: row.country ?? null,
          region: row.region ?? null,
          city: row.city ?? null,
          intendedRuntime: "scholar" as const,
          enabledRuntime: row.enabledRuntime ?? null,
          schoolId: row.schoolId ?? null,
          slug: row.slug ?? null,
          createdAt: row.createdAt ?? "2026-10-27T00:00:00.000Z",
          updatedAt: row.updatedAt ?? "2026-10-27T00:00:00.000Z",
          submittedAt: row.submittedAt ?? null,
          provisionedAt: row.provisionedAt ?? null,
          activatedAt: row.activatedAt ?? null,
          onboardingOwnerName:
            row.onboardingOwnerName ??
            activeAssignments.find((item) => item.assignmentType === "onboarding_owner")?.staffName ??
            null,
          assignmentCount: row.assignmentCount ?? activeAssignments.length,
        };
      }),
      assignments,
      activity,
    };
  } catch {
    return empty;
  }
}

function fixtureOrganizationSnapshot() {
  if (typeof window === "undefined") return readFixtureOrganizationSnapshot(null);
  try {
    return readFixtureOrganizationSnapshot(window.sessionStorage.getItem(CONSOLE_FIXTURE_ORGS_KEY));
  } catch {
    return readFixtureOrganizationSnapshot(null);
  }
}

function fixtureOrganizationMetricsCards(
  snapshot: ReturnType<typeof readFixtureOrganizationSnapshot>,
): ConsoleMetric[] {
  const source = snapshot.metrics.source;
  const cards: ConsoleMetric[] = [
    {
      key: "control-plane-organizations",
      name: "Control-plane organizations",
      value: String(snapshot.metrics.total),
      unit: "organizations",
      window: "current",
      source,
      updatedAt: null,
      available: true,
      definition: "Organization lifecycle cases recorded in the local visual fixture store.",
    },
    {
      key: "active-organizations",
      name: "Active organizations",
      value: String(snapshot.metrics.active),
      unit: "organizations",
      window: "current",
      source,
      updatedAt: null,
      available: true,
      definition: "Fixture cases in state active.",
    },
    {
      key: "onboarding-organizations",
      name: "Organizations onboarding",
      value: String(snapshot.metrics.onboarding),
      unit: "organizations",
      window: "current",
      source,
      updatedAt: null,
      available: true,
      definition: "Fixture cases that have started and are not yet active, suspended, or deactivated.",
    },
    {
      key: "suspended-organizations",
      name: "Suspended organizations",
      value: String(snapshot.metrics.suspended),
      unit: "organizations",
      window: "current",
      source,
      updatedAt: null,
      available: true,
      definition: "Fixture cases in state suspended. Records are retained.",
    },
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
  ];
  if (snapshot.metrics.conversionRate !== null) {
    cards.splice(4, 0, {
      key: "onboarding-conversion",
      name: "Onboarding completion rate",
      value: formatRatio(snapshot.metrics.conversionRate),
      unit: "%",
      window: "all recorded cases",
      source,
      updatedAt: null,
      available: true,
      definition: "Active fixture cases divided by cases that have left draft.",
    });
  }
  return cards;
}

function fixtureAttention(
  snapshot: ReturnType<typeof readFixtureOrganizationSnapshot>,
): ConsoleAttentionItem[] {
  const items: ConsoleAttentionItem[] = [
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
  ];
  if (snapshot.metrics.failedProvisioning > 0) {
    items.unshift({
      id: "provisioning-failed",
      severity: "high",
      title: `${snapshot.metrics.failedProvisioning} provisioning failure${snapshot.metrics.failedProvisioning === 1 ? "" : "s"}`,
      description: "Provisioning failed for one or more fixture organization cases.",
      detectedAt: "2026-10-27T00:00:00.000Z",
      resource: "Organizations",
      owner: null,
      nextAction: "Open organization directory",
      href: CONSOLE_PATHS.organizations,
    });
  }
  if (snapshot.metrics.onboarding > 0) {
    items.unshift({
      id: "onboarding-pipeline",
      severity: "medium",
      title: `${snapshot.metrics.onboarding} organization${snapshot.metrics.onboarding === 1 ? "" : "s"} in the onboarding pipeline`,
      description: "These fixture cases are not yet active.",
      detectedAt: "2026-10-27T00:00:00.000Z",
      resource: "Organizations",
      owner: null,
      nextAction: "Review onboarding",
      href: CONSOLE_PATHS.organizations,
    });
  }
  return items;
}

export function buildConsoleVisualFixtureOverview(): ConsoleOverview {
  const roles = [...CONSOLE_FIXTURE_OPERATOR.roles];
  const capabilities = [...viewerCapabilities(roles, false)];
  const workspaces = workspacesForViewer({
    displayName: CONSOLE_FIXTURE_OPERATOR.name,
    isSuperAdmin: false,
    roles,
  });
  const snapshot = fixtureOrganizationSnapshot();
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
    metrics: fixtureOrganizationMetricsCards(snapshot),
    attention: fixtureAttention(snapshot),
    activity: snapshot.activity,
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
    organizations: snapshot.organizations,
    organizationStore: "fixture",
    organizationMetrics: snapshot.metrics,
    assignments: snapshot.assignments.filter(
      (item) => item.staffId === CONSOLE_FIXTURE_OPERATOR.id,
    ),
    scholarTenants: null,
    registeredUsers: null,
    activeUsers30d: null,
  };
}
