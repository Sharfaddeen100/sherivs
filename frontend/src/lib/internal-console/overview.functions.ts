/**
 * Internal Console home snapshot. Operator-gated, no fabricated metrics.
 *
 * Homepage reads do not require AAL2 so staff can see operational status
 * after sign-in. Privileged writes remain AAL2-gated in staff.functions.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildHealthReport } from "@/lib/observability/health";
import { SystemClock, TimeAuthority } from "@/lib/kernel/time-authority";
import { CONSOLE_PATHS } from "./paths";
import { presentationRoleFor, presentationRoleLabel, viewerCapabilities } from "./roles";
import { overallFromCards, mapProcessHealth, type ConsoleHealthState } from "./status";
import { workspacesForViewer } from "./workspaces";
import type {
  ConsoleActivityItem,
  ConsoleAttentionItem,
  ConsoleHealthCard,
  ConsoleMetric,
  ConsoleOverview,
  ConsoleStaffRow,
} from "./overview";

const timeAuthority = new TimeAuthority(new SystemClock());

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function requestHost(): string | null {
  try {
    return new URL(getRequest().url).host || null;
  } catch {
    return null;
  }
}

function environmentLabel(): { environment: string; source: string } {
  const vercel = (process.env.VERCEL_ENV ?? "").trim();
  if (vercel === "production") return { environment: "Production", source: "VERCEL_ENV" };
  if (vercel === "preview") return { environment: "Preview", source: "VERCEL_ENV" };
  if (vercel === "development") return { environment: "Development", source: "VERCEL_ENV" };
  const node = (process.env.NODE_ENV ?? "").trim();
  if (node) return { environment: node === "production" ? "Production" : "Development", source: "NODE_ENV" };
  return { environment: "Unknown", source: "not configured" };
}

function describeAction(action: string): string {
  const map: Record<string, string> = {
    "platform_staff.invite": "A staff invitation was created",
    "platform_staff.resend_invite": "A staff invitation was resent",
    "platform_staff.status.suspended": "A staff member was suspended",
    "platform_staff.status.revoked": "A staff member was revoked",
    "platform_staff.status.active": "A staff member was restored",
    "platform_staff.set_roles": "Staff roles were changed",
    "platform_support.grant": "Time-limited support access was granted",
    "platform_support.revoke": "Support access was revoked",
    "platform_access_review.view": "An access review was opened",
  };
  return map[action] ?? action.replace(/[._]/g, " ");
}

export const getConsoleOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConsoleOverview> => {
    const { data: isStaff, error: staffErr } = await (context.supabase as unknown as RpcClient).rpc(
      "is_platform_staff",
    );
    if (staffErr || isStaff !== true) throw new Error("Not authorized");

    const now = timeAuthority.now().at;
    const { environment, source: environmentSource } = environmentLabel();
    const { data: superRow } = await context.supabase
      .from("super_admins")
      .select("id, full_name, email")
      .eq("id", context.userId)
      .maybeSingle();
    await context.supabase.rpc("claim_platform_staff_invite");
    const { data: staffRow } = await context.supabase
      .from("platform_staff")
      .select("id, full_name, email, status, platform_staff_roles(role_code)")
      .eq("id", context.userId)
      .eq("status", "active")
      .maybeSingle();
    const isSuperAdmin = Boolean(superRow);
    const roles = ((staffRow?.platform_staff_roles ?? []) as Array<{ role_code: string }>).map(
      (row) => row.role_code,
    );
    const capabilities = viewerCapabilities(roles, isSuperAdmin);
    const claimEmail =
      typeof (context.claims as { email?: unknown }).email === "string"
        ? (context.claims as { email: string }).email
        : "";
    const name = superRow?.full_name ?? staffRow?.full_name ?? (claimEmail || "Staff member");
    const email = superRow?.email ?? staffRow?.email ?? claimEmail;

    const healthReport = await buildHealthReport();
    const processStatus = mapProcessHealth(healthReport.status);

    let databaseStatus: ConsoleHealthState = "unknown";
    let databaseDetail = "The database check did not complete.";
    try {
      const db = await admin();
      const { error } = await db.from("platform_roles").select("code").limit(1);
      if (error) {
        databaseStatus = "unavailable";
        databaseDetail = "The required database health query failed.";
      } else {
        databaseStatus = "operational";
        databaseDetail = "The platform catalogue query succeeded. This does not prove every workflow.";
      }
    } catch {
      databaseStatus = "unavailable";
      databaseDetail = "The database probe could not run.";
    }

    const cards: ConsoleHealthCard[] = [
      {
        key: "platform",
        name: "Overall Platform Status",
        status: processStatus,
        detail:
          "Derived from the application process health report. A passing process is not proof that every workflow is functioning.",
        lastCheck: healthReport.ts,
        href: CONSOLE_PATHS.activityMetrics,
        source: "/health.json via buildHealthReport",
      },
      {
        key: "scholar",
        name: "Sherivs Scholar",
        status: processStatus,
        detail:
          "Scholar is served by this application process. This check does not prove every school workflow is functioning.",
        lastCheck: healthReport.ts,
        href: CONSOLE_PATHS.scholar,
        source: "same application process as /health.json",
      },
      {
        key: "auth",
        name: "Authentication",
        status: "operational",
        detail:
          "This request was authenticated. That does not prove every sign-in or recovery workflow is functioning.",
        lastCheck: now,
        href: CONSOLE_PATHS.account,
        source: "requireSupabaseAuth for this request",
      },
      {
        key: "database",
        name: "Database",
        status: databaseStatus,
        detail: databaseDetail,
        lastCheck: now,
        href: CONSOLE_PATHS.activityMetrics,
        source: "platform_roles catalogue query",
      },
      {
        key: "storage",
        name: "Storage",
        status: "unknown",
        detail: "Storage operations are not monitored on this page.",
        lastCheck: null,
        href: CONSOLE_PATHS.activityMetrics,
        source: "not configured",
      },
      {
        key: "integrations",
        name: "Critical Integrations",
        status: "unknown",
        detail: "Provider health is measured by verification drills, not this homepage.",
        lastCheck: null,
        href: CONSOLE_PATHS.activityMetrics,
        source: "not configured on homepage",
      },
      {
        key: "incidents",
        name: "Active Incidents",
        status: "unknown",
        detail: "Sherivs V1 has no incident-tracking store. Open incidents cannot be counted.",
        lastCheck: null,
        href: CONSOLE_PATHS.activity,
        source: "not configured",
      },
    ];

    const metrics: ConsoleMetric[] = [
      {
        key: "api-error",
        name: "API Error Rate",
        value: null,
        unit: "%",
        window: "not measured",
        source: "not configured",
        updatedAt: null,
        available: false,
        definition: "Eligible failed API requests divided by eligible API requests. Not collected in V1.",
      },
      {
        key: "api-latency",
        name: "API Latency",
        value: null,
        unit: "ms",
        window: "not measured",
        source: "not configured",
        updatedAt: null,
        available: false,
        definition: "Response-time percentiles for eligible API requests. Not collected in V1.",
      },
      {
        key: "incidents",
        name: "Active Incidents",
        value: null,
        unit: "count",
        window: "current",
        source: "not configured",
        updatedAt: null,
        available: false,
        definition: "Incidents currently open under an incident lifecycle. No incident table exists.",
      },
      {
        key: "uptime",
        name: "Application Process Uptime",
        value: String(Math.round(healthReport.uptime_s)),
        unit: "seconds",
        window: "since process start",
        source: "buildHealthReport process snapshot",
        updatedAt: healthReport.ts,
        available: true,
        definition: "Operating-system process uptime for this application instance.",
      },
    ];

    const canStaff = capabilities.has("platform.staff.read");
    const canAudit = capabilities.has("platform.audit.read");
    let staff: ConsoleStaffRow[] = [];
    let pendingInvitations: number | null = null;
    let activeStaff: number | null = null;

    if (canStaff) {
      const db = await admin();
      const { data, error } = await db
        .from("platform_staff")
        .select(
          "id, email, full_name, department, status, invited_at, activated_at, platform_staff_roles(role_code)",
        )
        .order("invited_at", { ascending: false })
        .limit(500);
      if (!error) {
        staff = (data ?? []).map((row) => ({
          id: row.id,
          email: row.email,
          fullName: row.full_name,
          department: row.department,
          status: row.status,
          invitedAt: row.invited_at,
          activatedAt: row.activated_at,
          roles: ((row.platform_staff_roles ?? []) as Array<{ role_code: string }>).map((x) => x.role_code),
        }));
        pendingInvitations = staff.filter((row) => row.status === "invited").length;
        activeStaff = staff.filter((row) => row.status === "active").length;
      }
    }

    const activity: ConsoleActivityItem[] = [];
    if (canAudit) {
      const db = await admin();
      const { data } = await db
        .from("audit_logs")
        .select("id, action, user_id, record_id, created_at, new_value")
        .or("action.like.platform_staff.%,action.like.platform_support.%,action.like.platform_access_review.%")
        .order("created_at", { ascending: false })
        .limit(20);
      const actorIds = [...new Set((data ?? []).map((row) => row.user_id).filter(Boolean))] as string[];
      const names = new Map<string, string>();
      if (actorIds.length) {
        const { data: people } = await db
          .from("platform_staff")
          .select("id, full_name, email")
          .in("id", actorIds);
        for (const person of people ?? []) names.set(person.id, person.full_name || person.email);
        const { data: supers } = await db.from("super_admins").select("id, full_name, email").in("id", actorIds);
        for (const person of supers ?? []) names.set(person.id, person.full_name || person.email);
      }
      for (const row of data ?? []) {
        const payload = (row.new_value ?? {}) as { outcome?: string; details?: Record<string, unknown> };
        activity.push({
          id: String(row.id),
          description: describeAction(row.action),
          actor: row.user_id ? (names.get(row.user_id) ?? "Staff member") : null,
          target: row.record_id,
          at: row.created_at ?? now,
          outcome: typeof payload.outcome === "string" ? payload.outcome : "recorded",
          action: row.action,
        });
      }
    }

    const attention: ConsoleAttentionItem[] = [];
    for (const card of cards) {
      if (card.status === "unavailable") {
        attention.push({
          id: `health-${card.key}`,
          severity: "critical",
          title: `${card.name} is unavailable`,
          description: card.detail,
          detectedAt: card.lastCheck ?? now,
          resource: card.name,
          owner: null,
          nextAction: "Open health details",
          href: card.href,
        });
      } else if (card.status === "degraded") {
        attention.push({
          id: `health-${card.key}`,
          severity: "high",
          title: `${card.name} is degraded`,
          description: card.detail,
          detectedAt: card.lastCheck ?? now,
          resource: card.name,
          owner: null,
          nextAction: "Review operational status",
          href: card.href,
        });
      }
    }
    if (typeof pendingInvitations === "number" && pendingInvitations > 0) {
      attention.push({
        id: "pending-invites",
        severity: "medium",
        title: `${pendingInvitations} staff invitation${pendingInvitations === 1 ? "" : "s"} pending`,
        description: "Invitations exist but have not been accepted. An invitation is not access.",
        detectedAt: now,
        resource: "Team & Access",
        owner: null,
        nextAction: "Review invitations",
        href: CONSOLE_PATHS.teamInvitations,
      });
    }

    if (canStaff) {
      metrics.push({
        key: "active-staff",
        name: "Active Internal Staff",
        value: activeStaff === null ? null : String(activeStaff),
        unit: "people",
        window: "current active memberships",
        source: "platform_staff.status = active",
        updatedAt: now,
        available: activeStaff !== null,
        definition: "Sherivs staff rows currently in status active. Customer-school users are excluded.",
      });
      metrics.push({
        key: "pending-invites",
        name: "Pending Staff Invitations",
        value: pendingInvitations === null ? null : String(pendingInvitations),
        unit: "invitations",
        window: "current",
        source: "platform_staff.status = invited",
        updatedAt: now,
        available: pendingInvitations !== null,
        definition: "Staff rows in status invited. Delivery is not implied.",
      });
    }

    const presentationRole = presentationRoleFor({ isSuperAdmin, roles });
    const workspaces = workspacesForViewer({ displayName: name, isSuperAdmin, roles });

    return {
      viewer: {
        id: context.userId,
        name,
        email,
        isSuperAdmin,
        roles,
        presentationRole,
        presentationLabel: presentationRoleLabel({ isSuperAdmin, roles }),
        capabilities: [...capabilities],
      },
      context: {
        organization: "Sherivs Internal",
        workspace: workspaces[0]?.name ?? "My Workspace",
        environment,
        environmentSource,
        host: requestHost(),
        version: healthReport.version,
      },
      health: {
        overall: overallFromCards(cards.map((card) => card.status)),
        cards,
        caveat:
          "These cards report verified checks only. Unknown means there is not enough evidence. A loaded homepage is not a health check.",
      },
      metrics,
      attention,
      activity,
      workspaces,
      staff,
      staffAvailable: canStaff,
      pendingInvitations,
      activeStaff,
      usageDefinition:
        "Active internal staff means platform_staff rows with status active. This number never includes school administrators, teachers, students, or parents.",
    };
  });
