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
import { ENGINEERING_SECTION_COUNT, engineeringSectionCoverage } from "../engineering-sections";
import { KERNEL_CAPABILITIES } from "../kernel-capability-registry";
import {
  PHASE_CONTRACT_SCHEMA_VERSION,
  buildPhaseContractGraph,
  isPhaseContractStatus,
  summarizePhaseContracts,
  validatePhaseContract,
  validatePhaseContractGraph,
  type AsiTier,
  type PhaseContractStatus,
  type PhaseContractSummary,
  type PhaseEngineeringContract,
  type SelfImprovementMode,
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
import { PHASE_21_CLOUD_FABRIC } from "./phase-21-cloud-fabric";
import { PHASE_22_MOBILE_PLATFORM } from "./phase-22-mobile-platform";
import { PHASE_23_WEB_PLATFORM } from "./phase-23-web-platform";
import { PHASE_24_EXPERIENCE_DESIGN } from "./phase-24-experience-design";
import { PHASE_25_ONBOARDING_WORKFORCE } from "./phase-25-onboarding-workforce";
import { PHASE_26_AI_INTELLIGENCE } from "./phase-26-ai-intelligence";
import { PHASE_27_MARKETPLACE } from "./phase-27-marketplace";
import { PHASE_28_DEVELOPER_PLATFORM } from "./phase-28-developer-platform";
import { PHASE_29_INTEGRATION } from "./phase-29-integration";
import { PHASE_30_GLOBALIZATION } from "./phase-30-globalization";
import { PHASE_31_ENTERPRISE_SCALE } from "./phase-31-enterprise-scale";
import { PHASE_32_FUTURE_EVOLUTION } from "./phase-32-evolution";
import { PHASE_33_REALITY_KERNEL } from "./phase-33-reality-kernel";
import { PHASE_34_COGNITIVE_ENGINE } from "./phase-34-cognitive-engine";
import { PHASE_35_AGENT_CIVILIZATION } from "./phase-35-agent-civilization";
import { PHASE_36_MEMORY_KNOWLEDGE } from "./phase-36-memory-knowledge";
import { PHASE_37_SIMULATION_ENGINE } from "./phase-37-simulation-engine";
import { PHASE_38_EVOLUTION_ENGINE } from "./phase-38-evolution-engine";
import { PHASE_39_GOVERNANCE_ALIGNMENT } from "./phase-39-governance-alignment";
import { PHASE_40_RUNTIME_FABRIC } from "./phase-40-runtime-fabric";
import { PHASE_41_SANDBOX_ENGINE } from "./phase-41-sandbox-engine";
import { PHASE_42_ADVERSARIAL_DEFENSE } from "./phase-42-adversarial-defense";
import { PHASE_43_INTERFACE_CONNECTIVITY } from "./phase-43-interface-connectivity";
import { PHASE_44_PLANETARY_INFRASTRUCTURE } from "./phase-44-planetary-infrastructure";
import { PHASE_45_AI_COMPUTE } from "./phase-45-ai-compute";
import { PHASE_46_TWIN_CIVILIZATION } from "./phase-46-twin-civilization";
import { PHASE_47_SELF_IMPROVEMENT } from "./phase-47-self-improvement";
import { PHASE_48_KNOWLEDGE_GRAPH } from "./phase-48-knowledge-graph";
import { PHASE_49_AUTONOMOUS_ECONOMY } from "./phase-49-autonomous-economy";
import { PHASE_50_HUMAN_INTERFACE } from "./phase-50-human-interface";
import { PHASE_51_REALITY_OS } from "./phase-51-reality-os";

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
  PHASE_21_CLOUD_FABRIC,
  PHASE_22_MOBILE_PLATFORM,
  PHASE_23_WEB_PLATFORM,
  PHASE_24_EXPERIENCE_DESIGN,
  PHASE_25_ONBOARDING_WORKFORCE,
  PHASE_26_AI_INTELLIGENCE,
  PHASE_27_MARKETPLACE,
  PHASE_28_DEVELOPER_PLATFORM,
  PHASE_29_INTEGRATION,
  PHASE_30_GLOBALIZATION,
  PHASE_31_ENTERPRISE_SCALE,
  PHASE_32_FUTURE_EVOLUTION,
  PHASE_33_REALITY_KERNEL,
  PHASE_34_COGNITIVE_ENGINE,
  PHASE_35_AGENT_CIVILIZATION,
  PHASE_36_MEMORY_KNOWLEDGE,
  PHASE_37_SIMULATION_ENGINE,
  PHASE_38_EVOLUTION_ENGINE,
  PHASE_39_GOVERNANCE_ALIGNMENT,
  PHASE_40_RUNTIME_FABRIC,
  PHASE_41_SANDBOX_ENGINE,
  PHASE_42_ADVERSARIAL_DEFENSE,
  PHASE_43_INTERFACE_CONNECTIVITY,
  PHASE_44_PLANETARY_INFRASTRUCTURE,
  PHASE_45_AI_COMPUTE,
  PHASE_46_TWIN_CIVILIZATION,
  PHASE_47_SELF_IMPROVEMENT,
  PHASE_48_KNOWLEDGE_GRAPH,
  PHASE_49_AUTONOMOUS_ECONOMY,
  PHASE_50_HUMAN_INTERFACE,
  PHASE_51_REALITY_OS,
] as const;

export function phaseContractById(id: string): PhaseEngineeringContract | undefined {
  return PHASE_CONTRACTS.find((contract) => contract.id === id);
}

const KNOWN_CAPABILITY_IDS: readonly string[] = KERNEL_CAPABILITIES.map((c) => c.id);
const CAPABILITY_OWNERS: Readonly<Record<string, string>> = Object.fromEntries(
  KERNEL_CAPABILITIES.map((c) => [c.id, c.ownerPhase]),
);

export interface PhaseContractCoverageRow {
  id: string;
  name: string;
  layer: string;
  stage: string;
  status: PhaseContractStatus;
  /** Owned kernel capability, or null when the phase is a pure composer. */
  capability: string | null;
  sectionsDeclared: number;
  sectionsTotal: number;
  asiTier: AsiTier;
  autonomyLevel: number;
  selfImprovement: SelfImprovementMode;
  dependencies: number;
  consumers: number;
  neutralSeats: number;
}

export interface PhaseContractCoverageSnapshot {
  schemaVersion: number;
  total: number;
  sectionsPerPhase: number;
  sectionsComplete: number;
  byStatus: Readonly<Record<PhaseContractStatus, number>>;
  byLayer: ReadonlyArray<{ layer: string; phases: number }>;
  byAsiTier: Readonly<Record<AsiTier, number>>;
  roots: readonly string[];
  rows: readonly PhaseContractCoverageRow[];
}

/**
 * Kernel-owned coverage snapshot for surfaces.
 *
 * A surface renders THIS — never a hand-maintained summary — so what an
 * operator sees is exactly what the contract validator enforces.
 */
export function phaseContractCoverageSnapshot(
  contracts: readonly PhaseEngineeringContract[] = PHASE_CONTRACTS,
): PhaseContractCoverageSnapshot {
  const rows: PhaseContractCoverageRow[] = contracts.map((contract) => {
    const coverage = engineeringSectionCoverage(Object.keys(contract.sections ?? {}));
    return {
      id: contract.id,
      name: contract.name,
      layer: contract.layer,
      stage: contract.stage,
      status: contract.status,
      capability: contract.capabilities.owns[0] ?? null,
      sectionsDeclared: coverage.declared,
      sectionsTotal: coverage.total,
      asiTier: contract.asi.tier,
      autonomyLevel: contract.asi.autonomy.level,
      selfImprovement: contract.asi.selfImprovement,
      dependencies: contract.dependsOn.length,
      consumers: contract.consumers.length,
      neutralSeats: contract.runtimeBindings.neutralSeats.length,
    };
  });

  const byStatus = {
    architecture: 0,
    planned: 0,
    implementing: 0,
    implemented: 0,
    complete: 0,
  } as Record<PhaseContractStatus, number>;
  const byAsiTier = {
    assistive: 0,
    "supervised-autonomous": 0,
    "governed-autonomous": 0,
    "civilization-scale": 0,
  } as Record<AsiTier, number>;
  const layerCounts = new Map<string, number>();

  for (const row of rows) {
    if (isPhaseContractStatus(row.status)) byStatus[row.status] += 1;
    byAsiTier[row.asiTier] += 1;
    layerCounts.set(row.layer, (layerCounts.get(row.layer) ?? 0) + 1);
  }

  return {
    schemaVersion: PHASE_CONTRACT_SCHEMA_VERSION,
    total: contracts.length,
    sectionsPerPhase: ENGINEERING_SECTION_COUNT,
    sectionsComplete: rows.filter((row) => row.sectionsDeclared === row.sectionsTotal).length,
    byStatus,
    byLayer: [...layerCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([layer, phases]) => ({ layer, phases })),
    byAsiTier,
    roots: buildPhaseContractGraph(contracts).roots,
    rows,
  };
}

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
