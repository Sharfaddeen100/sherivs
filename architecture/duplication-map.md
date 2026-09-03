# COREGRID — CAPABILITY DUPLICATION MAP

Status: PLAN ARTIFACT (living document)
Authority: REGISTRY.md §12–13; PROGRESS.md §8; DECISIONS.md (ADR register)
Version: 2026-09-02
Purpose: Detect every capability that appears in more than one phase, record its canonical owner and the resolution that prevents competing engines. Machine-auditable twin: `architecture/registry.json` (`duplications`).

---

## 1. Resolution algorithm (applied per cluster, §13)

1. Detect all references. 2. Extract all requirements. 3. Merge compatible requirements. 4. Detect contradictory requirements. 5. Determine canonical owner. 6. Define canonical interface. 7. Define canonical data model. 8. Define extension points. 9. Migrate consumers. 10. Preserve required behavior. 11. Delete only a proven duplicate implementation. 12. Test all consumers. 13. Update registry. 14. Update dependencies. 15. Record ADR if ownership changed.

Rule: never delete a requirement because it appeared in the "wrong" phase — move it into the canonical capability. ONE CAPABILITY, MANY CONSUMERS, ONE DOCUMENT SET.

## 2. Cluster register

| # | Cluster | Phases mentioning it | Owner | Consumers | Resolution state |
| --- | --- | --- | --- | --- | --- |
| D1 | Memory | 07 (agent-memory), 14 (data), 26, 34, 36 | P36 | P07 (client), P34, P35 | OPEN — ADR PLATFORM-003 before P36 implementation |
| D2 | Knowledge / graphs | 33 (ontology), 36 (knowledge), 48 (graph), 14 (catalog) | P33 ontology kernel; P48 relationship graph; P36 memory/knowledge semantics | P34, P35, P51 | OPEN — ADR PLATFORM-003 |
| D3 | Evolution | 32 (evolution-*.ts), 38, 47, 31 | P32 today → P38 consumes | P47 | OPEN — ADR PLATFORM-004 before P38 |
| D4 | Digital twin | 16 (live twin), 46, 33, 48 | P16 live twin | P46 federation | OPEN — ADR PLATFORM-005 before P46 |
| D5 | Simulation / sandbox | 37 (sim), 41 (sandbox), 16 (twin sim), 35 | P37 simulator | P41 sandbox runtime | OPEN — ADR PLATFORM-006 |
| D6 | Agents | 07 (runtime), 35, 26, 47, 50 | P07 | P35 overlay, P26, P47, P50 | CLOSED (operational rule) |
| D7 | Security / trust | 08, 09, 42, 51 | P08 enforcement; P09 trust; P42 adversarial overlay | all | OPEN — ADR PLATFORM-007 before P42 |
| D8 | Identity extensions | 02, 25 (workforce), 20 (government) | P02 | P25/P20 domain extensions | CLOSED (AGENTS.md 65) |
| D9 | AI / intelligence | 07, 11, 18, 26, 34 | P26 gateway | P07, P11, P18, P34, P35 | CLOSED (operational rule) |
| D10 | Event fabric | 05 (events/outbox/DLQ), 16, 17, workflows | P05 transport | all producers | CLOSED (operational rule) |
| D11 | Workflow / automation | 17 (automation), 05 (jobs), 28, 47 | P17 runtime | P28/P47 consumers | CLOSED (operational rule) |
| D12 | Workspace vs surfaces | 06, 19, 22, 23, 24, 50 | P06 composition | surfaces | CLOSED (operational rule) |
| D13 | Economy / finance | 13, 49, 27 | P13 ledger | P49 sim markets, P27 | CLOSED (operational rule) |
| D14 | Catalog module naming | P32 evolution-* vs reserved P38 names | — | — | CLOSED (reserve P38 prefixes; ADR PLATFORM-004) |
| D15 | Globalization / interface / human layer | 30, 43, 50 | P30 locale; P43 connectivity; P50 human interaction | — | CLOSED (operational rule) |

## 3. Canonical-system single-owner list (§14)

One coherent platform implementation for each of: Identity Foundation (P02), Authorization (P02/P08), Tenant Context (P03), Policy Engine (P08), Security (P08), Trust (P09), Event Fabric (P05), API Contract System (P05), Memory (P36), Knowledge (P36/P48), Reality Graph (P33), Data Platform (P14), Intelligence Gateway (P26), Agent Runtime (P07), Workflow Runtime (P17), Automation (P17), Simulation (P37), Digital Twin Infrastructure (P16), Observability (P05/P14), Audit (P05/P19), Capability Registry (P05), Runtime Registry (P51/P40), Configuration (P01), Secrets (P01), Deployment (P21), Cost Intelligence (P31/P45). Domains extend; they do not fork.

## 4. Audit cadence

Run the duplication audit after every phase gate and after every global change (§96): duplicate services, repositories, tables, event buses, memory stores, knowledge systems, agent runtimes, workflow engines, policy engines, security systems, API clients, configuration systems.
