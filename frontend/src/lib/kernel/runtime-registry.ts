/**
 * Sherivs — Phase 33 Universal Kernel: domain-runtime registry lifecycle.
 *
 * Pure logic over `cg_domain_runtime` rows and the runtime-manifest status
 * lifecycle (`kernel/domain-manifest.ts`). A server function validates a
 * manifest, builds a registry row with this module, and persists it via the
 * service role. This module performs no persistence and owns no state.
 */

import {
  validateManifest,
  type RuntimeManifest,
  type RuntimeManifestStatus,
} from "./domain-manifest";

/** Allowed status transitions (proposed → review → approved → active …). */
export const RUNTIME_STATUS_TRANSITIONS: Readonly<
  Record<RuntimeManifestStatus, readonly RuntimeManifestStatus[]>
> = {
  proposed: ["review", "retired"],
  review: ["approved", "proposed", "retired"],
  approved: ["active", "review", "retired"],
  active: ["suspended", "retired"],
  suspended: ["active", "retired"],
  retired: [],
} as const;

export function canTransitionRuntimeStatus(
  from: RuntimeManifestStatus,
  to: RuntimeManifestStatus,
): boolean {
  return RUNTIME_STATUS_TRANSITIONS[from].includes(to);
}

export interface RuntimeRegistryRow {
  id: string;
  name: string;
  version: string;
  status: RuntimeManifestStatus;
  manifest: RuntimeManifest;
  created_at: string;
  updated_at: string;
}

/**
 * Build a registry row from a validated manifest. Throws when the manifest is
 * structurally invalid or its status is not a registrable state.
 */
export function registryRowFromManifest(
  manifest: RuntimeManifest,
  now: string,
  status: RuntimeManifestStatus = "proposed",
): RuntimeRegistryRow {
  const validation = validateManifest(manifest);
  if (!validation.ok) {
    throw new Error(`Cannot register an invalid manifest: ${validation.issues.join("; ")}`);
  }
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    status,
    manifest,
    created_at: now,
    updated_at: now,
  };
}

/** Status transition result for the registry server function. */
export type RuntimeStatusChange =
  { ok: true; row: RuntimeRegistryRow } | { ok: false; reason: string };

export function applyRuntimeStatusTransition(
  current: RuntimeRegistryRow,
  to: RuntimeManifestStatus,
  now: string,
): RuntimeStatusChange {
  if (!canTransitionRuntimeStatus(current.status, to)) {
    return {
      ok: false,
      reason: `Runtime cannot transition ${current.status} → ${to}`,
    };
  }
  return {
    ok: true,
    row: { ...current, status: to, updated_at: now },
  };
}
