/**
 * CoreGrid — Phase 06 Workspace Engine composition domain (platform layer).
 *
 * Implements `architecture/phase-06-workspace-engine.md`:
 * - Standalone navigation and embedded navigation (Sections Y, Z).
 * - Workspace modules (Sections AA–AC).
 * - Workspace pages (Sections AD–AG).
 * - Dashboards (Sections AH, AI).
 * - Cards (Section AJ).
 * - Widget contract, data source, security, lifecycle, versioning (Sections AO–AS).
 * - Layout engine, grid system, responsive layout, breakpoints, validation (Sections AT–AX).
 * - Personalization and saved views (Sections AY–BF).
 * - Filter engine, sorting, grouping, columns, search, command surfaces
 *   (Sections BG–BO).
 * - Workspace templates, overrides, inheritance, configuration conflicts
 *   (Sections CF–CL).
 *
 * Phase 06 owns the configurable surface only. Domain truth, notifications,
 * tasks, search infrastructure and communication delivery remain owned by
 * their authoritative phases (Sections GU, E7).
 */

import type { TenantId } from "./tenant-core";
import {
  workspaceId,
  navigationItemId,
  moduleId,
  pageId,
  dashboardId,
  cardId,
  widgetTypeId,
  widgetInstanceId,
  layoutId,
  viewId,
  filterId,
  templateId,
  type WorkspaceId,
  type NavigationItemId,
  type ModuleId,
  type PageId,
  type DashboardId,
  type CardId,
  type WidgetTypeId,
  type WidgetInstanceId,
  type LayoutId,
  type ViewId,
  type FilterId,
  type TemplateId,
  type WorkspaceAuditEvent,
  type WorkspaceTenantScopedEntity,
} from "./workspace-core";

/* ─────────────────────────────────────────────────────────────
 * Navigation (Sections Y, Z)
 * ────────────────────────────────────────────────────────────*/

export type NavigationItemType = "page" | "dashboard" | "module" | "external" | "submenu";

export const NAVIGATION_ITEM_TYPES: readonly NavigationItemType[] = [
  "page",
  "dashboard",
  "module",
  "external",
  "submenu",
] as const;

/** Standalone navigation: workspace defines its own navigation structure (Section Y). */
export interface NavigationItem extends WorkspaceTenantScopedEntity {
  id: NavigationItemId;
  /** Parent navigation item ID for nested menus (Section Y). */
  parentId: NavigationItemId | null;
  /** Stable ordered key. */
  sortKey: string;
  /** Display label. */
  label: string;
  /** Navigation item type. */
  type: NavigationItemType;
  /** Target page, dashboard, or external URL (authorized). */
  target: {
    type: "page" | "dashboard" | "module" | "url";
    ref: string;
  } | null;
  /** Required capability the actor must have to see/use the item (Section BN). */
  requiredCapability: string | null;
  /** Whether this item is visible only to authorized actors (Section BN). */
  visibleIfAuthorized: boolean;
}

export interface CreateNavigationItemInput {
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  label: string;
  type: NavigationItemType;
  parentId?: NavigationItemId | null;
  sortKey?: string;
  target?: NavigationItem["target"];
  requiredCapability?: string | null;
  visibleIfAuthorized?: boolean;
  actorId: string;
  now: string;
}

export type CreateNavigationItemResult =
  | { ok: true; item: NavigationItem; auditEvent: WorkspaceAuditEvent }
  | { ok: false; error: string };

export function createNavigationItem(
  input: CreateNavigationItemInput,
  existingItems: NavigationItem[],
): CreateNavigationItemResult {
  if (input.label.trim() === "") {
    return { ok: false, error: "Navigation label is required" };
  }

  if (input.type === "submenu" && input.parentId === null) {
    return { ok: false, error: "Submenu items require a parent navigation item" };
  }

  // A navigation item must not target a resource in a different tenant.
  // (Cross-reference validation would occur in the composition resolver.)

  const id = navigationItemId(`${input.workspaceId}:${input.label}:${input.now}`);

  const item: NavigationItem = {
    id,
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    parentId: input.parentId ?? null,
    sortKey: input.sortKey ?? `${existingItems.length}`,
    label: input.label,
    type: input.type,
    target: input.target ?? null,
    requiredCapability: input.requiredCapability ?? null,
    visibleIfAuthorized: input.visibleIfAuthorized ?? true,
    createdAt: input.now,
    updatedAt: input.now,
  };

  const auditEvent: WorkspaceAuditEvent = {
    id: `audit-${input.now}-${id}`,
    type: "WorkspaceNavigationChanged",
    tenantId: item.tenantId as TenantId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    occurredAt: input.now,
    result: "success",
    metadata: { label: input.label, type: input.type },
  };

  return { ok: true, item, auditEvent };
}

/* ─────────────────────────────────────────────────────────────
 * Modules (Sections AA–AC)
 * ────────────────────────────────────────────────────────────*/

export type ModuleStatus = "enabled" | "disabled" | "deprecated";

export interface WorkspaceModule extends WorkspaceTenantScopedEntity {
  id: ModuleId;
  /** Module registry key. */
  key: string;
  name: string;
  description: string | null;
  /** Owning phase/capability that authoritatively owns this module's domain. */
  ownerCapability: string | null;
  status: ModuleStatus;
  /** Whether this module is visible in standalone navigation (Section Z). */
  includedInNavigation: boolean;
}

export type WorkspaceModuleChangeResult =
  | { ok: true; module: WorkspaceModule; auditEvent: WorkspaceAuditEvent }
  | { ok: false; error: string };

export function enableModule(
  moduleKey: string,
  name: string,
  tenantId: TenantId,
  workspaceId: WorkspaceId,
  actorId: string,
  now: string,
): WorkspaceModuleChangeResult {
  const id = moduleId(`${workspaceId}:${moduleKey}`);

  const module: WorkspaceModule = {
    id,
    key: moduleKey,
    tenantId,
    workspaceId,
    name,
    description: null,
    ownerCapability: "",
    status: "enabled",
    includedInNavigation: true,
    createdAt: now,
    updatedAt: now,
  };

  const auditEvent: WorkspaceAuditEvent = {
    id: `audit-${now}-${id}`,
    type: "WorkspaceModuleChanged",
    tenantId,
    workspaceId,
    actorId,
    occurredAt: now,
    result: "success",
    metadata: { moduleKey: moduleKey, action: "enable" },
  };

  return { ok: true, module, auditEvent };
}

export type DisableModuleResult =
  | { ok: true; module: WorkspaceModule; auditEvent: WorkspaceAuditEvent }
  | { ok: false; error: string };

export function disableModule(
  tenantId: TenantId,
  workspaceId: WorkspaceId,
  module: WorkspaceModule,
  actorId: string,
  now: string,
): DisableModuleResult {
  if (module.workspaceId !== workspaceId || module.tenantId !== tenantId) {
    return { ok: false, error: "Module does not belong to this workspace/tenant" };
  }

  const updated: WorkspaceModule = { ...module, status: "disabled", updatedAt: now };

  const auditEvent: WorkspaceAuditEvent = {
    id: `audit-${now}-${module.id}`,
    type: "WorkspaceModuleChanged",
    tenantId,
    workspaceId,
    actorId,
    occurredAt: now,
    result: "success",
    metadata: { moduleKey: module.name, action: "disable" },
  };

  return { ok: true, module: updated, auditEvent };
}

/** Determine whether a module is available given tenant context (Section DA). */
export function isModuleAvailable(
  module: WorkspaceModule,
  tenantId: TenantId | null,
  principalCapabilities: string[],
): boolean {
  if (module.status !== "enabled") return false;
  if (
    module.ownerCapability !== null &&
    module.ownerCapability !== "" &&
    !principalCapabilities.includes(module.ownerCapability)
  ) {
    return false;
  }
  // Tenant-scoped module requires a tenant context.
  if (tenantId === null) return false;
  return true;
}

/* ─────────────────────────────────────────────────────────────
 * Pages
 * ────────────────────────────────────────────────────────────*/

export interface PageComponentRef {
  id: string;
  componentType: string;
  props: Record<string, unknown>;
}

export interface WorkspacePage extends WorkspaceTenantScopedEntity {
  id: PageId;
  /** Page key. */
  key: string;
  title: string;
  description: string | null;
  /** Whether this page is the default landing for the workspace. */
  isDefault: boolean;
  /** Layout used for this page. */
  layoutId: LayoutId | null;
  /** Ordered component references. */
  components: PageComponentRef[];
}

export interface CreatePageInput {
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  key: string;
  title: string;
  description?: string | null;
  isDefault?: boolean;
  layoutId?: LayoutId | null;
  components?: PageComponentRef[];
  actorId: string;
  now: string;
}

export type CreatePageResult =
  { ok: true; page: WorkspacePage; auditEvent: WorkspaceAuditEvent } | { ok: false; error: string };

export function createPage(
  input: CreatePageInput,
  existingPages: WorkspacePage[],
): CreatePageResult {
  if (input.key.trim() === "") {
    return { ok: false, error: "Page key is required" };
  }
  if (input.title.trim() === "") {
    return { ok: false, error: "Page title is required" };
  }

  if (existingPages.some((p) => p.key === input.key && p.workspaceId === input.workspaceId)) {
    return { ok: false, error: `Page key ${input.key} already exists in this workspace` };
  }

  // Must authorize this page against the workspace's authorized modules/features (Section AD).

  const id = pageId(`${input.workspaceId}:${input.key}`);

  const page: WorkspacePage = {
    id,
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    key: input.key,
    title: input.title,
    description: input.description ?? null,
    isDefault: input.isDefault ?? false,
    layoutId: input.layoutId ?? null,
    components: input.components ?? [],
    createdAt: input.now,
    updatedAt: input.now,
  };

  const auditEvent: WorkspaceAuditEvent = {
    id: `audit-${input.now}-${id}`,
    type: "WorkspaceNavigationChanged",
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    occurredAt: input.now,
    result: "success",
    metadata: { key: input.key, title: input.title },
  };

  return { ok: true, page, auditEvent };
}

/* ─────────────────────────────────────────────────────────────
 * Dashboards
 * ────────────────────────────────────────────────────────────*/

export interface WorkspaceDashboard extends WorkspaceTenantScopedEntity {
  id: DashboardId;
  name: string;
  description: string | null;
  isDefault: boolean;
  /** Ordered widget instances. */
  widgetInstanceIds: WidgetInstanceId[];
  /** Layout reference for this dashboard. */
  layoutId: LayoutId | null;
}

export interface CreateDashboardInput {
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  layoutId?: LayoutId | null;
  widgetInstanceIds?: WidgetInstanceId[];
  actorId: string;
  now: string;
}

export type CreateDashboardResult =
  | { ok: true; dashboard: WorkspaceDashboard; auditEvent: WorkspaceAuditEvent }
  | { ok: false; error: string };

export function createDashboard(
  input: CreateDashboardInput,
  existingDashboards: WorkspaceDashboard[],
): CreateDashboardResult {
  if (input.name.trim() === "") {
    return { ok: false, error: "Dashboard name is required" };
  }

  if (
    existingDashboards.some((d) => d.name === input.name && d.workspaceId === input.workspaceId)
  ) {
    return { ok: false, error: `Dashboard ${input.name} already exists in this workspace` };
  }

  const id = dashboardId(`${input.workspaceId}:${input.name}`);
  const dashboard: WorkspaceDashboard = {
    id,
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    name: input.name,
    description: input.description ?? null,
    isDefault: input.isDefault ?? false,
    widgetInstanceIds: input.widgetInstanceIds ?? [],
    layoutId: input.layoutId ?? null,
    createdAt: input.now,
    updatedAt: input.now,
  };

  const auditEvent: WorkspaceAuditEvent = {
    id: `audit-${input.now}-${id}`,
    type: "WorkspaceDashboardChanged",
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    occurredAt: input.now,
    result: "success",
    metadata: { name: input.name },
  };

  return { ok: true, dashboard, auditEvent };
}

/* ─────────────────────────────────────────────────────────────
 * Cards & widgets
 * ────────────────────────────────────────────────────────────*/

export interface Card extends WorkspaceTenantScopedEntity {
  id: CardId;
  name: string;
}

export const createCard = (
  tenantId: TenantId,
  workspaceId: WorkspaceId,
  name: string,
  now: string,
): { ok: true; card: Card } | { ok: false; error: string } => {
  if (name.trim() === "") {
    return { ok: false, error: "Card name is required" };
  }
  const id = cardId(`${workspaceId}:${name}`);
  return {
    ok: true,
    card: { id, tenantId, workspaceId, name, createdAt: now, updatedAt: now },
  };
};

export interface WidgetType extends WorkspaceTenantScopedEntity {
  id: WidgetTypeId;
  /** Widget identifier. */
  widgetKey: string;
  name: string;
  /** Version required (Section AS). */
  version: string;
  /** Owning module/capability. */
  owner: string;
  /** Which source the widget consumes (Section AP). */
  dataSource: {
    kind: "api" | "application";
    capability: string;
  };
  /** Allowed region of the dashboard. */
  allowedRegions: string[];
  /** Whether this widget is disabled at type level. */
  enabled: boolean;
}

export interface WidgetInstance extends WorkspaceTenantScopedEntity {
  id: WidgetInstanceId;
  /** Type referenced. */
  widgetTypeId: WidgetTypeId;
  /** Region of the dashboard. */
  region: string;
  /** Instance-level settings (personalization). */
  settings: Record<string, unknown>;
}

/* ─────────────────────────────────────────────────────────────
 * Layout engine (Sections AT–AX)
 * ────────────────────────────────────────────────────────────*/

export type ResponsiveBreakpoint = "sm" | "md" | "lg" | "xl";

export interface LayoutRegion {
  id: string;
  order: number;
  /** Column span within a 12-column grid (Section AU). */
  span: number;
  /** Slot entries in this region. */
  slots: Array<{
    widgetInstanceId: WidgetInstanceId | null;
    cardId: CardId | null;
  }>;
}

export interface WorkspaceLayout extends WorkspaceTenantScopedEntity {
  id: LayoutId;
  name: string;
  regions: LayoutRegion[];
  breakpoints: Map<ResponsiveBreakpoint, string>;
  /** Whether this layout satisfies validation: no overlaps, accessible (Section AX). */
  isValid: boolean;
  validationIssues: string[];
}

export const LAYOUT_COLUMNS = 12;

export function validateLayout(layout: WorkspaceLayout): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Region span must not exceed the grid (Section AX).
  for (const region of layout.regions) {
    if (region.span < 1 || region.span > LAYOUT_COLUMNS) {
      issues.push(`Region ${region.id} has invalid span ${region.span}`);
    }
  }

  // Ensure breakpoints are non-decreasing (Section AW).
  const breakpoints: ResponsiveBreakpoint[] = ["sm", "md", "lg", "xl"];
  let prev: number | null = null;
  for (const bp of breakpoints) {
    const value = layout.breakpoints.get(bp) ?? "";
    if (value === "") {
      issues.push(`Missing breakpoint ${bp}`);
      continue;
    }
    const px = Number.parseInt(value, 10);
    if (Number.isNaN(px)) {
      issues.push(`Breakpoint ${bp} is not numeric`);
      continue;
    }
    if (prev !== null && px <= prev) {
      issues.push(`Breakpoint ${bp} must be greater than previous breakpoint`);
    }
    prev = px;
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/* ─────────────────────────────────────────────────────────────
 * Views (Sections BD–BF)
 * ────────────────────────────────────────────────────────────*/

export type ViewScope = "workspace" | "department" | "team" | "role" | "private";
export type Views = "grid" | "list" | "table" | "cards" | "calendar" | "chart";

export interface WorkspaceView extends WorkspaceTenantScopedEntity {
  id: ViewId;
  name: string;
  scope: ViewScope;
  /** Creator identity (Section BF). */
  creatorId: string;
  /** Owner identity (Section BF). */
  ownerId: string;
  /** Version (Section BF). */
  version: number;
  /** Share target for shared views (Section BE). */
  sharedTo: {
    type: "workspace" | "department" | "team" | "role";
    ref: string;
  } | null;
  /** View display type. */
  viewType: Views;
  /** Column/field configuration (Section BK). */
  columns: Array<{ field: string; label: string; visible: boolean }>;
  /** Filter state (Section BG). */
  filters: FilterDefinition[];
  /** Sorting (Section BI). */
  sorting: Array<{ field: string; direction: "asc" | "desc" } | null>;
  /** Grouping (Section BJ). */
  grouping: Array<{ field: string }>;
}

export type WorkspaceViewResult =
  { ok: true; view: WorkspaceView; auditEvent: WorkspaceAuditEvent } | { ok: false; error: string };

export function createView(
  input: {
    tenantId: TenantId;
    workspaceId: WorkspaceId;
    name: string;
    scope: ViewScope;
    creatorId: string;
    ownerId: string;
    viewType: Views;
    now: string;
  },
  existingViews: WorkspaceView[],
): WorkspaceViewResult {
  if (input.name.trim() === "") {
    return { ok: false, error: "View name is required" };
  }

  if (
    existingViews.some(
      (v) =>
        v.name === input.name &&
        v.workspaceId === input.workspaceId &&
        v.creatorId === input.creatorId,
    )
  ) {
    return { ok: false, error: "A view with this name already exists for this creator" };
  }

  const id = viewId(`${input.workspaceId}:${input.name}:${input.creatorId}`);

  const view: WorkspaceView = {
    id,
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    name: input.name,
    scope: input.scope,
    creatorId: input.creatorId,
    ownerId: input.ownerId,
    version: 1,
    sharedTo: input.scope === "workspace" ? { type: "workspace", ref: input.workspaceId } : null,
    viewType: input.viewType,
    columns: [],
    filters: [],
    sorting: [],
    grouping: [],
    createdAt: input.now,
    updatedAt: input.now,
  };

  const auditEvent: WorkspaceAuditEvent = {
    id: `audit-${input.now}-${id}`,
    type: "WorkspaceViewCreated",
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    actorId: input.creatorId,
    occurredAt: input.now,
    result: "success",
    metadata: { name: input.name, scope: input.scope, viewType: input.viewType },
  };

  return { ok: true, view, auditEvent };
}

/* ─────────────────────────────────────────────────────────────
 * Filters (Sections BG–BH)
 * ────────────────────────────────────────────────────────────*/

export interface FilterDefinition {
  id: FilterId;
  /** Authorized/approved field (Section BH). */
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "between";
  value: unknown;
  /** Boolean combination (Section BG). */
  and?: FilterDefinition[];
  or?: FilterDefinition[];
}

/**
 * Filters must not allow users to bypass authorization or tenant restrictions (Section BH).
 * Filter evaluation is performed only in a safe, authorized context.
 */
export function buildFilterId(workspaceId: WorkspaceId, field: string, now: string): FilterId {
  return filterId(`${workspaceId}:${field}:${now}`);
}

/**
 * Validate that a filter only references approved fields. This is a structural
 * guard; the actual authorization decision is made by the authoritative security layer.
 */
export function areFiltersOnApprovedFields(
  filters: FilterDefinition[],
  approvedFields: readonly string[],
): boolean {
  const walk = (f: FilterDefinition): boolean => {
    if (!approvedFields.includes(f.field)) return false;
    if (f.and && !f.and.every(walk)) return false;
    if (f.or && !f.or.every(walk)) return false;
    return true;
  };
  return filters.every(walk);
}

/* ─────────────────────────────────────────────────────────────
 * Sorting / grouping safety (Sections BI–BJ)
 * ────────────────────────────────────────────────────────────*/

export function areSortFieldsApproved(
  sorting: Array<{ field: string; direction: "asc" | "desc" } | null>,
  approvedFields: readonly string[],
): boolean {
  return sorting.every((s) => s === null || approvedFields.includes(s.field));
}

export function areGroupFieldsApproved(
  grouping: Array<{ field: string }>,
  approvedFields: readonly string[],
): boolean {
  return grouping.every((g) => approvedFields.includes(g.field));
}

/* ─────────────────────────────────────────────────────────────
 * Saved views / shared views (Sections BD–BF)
 * ────────────────────────────────────────────────────────────*/

export type ShareViewResult =
  { ok: true; view: WorkspaceView; auditEvent: WorkspaceAuditEvent } | { ok: false; error: string };

export function shareView(
  view: WorkspaceView,
  target: { type: "workspace" | "department" | "team" | "role"; ref: string },
  actorId: string,
  canPublish: boolean,
  now: string,
): ShareViewResult {
  if (!canPublish) {
    return { ok: false, error: "Actor does not have permission to publish shared views" };
  }

  const updated: WorkspaceView = {
    ...view,
    scope: target.type,
    sharedTo: target,
    version: view.version + 1,
    updatedAt: now,
  };

  const auditEvent: WorkspaceAuditEvent = {
    id: `audit-${now}-${view.id}`,
    type: "WorkspaceViewShared",
    tenantId: view.tenantId,
    workspaceId: view.workspaceId,
    actorId,
    occurredAt: now,
    result: "success",
    metadata: { target: target.type, ref: target.ref, version: updated.version },
  };

  return { ok: true, view: updated, auditEvent };
}

/* ─────────────────────────────────────────────────────────────
 * Personalized saved views (Section AY)
 * ────────────────────────────────────────────────────────────*/

export interface PersonalizedSavedView {
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  identityId: string;
  name: string;
  /** Page or dashboard this view applies to. */
  targetRef: { type: "page" | "dashboard"; id: string };
  filters: FilterDefinition[];
  sorting: Array<{ field: string; direction: "asc" | "desc" } | null>;
  grouping: Array<{ field: string }>;
  /** Whether this view is the actor's default (Section CA). */
  isDefault: boolean;
  /** Whether this view is visible to others (authorized sharing). */
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SavePersonalizedViewResult =
  { ok: true; savedView: PersonalizedSavedView } | { ok: false; error: string };

export function savePersonalizedView(
  input: Omit<PersonalizedSavedView, "createdAt" | "updatedAt"> & { now: string },
  existingViews: PersonalizedSavedView[],
): SavePersonalizedViewResult {
  const duplicate = existingViews.find(
    (v) =>
      v.identityId === input.identityId &&
      v.workspaceId === input.workspaceId &&
      v.targetRef.id === input.targetRef.id &&
      v.name === input.name,
  );
  if (duplicate) {
    return { ok: false, error: "A saved view with this name already exists for this target" };
  }

  return {
    ok: true,
    savedView: {
      tenantId: input.tenantId,
      workspaceId: input.workspaceId,
      identityId: input.identityId,
      name: input.name,
      targetRef: input.targetRef,
      filters: input.filters,
      sorting: input.sorting,
      grouping: input.grouping,
      isDefault: input.isDefault ?? false,
      visible: input.visible ?? false,
      createdAt: input.now,
      updatedAt: input.now,
    },
  };
}

/* ─────────────────────────────────────────────────────────────
 * Personalization (Section AY) & widgets
 * ────────────────────────────────────────────────────────────*/

export type PersonalizationInput = {
  tenantId: TenantId;
  workspaceId: WorkspaceId;
  identityId: string;
  widgetInstanceId: WidgetInstanceId;
  settings: Record<string, unknown>;
};

/**
 * Personalization applies to the user's workspace only and must never modify
 * authoritative institutional data (Section AZ).
 */
export function personalizeWidgetInstance(
  input: PersonalizationInput,
  instance: WidgetInstance,
  now: string,
): PersonalizationResult {
  if (instance.tenantId !== input.tenantId || instance.workspaceId !== input.workspaceId) {
    return { ok: false, error: "Widget instance does not belong to this workspace/tenant" };
  }
  return {
    ok: true,
    instance: {
      ...instance,
      settings: { ...instance.settings, ...input.settings },
      updatedAt: now,
    },
  };
}

export type PersonalizationResult =
  { ok: true; instance: WidgetInstance } | { ok: false; error: string };

/* ─────────────────────────────────────────────────────────────
 * Workspace templates (Sections CI–CK)
 * ────────────────────────────────────────────────────────────*/

export type TemplateScope = "platform" | "tenant" | "institution" | "department";

export interface WorkspaceTemplate extends WorkspaceTenantScopedEntity {
  id: TemplateId;
  name: string;
  description: string | null;
  scope: TemplateScope;
  /** Template version (Section CH). */
  version: string;
  /** Template configuration snapshot. */
  configuration: Record<string, unknown>;
  /** Whether this template is currently active. */
  isActive: boolean;
}

export interface TemplateOverride {
  key: string;
  value: unknown;
}

/**
 * Workspaces may inherit configuration from templates (Section CI).
 * Overrides must be explicit (Section CJ) and conflicts must resolve deterministically (Section CL).
 */
export type ResolveOverrideResult = { ok: true; value: unknown } | { ok: false; error: string };

export function resolveTemplateValueFromOverrides(
  baseValue: unknown,
  overrides: TemplateOverride[],
  key: string,
): ResolveOverrideResult {
  for (const o of overrides) {
    if (o.key === key) {
      return { ok: true, value: o.value };
    }
  }
  return { ok: true, value: baseValue };
}
