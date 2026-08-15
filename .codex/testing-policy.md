# Testing Policy

- Unit tests live in `tests/unit/` and run with Vitest
  (`npx vitest run`).
- E2E tests live in `tests/e2e/` and run with Playwright
  (`npm run test:e2e` against a running dev server).
- Database isolation guarantees are verified with
  `database/queries/rls-isolation-check.sql`.
- Every change that touches behavior must include or update a test.
- A change is complete only when the production build passes
  (`npm run build`).

