/**
 * CoreGrid Scholar — offline-first operation (Phase-04 §86–90).
 *
 * The runtime must work with weak/intermittent connectivity, expensive mobile
 * data and power interruptions (§86). Supported workflows queue SAFE
 * operations for synchronization (§87) and offline changes require
 * DETERMINISTIC reconciliation (§88). Low-bandwidth design minimizes media,
 * repeated downloads and excessive sync (§89); power-aware operation keeps
 * clients efficient in constrained environments (§90). Purely declarative —
 * the transport/sync mechanism belongs to the infrastructure phases.
 */

export type SyncMode = "standard" | "low_bandwidth" | "power_safe";

export interface QueuedOperation {
  opId: string;
  kind: string;
  entity: string;
  entityId: string;
  queuedAt: string;
  syncMode: SyncMode;
  /** Media-heavy payload refs are stripped in low-bandwidth modes. */
  payloadRefs?: string[];
}

export function validateOfflineQueue(input: readonly QueuedOperation[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const operation of input) {
    if (!operation.opId.trim()) {
      issues.push("a queued operation requires an opId");
      continue;
    }
    if (ids.has(operation.opId)) issues.push(`duplicate queued operation "${operation.opId}"`);
    ids.add(operation.opId);
    if (!operation.kind.trim() || !operation.entity.trim() || !operation.entityId.trim()) {
      issues.push(`queued operation "${operation.opId}": kind, entity and entityId are required`);
    }
    if (!Number.isFinite(Date.parse(operation.queuedAt))) {
      issues.push(`queued operation "${operation.opId}": queuedAt must be a valid timestamp`);
    }
    if (
      operation.syncMode !== "standard" &&
      operation.syncMode !== "low_bandwidth" &&
      operation.syncMode !== "power_safe"
    ) {
      issues.push(
        `queued operation "${operation.opId}": syncMode must be standard, low_bandwidth or power_safe`,
      );
    }
  }
  return issues;
}

/** Deterministic conflict resolution (§88): later timestamp wins; ties by opId. */
export function resolveConflict(
  serverOperation: QueuedOperation,
  localOperation: QueuedOperation,
): QueuedOperation {
  if (serverOperation.queuedAt !== localOperation.queuedAt) {
    return serverOperation.queuedAt > localOperation.queuedAt ? serverOperation : localOperation;
  }
  return serverOperation.opId.localeCompare(localOperation.opId) >= 0
    ? serverOperation
    : localOperation;
}

/** §89: media payload refs that a low-bandwidth client should not download. */
export function lowBandwidthSkipList(operation: QueuedOperation): string[] {
  if (operation.syncMode !== "low_bandwidth") return [];
  const mediaish = ["video", "image", "audio", "simulation"];
  return (operation.payloadRefs ?? []).filter((ref) =>
    mediaish.some((token) => ref.toLowerCase().includes(token)),
  );
}

/** §90: suggested batching size for power-aware synchronization. */
export function powerSafeBatchSize(queueLength: number): number {
  if (queueLength === 0) return 0;
  return Math.min(10, queueLength);
}
