/**
 * Sherivs Scholar — versioned institution blueprint (Phase-04 §81–82,128–129).
 *
 * The institution's complete operating model is a VERSIONED blueprint:
 *   version · author · timestamp · reason · previousVersion · spec
 * Blueprint changes are auditable and rollback-safe (each version names its
 * predecessor); re-validating a blueprint re-runs the A1/A2 structural
 * validators so an invalid snapshot can never be published.
 *
 * Pure + platform-aware: the blueprint belongs to one tenant (cg_tenant);
 * persistence flows through the Scholar config surface later. No state here.
 */

import { validateLevels } from "./education-levels";
import { validateProgrammeStructure } from "./programme";
import type { SchoolBuildSpec } from "./school-builder";

export interface BlueprintHeader {
  blueprintId: string;
  version: number;
  author: string;
  timestamp: string;
  reason: string;
  previousVersion: number | null;
}

export interface SchoolBlueprint {
  header: BlueprintHeader;
  spec: SchoolBuildSpec;
}

export type BlueprintValidation =
  { ok: true; blueprint: SchoolBlueprint } | { ok: false; issues: string[] };

export interface NewBlueprintInput {
  spec: SchoolBuildSpec;
  blueprintId: string;
  author: string;
  reason: string;
  now: string;
  /** The current/latest blueprint when creating a successor. */
  previous?: Pick<BlueprintHeader, "version"> | null;
}

export function createBlueprint(input: NewBlueprintInput): BlueprintValidation {
  const issues: string[] = [];

  if (!input.blueprintId.trim()) issues.push("blueprintId is required");
  if (!input.author.trim()) issues.push("author is required");
  if (!input.reason.trim()) issues.push("reason is required (audit trail)");
  if (!Number.isFinite(Date.parse(input.now))) issues.push("now must be a valid ISO timestamp");

  const levels = validateLevels(input.spec.levels);
  if (!levels.ok) issues.push(...levels.issues.map((i) => `levels: ${i}`));
  const programmes = validateProgrammeStructure(input.spec.programmes);
  if (!programmes.ok) issues.push(...programmes.issues.map((i) => `programmes: ${i}`));

  if (issues.length > 0) return { ok: false, issues };

  const previousVersion = input.previous ? input.previous.version : null;
  const blueprint: SchoolBlueprint = {
    header: {
      blueprintId: input.blueprintId.trim(),
      version: previousVersion === null ? 1 : previousVersion + 1,
      author: input.author.trim(),
      timestamp: input.now,
      reason: input.reason.trim(),
      previousVersion,
    },
    spec: input.spec,
  };
  return { ok: true, blueprint };
}

/** Structural re-validation of a stored blueprint (rollback safety net). */
export function validateBlueprint(blueprint: SchoolBlueprint): BlueprintValidation {
  const issues: string[] = [];
  if (!blueprint.header.blueprintId.trim()) issues.push("blueprintId is required");
  if (blueprint.header.version < 1) issues.push("version must be >= 1");
  if (!blueprint.header.author.trim()) issues.push("author is required");
  if (!blueprint.header.reason.trim()) issues.push("reason is required");
  const levels = validateLevels(blueprint.spec.levels);
  if (!levels.ok) issues.push(...levels.issues.map((i) => `levels: ${i}`));
  const programmes = validateProgrammeStructure(blueprint.spec.programmes);
  if (!programmes.ok) issues.push(...programmes.issues.map((i) => `programmes: ${i}`));
  return issues.length === 0 ? { ok: true, blueprint } : { ok: false, issues };
}

/** The version to roll back to (null when the blueprint is the root version). */
export function rollbackTarget(blueprint: SchoolBlueprint): number | null {
  return blueprint.header.previousVersion;
}

export function isNewerThan(a: SchoolBlueprint, b: SchoolBlueprint): boolean {
  return a.header.version > b.header.version;
}
