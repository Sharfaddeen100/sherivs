# Tests

```
tests/
  unit/    Vitest unit tests (imports from frontend/src)
  e2e/     Playwright end-to-end tests
```

Run unit tests: `npx vitest run`

Run e2e tests: `npm run test:e2e` (requires a running dev server, default
`http://localhost:8080`)

Testing policy: `.codex/testing-policy.md`.

