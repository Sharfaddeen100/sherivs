# Scripts

Automation scripts for the CoreGrid platform.

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
- `npm run verify:infrastructure` (proves the Cloud Fabric's source invariants:
  provider/module structure, secret hygiene, remote state, pinning, tagging,
  cluster baseline, sandbox containment, domain neutrality; writes
  `architecture/proofs/cloud-fabric-foundation.proof.json`)
- `node scripts/infrastructure/supabase-config-check.mjs --static` (data-layer
  configuration contract; without `--static` it performs a read-only live check
  and refuses to treat an unrestorable data layer as ready)
- `npm run preflight:infrastructure` (read-only credential/scope doctor per
  provider: presence of each required secret NAME, token acceptance, target
  reachability; writes `architecture/proofs/infrastructure-preflight.proof.json`
  and names every blocked wave — it never logs or stores a value)
- `npm run bootstrap:infrastructure` (prepares a provider root for apply: backend
  config from identifiers, ignore-hygiene check, secret presence per provider and
  the exact reproducible command sequence; dry run unless `--write`)
- `npm run generate:icons` (regenerates the installable PWA icons in
  `public/icons/` from a brand colour — no image dependency)
- `npm run verify` (typecheck, unit tests, registry, secrets, then production build)

Architecture analysis:

- `node scripts/verification/engineering-sections.mjs` (phase-document completeness matrix)
- `node scripts/verification/registry-validate.mjs` (same as `npm run verify:registry`)
- `node scripts/verification/secret-scan.mjs` (same as `npm run verify:secrets`)
- `npm run audit:phases` (evidence-derived five-level completion gate across all 51
  phases: writes `architecture/proofs/phase-completion.proof.json` and
  `architecture/phase-completion-status.md`; provable defects fail, incompleteness
  is reported honestly)
- `npm run audit:phase -- --phase=01` (per-phase acceptance probe used during the
  phase archaeology intake: resolves the phase document's acceptance criteria
  against real artefacts and classifies each as ENFORCED / DECLARED / MISSING; a
  REQUIRED area with no evidence fails. Each phase supplies its own data file at
  `architecture/phase-acceptance/phase-<id>-*.json`, so new phases need no code;
  writes `architecture/proofs/phase-<id>-acceptance.proof.json`)

Database query scripts moved to `database/queries/`.

Staging-only 71-file restore runner (does **not** replace `db-apply.mjs`,
does **not** apply migrations unless a later authorized process injects a
live connector):

- `node scripts/staging/sherivs-restore/cli.mjs --mode=manifest`
- `node scripts/staging/sherivs-restore/cli.mjs --mode=offline`
- See `scripts/staging/sherivs-restore/README.md`,
  `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-001.md`, and
  `docs/security/rls-prep/SHERIVS-STAGING-MIGRATION-RUNNER-CORRECTIONS-001.md`
