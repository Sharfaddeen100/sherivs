/**
 * CoreGrid Scholar — dashboard grid engine (WAVE-R34).
 *
 * Composes an actor's dashboards from enabled feature codes + authorized role
 * categories. Nothing is hand-drawn: a widget appears exactly when the feature it
 * belongs to is enabled for the actor AND the actor's roles participate in the
 * workspace the widget lives in.
 */

import { featureCodeByCode } from "../capability-codes";
import { roleById } from "../roles/role-registry";
import { roleWorkspaceLabel, type RoleWorkspaceKey } from "../roles/role-workspaces";
import { DASHBOARD_CONTRIBUTIONS, type DashboardContribution } from "./contribution-catalog";

export interface DashboardWidget {
  code: string;
  label: string;
  featureCode: string;
  workspace: RoleWorkspaceKey;
  size: 1 | 2 | 3 | 4;
  order: number;
  /** Why the widget is on the dashboard. */
  reason: readonly string[];
}

export interface DashboardGrid {
  workspace: RoleWorkspaceKey;
  label: string;
  widgets: readonly DashboardWidget[];
}

export interface ComposeGridInput {
  roleIds: readonly string[];
  /** Feature codes enabled for the actor (feature-gate decisions). */
  enabledCodes: readonly string[];
  contributions?: readonly DashboardContribution[];
}

const SIZE_ORDER: Record<DashboardWidget["size"], number> = { 4: 0, 3: 1, 2: 2, 1: 3 };

/**
 * Compose grids: contributions are filtered by enabled feature code and by the
 * actor's role categories, then grouped per workspace and ordered by size then
 * declared order (largest first).
 */
export function composeDashboardGrids(input: ComposeGridInput): readonly DashboardGrid[] {
  const enabled = new Set(input.enabledCodes);
  const categories = new Set(
    input.roleIds
      .map((roleId) => roleById(roleId)?.category)
      .filter((category): category is NonNullable<typeof category> => category !== undefined),
  );
  const contributions = input.contributions ?? DASHBOARD_CONTRIBUTIONS;

  const byWorkspace = new Map<RoleWorkspaceKey, DashboardWidget[]>();
  for (const contribution of contributions) {
    if (!enabled.has(contribution.featureCode)) continue;
    if (!contribution.roleCategories.some((category) => categories.has(category))) continue;
    const widget: DashboardWidget = {
      code: contribution.code,
      label: contribution.label,
      featureCode: contribution.featureCode,
      workspace: contribution.workspace,
      size: contribution.size,
      order: contribution.order,
      reason: [`feature:${contribution.featureCode}`, `workspace:${contribution.workspace}`],
    };
    byWorkspace.set(contribution.workspace, [
      ...(byWorkspace.get(contribution.workspace) ?? []),
      widget,
    ]);
  }

  return [...byWorkspace.entries()]
    .map(([workspace, widgets]) => ({
      workspace,
      label: roleWorkspaceLabel(workspace),
      widgets: widgets.sort(
        (left, right) => SIZE_ORDER[left.size] - SIZE_ORDER[right.size] || left.order - right.order,
      ),
    }))
    .sort((left, right) => left.workspace.localeCompare(right.workspace));
}

/** Structural audit: every contribution points at a real feature code/workspace. */
export function auditDashboardContributions(
  contributions: readonly DashboardContribution[] = DASHBOARD_CONTRIBUTIONS,
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const contribution of contributions) {
    if (seen.has(contribution.code)) issues.push(`${contribution.code}: duplicate widget`);
    seen.add(contribution.code);
    if (!featureCodeByCode(contribution.featureCode)) {
      issues.push(`${contribution.code}: unknown feature code "${contribution.featureCode}"`);
    }
    if (contribution.roleCategories.length === 0) {
      issues.push(`${contribution.code}: declares no role category`);
    }
  }
  return issues;
}

/**
 * Widgets per workspace for a set of enabled codes, WITHOUT role filtering —
 * used to preview the workspace an installed reality will produce.
 */
export function contributionIndexForCodes(
  enabledCodes: readonly string[],
  contributions: readonly DashboardContribution[] = DASHBOARD_CONTRIBUTIONS,
): readonly DashboardGrid[] {
  const enabled = new Set(enabledCodes);
  const byWorkspace = new Map<RoleWorkspaceKey, DashboardWidget[]>();
  for (const contribution of contributions) {
    if (!enabled.has(contribution.featureCode)) continue;
    const widget: DashboardWidget = {
      code: contribution.code,
      label: contribution.label,
      featureCode: contribution.featureCode,
      workspace: contribution.workspace,
      size: contribution.size,
      order: contribution.order,
      reason: [`feature:${contribution.featureCode}`, "reality-installed"],
    };
    byWorkspace.set(contribution.workspace, [
      ...(byWorkspace.get(contribution.workspace) ?? []),
      widget,
    ]);
  }
  return [...byWorkspace.entries()]
    .map(([workspace, widgets]) => ({
      workspace,
      label: roleWorkspaceLabel(workspace),
      widgets: widgets.sort((left, right) => left.order - right.order),
    }))
    .sort((left, right) => left.workspace.localeCompare(right.workspace));
}
