/**
 * Sherivs Scholar — evolution guards + phase ownership boundaries
 * (Phase-04 §176–180 and the §142–153 boundary rows O2/O4, plus §184–199).
 *
 * Evolution: a new curriculum must not destroy historical records (§178), a
 * school may restructure without rebuilding the institution (§179), future
 * African education models must be supported without platform redesign
 * (§180). This module asserts those invariants over versioned inputs and
 * records which concerns are OWNED by other phases so Phase 04 never claims a
 * second engine (P05/P14/P21 availability; P16 twin; P15 hardware; P18
 * analytics; P12 scheduling optimisation; P11 learning intelligence; P24 UI;
 * P17 automation; P07 memory; P36 knowledge graph).
 */

import { assertHistoryPreserved } from "./curriculum-evolution";
import type { CurriculumVersion } from "./curriculum-core";

export interface EvolutionPair {
  scope: string;
  before: string[];
  after: string[];
}

/** §178/§180: evolution must never lose a previously declared version/state. */
export function assertNonDestructiveEvolution(pair: EvolutionPair): string[] {
  const beforeSet = new Set(pair.before);
  const afterSet = new Set(pair.after);
  const lost: string[] = [];
  for (const item of beforeSet) {
    if (!afterSet.has(item)) lost.push(`${pair.scope}: "${item}" disappeared after evolution`);
  }
  return lost;
}

/** Reuses the curriculum history-preservation contract (D12, §178). */
export function curriculumHistoryIssues(
  beforeLabels: readonly string[],
  afterLabels: readonly string[],
): string[] {
  const asVersions = (labels: readonly string[]): CurriculumVersion[] =>
    labels.map((version) => ({ version, effectiveDate: "", authority: "", source: "" }));
  return assertHistoryPreserved(asVersions(beforeLabels), asVersions(afterLabels));
}

/** Authoritative external ownership of concerns Phase 04 must NOT duplicate. */
export const PHASE_BOUNDARY_OWNERS: Record<string, string> = {
  performance_scale_availability: "P05/P14/P21",
  degraded_mode: "P05/P14/P21",
  digital_twin: "P16",
  hardware_integration: "P15",
  analytics_decision: "P18",
  schedule_optimization: "P12",
  timetable_optimization: "P12",
  learning_intelligence: "P11",
  memory_architecture: "P07",
  knowledge_graph: "P36",
  visual_ui: "P24",
  automation_execution: "P17",
  identity: "P02",
  tenancy: "P03",
  authorization: "P08",
  security: "P09",
} as const;

export const BOUNDARY_CONCERNS: readonly string[] = Object.keys(PHASE_BOUNDARY_OWNERS);

/** Returns the owning phases for a concern (empty when not a declared boundary). */
export function boundaryOwner(concern: string): string[] {
  const owner = PHASE_BOUNDARY_OWNERS[concern];
  return owner ? owner.split("/") : [];
}
