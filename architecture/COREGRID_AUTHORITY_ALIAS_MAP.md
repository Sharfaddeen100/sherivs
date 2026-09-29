# CoreGrid Authority Alias Map

Mission: `COREGRID-MISSION-0001`  
Status: `OBSERVED / PROPOSED / GOVERNANCE DECISION REQUIRED`  
Captured: `2026-09-28`

This map reconciles names and existing artifacts without creating a second
authority. It does not silently adopt the conceptual 13-surface model over
the seven legacy governance roots. The unresolved authority decision remains
explicit.

## Authority precedence currently evidenced

```text
CONSTITUTION.md
  ↓
GOVERNANCE.md / legacy governance roots
  ↓
ARCHITECTURE.md / REGISTRY.md / DEPENDENCY.md / BOUNDARIES.md
  ↓
REALITY.md / ENGINEERING.md / WORKFORCE.md / MISSIONS.md / BLUEPRINTS.md
  ↓
IMPLEMENTATION.md / RUNTIME.md / ASSURANCE.md
  ↓
phase contracts and mission contracts
  ↓
implementation
  ↓
tests, execution evidence, verification, conformance
```

The 13 conceptual mother surfaces are present in the current working tree,
but their presence does not by itself supersede the legacy governance roots.
`AGENTS.md` and the Luna contracts constrain agent execution; they are not
architectural authority.

## Mother-surface aliases

| Conceptual surface | Existing authority or machine owner | Classification | Decision state |
| --- | --- | --- | --- |
| `COREGRID.md` | `README.md` + `CONSTITUTION.md` | compatibility plus constitutional mission | proposed alias |
| `GOVERNANCE.md` | `CONSTITUTION.md` + `DECISIONS.md` + `AGENTS.md` | overlapping governance artifacts | unresolved |
| `ARCHITECTURE.md` | `REGISTRY.md` + `DEPENDENCY.md` + `BOUNDARIES.md` + `architecture-map.md` | overlapping structural authority | unresolved |
| `REALITY.md` | Phase 33 + `frontend/src/lib/kernel/reality.ts` + `cg_*` migrations | conceptual plus machine substrate | proposed alias |
| `ENGINEERING.md` | phase engineering sections + kernel engineering contracts | conceptual plus verification tooling | proposed alias |
| `WORKFORCE.md` | Phase 25 workforce substrate and workforce libraries | conceptual plus HR implementation | proposed alias; agent delegation remains open |
| `MISSIONS.md` | mission specifications and plans; no durable mission runtime | conceptual design only | blocked on mission ownership |
| `BLUEPRINTS.md` | `architecture/phase-*.md` + phase contracts | phase corpus authority | proposed alias |
| `PROGRESS.md` | `architecture/phase-completion-status.md` + proofs | operational ledger and derived projection | active with status drift |
| `ECOSYSTEM.md` | registry runtimes/capabilities + marketplace/runtime modules | conceptual plus machine projection | proposed alias |
| `IMPLEMENTATION.md` | `frontend/`, `database/`, `scripts/`, and tests | design over implementation evidence | proposed alias |
| `RUNTIME.md` | Phase 05, `frontend/src/lib/runtime-*`, and Scholar runtime | design over runtime evidence | proposed alias |
| `ASSURANCE.md` | `architecture/proofs/`, acceptance, archaeology, scripts, and CI | design over assurance tooling | evidence ownership unresolved |

## Legacy governance aliases

| Existing artifact | Canonical concern | Classification |
| --- | --- | --- |
| `CONSTITUTION.md` | platform law | canonical |
| `PRINCIPLES.md` | architecture principles | canonical; internal filename drift |
| `REGISTRY.md` | phase and capability registry | canonical; machine twin is `architecture/registry.json` |
| `DEPENDENCY.md` | dependency topology | canonical; machine companion is `architecture/dependency-graph.md` |
| `BOUNDARIES.md` | ownership and boundaries | canonical; stale `architecture.md` reference remains |
| `DECISIONS.md` | architectural decisions | canonical; internal singular/plural drift remains |
| `PROGRESS.md` | progress projection | specialized operational ledger |
| `AGENTS.md` | agent execution constraints | specialized engineering authority |
| `README.md` | repository entry point | compatibility/descriptive |

## Control-plane aliases

The 12 control-plane documents are mechanisms, not additional governing
surfaces or mandatory services. Their current owner map is:

1. Registry → `REGISTRY.md`, `architecture/registry.json`, kernel registries.
2. Schemas → SQL migrations, Zod schemas, generated Supabase types, contracts.
3. State → `cg_*`, legacy state, twin state, and runtime projections.
4. Evidence → proofs, acceptance, archaeology, and domain evidence.
5. Context → AI context and domain context modules; universal fabric partial.
6. Mission orchestration → designed only; durable runtime owner unresolved.
7. Workforce delegation → Phase 25 HR substrate; agent delegation unresolved.
8. Cursor execution → engineering-tool boundary; not product runtime authority.
9. Verification → scripts, tests, CI, and acceptance probes.
10. Conformance → purity, neutrality, phase, and security guards; unified plane partial.
11. Progress → `PROGRESS.md`, derived status, and truth-sweep evidence.
12. Drift/evolution → audits and evolution modules; D3 ownership unresolved.

The authoritative detailed assessment is
`architecture/COREGRID_CONTROL_PLANE_RECONCILIATION.md`.

## Unresolved decisions

- `RD-01`: whether the 13 conceptual surfaces are aliases to the legacy
  governance plane or a future canonical document set.
- `RD-02`: whether mission orchestration is a CoreGrid product mechanism or
  remains an external engineering process until a runtime contract exists.
- `RD-03`: the exact distinction between phase `COMPLETE`, `VERIFIED`,
  `CONFORMANT`, `DEPLOYED`, and `OPERATIONAL`.
- `RD-04`: ownership resolution for duplication clusters D1, D2, D3, D4, D5,
  and D7.
- `RD-05`: tracking/quarantine policy for engineering-tool payloads and
  historical scratch artifacts.
- Mission, evidence, and execution ownership required by Foundation Mission
  001.

Until these decisions are authorized and recorded, no artifact may silently
promote a proposal into architectural authority and no foundation runtime
implementation may claim completion.
