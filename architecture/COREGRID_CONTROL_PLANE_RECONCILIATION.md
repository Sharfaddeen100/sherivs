# CoreGrid Control-Plane Reconciliation

Mission: COREGRID-MISSION-0001  
Status: DESIGNED / PARTIAL IMPLEMENTATION MAP  
Date: 2026-09-27  
Authority: Existing governance hierarchy; no new service authority created.

## Decision

The twelve mechanisms are capabilities and control interfaces, not twelve
independent microservices. Existing repository structures already implement
portions of each mechanism. The current control plane is distributed across
governance documents, registry data, typed contracts, Supabase state, scripts,
tests, CI, and runtime libraries.

## Mechanism map

| Mechanism | Existing owner/substrate | Status | Main broken link |
| --- | --- | --- | --- |
| 01 Registry | `REGISTRY.md`, `architecture/registry.json`, kernel registries | IMPLEMENTED / DRIFTING | Hand registry and derived status disagree |
| 02 Schemas | SQL migrations, Zod, generated Supabase types, phase contracts | IMPLEMENTED / SPLIT | No unified schema ownership policy |
| 03 State | `cg_*`, legacy `school_*`, twin state, React Query | PARTIAL | Canonical state plane not unified |
| 04 Evidence | proofs, acceptance, archaeology, Scholar evidence | PARTIAL | No universal evidence identity/revocation plane |
| 05 Context Assembly | `ai-context.ts`, Scholar context modules | PARTIAL | No universal persisted context fabric |
| 06 Mission Orchestration | `MISSIONS.md`, progress/execution plans, agent tooling | DESIGNED | No durable mission contract or runtime |
| 07 Workforce Delegation | Phase 25 HR/workforce substrate; agent task contracts | PARTIAL | HR workforce is not mission/agent delegation |
| 08 Cursor Execution | `AGENTS.md`, `.claude/`, hooks, Cursor environment | TOOLING | Not a CoreGrid product runtime |
| 09 Verification | package scripts, verification scripts, tests, CI | TOOLING_IMPLEMENTED | Live integration verification is not in main CI |
| 10 Conformance | purity, neutrality, phase-contract, P08 tests | PARTIAL | No unified conformance claim/evidence model |
| 11 Progress Reconciliation | `PROGRESS.md`, phase auditor, derived status, truth sweep | OPERATIONAL_LEDGER | Status semantics and registry drift remain |
| 12 Drift / Evolution | evolution libraries, duplication map, audit records | PARTIAL / CONTESTED | D3 and related ownership remains open |

## Control-plane boundaries

```text
Governance
    ↓
Registry + Contracts
    ↓
State + Evidence
    ↓
Context + Mission + Workforce
    ↓
Authorized Execution
    ↓
Verification + Conformance
    ↓
Progress + Drift / Evolution
```

The arrows describe dependencies and evidence flow. They do not mandate
process boundaries, deployment boundaries, or microservices.

## Security boundary

Control-plane claims must preserve identity, tenant scope, authorization,
policy, purpose, data classification, minimization, audit, and revocation.
Kernel `cg_*` tables use deny-by-default RLS and server/service-role access;
consuming runtime policies remain a separate verification concern.

## Current implementation gate

Do not implement mission orchestration, autonomous execution, evidence
infrastructure, or new stores until:

1. authority aliases are resolved;
2. mission and evidence ownership are assigned;
3. contracts and schemas are defined;
4. tenant/security boundaries are specified;
5. failure and rollback semantics are defined;
6. verification and conformance evidence are designed.

## Next safe control-plane action

Use existing registry, phase contracts, and audit scripts to lock a row-level
status comparison. This increases certainty without adding infrastructure.
