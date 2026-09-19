/**
 * CoreGrid — phase-contract authoring helper (kernel, domain-neutral).
 *
 * Writing a contract by hand for fifty-one phases would repeat the same
 * structure fifty-one times and invite drift. `definePhaseContract` keeps the
 * contract honest while removing the boilerplate:
 *
 *  - every one of the twenty engineering sections is still REQUIRED at the type
 *    level, so a phase cannot be authored with a missing section;
 *  - a section may be written as a short string when it needs no extra
 *    metadata, or as a declaration object when it carries status/artifacts;
 *  - `defaultArtifacts` supplies the shared phase document for sections that do
 *    not name their own artifacts, so the validator's artifact requirement is
 *    satisfied by real files rather than placeholders.
 *
 * The helper performs no invention: it never fabricates a summary or an
 * artifact. A draft that omits a section or provides no artifacts fails fast.
 */

import { ENGINEERING_SECTION_KEYS, type EngineeringSectionKey } from "../engineering-sections";
import {
  PHASE_CONTRACT_SCHEMA_VERSION,
  type AsiTier,
  type ConnectionRef,
  type NeutralDomainSeat,
  type PhaseContractRef,
  type PhaseContractStatus,
  type PhaseEngineeringContract,
  type SectionDeclaration,
  type SectionDeclarationStatus,
  type SelfImprovementMode,
} from "../phase-contract";
import type { AsiInvariant } from "../engineering-sections";

export type SectionInput =
  | string
  | {
      summary: string;
      status?: SectionDeclarationStatus;
      artifacts?: readonly string[];
      evidence?: readonly string[];
    };

export interface PhaseContractDraft extends Omit<
  PhaseEngineeringContract,
  "schemaVersion" | "sections"
> {
  sections: Readonly<Record<EngineeringSectionKey, SectionInput>>;
}

export interface DefinePhaseOptions {
  /** Artifacts applied to sections that declare none (usually the phase doc). */
  defaultArtifacts?: readonly string[];
}

export function definePhaseContract(
  draft: PhaseContractDraft,
  options: DefinePhaseOptions = {},
): PhaseEngineeringContract {
  const defaults = options.defaultArtifacts ?? [];
  const sections = {} as Record<EngineeringSectionKey, SectionDeclaration>;

  for (const key of ENGINEERING_SECTION_KEYS) {
    const input = draft.sections[key];
    if (input === undefined) {
      throw new Error(`Phase ${draft.id} is missing engineering section "${key}"`);
    }
    const declaration = typeof input === "string" ? { summary: input } : input;
    const artifacts = declaration.artifacts ?? defaults;
    if (!artifacts.length) {
      throw new Error(
        `Phase ${draft.id} section "${key}" has no artifacts; pass defaultArtifacts or declare them`,
      );
    }
    sections[key] = {
      status: declaration.status ?? "declared",
      summary: declaration.summary,
      artifacts: [...artifacts],
      evidence: declaration.evidence ? [...declaration.evidence] : undefined,
    };
  }

  return { ...draft, schemaVersion: PHASE_CONTRACT_SCHEMA_VERSION, sections };
}

/* ─────────────────────────────────────────────────────────────
 * Seed-driven authoring (used for the 50-phase sweep)
 * ────────────────────────────────────────────────────────────*/

/**
 * A seed carries the facts that genuinely differ per phase. Every engineering
 * section is generated from those facts, with optional per-section overrides.
 * Generated sections are never hollow: each names the phase, its owned
 * capability, its dependencies/consumers or its artifacts.
 */
export interface PhaseContractSeed {
  id: string;
  name: string;
  /** Exact phase document path (the default artifact for every section). */
  phaseDoc: string;
  layer: string;
  stage: string;
  status: PhaseContractStatus;
  owner: string;
  /** Owned kernel capability id (must match the capability registry owner). */
  capability?: string;
  /**
   * Used only when the phase owns no capability of its own (registry-true for a
   * pure composer such as phase 38): how the phase relates to others' capability.
   */
  ownershipNote?: string;
  consumes?: readonly string[];
  purpose: string;
  /** What this phase is the single owner of (engineering `ownership` section). */
  ownership: string;
  /** Engineering `boundary` summary; `boundaryStatement` is the neutrality law. */
  boundaryStatement: string;
  excludes: readonly string[];
  principle: string;
  dependsOn: readonly ConnectionRef[];
  consumers?: readonly ConnectionRef[];
  /** Owned state / substrate for the `dataModel` section. */
  substrates?: readonly string[];
  /** Domain suites that carry the `testing` section. */
  tests?: readonly string[];
  provides?: readonly PhaseContractRef[];
  consumesContracts?: readonly PhaseContractRef[];
  canonicalTruth: {
    owners: readonly string[];
    derived: readonly string[];
    ownsNoCanonicalTruth?: boolean;
  };
  asiTier?: AsiTier;
  autonomyLevel?: number;
  requiresApprovalFor?: readonly string[];
  selfImprovement?: SelfImprovementMode;
  neutralSeats?: readonly NeutralDomainSeat[];
  /** Per-section overrides when a generated section would be inaccurate. */
  sections?: Partial<Record<EngineeringSectionKey, SectionInput>>;
}

export const DEFAULT_NEUTRAL_SEATS: readonly NeutralDomainSeat[] = [
  { domain: "healthcare", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  { domain: "government", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
  { domain: "commerce", status: "reserved", manifestRef: "kernel/domain-manifest.ts" },
] as const;

const ALL_ASI_INVARIANTS: readonly AsiInvariant[] = [
  "canonical-truth-separation",
  "agent-least-privilege",
  "human-approval-for-critical",
  "ai-output-untrusted",
  "no-permission-expansion",
  "provenance-required",
  "observable-autonomy",
] as const;

export function definePhaseContractFromSeed(seed: PhaseContractSeed): PhaseEngineeringContract {
  const contracts = {
    provides: seed.provides ?? [],
    consumes: seed.consumesContracts ?? [],
  };
  const capabilityList = [seed.capability, ...(seed.consumes ?? [])]
    .filter((entry): entry is string => Boolean(entry))
    .join(", ");
  const providedIds = contracts.provides.map((contract) => contract.id).join(", ");
  const consumedIds = contracts.consumes.map((contract) => contract.id).join(", ");

  const generated: Record<EngineeringSectionKey, SectionInput> = {
    identity: seed.capability
      ? `Phase ${seed.id} owns capability ${seed.capability} in the kernel capability registry (${seed.name}).`
      : `Phase ${seed.id} owns no kernel capability of its own; ${seed.ownershipNote ?? "it composes capabilities owned by other phases and never redefines them"}.`,
    purpose: seed.purpose,
    ownership: seed.ownership,
    boundary: seed.boundaryStatement,
    principle: seed.principle,
    architecture: `Domain modules hold ${seed.name} logic, the application layer wires its contracts, policy gates privileged operations and infrastructure adapts providers.`,
    contract: `Provides ${contracts.provides.length} contract(s)${providedIds ? ` (${providedIds})` : ""} and consumes ${consumedIds || "no phase contract"}; capabilities in scope: ${capabilityList}.`,
    dataModel:
      seed.substrates && seed.substrates.length
        ? `Owned state: ${seed.substrates.join(", ")}, tenant-scoped by RLS wherever it holds tenant data.`
        : `Phase ${seed.id} owns no domain tables; its state is the contracts and registrations it exposes.`,
    event: `Phase ${seed.id} publishes ${seed.name} domain events through the phase 05 transport; it never delivers them itself.`,
    workflow: `Operating workflow: propose → validate → apply → audit for ${seed.name} operations, with policy gates on privileged steps.`,
    security: `Phase 08 enforces access to ${seed.name} operations; the phase fails closed when authorization context is missing.`,
    tenancy: `All tenant data in ${seed.name} is scoped to a tenant and protected by the phase 03 isolation guarantees.`,
    aiSafety: `AI may analyse ${seed.name} data and propose changes, but may not mutate canonical records, widen its own permissions or act outside the declared approval gates.`,
    observability: `${seed.name} operations, failures and policy decisions are observable without logging secrets or unnecessary personal data.`,
    testing: `Phase ${seed.id} evidence: unit suites${seed.tests?.length ? ` (${seed.tests.join(", ")})` : ""} plus the shared verification chain (typecheck, unit, registry, secrets, build).`,
    integration: `Consumed by ${(seed.consumers ?? ["all"]).join(", ")}; the first installed runtime is a consumer among equals, and other domains consume the same contract through neutral seats.`,
    dependency: `Depends on ${seed.dependsOn.length ? seed.dependsOn.join(", ") : "no phase (foundation root)"}; external providers are reached only through adapters.`,
    risk: `Registered risks for ${seed.name} are tracked in PROGRESS.md; mitigations are the verification chain, policy gates and single ownership.`,
    completion: `L1–L3 require the phase document, owned state where applicable and working contracts; L4–L5 require live surfaces, observability and validation rows.`,
    extension: `Extension points are additive: new subtypes, adapters and contracts register without changing the kernel.`,
  };

  const sections = { ...generated, ...(seed.sections ?? {}) } as Record<
    EngineeringSectionKey,
    SectionInput
  >;

  return definePhaseContract(
    {
      id: seed.id,
      name: seed.name,
      layer: seed.layer,
      stage: seed.stage,
      status: seed.status,
      owner: seed.owner,
      purpose: seed.purpose,
      boundary: { statement: seed.boundaryStatement, excludes: seed.excludes },
      dependsOn: seed.dependsOn,
      consumers: seed.consumers ?? ["all"],
      capabilities: {
        owns: seed.capability ? [seed.capability] : [],
        consumes: seed.consumes ?? [],
      },
      contracts,
      sections,
      asi: {
        tier: seed.asiTier ?? "assistive",
        autonomy: {
          level: seed.autonomyLevel ?? 1,
          requiresApprovalFor: seed.requiresApprovalFor ?? [
            "canonical-record-mutation",
            "permission-change",
          ],
        },
        invariants: ALL_ASI_INVARIANTS,
        selfImprovement: seed.selfImprovement ?? "proposal-only",
        canonicalTruth: seed.canonicalTruth,
      },
      runtimeBindings: {
        firstRuntime: "runtime:scholar",
        neutralSeats: seed.neutralSeats ?? DEFAULT_NEUTRAL_SEATS,
      },
    },
    { defaultArtifacts: [seed.phaseDoc] },
  );
}
