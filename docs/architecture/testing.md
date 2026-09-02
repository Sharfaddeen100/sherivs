# Testing Architecture

> Status: Canonical.

## Layers

| Layer | Tool | Location | Status |
| --- | --- | --- | --- |
| Unit | Vitest | `tests/unit/` | 24 tests passing |
| E2E | Playwright | `tests/e2e/` | Preserved; needs dev server |
| Database isolation | psql script | `database/queries/rls-isolation-check.sql` | Requires DB access |
| Smoke | curl script | `scripts/smoke.sh` | Requires dev server |
| Build | Vite | - | Passing |
| Typecheck | tsc | - | Active verification; the seven admin route-header TS2322 errors have been corrected and require a completed run |

## Policy

- Tests are contracts (`.codex/testing-policy.md`).
- Every behavior change includes or updates a test.
- No change is complete until the production build passes.

## Known debt

- Lint fails on pre-existing Prettier/CRLF + `any`/hook-deps issues
  (classified PRE-EXISTING in `PROGRESS.md`).
- No CI gate yet (planned).
