/**
 * CoreGrid — capability-code gate (Phase 08/06 enforcement primitive).
 *
 * A capability code is the atomic authorization unit of workspace chrome and
 * future per-feature server gates ("r001:org_admin.settings"). This module
 * parses codes strictly and evaluates them against a member's coarse
 * membership kind — FAILING CLOSED on malformed codes, unknown features,
 * unknown kinds and unknown roles. It grants nothing by itself: it is the
 * pattern every per-feature Scholar server gate (Phases 11–13) adopts so a
 * capability is never granted by accident.
 *
 * Platform super-admin evaluation bypasses kind checks ONLY for codes the
 * runtime declared (mirrors the existing composite server gates). UI never
 * calls this for hiding: RLS + server functions remain the boundary.
 */
import type { AppRole } from "@/lib/roles";
import { isScholarFeatureCode, type ScholarNavKind } from "@/lib/workspace-engine/nav-catalog";

const CAPABILITY_CODE = /^([a-z0-9]+):([a-z0-9_]+)\.([a-z0-9_.]+)$/;

export interface ParsedCapabilityCode {
  runtime: string;
  kind: string;
  feature: string;
}

/** Strict parse; null on any malformed code (fail closed). */
export function parseCapabilityCode(code: string): ParsedCapabilityCode | null {
  const match = CAPABILITY_CODE.exec(code);
  if (!match) return null;
  return { runtime: match[1], kind: match[2], feature: match[3] };
}

/** Membership kinds that satisfy a Scholar chrome kind (P08-equivalent). */
export const SCHOLAR_MEMBERSHIP_FOR_KIND: Readonly<Record<ScholarNavKind, readonly AppRole[]>> = {
  org_admin: ["admin", "principal"],
  teacher: ["teacher"],
  bursar: ["bursar"],
  hq: ["hq"],
  super_admin: ["super_admin"],
  parent: ["parent"],
  student: ["student"],
  driver: ["driver"],
};

const SCHOLAR_KINDS = Object.keys(SCHOLAR_MEMBERSHIP_FOR_KIND) as ScholarNavKind[];

export type CapabilityGateDecision =
  | { decision: "allow"; reason: "Capability granted" }
  | {
      decision: "deny";
      code: "malformed" | "unknown_feature" | "unknown_kind" | "role_required";
      reason: string;
    };

export interface ScholarCapabilitySignals {
  code: string;
  role: AppRole;
  /** Platform super-admin evaluation (bypasses kind membership checks). */
  isPlatformSuper?: boolean;
}

/**
 * Evaluate a Scholar capability code against a membership kind. Every
 * non-allow path is an explicit DENY (AT.9) — malformed, undeclared,
 * unknown-kind and role-mismatch codes all fail closed.
 */
export function evaluateScholarCapability(
  signals: ScholarCapabilitySignals,
): CapabilityGateDecision {
  const parsed = parseCapabilityCode(signals.code);
  if (!parsed) {
    return { decision: "deny", code: "malformed", reason: "Malformed capability code" };
  }
  const kind = parsed.kind as ScholarNavKind;
  if (!SCHOLAR_KINDS.includes(kind)) {
    return {
      decision: "deny",
      code: "unknown_kind",
      reason: `Unknown chrome kind "${parsed.kind}"`,
    };
  }
  if (parsed.runtime !== "r001" || !isScholarFeatureCode(signals.code)) {
    return {
      decision: "deny",
      code: "unknown_feature",
      reason: `Capability not declared by the Scholar runtime: ${signals.code}`,
    };
  }
  if (signals.isPlatformSuper) {
    return { decision: "allow", reason: "Capability granted" };
  }
  const allowed = SCHOLAR_MEMBERSHIP_FOR_KIND[kind];
  if (!allowed.includes(signals.role)) {
    return {
      decision: "deny",
      code: "role_required",
      reason: `Role "${signals.role}" does not grant ${signals.code}`,
    };
  }
  return { decision: "allow", reason: "Capability granted" };
}
