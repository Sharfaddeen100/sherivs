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

The platform evolves through 24 documented phases. Each phase file in this
directory is intentionally empty; content is added as each phase is scoped
and approved:

| Phase | Focus |
| --- | --- |
| 01 | Foundation |
| 02 | Identity |
| 03 | Multi-tenancy |
| 04 | Education Reality Engine |
| 05 | Workspace Engine |
| 06 | AI Agent System |
| 07 | Security Engine |
| 08 | Communication Platform |
| 09 | Payment & Billing Engine |
| 10 | Data Platform |
| 11 | Hardware Integration |
| 12 | Digital Twin |
| 13 | Automation Engine |
| 14 | Analytics Engine |
| 15 | Government Education Cloud |
| 16 | Mobile Platform |
| 17 | Web Platform |
| 18 | AI Intelligence Layer |
| 19 | Marketplace |
| 20 | Developer Platform |
| 21 | CoreGrid Integration |
| 22 | Globalization |
| 23 | Enterprise Scale |
| 24 | Future Evolution |

## Reading order for agents

Codex and other agents must read, in order:

1. `architecture/` (this directory) - what we are building and why
2. `constitution/` - the rules that override convenience
3. `decisions/` - recorded decisions, including rejected alternatives
4. `progress/` - what exists, what is blocked, what is next

Never create a feature outside an approved architecture phase.

