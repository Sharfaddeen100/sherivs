/**
 * Sherivs Scholar — educational level registry (Phase-04 §5).
 *
 * An institution defines its OWN educational levels. No fixed grade hierarchy
 * exists anywhere in this module: nursery / kindergarten / primary / lower and
 * upper primary / junior & senior secondary / technical & vocational streams /
 * teacher training / college / adult education / institutional custom levels
 * are all just possible configurations — never code branches (§5, §78, §186).
 *
 * Platform dependency: a level belongs to a tenant (cg_tenant id) and is
 * config data for that tenant; the level configuration is validated here and
 * later persisted through the Scholar blueprint/config surface (Cluster A4).
 * This module owns no state and performs no persistence.
 */

export interface EducationalLevel {
  /** Canonical name shown in the institution (e.g. "SS1", "JHS 2", "Term 3"). */
  name: string;
  /** Optional stable code (e.g. "ss1", "jhs2") for imports/integrations. */
  code?: string | null;
  /** Display/ordering index within the institution's level list. */
  sortOrder: number;
}

export type LevelConfiguration = readonly EducationalLevel[];

export type LevelValidation =
  { ok: true; levels: EducationalLevel[] } | { ok: false; issues: string[] };

const LEVEL_NAME_MAX = 80;
const LEVEL_CODE_MAX = 32;
const LEVEL_CODE_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;

export function isValidLevelCode(code: string): boolean {
  return LEVEL_CODE_RE.test(code);
}

/** Order levels by sortOrder (stable for equal keys). */
export function sortLevels(levels: readonly EducationalLevel[]): EducationalLevel[] {
  return [...levels].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Validate an institution's level configuration.
 * Rules (configuration, never hard-coded structure):
 *  - at least one level;
 *  - non-blank unique names (trimmed);
 *  - codes (when present) unique and matching the code pattern;
 *  - sortOrder must be a finite, non-negative integer.
 */
export function validateLevels(input: unknown): LevelValidation {
  const issues: string[] = [];
  if (!Array.isArray(input) || input.length === 0) {
    return { ok: false, issues: ["an institution must define at least one educational level"] };
  }

  const levels: EducationalLevel[] = [];
  const names = new Set<string>();
  const codes = new Set<string>();

  for (const [index, raw] of input.entries()) {
    if (typeof raw !== "object" || raw === null) {
      issues.push(`level[${index}] must be an object`);
      continue;
    }
    const level = raw as { name?: unknown; code?: unknown; sortOrder?: unknown };
    const name = typeof level.name === "string" ? level.name.trim() : "";
    if (name.length < 1 || name.length > LEVEL_NAME_MAX) {
      issues.push(`level[${index}].name must be 1–${LEVEL_NAME_MAX} characters`);
    } else if (names.has(name)) {
      issues.push(`duplicate level name "${name}"`);
    } else {
      names.add(name);
    }

    if (level.code != null && level.code !== "") {
      const code = String(level.code).trim();
      if (!isValidLevelCode(code)) {
        issues.push(
          `level "${name || index}" code must match ${LEVEL_CODE_RE} (lowercase letters, digits, _ and - only)`,
        );
      } else if (codes.has(code)) {
        issues.push(`duplicate level code "${code}"`);
      } else {
        codes.add(code);
      }
    }

    const order = level.sortOrder;
    if (
      typeof order !== "number" ||
      !Number.isFinite(order) ||
      !Number.isInteger(order) ||
      order < 0
    ) {
      issues.push(`level "${name || index}" sortOrder must be a non-negative integer`);
    }

    if (name.length >= 1 && name.length <= LEVEL_NAME_MAX) {
      levels.push({
        name,
        code: level.code ? String(level.code).trim() : null,
        sortOrder: typeof order === "number" && Number.isFinite(order) ? order : levels.length,
      });
    }
  }

  return issues.length === 0 ? { ok: true, levels: sortLevels(levels) } : { ok: false, issues };
}
