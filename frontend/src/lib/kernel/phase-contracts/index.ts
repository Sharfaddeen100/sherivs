/**
 * CoreGrid — kernel phase-contract registry (domain-neutral barrel).
 *
 * The assembled set of authored phase contracts. `validatePhaseContracts`
 * checks every contract and the cross-phase connection graph together, so a
 * phase can never land as an island: it must declare dependencies and at least
 * one consumer, and the whole set must stay a connected DAG.
 *
 * Adding a phase is a data operation: author `phase-NN-*.ts`, add it here, run
 * the verification chain. The kernel itself is never rewritten.
 */

import { PHASE_CATALOG } from "../../phase-catalog";
import { KERNEL_CAPABILITIES } from "../kernel-capability-registry";
import {
  buildPhaseContractGraph,
  summarizePhaseContracts,
  validatePhaseContract,
  validatePhaseContractGraph,
  type PhaseContractSummary,
  type PhaseEngineeringContract,
} from "../phase-contract";
import { PHASE_01_FOUNDATION } from "./phase-01-foundation";
import { PHASE_02_IDENTITY } from "./phase-02-identity";
import { PHASE_03_MULTI_TENANCY } from "./phase-03-multi-tenancy";
import { PHASE_04_REALITY_ENGINE } from "./phase-04-reality-engine";
import { PHASE_05_APPLICATION_RUNTIME } from "./phase-05-application-runtime";
import { PHASE_06_WORKSPACE_ENGINE } from "./phase-06-workspace-engine";
import { PHASE_07_AI_AGENT_SYSTEM } from "./phase-07-ai-agent-system";
import { PHASE_08_SECURITY_ENGINE } from "./phase-08-security-engine";
import { PHASE_09_TRUST_FABRIC } from "./phase-09-trust-fabric";
import { PHASE_10_COMMUNICATION } from "./phase-10-communication";
import { PHASE_11_ACADEMIC_INTELLIGENCE } from "./phase-11-academic-intelligence";
import { PHASE_12_SCHEDULING_INTELLIGENCE } from "./phase-12-scheduling-intelligence";
import { PHASE_13_FINANCIAL_SYSTEM } from "./phase-13-financial-system";
import { PHASE_14_DATA_PLATFORM } from "./phase-14-data-platform";
import { PHASE_15_HARDWARE_INTEGRATION } from "./phase-15-hardware-integration";
import { PHASE_16_DIGITAL_TWIN } from "./phase-16-digital-twin";
import { PHASE_17_AUTOMATION_ENGINE } from "./phase-17-automation-engine";
import { PHASE_18_ANALYTICS_INTELLIGENCE } from "./phase-18-analytics-intelligence";
import { PHASE_19_COMMAND_CENTRE } from "./phase-19-command-centre";
import { PHASE_20_GOVERNMENT_CLOUD } from "./phase-20-government-cloud";

export const PHASE_CONTRACTS: readonly PhaseEngineeringContract[] = [
  PHASE_01_FOUNDATION,
  PHASE_02_IDENTITY,
  PHASE_03_MULTI_TENANCY,
  PHASE_04_REALITY_ENGINE,
  PHASE_05_APPLICATION_RUNTIME,
  PHASE_06_WORKSPACE_ENGINE,
  PHASE_07_AI_AGENT_SYSTEM,
  PHASE_08_SECURITY_ENGINE,
  PHASE_09_TRUST_FABRIC,
  PHASE_10_COMMUNICATION,
  PHASE_11_ACADEMIC_INTELLIGENCE,
  PHASE_12_SCHEDULING_INTELLIGENCE,
  PHASE_13_FINANCIAL_SYSTEM,
  PHASE_14_DATA_PLATFORM,
  PHASE_15_HARDWARE_INTEGRATION,
  PHASE_16_DIGITAL_TWIN,
  PHASE_17_AUTOMATION_ENGINE,
  PHASE_18_ANALYTICS_INTELLIGENCE,
  PHASE_19_COMMAND_CENTRE,
  PHASE_20_GOVERNMENT_CLOUD,
] as const;

export function phaseContractById(id: string): PhaseEngineeringContract | undefined {
  return PHASE_CONTRACTS.find((contract) => contract.id === id);
}

const KNOWN_CAPABILITY_IDS: readonly string[] = KERNEL_CAPABILITIES.map((c) => c.id);
const CAPABILITY_OWNERS: Readonly<Record<string, string>> = Object.fromEntries(
  KERNEL_CAPABILITIES.map((c) => [c.id, c.ownerPhase]),
);

export interface PhaseContractsValidation {
  ok: boolean;
  issues: readonly string[];
  summary: PhaseContractSummary;
}

/**
 * Validate the authored contract set as a whole: per-contract rules, kernel
 * capability ownership, and the connected-DAG law across phases.
 */
export function validatePhaseContracts(
  contracts: readonly PhaseEngineeringContract[] = PHASE_CONTRACTS,
): PhaseContractsValidation {
  const issues: string[] = [];
  /** Connection refs are validated against the whole 51-phase registry, not
   * only the contracts authored so far, so a wave can declare consumers in
   * phases that have not been authored yet (they are registered phases). */
  const knownPhaseIds = PHASE_CATALOG.map((entry) => entry.phase);

  for (const contract of contracts) {
    const result = validatePhaseContract(contract, {
      knownPhaseIds,
      knownCapabilityIds: KNOWN_CAPABILITY_IDS,
      capabilityOwners: CAPABILITY_OWNERS,
    });
    if (!result.ok) {
      for (const issue of result.issues) issues.push(`phase ${contract.id}: ${issue}`);
    }
  }

  for (const graphIssue of validatePhaseContractGraph(buildPhaseContractGraph(contracts))) {
    issues.push(graphIssue);
  }

  return { ok: issues.length === 0, issues, summary: summarizePhaseContracts(contracts) };
}
