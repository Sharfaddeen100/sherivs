# Scripts

Automation scripts for CoreGrid Scholar.

- `smoke.sh` - smoke test public/auth routes against a running dev server
- `verification/check.ps1` - verification bundle: typecheck + unit tests +
  production build (`pwsh scripts/verification/check.ps1`)

Portable verification commands are available through `npm` and are used by CI:

- `npm run typecheck`
- `npm run test:unit`
- `npm run verify:registry` (machine-readable architectural registry invariants)
- `npm run verify:secrets` (tracked-file secret scan)
- `npm run verify:role-substrate` (proves the role assignment/grant substrate:
  source invariants always, applied-database invariants when `DATABASE_URL` is
  set; writes `architecture/proofs/role-assignment-substrate.proof.json`)
- `npm run generate:icons` (regenerates the installable PWA icons in
  `public/icons/` from a brand colour — no image dependency)
- `npm run verify` (typecheck, unit tests, registry, secrets, then production build)

Architecture analysis:

- `node scripts/verification/engineering-sections.mjs` (phase-document completeness matrix)
- `node scripts/verification/registry-validate.mjs` (same as `npm run verify:registry`)
- `node scripts/verification/secret-scan.mjs` (same as `npm run verify:secrets`)

Database query scripts moved to `database/queries/`.
