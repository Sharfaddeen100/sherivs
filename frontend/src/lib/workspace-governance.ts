/**
 * Sherivs — Phase 06 Workspace Engine governance, configuration, and observability (platform layer).
 *
 * Implements `architecture/phase-06-workspace-engine.md`:
 * - Workspace policy: available modules, allowed widgets, default layouts,
 *   allowed integrations, customization limits (Section CM).
 * - Workspace governance: administrators may manage modules, layouts, dashboards,
 *   membership, shared views according to permissions (Section CN).
 * - Administration surface: settings, member management, module management,
 *   dashboard management, configuration history, audit references (Section CO).
 * - Workspace audit: important changes produce audit records (Section CP).
 * - Configuration versioning and snapshots: versioned snapshots for rollback,
 *   auditing, experimentation, configuration migration (Sections CC–CE).
 * - Template inheritance, overrides, and deterministic conflict resolution
 *   (Sections CI–CL).
 * - Catalog: organized publication of standard workspaces, pages, dashboards,
 *   widgets, views, templates (Section GE).
 *
 * Phase 06 does not replace the core security/authorization architecture.
 */

import type { TenantId } from "./tenant-core";
import {
  workspaceSnapshotId,
  workspaceConfigVersionId,
  type Workspace,
  type WorkspaceId,
  type WorkspaceSnapshotId,
  type WorkspaceConfigVersionId,
  type WorkspaceAuditEvent,
  type WorkspaceAuditEventType,
} from "./workspace-core";
import type {
  WorkspacePage,
  WorkspaceDashboard,
  WorkspaceModule,
  WorkspaceTemplate,
  ViewScope,
  WorkspaceView,
} from "./workspace-composition";

/* ─────────────────────────────────────────────────────────────
 * Workspace configuration policy (Section CM)
 * ────────────────────────────────────────────────────────────*/

export interface WorkspaceConfigurationPolicy {
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  /** Modules allowed to appear in this workspace. */
  allowedModuleKeys: string[];
  /** Widget types allowed in this workspace. */
  allowedWidgetKeys: string[];
  /** Default layout key. */
  defaultLayoutKey: string | null;
  /** Integration capabilities allowed. */
  allowedIntegrationKeys: string[];
  /** Maximum number of widgets permitted per dashboard. */
  maxWidgetsPerDashboard: number;
  /** Whether personalization is permitted (Section AY). */
  allowPersonalization: boolean;
  /** Whether shared views may be published (Section BE). */
  allowSharedViews: boolean;
  /** Whether custom modules may be enabled. */
  allowCustomModules: boolean;
}

export type PolicyValidationResult = { ok: true } | { ok: false; errors: string[] };

/**
 * Validate a workspace policy against tenant/module/widget catalogs (Section CM).
 * Workspace policy may permit customization, but never bypass authorization (Section CM).
 */
export function validateWorkspacePolicy(
  policy: WorkspaceConfigurationPolicy,
  availableModuleKeys: readonly string[],
  availableWidgetKeys: readonly string[],
  availableIntegrationKeys: readonly string[],
): PolicyValidationResult {
  const errors: string[] = [];

  for (const m of policy.allowedModuleKeys) {
    if (!availableModuleKeys.includes(m)) {
      errors.push(`Module ${m} is not available in the catalog`);
    }
  }
  for (const w of policy.allowedWidgetKeys) {
    if (!availableWidgetKeys.includes(w)) {
      errors.push(`Widget ${w} is not available in the catalog`);
    }
  }
  for (const i of policy.allowedIntegrationKeys) {
    if (!availableIntegrationKeys.includes(i)) {
      errors.push(`Integration ${i} is not available in the catalog`);
    }
  }
  if (policy.maxWidgetsPerDashboard < 0) {
    errors.push("maxWidgetsPerDashboard must be non-negative");
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

/* ─────────────────────────────────────────────────────────────
 * Configuration snapshot & versioning (Sections CC–CD)
 * ────────────────────────────────────────────────────────────*/

export interface WorkspaceConfigurationSnapshot {
  id: WorkspaceSnapshotId;
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  /** Snapshot version number. */
  version: number;
  /** Immutable captured workspace configuration. */
  captured: {
    lifecycleState: string;
    moduleIds: string[];
    pages: unknown[];
    dashboards: unknown[];
    navigation: unknown[];
    layout: unknown[];
    views: unknown[];
    configVersion: number;
  };
  /** Reason for the snapshot. */
  reason: string | null;
  /** Whether this snapshot is the current restore point. */
  isCurrent: boolean;
  capturedAt: string;
}

export type CreateSnapshotResult =
  | { ok: true; snapshot: WorkspaceConfigurationSnapshot; auditEvent: WorkspaceAuditEvent }
  | { ok: false; error: string };

export function createConfigurationSnapshot(
  tenantId: TenantId,
  workspace: Workspace,
  captured: WorkspaceConfigurationSnapshot["captured"],
  reason: string | null,
  actorId: string,
  now: string,
): CreateSnapshotResult {
  const id = workspaceSnapshotId(`${workspace.id}:v${workspace.configVersion}:${now}`);
  const snapshot: WorkspaceConfigurationSnapshot = {
    id,
    tenantId,
    workspaceId: workspace.id,
    version: workspace.configVersion,
    captured,
    reason,
    isCurrent: true,
    capturedAt: now,
  };

  const auditEvent: WorkspaceAuditEvent = {
    id: `audit-${now}-${id}`,
    type: "WorkspaceSnapshotCreated",
    tenantId,
    workspaceId: workspace.id,
    actorId,
    occurredAt: now,
    result: "success",
    metadata: { version: snapshot.version, reason },
  };

  return { ok: true, snapshot, auditEvent };
}

/* ─────────────────────────────────────────────────────────────
 * Configuration versioning (Section CD)
 * ────────────────────────────────────────────────────────────*/

export interface ConfigVersionEntry {
  id: WorkspaceConfigVersionId;
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  version: number;
  capturedAt: string;
  actorId: string;
  /** Human-readable change summary. */
  changeSummary: string | null;
}

export type WorkspaceConfigVersionResult =
  | { ok: true; entry: ConfigVersionEntry; auditEvent: WorkspaceAuditEvent }
  | { ok: false; error: string };

export function recordConfigVersion(
  tenantId: TenantId,
  workspaceId: WorkspaceId,
  version: number,
  actorId: string,
  changeSummary: string | null,
  now: string,
): WorkspaceConfigVersionResult {
  const id = workspaceConfigVersionId(`${workspaceId}:v${version}:${now}`);
  const entry: ConfigVersionEntry = {
    id,
    tenantId,
    workspaceId,
    version,
    capturedAt: now,
    actorId,
    changeSummary,
  };

  const auditEvent: WorkspaceAuditEvent = {
    id: `audit-${now}-${id}`,
    type: "WorkspaceConfigVersioned",
    tenantId,
    workspaceId,
    actorId,
    occurredAt: now,
    result: "success",
    metadata: { version, changeSummary },
  };

  return { ok: true, entry, auditEvent };
}

/* ─────────────────────────────────────────────────────────────
 * Workspace catalog (Section GE)
 * ────────────────────────────────────────────────────────────*/

export interface WorkspaceCatalogItem {
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  name: string;
  type: string;
  version: string;
  /** Whether this catalog item is visible across the tenant. */
  isPublished: boolean;
  /** Catalog category. */
  category: string | null;
}

export interface CatalogInheritanceResult {
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  /** Resolved modules after inheritance. */
  modules: WorkspaceModule[];
  /** Resolved dashboards after inheritance. */
  dashboards: WorkspaceDashboard[];
  /** Resolved pages after inheritance. */
  pages: WorkspacePage[];
  /** Resolved views after inheritance. */
  views: WorkspaceView[];
}

/**
 * Catalog inheritance provides standard views, widgets and templates while still
 * respecting overrides and authorization (Section GE). Phase 06 composes the
 * catalog; the domain systems remain authoritative.
 */
export function resolveCatalogInheritance(
  tenantId: TenantId,
  workspaceId: WorkspaceId,
  inherited: {
    modules: WorkspaceModule[];
    dashboards: WorkspaceDashboard[];
    pages: WorkspacePage[];
    views: WorkspaceView[];
  },
): CatalogInheritanceResult {
  // Phase 06 preserves deterministic precedence; inherited catalog items are
  // composed only when no explicit workspace override exists. Actual merge
  // logic (explicit overrides resolution Section CL) would be performed on write.
  return {
    tenantId,
    workspaceId,
    modules: inherited.modules,
    dashboards: inherited.dashboards,
    pages: inherited.pages,
    views: inherited.views,
  };
}

/* ─────────────────────────────────────────────────────────────
 * Workspace audit extraction (Section CP)
 * ────────────────────────────────────────────────────────────*/

export type WorkspaceAuditFilter = {
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  eventTypes?: WorkspaceAuditEventType[];
  since?: string;
  until?: string;
  actorId?: string | null;
};

export interface WorkspaceAuditRecord {
  event: WorkspaceAuditEvent;
}

/**
 * Extract audit events scoped to a workspace. The authoritative audit/security
 * system owns long-term audit governance (Section CQ), which must be used for
 * durable records.
 */
export function filterWorkspaceAuditEvents(
  events: WorkspaceAuditEvent[],
  filter: WorkspaceAuditFilter,
): WorkspaceAuditEvent[] {
  return events.filter((e) => {
    if (e.tenantId !== filter.tenantId || e.workspaceId !== filter.workspaceId) return false;
    if (filter.eventTypes && !filter.eventTypes.includes(e.type)) return false;
    if (filter.since && e.occurredAt < filter.since) return false;
    if (filter.until && e.occurredAt > filter.until) return false;
    if (filter.actorId !== undefined && e.actorId !== filter.actorId) return false;
    return true;
  });
}
