# COREGRID — CAPABILITY OWNERSHIP GRAPH

Status: PLAN ARTIFACT (living document)
Authority: REGISTRY.md §9–10, §14; DEPENDENCY.md §7–9; PROGRESS.md §7
Version: 2026-09-02
Purpose: The canonical map of every major CoreGrid capability to its single architectural owner and its consumers. Machine-auditable twin: `architecture/registry.json` (`capabilities`).

---

## 1. Laws

1. ONE CAPABILITY → ONE CANONICAL OWNER → MANY CONSUMERS.
2. Consumption occurs only through API / EVENT / COMMAND / QUERY / CONTRACT / POLICY / DATA PROJECTION / ADAPTER.
3. Runtime interaction never equals structural ownership (§73). Structural edges must remain acyclic (§74).
4. No phase, runtime or domain forks a canonical engine. Domains extend; they do not fork (§14, §19, §20).
5. Where a later phase is a governance/surface "overlay" over an earlier engine, the earlier phase remains the canonical owner and the overlay is recorded as a consumer with governing responsibilities.
6. If a capability's owner is "multiple phases," that is a duplication defect — resolve via §8 duplication map and record an ADR.

## 2. Canonical ownership table

| Capability | Owner | Primary consumers | Canonical surface today |
| --- | --- | --- | --- |
| Foundation, standards, config, secrets, CI | P01 | all | scripts/, .github/workflows/verify.yml |
| Universal identity | P02 | P03, P05, P06, P08, P22, P25, P50 | identity*.ts, roles.ts, supabase auth |
| Tenancy / isolation / RLS | P03 | all | tenant*.ts, 30 migrations/RLS |
| Education reality ontology (Scholar) | P04 | P11, P12, P13, P25 | education-*.ts |
| Universal reality/ontology model (URIK) | P33 | P34, P36, P48, P51 | phase-33 doc (L1) |
| Runtime primitives (ctx/cmd-qry/events/jobs/caps/obs) | P05 | all domain layers | runtime-*.ts |
| Workspace composition | P06 | P19, P24, P50 | workspace-*.ts |
| Agent runtime | P07 | P26, P35, P47, P50 | agent-*.ts |
| Security enforcement | P08 | all | security-*.ts |
| Trust fabric | P09 | P08, P42 | trust-*.ts |
| Communication/messaging | P10 | P24, P43 | communication-*.ts |
| Academic intelligence (Scholar) | P11 | P12, P18 | academic-*.ts |
| Scheduling (Scholar) | P12 | P04, P25 | scheduling-*.ts |
| Financial/payments ledger | P13 | P27, P49 | financial-*.ts |
| Data platform | P14 | all domains | data-*.ts |
| Hardware/device/telemetry | P15 | P16, P44 | hardware-*.ts |
| Live digital twin | P16 | P17, P18, P46 | twin-*.ts |
| Automation/workflow runtime | P17 | all | automation-*.ts |
| Analytics/decision intelligence | P18 | P19, P34 | analytics-*.ts |
| Command centre (ops surface) | P19 | control plane | command-*.ts + `/` |
| Government/sovereign deployments | P20 | P44 | government-*.ts |
| Cloud fabric / BYOC | P21 | P44 | cloud-*.ts |
| Mobile client platform | P22 | Scholar runtime | platform-*.ts |
| Web client platform | P23 | Scholar runtime | web-*.ts |
| Experience design intelligence | P24 | P50 | experience-*.ts |
| Onboarding/workforce identity (ext of P02) | P25 | Scholar runtime | institution-*, workforce-* |
| AI model gateway / intelligence routing | P26 | P07, P34, P35 | ai-*.ts, ai-gateway.server.ts |
| Marketplace | P27 | P49, P51 | marketplace-*.ts |
| Developer platform | P28 | P27, P51 | dev-*.ts |
| Integration adapters / anti-corruption | P29 | P43 | integration-*.ts |
| Globalization | P30 | P04, P50 | globalization-*.ts |
| Enterprise scale | P31 | P40 | enterprise-*.ts |
| Evolution lifecycle of capabilities | P32/38* | P47 | evolution-*.ts (*ADR PLATFORM-004) |
| Cognitive architecture / reasoning | P34 | P26, P35 | phase-34 doc (L1) |
| Multi-agent society governance | P35 | P07 (overlay) | phase-35 doc (L1) |
| Memory & knowledge civilization engine | P36 | P34, P35, P07 | phase-36 doc (L1) |
| Simulation & future intelligence engine | P37 | P41 | phase-37 doc (L1) |
| Governance & alignment engine | P39 | P51 | phase-39 doc (L1) |
| Universal runtime fabric | P40 | P51 | phase-40 doc (L1) |
| Sandbox/simulation civilization runtime | P41 | P37, P47 | phase-41 doc (L1) |
| Zero-trust/adversarial defense | P42 | P08 (overlay) | phase-42 doc (L1) |
| Universal interface & connectivity | P43 | P50, P51 | phase-43 doc (L1) |
| Planetary distributed infrastructure | P44 | P15, P21 | phase-44 doc (L1) |
| AI compute civilization | P45 | P26 | phase-45 doc (L1) |
| Digital twin civilization federation | P46 | P16 (federation) | phase-46 doc (L1) |
| Autonomous engineering self-improvement | P47 | P32/38, P39 | phase-47 doc (L1) |
| Civilization knowledge graph | P48 | P33, P36 | phase-48 doc (L1) |
| Autonomous economy (governed markets) | P49 | P13, P27 | phase-49 doc (L1) |
| Human civilization interface | P50 | P06, P24 | phase-50 doc (L1) |
| Reality OS kernel (composition) | P51 | all | phase-51 doc (L1) |

## 3. Ownership verification (per phase gate)

Before a phase advances: WHO owns each of its exposed capabilities? Is the answer single and recorded? Do any consumers fork or reimplement? Does the phase own state that overlaps another phase's canonical state? Any "multiple phases" answer routes to the duplication map (§8 PROGRESS) and an ADR — never to silent resolution.
