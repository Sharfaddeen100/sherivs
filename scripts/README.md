# Scripts

Automation scripts for CoreGrid Scholar.

- `smoke.sh` - smoke test public/auth routes against a running dev server
- `verification/check.ps1` - verification bundle: typecheck + unit tests +
  production build (`pwsh scripts/verification/check.ps1`)

Portable verification commands are available through `npm` and are used by CI:

- `npm run typecheck`
- `npm run test:unit`
- `npm run verify` (typecheck, unit tests, then production build)

Database query scripts moved to `database/queries/`.
