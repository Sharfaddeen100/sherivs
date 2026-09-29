# CoreGrid Prototype Archaeology

Mission: COREGRID-MISSION-0001  
Status: DESIGNED / EVIDENCE REGISTER  
Date: 2026-09-27  
Rule: classify before migrating, quarantining, or removing.

## Classification findings

| Classification | Evidence | Current treatment |
| --- | --- | --- |
| FOUNDATION | React/TanStack/Vite/Nitro/TypeScript, Supabase migrations, authentication primitives, CI, tested utilities | Preserve and verify compatibility |
| COREGRID-COMPATIBLE | `frontend/src/lib/kernel/*`, identity/tenant substrate, phase contracts, security gates, runtime registry | Preserve; reconcile ownership |
| SCHOLAR-SPECIFIC | `frontend/src/lib/scholar/*`, Scholar routes, education schemas, school-specific roles and workflows | Keep in runtime-001 unless proven universal |
| PROTOTYPE ASSUMPTION | Architecture-only phases 34–51, pure engine libraries without runtime consumers, uninstalled manifests | Mark designed/partial; do not represent as operational |
| DEMO / TEST FIXTURE | `demo-provision.functions.ts`, `dev-env.ts`, `admin@demo.school`, fixture intelligence reports | Keep bounded to development/test contexts |
| DUPLICATED / CONTESTED | D1 memory, D2 knowledge graphs, D3 evolution, D4 twins, D5 simulation, D7 security/trust | Preserve; require ownership decisions |
| UNKNOWN | Historical artifacts, large cross-domain corpus claims not connected to contracts or runtime | Preserve and investigate |

## Verified risks

- `frontend/src/components/intelligence-center.tsx` identifies presentational intelligence values as placeholders.
- `frontend/src/lib/academic-intelligence-report.ts` and `scheduling-intelligence-report.ts` expose report/fixture-style engines with declared persistence or publication gaps.
- Scholar remains the practical application runtime and directly references school-domain structures in selected server functions.
- Kernel primitives distinguish observation kinds, but broad epistemic, spatial, causal, simulation, and counterfactual persistence is not established.
- Existing evidence files are valuable provenance and must not be deleted because they are incomplete.

## Required handling

1. Do not label pure functions, fixture reports, or architecture contracts as operational reality.
2. Keep demo state explicitly separated from production state.
3. Preserve unknown artifacts until dependency and provenance analysis is complete.
4. Move or quarantine only after replacement mapping, verification, and rollback evidence exist.
5. Keep Scholar-specific concepts below the universal kernel boundary.

## Explicit non-actions

No deletion, bulk refactor, infrastructure installation, new database engine, new vector store, graph store, queue, or autonomous side-effect was authorized by this artifact.
