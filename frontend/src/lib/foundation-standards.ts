/**
 * CoreGrid — Phase 01 Foundation standards (machine-readable, consumable).
 *
 * Phase 01 owns conventions and verification, never domain state. This module is
 * the machine-readable form of that ownership: the capability id, the verification
 * contracts the foundation guarantees, and a snapshot derived from the phase-01
 * engineering contract itself. It exists so a surface (or any consumer) can show
 * and check *what the foundation actually enforces* without duplicating prose.
 *
 * It implements nothing new: every value is read from
 * `phase-contracts/phase-01-foundation.ts`, which is the contract the phases
 * already agree on.
 */
import { phaseContractById, type PhaseContractRef } from "@/lib/kernel/phase-contracts";

/** The capability Phase 01 owns. Consumers reference this, never a copy. */
export const FOUNDATION_CAPABILITY_ID = "foundation-standards-config-secrets-ci";

export interface FoundationStandard {
  /** Contract id as declared by the phase-01 contract (e.g. `npm:verify`). */
  id: string;
  kind: PhaseContractRef["kind"];
  description: string;
}

export interface FoundationStandardsSnapshot {
  capabilityId: string;
  standards: FoundationStandard[];
  /** Human-facing guarantee this standard provides, in contract order. */
  guarantees: string[];
}

/**
 * Read the foundation's standards from the phase-01 contract.
 *
 * Returns an empty snapshot rather than throwing when the contract is absent: a
 * projection must be able to render "no contract found" truthfully instead of
 * crashing or inventing content.
 */
export function foundationStandardsSnapshot(): FoundationStandardsSnapshot {
  const contract = phaseContractById("01");
  const standards = (contract?.contracts.provides ?? []).map((ref) => ({
    id: ref.id,
    kind: ref.kind,
    description: ref.description ?? "",
  }));

  return {
    capabilityId: FOUNDATION_CAPABILITY_ID,
    standards,
    guarantees: standards.map((standard) => `${standard.id} — ${standard.description}`),
  };
}

/** Whether a command is one of the foundation's declared verification contracts. */
export function isFoundationStandard(id: string): boolean {
  return foundationStandardsSnapshot().standards.some((standard) => standard.id === id);
}
