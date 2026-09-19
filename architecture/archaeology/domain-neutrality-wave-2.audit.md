# Domain Neutrality — Wave 2 · Archaeology Record

> **Wave:** NEUTRALITY-2 (owner finding: the platform read as if it had been built for one
> application, because a runtime was named — and in places *hard-wired* — as the platform).
> **Trigger:** owner review, 2026-09-18.
> **Machine evidence:** `tests/unit/platform-neutrality.test.ts` (Laws 1–5),
> `scripts/neutralise-scholar-framing.mjs --check`.

## 1. What was actually wrong

Wave 1 neutralised what the kernel *said about itself* (73 modules that opened with a
runtime's name) and separated one neutral engine from its runtime adapter. It missed three
things that mattered more than prose:

1. **The kernel held one runtime's DATA.** `frontend/src/lib/workspace-engine/nav-catalog.ts`
   — inside the KERNEL's workspace engine — carried ~1,070 lines of a single runtime's
   navigation data (its portal capability sets, its contribution seeds, its feature-code
   index, its workspace labels).
2. **The platform shell imported it directly.** `routes/_authenticated/route.tsx` rendered
   that runtime's contributions as *the* navigation, so the platform's own chrome was one
   runtime's chrome.
3. **The platform's identity module owned a runtime's identity, and the platform gate spoke
   a runtime's vocabulary.** `lib/platform.ts` exported the runtime's id, name and
   description; `lib/capability-gate.ts` exported `evaluateScholarCapability`,
   `ScholarCapabilitySignals`, `SCHOLAR_MEMBERSHIP_FOR_KIND`, `SCHOLAR_KINDS` and a refusal
   reason naming that runtime; contracts from phases 01–51 narrated it as "the first
   runtime", "consumes it as its identity spine", "the first installed ontology", and so on.

The result read exactly as the owner described: a platform that looked purpose-built for one
application, with other domains as an afterthought.

## 2. What changed

| Change | Where it went | Evidence |
| --- | --- | --- |
| One runtime's navigation data left the kernel | `frontend/src/lib/runtime/scholar-nav-catalog.ts` (runtime layer) | 14 importers repointed; kernel `workspace-engine/**` now holds no contribution data and names no runtime |
| A runtime-layer registry lists what is installed | `frontend/src/lib/runtime/nav-registry.ts` — `INSTALLED_NAV_CONTRIBUTION_SETS`, `ALL_NAV_CONTRIBUTIONS`, neutral alias `isDeclaredRuntimeFeatureCode` | the shell renders `ALL_NAV_CONTRIBUTIONS` |
| The shell stopped rendering one catalog | `routes/_authenticated/route.tsx` | guard asserts it contains `ALL_NAV_CONTRIBUTIONS` and not the runtime's constant |
| A runtime's identity left the platform's identity module | `frontend/src/lib/runtime/installed-runtimes.ts` (`INSTALLED_RUNTIMES`, `FIRST_INSTALLED_RUNTIME`, `INSTALLED_RUNTIME_NAME/DESCRIPTION`) | `lib/platform.ts` exports the platform's identity only; 4 consumers take the runtime's name from the runtime layer |
| The platform gate speaks generically | `lib/capability-gate.ts`: `evaluateRuntimeCapability`, `RuntimeCapabilitySignals`, `MEMBERSHIP_FOR_NAV_KIND`, `ROUTED_NAV_KINDS`, neutral refusal reason, aliased import | guard asserts none of the runtime's names remain in the gate |
| Kernel contracts describe the platform | phases 01, 02, 03, 04, 05, 06, 08, 13, 16, 40, 51 + `define-phase.ts` + `phase-contracts/index.ts` | kernel `phase-contracts/**` contains no occurrence of a runtime's name |
| Platform surfaces speak about *installed* runtimes | `routes/platform.tsx`, `super-admin/workspace-projection.tsx`, `admin/facilities.tsx`, `settings.tsx`, `components/command-centre/*` (card renamed) | the narrative law below |
| Platform-wide prose neutralised | `styles.css`, `education-reality-view.ts`, `experience/experience-platform.ts`, `org-profile.functions.ts`, `staff-accounts.functions.ts`, `workspace-projection.ts`, `security-role-gate.ts`, `workforce-core.ts` | the narrative law below |

**Nothing was renamed in the runtime's own layer.** `lib/scholar/**`, `lib/runtime/scholar-*`,
`routes/_authenticated/scholar/**`, `types/coregrid-scholar.ts` and
`scripts/verify-scholar-config-wiring.mjs` keep their names: that is where a runtime's name
belongs, and the guard now says so by path.

## 3. The laws, as they now stand

`tests/unit/platform-neutrality.test.ts` enforces five structural rules (they read the files
and fail on the pattern, so they survive future phases):

1. A neutral platform module imports no runtime/vertical.
2. No kernel or capability file introduces itself as a runtime's subsystem.
3. Only the runtime layer may narrate a runtime: no kernel module names one at all.
4. The kernel owns no runtime's data: no contribution data in the kernel's workspace engine,
   navigation rendered from the installed-runtime registry, no runtime identity in the
   platform's identity module, and a generic gate vocabulary.
5. Outside the runtime layer the platform speaks about *an installed runtime* — the narrative
   patterns (`CoreGrid Scholar`, `Scholar's`, `Scholar is`, `Scholar consumes`, `Scholar-only`,
   …) are refused wherever the platform, rather than the runtime, is speaking.

## 4. Verification

| Gate | Result |
| --- | --- |
| Targeted suites (`platform-neutrality`, `capability-gate`, `workspace-navigation`, `roles`, `scholar-workforce-nav`) | **71 passed** — 31 neutrality tests, including both new laws |
| `tsc --noEmit` | one error found **by this pass** and fixed: an aliased import in the shell (`type RuntimePortalKind as RuntimePortalKind` after the mechanical rename); re-run clean |
| `vitest run` (full suite) | re-run after the move; result recorded in PROGRESS §22.16 |
| `audit:phase --phase=06` | one acceptance evidence entry repointed from the removed kernel path to the runtime registry |
| `audit:phases` / `verify:registry` | re-run; recorded in PROGRESS §22.16 |

## 5. Limits, stated rather than smoothed

* **Runtime-prefixed symbols still exist where a consumer asks the runtime a question.**
  `routes/_authenticated/super-admin/workspace-projection.tsx` imports
  `scholarRoleWorkspaceCoverage` and `SCHOLAR_WORKSPACE_KINDS` from the runtime adapter, and
  every `tests/unit/*` header still reads "CoreGrid Scholar — Phase NN". Those are
  runtime-layer references rather than platform claims; the test headers are the next sweep
  (the comment-only treatment Wave 1 applied to modules).
* **The kernel still contains education-flavoured capability modules** that the education
  runtime consumes (`education-reality-view.ts` and its suite). Their framing is neutral and
  their ownership is phase 04's, but a later wave should decide whether they belong in the
  runtime layer outright.
* The mechanical passes were **content-preserving**: they moved code between layers, renamed
  platform-owned symbols, and rewrote prose. No navigation data, capability code, label or
  behaviour was changed — which is why the affected suites could be used as the check.
