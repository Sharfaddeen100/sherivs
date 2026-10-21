/**
 * Sherivs Scholar — configurable grading (§41).
 *
 * Grading systems are configuration: numerical, percentage, letter, grade
 * bands, competency, pass/fail, mastery and institution-defined models are
 * supported through one structure. Scales are validated for ordering and
 * overlap; score resolution is pure.
 */

export type GradingModelKind =
  | "numerical"
  | "percentage"
  | "letter"
  | "grade_band"
  | "competency"
  | "pass_fail"
  | "mastery"
  | "institution_defined";

export const GRADING_MODEL_KINDS: readonly GradingModelKind[] = [
  "numerical",
  "percentage",
  "letter",
  "grade_band",
  "competency",
  "pass_fail",
  "mastery",
  "institution_defined",
] as const;

export interface ScaleEntry {
  label: string;
  minPercentage: number;
  maxPercentage: number;
  passed: boolean | null;
}

export interface GradingModel {
  code: string;
  name: string;
  kind: GradingModelKind;
  /** Thresholds are inclusive on both ends and must not overlap. */
  scale: ScaleEntry[];
  /** Pass mark for numerical models (0–100). */
  numericalPassMark?: number | null;
  notes?: string | null;
}

export type GradingValidation = { ok: true; model: GradingModel } | { ok: false; issues: string[] };

export interface GradeResult {
  label: string;
  passed: boolean | null;
  kind: GradingModelKind;
  pct: number | null;
}

export function validateGradingModel(model: GradingModel): GradingValidation {
  const issues: string[] = [];

  if (!model.code.trim()) issues.push("a grading model requires a code");
  if (!model.name.trim()) issues.push(`model "${model.code}": name is required`);
  if (!GRADING_MODEL_KINDS.includes(model.kind)) {
    issues.push(`model "${model.code}": kind must be one of ${GRADING_MODEL_KINDS.join(", ")}`);
  }
  // Pass-mark kinds (numerical/percentage) need a 0–100 numerical pass mark.
  if (model.kind === "numerical" || model.kind === "percentage") {
    if (model.numericalPassMark != null && !Number.isFinite(model.numericalPassMark)) {
      issues.push(`model "${model.code}": numericalPassMark must be a number`);
    } else if (
      model.numericalPassMark != null &&
      (model.numericalPassMark < 0 || model.numericalPassMark > 100)
    ) {
      issues.push(`model "${model.code}": numericalPassMark must be between 0 and 100`);
    }
    if (model.kind === "numerical" && model.numericalPassMark == null) {
      issues.push(`model "${model.code}": numerical models require a numericalPassMark`);
    }
  }

  const thresholdKinds = new Set<string>(["letter", "grade_band", "pass_fail"]);
  const descriptorKinds = new Set<string>(["competency", "mastery", "institution_defined"]);
  const needsScale = thresholdKinds.has(model.kind) || descriptorKinds.has(model.kind);
  if (needsScale && model.scale.length === 0) {
    issues.push(`model "${model.code}": kind "${model.kind}" requires at least one scale entry`);
  }

  for (const entry of model.scale) {
    if (!entry.label.trim()) issues.push(`model "${model.code}": a scale entry requires a label`);
    if (!Number.isFinite(entry.minPercentage) || !Number.isFinite(entry.maxPercentage)) {
      issues.push(`model "${model.code}": scale thresholds must be numbers`);
      continue;
    }
    if (
      entry.minPercentage < 0 ||
      entry.maxPercentage > 100 ||
      entry.minPercentage > entry.maxPercentage
    ) {
      issues.push(
        `model "${model.code}": scale entry "${entry.label}" is outside 0–100 or inverted`,
      );
    }
  }

  // Descriptor kinds (competency/mastery) label outcomes; numeric thresholds
  // are meaningless for them — only labels must be unique.
  if (descriptorKinds.has(model.kind)) {
    const labels = new Set<string>();
    for (const entry of model.scale) {
      if (labels.has(entry.label))
        issues.push(`model "${model.code}": duplicate scale label "${entry.label}"`);
      labels.add(entry.label);
    }
  }

  // Threshold kinds resolve percentage scores — entries must not overlap.
  if (thresholdKinds.has(model.kind)) {
    const sorted = [...model.scale].sort((a, b) => a.minPercentage - b.minPercentage);
    for (let i = 0; i < sorted.length; i += 1) {
      if (i > 0 && sorted[i].minPercentage <= sorted[i - 1].maxPercentage) {
        issues.push(
          `model "${model.code}": scale entry "${sorted[i].label}" overlaps the previous entry`,
        );
      }
    }
  }

  return issues.length === 0 ? { ok: true, model } : { ok: false, issues };
}

/** Resolve a percentage score (0–100) through the configured scale. */
export function gradeForPercentage(model: GradingModel, pct: number): GradeResult {
  if (model.kind === "numerical") {
    const passed = model.numericalPassMark == null ? null : pct >= model.numericalPassMark;
    return { label: `${Math.round(pct)}`, passed, kind: model.kind, pct };
  }
  if (model.kind === "percentage") {
    return {
      label: `${Math.round(pct)}%`,
      passed: pct >= (model.numericalPassMark ?? 50),
      kind: model.kind,
      pct,
    };
  }
  const entry = model.scale.find((s) => pct >= s.minPercentage && pct <= s.maxPercentage);
  if (!entry) {
    return { label: "unscored", passed: null, kind: model.kind, pct };
  }
  return { label: entry.label, passed: entry.passed, kind: model.kind, pct };
}

/** Resolve a competency/mastery descriptor through the configured scale. */
export function gradeForDescriptor(model: GradingModel, descriptor: string): GradeResult {
  const entry = model.scale.find((s) => s.label === descriptor);
  if (!entry) {
    return { label: "unscored", passed: null, kind: model.kind, pct: null };
  }
  return { label: entry.label, passed: entry.passed, kind: model.kind, pct: null };
}
