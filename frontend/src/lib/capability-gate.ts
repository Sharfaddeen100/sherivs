/**
 * CoreGrid — capability-code gate (Phase 08/06 enforcement primitive).
 *
 * A capability code is the atomic authorization unit of workspace chrome and
 * future per-feature server gates ("r001:org_admin.settings"). This module
 * parses codes strictly and evaluates them against a member's coarse
 * membership kind — FAILING CLOSED on malformed codes, unknown features,
 * unknown kinds and unknown roles. It grants nothing by itself: it is the
 * pattern every per-feature server gate an installed runtime adopts (Phases 11–13) so a
 * capability is never granted by accident.
 *
 * Platform super-admin evaluation bypasses kind checks ONLY for codes the
 * runtime declared (mirrors the existing composite server gates). UI never
 * calls this for hiding: RLS + server functions remain the boundary.
 */
import type { AppRole } from "@/lib/roles";
import {
  isDeclaredRuntimeFeatureCode,
  // The runtime layer names its own nav kinds; the platform gate speaks of them
  // generically, so the runtime's vocabulary never becomes the platform's.
  type ScholarNavKind as RuntimeNavKind,
} from "@/lib/runtime/nav-registry";

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

/** Membership kinds that satisfy a runtime chrome kind (P08-equivalent). */
export const MEMBERSHIP_FOR_NAV_KIND: Readonly<Record<RuntimeNavKind, readonly AppRole[]>> = {
  org_admin: ["admin", "principal"],
  teacher: ["teacher"],
  bursar: ["bursar"],
  hq: ["hq"],
  super_admin: ["super_admin"],
  parent: ["parent"],
  student: ["student"],
  driver: ["driver"],
};

const ROUTED_NAV_KINDS = Object.keys(MEMBERSHIP_FOR_NAV_KIND) as RuntimeNavKind[];

export type CapabilityGateDecision =
  | { decision: "allow"; reason: "Capability granted" }
  | {
      decision: "deny";
      code: "malformed" | "unknown_feature" | "unknown_kind" | "role_required";
      reason: string;
    };

export interface RuntimeCapabilitySignals {
  code: string;
  role: AppRole;
  /** Platform super-admin evaluation (bypasses kind membership checks). */
  isPlatformSuper?: boolean;
}

/**
 * Evaluate a runtime capability code against the membership kind that satisfies it. Every
 * non-allow path is an explicit DENY (AT.9) — malformed, undeclared,
 * unknown-kind and role-mismatch codes all fail closed.
 */
export function evaluateRuntimeCapability(
  signals: RuntimeCapabilitySignals,
): CapabilityGateDecision {
  const parsed = parseCapabilityCode(signals.code);
  if (!parsed) {
    return { decision: "deny", code: "malformed", reason: "Malformed capability code" };
  }
  const kind = parsed.kind as RuntimeNavKind;
  if (!ROUTED_NAV_KINDS.includes(kind)) {
    return {
      decision: "deny",
      code: "unknown_kind",
      reason: `Unknown chrome kind "${parsed.kind}"`,
    };
  }
  if (parsed.runtime !== "r001" || !isDeclaredRuntimeFeatureCode(signals.code)) {
    return {
      decision: "deny",
      code: "unknown_feature",
      reason: `Capability not declared by the installed runtime: ${signals.code}`,
    };
  }
  if (signals.isPlatformSuper) {
    return { decision: "allow", reason: "Capability granted" };
  }
  const allowed = MEMBERSHIP_FOR_NAV_KIND[kind];
  if (!allowed.includes(signals.role)) {
    return {
      decision: "deny",
      code: "role_required",
      reason: `Role "${signals.role}" does not grant ${signals.code}`,
    };
  }
  return { decision: "allow", reason: "Capability granted" };
}
