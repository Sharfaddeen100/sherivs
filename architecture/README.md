# CoreGrid Scholar - Architecture

## Philosophy

CoreGrid Scholar is the first production runtime of the CoreGrid platform
ecosystem: a multi-tenant education operating system designed to scale from a
single school to national education clouds.

The architecture follows five commitments:

1. **Clean boundaries before new features.** Every engine (Identity,
   Multi-Tenancy, Education Reality, Workspace, AI Agents, Security,
   Communication, Payments, Data, Hardware, Digital Twin, Automation,
   Analytics, Mobile, Web, Intelligence, Marketplace, Developer Platform,
   CoreGrid Integration, Globalization, Enterprise Scale) is planned as a
   phase. No feature is built outside its phase.
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
   `constitution/ai-agent-policy.md`.

## Phase map

The platform evolves through 30 documented phases. Each phase file in this
directory is intentionally empty; content is added as each phase is scoped
and approved:

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
| 24 | AI Intelligence Layer |
| 25 | Marketplace |
| 26 | Developer Platform |
| 27 | CoreGrid Integration |
| 28 | Globalization |
| 29 | Enterprise Scale |
| 30 | Future Evolution |

## Reading order for agents

Codex and other agents must read, in order:

1. `architecture/` (this directory) - what we are building and why
2. `constitution/` - the rules that override convenience
3. `decisions/` - recorded decisions, including rejected alternatives
4. `progress/` - what exists, what is blocked, what is next

Never create a feature outside an approved architecture phase.
