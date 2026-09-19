/**
 * Phase 02 — Identity engineering contract (kernel-neutral).
 *
 * The universal identity substrate: one registry of actors (human,
 * organization, agent, service, device, runtime) with credentials, lifecycle,
 * relationships and roles. A runtime binds staff, student and guardian actors to
 * this identity spine; other domains consume the same contract through reserved
 * neutral seats (patient, citizen, customer). No runtime holds a privileged seat.
 *
 * Boundary: identity owns WHO an actor is. Tenancy hierarchy belongs to phase
 * 03, workspace chrome to phase 06, domain attributes to the runtimes.
 */

import { definePhaseContract } from "./define-phase";

export const PHASE_02_IDENTITY = definePhaseContract(
  {
    id: "02",
    name: "Identity",
    layer: "Foundations",
    stage: "S1",
    status: "implemented",
    owner: "02",
    purpose:
      "Own the universal identity substrate: register every actor with provenance, resolve it under tenant context, govern its lifecycle and relationships, and expose typed consumption contracts.",
    boundary: {
      statement:
        "Identity answers who an actor is, never what a domain's actor means. It never embeds tenant hierarchy, workspace chrome or domain attributes (student, patient, citizen), which belong to phase 03, phase 06 and the domain runtimes respectively.",
      excludes: [
        "tenancy-hierarchy-ownership (phase 03)",
        "workspace-chrome-ownership (phase 06)",
        "domain-actor-attributes (consuming runtimes)",
        "authorization-decisions (phase 08)",
      ],
    },
    dependsOn: ["01"],
    consumers: ["03", "05", "06", "08", "22", "25", "50"],
    capabilities: {
      owns: ["universal-identity"],
      consumes: ["foundation-standards-config-secrets-ci"],
    },
    contracts: {
      provides: [
        { id: "identity:register-actor", kind: "command", description: "provision an actor" },
        { id: "identity:resolve-actor", kind: "query", description: "resolve actor under tenant" },
        { id: "identity:lifecycle-transition", kind: "api", description: "governed state change" },
      ],
      consumes: [{ id: "foundation:verify-chain", kind: "command" }],
    },
    sections: {
      identity:
        "Phase 02 owns capability universal-identity and the cg_identity registry identity.",
      purpose:
        "One universal identity substrate so every phase and runtime resolves actors the same way, with provenance and lifecycle instead of ad-hoc user tables.",
      ownership:
        "Single owner of actor registry, credential lifecycle, relationships and role assignment; no other phase may mint actors.",
      boundary:
        "Excludes tenancy hierarchy, workspace chrome, authorization decisions and domain attributes; those live in phases 03, 06, 08 and the runtimes.",
      principle:
        "Identity is verified before it is trusted: no actor exists without provenance, and no privilege is implicit from record existence.",
      architecture:
        "Domain modules hold identity logic; application/server functions wire commands and queries; policy gates lifecycle; infrastructure holds the auth adapter.",
      contract:
        "Provides register/resolve/lifecycle contracts; consumes the foundation verification chain; never exposes raw credential material.",
      dataModel: {
        summary:
          "Owned state is the cg_identity substrate plus credentials, lifecycle, relationships and roles tables with RLS by tenant.",
        artifacts: [
          "architecture/phase-02-identity.md",
          "database/supabase/migrations/20260904020000_coregrid_l2_identity_tenancy.sql",
          "frontend/src/lib/identity-registry.ts",
        ],
      },
      event: "Emits identity lifecycle and relationship events; transport belongs to phase 05.",
      workflow:
        "Provision → verify → activate → relate → suspend/archive, with every transition audited and reversible where policy allows.",
      security: {
        summary:
          "Credentials never leave the adapter; RLS guards identity rows; privileged transitions are gated by phase 08 roles and audited.",
        artifacts: ["frontend/src/lib/identity-credentials.ts", "CONSTITUTION.md"],
      },
      tenancy:
        "Every identity read and write is tenant-scoped; cross-tenant linking requires explicit policy and recorded approval.",
      aiSafety:
        "AI may resolve and recommend actors but never create, elevate or impersonate one; model identity assertions are untrusted until validated.",
      observability:
        "Identity transitions and failed resolutions are recorded as audit events without leaking credential material.",
      testing: {
        summary:
          "Unit suites cover registry, credentials, lifecycle, relationships and actor resolution, including cross-tenant denial.",
        artifacts: ["tests/unit/identity-registry.test.ts", "tests/unit/identity.test.ts"],
        evidence: ["registry + lifecycle suites green"],
      },
      integration:
        "Consumed by phases 03, 05, 06, 08, 22, 25 and 50; a runtime binds its own actor kinds (staff, student and guardian in an education runtime) to this contract.",
      dependency:
        "Depends on phase 01 foundations and consumes the kernel capability graph rather than redefining it.",
      risk: "Risks: identity duplication across phases (single ownership), privilege creep (gated transitions) and orphaned actors (lifecycle rules).",
      completion:
        "L1–L3 evidenced by document, substrate migration and live RLS; L4–L5 advance as surfaces and validation rows consume the typed contracts.",
      extension:
        "New actor kinds and identity providers are additive through the registry and adapter contracts; no kernel rewrite required.",
    },
    asi: {
      tier: "assistive",
      autonomy: {
        level: 1,
        requiresApprovalFor: [
          "actor-deletion",
          "role-escalation",
          "cross-tenant-identity-link",
          "credential-reset-without-verification",
        ],
      },
      invariants: [
        "canonical-truth-separation",
        "agent-least-privilege",
        "human-approval-for-critical",
        "ai-output-untrusted",
        "no-permission-expansion",
        "provenance-required",
        "observable-autonomy",
      ],
      selfImprovement: "proposal-only",
      canonicalTruth: {
        owners: ["cg_identity", "credential-lifecycle", "identity-relationships"],
        derived: ["identity-risk-signals", "duplicate-candidates", "agent-proposals"],
      },
    },
    runtimeBindings: {
      firstRuntime: "runtime:scholar",
      neutralSeats: [
        {
          domain: "healthcare",
          status: "reserved",
          manifestRef: "frontend/src/lib/kernel/domain-manifest.ts",
        },
        {
          domain: "government",
          status: "reserved",
          manifestRef: "frontend/src/lib/kernel/domain-manifest.ts",
        },
        {
          domain: "commerce",
          status: "reserved",
          manifestRef: "frontend/src/lib/kernel/domain-manifest.ts",
        },
      ],
    },
  },
  { defaultArtifacts: ["architecture/phase-02-identity.md"] },
);
