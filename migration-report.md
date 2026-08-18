# CoreGrid Scholar - Migration Report

**Date:** 2026-08-15
**Branch:** `coregrid-scholar-migration`
**Commit:** "Transform Remix School OS into CoreGrid Scholar foundation"

---

## 1. Summary

The Remix School OS application was migrated into **CoreGrid Scholar**, the
first production runtime of the CoreGrid platform ecosystem. All existing
functionality was preserved; no features were deleted or rewritten. The
migration renamed the project identity, created the platform governance
structure, physically reorganized the repository, repaired a broken
production build, and hardened secrets handling.

Verification after migration:

- `npm run build` - PASS (client + SSR)
- `npx vitest run` - PASS (24 tests, 3 files)
- Playwright e2e suite preserved (requires dev server to run)

---

## 2. Pre-existing issues found and fixed

1. **Corrupted route file** - `classes.tsx` contained JSON-escaped
   sequences (`\"`, `\n`) from line 102 onward, breaking the router
   generator and the build. Repaired by de-escaping the corrupted block
   (mechanical fix; 153 `\"` and 3 `\n` sequences).
2. **Invalid CSS ordering** - `styles.css` placed `@import "tw-animate-css"`
   after `@source "../src"`. Imports moved above all other statements.
3. **Missing Tailwind plugin** - `vite.config.ts` did not declare
   `@tailwindcss/vite`, which the previous hosted platform wrapper previously
   injected. Added directly so local and production builds are
   self-contained. (This was the root cause of the CSS minification
   failures encountered during verification.)

These were defects in the codebase, not migration side effects; the
pre-fix state is preserved in commit `144e60c` ("Backup before CoreGrid
Scholar migration").

---

## 3. Files moved

| From | To | Reason |
| --- | --- | --- |
| `src/` (300 files) | `frontend/src/` | Web platform code under `frontend/` |
| `public/` | `frontend/public/` | Static assets belong to the web app |
| `supabase/` (29 migrations + config) | `database/supabase/` | Database layer under `database/` |
| `scripts/rls-isolation-check.sql` | `database/queries/rls-isolation-check.sql` | Query logic under `database/` |
| `src/lib/auth-helpers.test.ts` | `tests/unit/auth-helpers.test.ts` | Test files under `tests/` |
| `src/lib/roles.test.ts` | `tests/unit/roles.test.ts` | Test files under `tests/` |
| `src/lib/subscription-tiers.test.ts` | `tests/unit/subscription-tiers.test.ts` | Test files under `tests/` |
| `README.md` | `docs/product-spec.md` | Original spec archived; new platform README at root |
| `src/types/school-os.ts` | `frontend/src/types/coregrid-scholar.ts` | Internal naming |

All moves were performed with `git mv` (rename tracking preserved).

## 4. Files created

### Platform structure

- `architecture/README.md` + 32 empty phase files
  (`phase-01-foundation.md` ... `phase-32-future-evolution.md`)
- `constitution/` - README + 6 policy placeholders
- `decisions/` - README + architecture/technology/security decisions with
  real ADR entries from this migration
- `progress/` - README + current-state, completed, in-progress, blocked,
  next-tasks
- `.codex/` - instructions, engineering-loop, testing-policy,
  security-policy, pull-request-policy
- `backend/`, `mobile/`, `agents/`, `infrastructure/` - directory READMEs
  describing current state and future scope
- `frontend/`, `database/`, `tests/`, `scripts/`, `docs/` - directory
  READMEs
- `src/`, `components/`, `api/` - platform placeholder READMEs (application
  code lives in `frontend/src/`)
- `AGENTS.md` - agent reading order

### Documentation deliverables

- `docs/migration-audit.md` - full pre-migration audit
- `migration-report.md` - this document
- `architecture-map.md` - current system to CoreGrid Scholar mapping
- `remaining-work.md` - future roadmap

### Configuration

- `.env.example` - documented environment variables (no values)
- `vite.config.ts` - added `@tailwindcss/vite` and `srcDirectory`
- `tsconfig.json`, `vitest.config.ts`, `components.json`,
  `.prettierignore` - updated paths for `frontend/src/`
- `.gitignore` - ignores `.env` / `.env.*` (keeps `.env.example`)

## 5. Renames (identity)

| Where | Change |
| --- | --- |
| `package.json` | name `tanstack_start_ts` -> `coregrid-scholar` |
| README + docs | Remix School OS -> CoreGrid Scholar |
| App metadata (SEO) | "Universal School OS" -> "CoreGrid Scholar" |
| Marketing/portal UI | "Universal School OS" -> "CoreGrid Scholar" |
| Feature labels | "Vibeora Intelligence" -> "CoreGrid Intelligence" |
| Service worker | "Vibeora School OS" -> "CoreGrid Scholar" |
| Design system header | "VIBEORA ENTERPRISE DESIGN SYSTEM" -> "COREGRID SCHOLAR DESIGN SYSTEM" |
| Types | `school-os.ts` -> `coregrid-scholar.ts` |
| Tenant docs | comment documents CoreGrid domain cutover |

### Intentionally retained (compatibility)

- Database identifiers: `vibeora_intelligence`, `vibeora_notes`, and
  other `vibeora_*` columns/feature flags (forward migrations only).
- `PLATFORM_HOSTS` runtime domain list (cutover requires DNS).
- `robots.txt` sitemap URL (live site).
- Applied migration file history (immutable).
- Internal AI model label `vibeora-school-data` and local storage keys.

## 6. Security changes

- `.env` untracked (`git rm --cached`) and ignored.
- `.env.example` documents all required variables.
- `.mcp.json` secrets flagged as must-fix (see audit section 5).

## 7. Known issues / recommendations

- Rotate all credentials that existed in git history.
- Convert `.mcp.json` embedded secrets to environment variables.
- Add CI (build, unit, e2e, secret scan, RLS check).
- Ratify constitution policies; fill phase files.
- Execute the roadmap in `remaining-work.md`.
