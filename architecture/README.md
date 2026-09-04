# CoreGrid Scholar - Architecture

## Philosophy

CoreGrid Scholar is the first production runtime of the CoreGrid platform
ecosystem: a multi-tenant education operating system designed to scale from a
single school to national education clouds.

The architecture follows five commitments:

1. **Clean boundaries before new features.** Every engine (Identity,
   Multi-Tenancy, Education Reality, Core Application Runtime, Workspace,
   AI Agents, Security, Trust Fabric, Communication, Academic Intelligence,
   Scheduling Intelligence, Financial System, Data, Hardware, Digital Twin,
   Automation, Analytics, Command Centre, Government Cloud, Global Cloud
   Fabric, Mobile, Web, Experience & Design, Workforce Identity,
   Intelligence, Marketplace, Developer Platform, CoreGrid Integration,
   Globalization, Enterprise Scale) is planned as a phase. No feature is
   built outside its phase.
2. **Data isolation is a database guarantee.** Tenant isolation is enforced
   by Postgres Row-Level Security, never only by application code.
3. **The monolith is a feature, not a debt.** The current TanStack Start
   full-stack application is the correct first runtime; services are extracted
   only when the boundary is real and tested.
4. **No fake data, ever.** Every component renders real data from the
   database or an explicit empty state. This rule is inherited from the
   archived product specification and remains constitutional.
5. **AI is an agent, not a feature.** AI systems are designed as auditable
   agents with policies, permissions, and observability, per
   `architecture/phase-07-ai-agent-system.md` (Phase 07 specification).

## Phase map

The platform evolves through 51 documented phases. Each phase file in this
directory carries its architectural specification; implementation status,
levels and evidence are tracked in `PROGRESS.md` and
`architecture/registry.json` (never inside the normative phase docs):

| Phase | Focus |
| --- | --- |
| 01 | Foundation |
| 02 | Identity |
| 03 | Multi-Tenancy |
| 04 | Education Reality Engine |
| 05 | Core Application Runtime |
| 06 | Workspace Engine |
| 07 | AI Agent System |
| 08 | Security Engine |
| 09 | Security Trust Fabric |
| 10 | Communication Platform |
| 11 | Academic Intelligence |
| 12 | Scheduling Intelligence |
| 13 | Financial System |
| 14 | Data Platform |
| 15 | Hardware Integration |
| 16 | Digital Twin |
| 17 | Automation Engine |
| 18 | Analytics Intelligence |
| 19 | Command Centre |
| 20 | Government Education Cloud |
| 21 | Global Cloud Fabric |
| 22 | Mobile Platform |
| 23 | Web Platform |
| 24 | CoreGrid Experience & Design Intelligence |
| 25 | Institutional Onboarding, Administration & Workforce Identity Platform |
| 26 | AI Intelligence Layer |
| 27 | Marketplace |
| 28 | Developer Platform |
| 29 | CoreGrid Integration |
| 30 | Globalization |
| 31 | Enterprise Scale |
| 32 | Future Evolution |
| 33 | Reality Intelligence Kernel |
| 34 | Universal Cognitive Intelligence Engine |
| 35 | Autonomous Agent Civilization OS |
| 36 | Universal Memory & Knowledge Civilization Engine |
| 37 | Simulation & Future Intelligence Engine |
| 38 | Evolution Engine |
| 39 | Governance & Alignment Engine |
| 40 | Universal Runtime Fabric |
| 41 | Reality Simulation & Autonomous Sandbox Civilization Engine |
| 42 | Zero Trust Security & Adversarial Defense Civilization Engine |
| 43 | Universal Interface & Connectivity Intelligence |
| 44 | Planetary Distributed Infrastructure Engine |
| 45 | AI Compute Civilization Engine |
| 46 | Universal Digital Twin Civilization Layer |
| 47 | Autonomous Engineering Self-Improvement Engine |
| 48 | Civilization Knowledge Graph |
| 49 | Autonomous Economy Engine |
| 50 | Human Civilization Interface Layer |
| 51 | Universal Reality Operating System Kernel |

## Reading order for agents

Codex and other agents must read, in order:

1. `architecture/` (this directory) - what we are building and why
2. `CONSTITUTION.md` (root) - the rules that override convenience
3. `PRINCIPLES.md` (root) - foundational architecture principles
4. `DECISIONS.md` (root) - recorded decisions, including rejected alternatives
5. `BOUNDARIES.md`, `DEPENDENCY.md`, `REGISTRY.md` (root) - boundaries, dependency topology, canonical registry
6. `PROGRESS.md` (root) - what exists, what is blocked, what is next

Never create a feature outside an approved architecture phase.

## Plan artifacts and machine-readable registry

The repository carries the 51-phase execution plan artifacts produced by the platform-wide reconnaissance (2026-09-02). Read them with the phase documents:

- `execution-plan.md` — the complete 51-phase architectural execution plan (stage map, per-phase delta to gate, completion gate, verification loop, stop conditions)
- `capability-ownership-graph.md` — canonical capability → owner → consumers graph
- `duplication-map.md` — capability duplication clusters and canonicalization decisions
- `dependency-graph.md` — typed structural dependency graph and topological execution order
- `engineering-section-completeness-matrix.md` — phase-document section coverage + L1–L5 maturity grid
- `migration-plan.md` — the transformation path preserving valid infrastructure and upgrading to the universal model
- `kernel-wiring-plan.md` — the DB-backed S2 wiring sequence (runtime registry, event recording, persistence adapters); NOT EXECUTED until a database-backed runtime is available
- `registry.json` — machine-readable architectural registry (51 phases, 50 capabilities, 15 duplication rows, 2 runtimes)
- `scripts/verification/registry-validate.mjs` — registry invariant validator
- `scripts/verification/engineering-sections.mjs` — completeness-matrix scanner

Progress truth (statuses, test counts, evidence) lives in `PROGRESS.md`; these artifacts and the registry must never drift from it or from `REGISTRY.md`.
