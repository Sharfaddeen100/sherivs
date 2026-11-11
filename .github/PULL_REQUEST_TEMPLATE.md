## Summary

<!-- What changes and why. Link the mission/issue. -->

## Version target (AGENTS.md section 45)

- [ ] V1 organizational capability
- [ ] Governance / documentation only
- [ ] V2 / V3 / future (FROZEN: requires a human authorization record; link it)

## Security and tenancy

- [ ] No secrets, tokens or credential values added (code, docs, tests, logs)
- [ ] Tenant isolation preserved; RLS/authorization changes reviewed
- [ ] No workflow gives secrets to `pull_request` jobs; no `pull_request_target`
- [ ] Workflow actions pinned to full commit SHAs

## Evidence

- [ ] `npm run verify:local` output attached (or hosted `Verify` green)
- [ ] Tests added/updated; migration changes dry-run
- Not verified / known risks:

## Rollback

<!-- How to revert; data/migration implications. -->
