/**
 * Sherivs Scholar — API/event contracts (Phase-04 §131–132, O1).
 *
 * Phase 04 connects other systems through authoritative educational contracts.
 * This module is the typed OPERATION REGISTRY for the runtime's server
 * surfaces: every command/query/event names its surface, input shape and
 * output kind. The registry is declarative — enforcement happens at the P08
 * gated server functions, not here.
 */

export type OperationKind = "command" | "query" | "event";

export type SurfaceName =
  | "configuration"
  | "structure"
  | "curriculum"
  | "time"
  | "participation"
  | "attendance"
  | "assessment"
  | "examination"
  | "facilities"
  | "boarding"
  | "transport"
  | "welfare"
  | "evidence"
  | "oversight"
  | "import";

export const SURFACE_NAMES: readonly SurfaceName[] = [
  "configuration",
  "structure",
  "curriculum",
  "time",
  "participation",
  "attendance",
  "assessment",
  "examination",
  "facilities",
  "boarding",
  "transport",
  "welfare",
  "evidence",
  "oversight",
  "import",
] as const;

export interface OperationContract {
  id: string;
  kind: OperationKind;
  surface: SurfaceName;
  /** Zod/documentation shape name — typed bodies live with server functions. */
  inputShape: string;
  outputKind: string;
  requiresAuthorization: boolean;
}

export function validateOperationContracts(input: readonly OperationContract[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const contract of input) {
    const id = contract.id.trim();
    if (!id) {
      issues.push("an operation contract requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate operation contract id "${id}"`);
    ids.add(id);
    if (contract.kind !== "command" && contract.kind !== "query" && contract.kind !== "event") {
      issues.push(`contract "${id}": kind must be command, query or event`);
    }
    if (!SURFACE_NAMES.includes(contract.surface)) {
      issues.push(`contract "${id}": surface must be one of ${SURFACE_NAMES.join(", ")}`);
    }
    if (!contract.inputShape.trim() || !contract.outputKind.trim()) {
      issues.push(`contract "${id}": inputShape and outputKind are required`);
    }
    if (!contract.requiresAuthorization) {
      issues.push(`contract "${id}": every Scholar operation requires authorization (§26)`);
    }
  }
  return issues;
}

/** Resolve the contract for an operation id, or null when undeclared. */
export function resolveOperationContract(
  contracts: readonly OperationContract[],
  operationId: string,
): OperationContract | null {
  return contracts.find((contract) => contract.id === operationId) ?? null;
}
