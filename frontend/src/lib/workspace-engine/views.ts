/**
 * CoreGrid — Phase 06 Workspace Engine: views, filters, sorting, grouping.
 *
 * Implements phase-06-workspace-engine.md sections:
 * - BC Saved views — users may save reusable views.
 * - BD View model.
 * - BE Shared views — authorized users publish views to workspace/department/
 *   team/role.
 * - BF View ownership — creator, owner, scope, visibility, version.
 * - BG Filter engine — field filters, date ranges, status, relationships,
 *   search, boolean combinations.
 * - BH Filter safety — filters never bypass authorization or tenant
 *   restrictions (defense-in-depth: backend enforcement remains mandatory).
 * - BI Sorting — only approved fields.
 * - BJ Grouping — only where underlying data permits.
 * - BK Column configuration — sensitive fields stay policy-controlled.
 *
 * Interaction layer ONLY: no domain truth, no authorization authority (P08),
 * no tenancy authority (P03), no execution (P05).
 */

export type ViewScope = "personal" | "workspace" | "department" | "team" | "role";
export type ViewVisibility = "private" | "shared";

export const VIEW_SCOPES: readonly ViewScope[] = [
  "personal",
  "workspace",
  "department",
  "team",
  "role",
] as const;
export const VIEW_VISIBILITIES: readonly ViewVisibility[] = ["private", "shared"] as const;

export type FilterOperator =
  "eq" | "neq" | "in" | "contains" | "gt" | "gte" | "lt" | "lte" | "between" | "is_null";

export const FILTER_OPERATORS: readonly FilterOperator[] = [
  "eq",
  "neq",
  "in",
  "contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "is_null",
] as const;

export interface FilterClause {
  field: string;
  op: FilterOperator;
  values?: unknown[];
}

export interface FilterExpression {
  conjunction: "and" | "or";
  clauses: FilterClause[];
}

export interface SortRule {
  field: string;
  direction: "asc" | "desc";
}

export interface GroupRule {
  field: string;
}

export interface ColumnSelection {
  field: string;
  visible: boolean;
}

export interface SavedViewHeader {
  id: string;
  workspaceId: string;
  name: string;
  /** View ownership (§BF): owner and creator are recorded server-side. */
  ownerId: string;
  createdBy: string;
  scope: ViewScope;
  visibility: ViewVisibility;
  version: number;
  createdAt: string;
}

export interface SavedView {
  header: SavedViewHeader;
  filter?: FilterExpression | null;
  sort?: SortRule[] | null;
  grouping?: GroupRule[] | null;
  columns?: ColumnSelection[] | null;
}

export interface ViewReferenceIndex {
  workspaceIds?: ReadonlySet<string>;
  /** Authorized identity ids — never client-claimed. */
  ownerIds?: ReadonlySet<string>;
  /** §BI approved sortable/groupable/filterable fields. */
  approvedFields?: ReadonlySet<string>;
  /** §BK sensitive fields that require policy before display. */
  sensitiveFields?: ReadonlySet<string>;
}

export type ViewsValidation = { ok: true; views: SavedView[] } | { ok: false; issues: string[] };

function blank(value: string | null | undefined): boolean {
  return value == null || value.trim() === "";
}

export function validateSavedViews(
  input: readonly SavedView[],
  refs: ViewReferenceIndex = {},
  allowSensitiveColumns = false,
): ViewsValidation {
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const view of input) {
    const { header } = view;
    const key = `${header.workspaceId}::${header.id}`;
    if (blank(header.id) || blank(header.workspaceId)) {
      issues.push("a saved view requires an id and a workspaceId");
      continue;
    }
    if (seen.has(key)) issues.push(`duplicate saved view "${key}"`);
    seen.add(key);
    if (blank(header.name)) issues.push(`view "${header.id}": name is required`);
    if (blank(header.ownerId) || blank(header.createdBy)) {
      issues.push(`view "${header.id}": ownerId and createdBy are required`);
    }
    if (!VIEW_SCOPES.includes(header.scope)) {
      issues.push(`view "${header.id}": scope must be one of ${VIEW_SCOPES.join(", ")}`);
    }
    if (!VIEW_VISIBILITIES.includes(header.visibility)) {
      issues.push(`view "${header.id}": visibility must be private or shared`);
    }
    if (!Number.isInteger(header.version) || header.version < 1) {
      issues.push(`view "${header.id}": version must be a positive integer`);
    }
    if (refs.workspaceIds && !refs.workspaceIds.has(header.workspaceId)) {
      issues.push(`view "${header.id}": unknown workspace "${header.workspaceId}"`);
    }
    if (refs.ownerIds && !refs.ownerIds.has(header.ownerId)) {
      issues.push(`view "${header.id}": unknown owner "${header.ownerId}"`);
    }
    // §BE: publishing beyond personal requires shared visibility.
    if (header.scope !== "personal" && header.visibility !== "shared") {
      issues.push(`view "${header.id}": scope "${header.scope}" requires shared visibility`);
    }

    if (view.filter) {
      if (view.filter.conjunction !== "and" && view.filter.conjunction !== "or") {
        issues.push(`view "${header.id}": filter conjunction must be and or or`);
      }
      for (const clause of view.filter.clauses) {
        if (blank(clause.field))
          issues.push(`view "${header.id}": a filter clause requires a field`);
        if (!FILTER_OPERATORS.includes(clause.op)) {
          issues.push(
            `view "${header.id}": operator must be one of ${FILTER_OPERATORS.join(", ")}`,
          );
        }
        // §BH: filters may only target fields the consumer authorized.
        if (refs.approvedFields && !refs.approvedFields.has(clause.field)) {
          issues.push(`view "${header.id}": filter field "${clause.field}" is not approved`);
        }
      }
    }

    for (const rule of view.sort ?? []) {
      if (blank(rule.field)) issues.push(`view "${header.id}": a sort rule requires a field`);
      if (rule.direction !== "asc" && rule.direction !== "desc") {
        issues.push(`view "${header.id}": sort direction must be asc or desc`);
      }
      // §BI: sorting must use approved fields.
      if (refs.approvedFields && !refs.approvedFields.has(rule.field)) {
        issues.push(`view "${header.id}": sort field "${rule.field}" is not approved`);
      }
    }

    for (const rule of view.grouping ?? []) {
      if (blank(rule.field)) issues.push(`view "${header.id}": a grouping requires a field`);
      if (refs.approvedFields && !refs.approvedFields.has(rule.field)) {
        issues.push(`view "${header.id}": grouping field "${rule.field}" is not approved`);
      }
    }

    for (const column of view.columns ?? []) {
      if (blank(column.field)) issues.push(`view "${header.id}": a column requires a field`);
      // §BK: sensitive fields stay policy-controlled.
      if (!allowSensitiveColumns && refs.sensitiveFields?.has(column.field)) {
        issues.push(`view "${header.id}": sensitive column "${column.field}" requires policy`);
      }
    }
  }

  return issues.length === 0 ? { ok: true, views: [...input] } : { ok: false, issues };
}

/** §BF: bump a view to a new version (views are versioned, never overwritten). */
export function nextViewVersion(view: SavedView): number {
  return view.header.version + 1;
}

/**
 * §BH defense-in-depth: compose the tenant-bound filter every consumer MUST also
 * enforce server-side (filters alone never authorize — this only builds the
 * UI-scoped constraint).
 */
export function withTenantBoundary(
  filter: FilterExpression | null | undefined,
  tenantField: string,
  tenantValue: string,
): FilterExpression {
  const boundary: FilterClause = { field: tenantField, op: "eq", values: [tenantValue] };
  if (!filter || filter.clauses.length === 0) {
    return { conjunction: "and", clauses: [boundary] };
  }
  return {
    conjunction: "and",
    clauses: [boundary, ...filter.clauses],
  };
}

/** Visible column fields after sensitive-field policy filtering (§BK). */
export function visibleColumns(
  columns: readonly ColumnSelection[] | null | undefined,
  sensitiveFields: ReadonlySet<string>,
): string[] {
  return (columns ?? [])
    .filter((c) => c.visible && !sensitiveFields.has(c.field))
    .map((c) => c.field);
}
