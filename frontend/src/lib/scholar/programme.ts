/**
 * CoreGrid Scholar — configurable programme/educational hierarchy (Phase-04 §6).
 *
 * "The hierarchy must be configurable." An institution composes its own tree —
 * levels, streams, programmes, houses, groups — as generic nodes with parent
 * references. Nothing here assumes a specific national or Western structure
 * (§6, §186). Node keys are `code` when present, otherwise `name` (uniqueness
 * enforced on the effective key).
 *
 * Platform dependency: the whole structure belongs to one tenant (cg_tenant);
 * later persistence flows through the Scholar blueprint/config surface. This
 * module owns no state and performs no persistence.
 */

export interface ProgrammeItem {
  name: string;
  /** Stable key used for parenting/integration when provided. */
  code?: string | null;
  /** Effective key of the parent, or null for a root node. */
  parentCode?: string | null;
  sortOrder?: number;
}

export type ProgrammeStructure = readonly ProgrammeItem[];

export type ProgrammeValidation =
  { ok: true; roots: string[]; total: number } | { ok: false; issues: string[] };

const ITEM_NAME_MAX = 80;
const ITEM_CODE_MAX = 32;
const ITEM_CODE_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;

export function effectiveKey(item: { name: string; code?: string | null }): string {
  const code = item.code?.trim() ?? "";
  return code !== "" ? code : item.name.trim();
}

/** Validate a configurable programme structure (uniqueness + acyclicity). */
export function validateProgrammeStructure(items: unknown): ProgrammeValidation {
  const issues: string[] = [];
  if (!Array.isArray(items)) {
    return { ok: false, issues: ["programme structure must be an array"] };
  }

  const byKey = new Map<string, ProgrammeItem>();
  for (const [index, raw] of items.entries()) {
    const item = raw as {
      name?: unknown;
      code?: unknown;
      parentCode?: unknown;
      sortOrder?: unknown;
    };
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (name.length < 1 || name.length > ITEM_NAME_MAX) {
      issues.push(`item[${index}].name must be 1–${ITEM_NAME_MAX} characters`);
      continue;
    }
    const code = typeof item.code === "string" && item.code.trim() !== "" ? item.code.trim() : null;
    if (code !== null && !ITEM_CODE_RE.test(code)) {
      issues.push(`item "${name}" code must match ${ITEM_CODE_RE}`);
    }
    const parentCode = typeof item.parentCode === "string" ? item.parentCode : null;
    const sortOrder = typeof item.sortOrder === "number" ? item.sortOrder : undefined;
    const key = code ?? name;
    if (byKey.has(key)) {
      issues.push(`duplicate item key "${key}"`);
    } else {
      byKey.set(key, { name, code, parentCode, sortOrder });
    }
  }
  if (issues.length > 0) return { ok: false, issues };

  // Parent references must resolve; detect cycles via DFS colouring.
  const colour = new Map<string, "grey" | "black">();
  const resolve = (key: string): boolean => {
    const item = byKey.get(key);
    if (!item) return false;
    if (!item.parentCode) return true;
    const parent = item.parentCode;
    if (!byKey.has(parent)) {
      issues.push(`item "${key}" references unknown parent "${parent}"`);
      return false;
    }
    return true;
  };

  for (const key of byKey.keys()) resolve(key);
  if (issues.length > 0) return { ok: false, issues };

  const visit = (key: string): boolean => {
    const item = byKey.get(key);
    if (!item) return true;
    const state = colour.get(key);
    if (state === "grey") {
      issues.push(`cycle detected at "${key}"`);
      return false;
    }
    if (state === "black") return true;
    colour.set(key, "grey");
    if (item.parentCode) visit(item.parentCode);
    colour.set(key, "black");
    return issues.length === 0;
  };
  for (const key of byKey.keys()) {
    if (!visit(key)) break;
  }

  if (issues.length > 0) return { ok: false, issues };
  const roots = [...byKey.values()].filter((i) => !i.parentCode).map(effectiveKey);
  return { ok: true, roots, total: byKey.size };
}

/** Build an ordered adjacency list for a validated structure. */
export function programmeChildren(items: readonly ProgrammeItem[]): Map<string, ProgrammeItem[]> {
  const children = new Map<string, ProgrammeItem[]>();
  for (const item of items) {
    const key = effectiveKey(item);
    if (item.parentCode) {
      const list = children.get(item.parentCode) ?? [];
      list.push(item);
      children.set(item.parentCode, list);
    }
  }
  for (const list of children.values()) {
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
  return children;
}
