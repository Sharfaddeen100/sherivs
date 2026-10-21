/**
 * Sherivs Scholar — configuration governance (Phase-04 §166–168).
 *
 * Major configuration changes require: PREVIEW (§166 human override context) ·
 * VALIDATION (A5) · AUTHORIZATION (P08 roles — never client-supplied) ·
 * AUDIT · VERSIONING (A4 blueprint). This module is the pure decision core:
 * the runtime calls it AFTER the server has resolved the actor's real roles
 * through the P08 surface gate. Humans remain authoritative for consequential
 * institutional decisions (§166); the gate is where that authority is proven.
 */

import type { SchoolBuildSpec } from "./school-builder";
import { simulate, type SimulationResult, type ConfigScenario } from "./config-simulator";
import { createBlueprint, type BlueprintHeader } from "./blueprint";

/** Canonical P08 role gate kinds that may authorise configuration changes. */
export const CONFIG_GOVERNANCE_ROLES: readonly string[] = [
  "platform_super_admin",
  "school_admin",
] as const;

export interface ConfigChangeIntent {
  /** Current validated operating model (or undefined when none exists yet). */
  baseline: SchoolBuildSpec | undefined;
  scenarios: readonly ConfigScenario[];
  reason: string;
  /** Server-resolved identity of the requesting actor (P08 gate output). */
  actor: string;
  /** Server-resolved roles — never accepted from the client. */
  actorRoles: readonly string[];
  blueprintId: string;
  now: string;
}

export interface ConfigChangeAudit {
  changeId: string;
  actor: string;
  reason: string;
  decision: "approved" | "denied";
  previewOk: boolean;
  changes: string[];
  issues: string[];
}

export type ConfigChangeOutcome =
  | { decision: "approved"; changeId: string; preview: SimulationResult; audit: ConfigChangeAudit }
  | { decision: "denied"; changeId: string; reasons: string[]; audit: ConfigChangeAudit };

function createChangeId(now: string, actor: string, reason: string): string {
  const stamp = Number.isFinite(Date.parse(now)) ? new Date(now).getTime().toString(36) : "no-date";
  return `cfg-${stamp}-${actor.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "actor"}-${reason
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)}`;
}

/**
 * Govern a major configuration change: preview → validate → authorise → audit.
 * The blueprint is versioned separately via createBlueprint() on approval
 * (this function stays pure and returns the decision + audit evidence).
 */
export function governConfigChange(
  intent: ConfigChangeIntent,
  allowedRoles: readonly string[] = CONFIG_GOVERNANCE_ROLES,
): ConfigChangeOutcome {
  const changeId = createChangeId(intent.now, intent.actor, intent.reason);
  const reasons: string[] = [];

  if (!intent.reason.trim()) reasons.push("a change reason is required (audit trail)");
  if (!intent.actor.trim()) reasons.push("the requesting actor must be identified");
  if (!intent.blueprintId.trim()) reasons.push("blueprintId is required (versioning)");
  if (!Number.isFinite(Date.parse(intent.now))) reasons.push("now must be a valid ISO timestamp");

  const isAuthorized = intent.actorRoles.some((role) => allowedRoles.includes(role));
  if (!isAuthorized) reasons.push("actor is not authorised for configuration changes (P08 gate)");

  let preview: SimulationResult | undefined;
  if (intent.baseline) {
    preview = simulate(intent.baseline, intent.scenarios);
    if (!preview.ok) {
      reasons.push("preview failed configuration validation", ...preview.issues);
    }
  } else {
    reasons.push("no validated baseline exists — create the initial configuration first");
  }

  const audit: ConfigChangeAudit = {
    changeId,
    actor: intent.actor,
    reason: intent.reason,
    decision: reasons.length === 0 ? "approved" : "denied",
    previewOk: preview?.ok ?? false,
    changes: preview?.changes ?? [],
    issues: preview?.issues ?? [],
  };

  if (reasons.length > 0) return { decision: "denied", changeId, reasons, audit };

  return {
    decision: "approved",
    changeId,
    preview: preview as SimulationResult,
    audit,
  };
}

/**
 * Version the approved change as a new blueprint (A4). Exposed as a thin
 * governance wrapper so callers never skip the versioning requirement (§168).
 */
export function versionApprovedChange(
  outcome: Extract<ConfigChangeOutcome, { decision: "approved" }>,
  intent: ConfigChangeIntent,
  previous?: Pick<BlueprintHeader, "version"> | null,
) {
  return createBlueprint({
    spec: outcome.preview.proposed,
    blueprintId: intent.blueprintId,
    author: intent.actor,
    reason: intent.reason,
    now: intent.now,
    previous,
  });
}

export interface ChangeExplanation {
  sourceData: string[];
  context: string[];
  constraints: string[];
  assumptions: string[];
  uncertainty: string[];
}

/** Explainability (§167): what the decision rests on, plainly stated. */
export function explainChange(
  intent: ConfigChangeIntent,
  outcome: ConfigChangeOutcome,
): ChangeExplanation {
  const baseline = intent.baseline;
  return {
    sourceData: [
      baseline
        ? `baseline configuration (${baseline.levels.length} levels, ${baseline.programmes.length} programmes, ${baseline.shifts.length} shifts)`
        : "no baseline configuration exists",
      ...(outcome.decision === "approved" ? outcome.preview.changes : []),
    ],
    context: [
      `actor "${intent.actor}" requested: ${intent.reason}`,
      `roles considered: ${intent.actorRoles.join(", ") || "(none)"}`,
    ],
    constraints: [
      `allowed governance roles: ${CONFIG_GOVERNANCE_ROLES.join(", ")}`,
      "proposed configuration must pass A5 validation",
      "every change is versioned against the A4 blueprint chain",
    ],
    assumptions: ["scenarios are applied as pure diffs on top of the current baseline"],
    uncertainty: ["approval applies configuration only — operational impact is not predicted here"],
  };
}
