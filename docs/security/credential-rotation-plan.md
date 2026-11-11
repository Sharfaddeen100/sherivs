# Historical credential exposure: inventory and rotation/revocation plan (M0.2-B)

Status: PLAN ONLY. No credential was tested, rotated, revoked or copied by this mission.
No values appear in this document; reference commits by SHA only. Source evidence: `docs/engineering/M0.1-REPOSITORY-GOVERNANCE-AUDIT.md` (F2), `docs/security/track-e-findings.md:13`, `remaining-work.md:7-14`.

## 1. Exposure inventory

Origin: commit `144e60c9` (2026-08-15, "Backup before CoreGrid Scholar migration") committed `.env` and `.mcp.json`. Commit `b1eef496` (2026-09-03) removed the embedded secrets. History was not rewritten and the repository history is public to anyone with read access (treat as compromised).

| # | Category | Service | Where it was | Environment affected | Rotation status |
|---|---|---|---|---|---|
| 1 | Supabase `service_role` key | Supabase | `.env`, `.mcp.json` | OLD project `qimawwdlgjtudzufgeox` (not production `nwrflbpbhyiqdptmlccm`, per `track-e-findings.md:13`) | UNVERIFIED |
| 2 | Supabase anon / publishable keys (incl. `VITE_`-prefixed) | Supabase | `.env`, `.mcp.json` | old project | UNVERIFIED (public-by-design keys, low impact; revoke with project) |
| 3 | GitHub personal access token | GitHub | `.mcp.json` | account that owned the PAT | UNVERIFIED |
| 4 | NVIDIA API key | NVIDIA NIM/API | `.env`, `claude-flow*.json` | vendor account | UNVERIFIED |

No evidence of rotation exists in the repository or its history. Liveness was deliberately not tested.
Full-history scanning shows 9 gitleaks findings (`track-e-findings.md`). Items outside this table were not enumerated here; the full-history scan below is the authority.

## 2. Plan (owner actions; nothing here is automated)

Order is by blast radius.

1. **GitHub PAT (#3)** - owner of the token: Settings > Developer settings > revoke. Check the account's security log for use since 2026-08-15. Replacement: none needed (`.mcp.json` now uses environment variables). Verify: token returns 401.
2. **Supabase old project (#1, #2)** - owner decides: (a) delete/pause project `qimawwdlgjtudzufgeox` if it is retired (preferred), or (b) rotate JWT secret / API keys and update only consumers that still use it. Confirm no production workflow references that ref (`grep` for the ref in `.github/`, `infrastructure/`, `scripts/`). Verify: old keys rejected.
3. **NVIDIA key (#4)** - revoke in the vendor console; issue a new key only if the integration is still used, and store it solely in the secret store / local env.
4. **Verify GitHub secret scanning** - confirm whether partner auto-revocation already revoked the PAT (see Security > Secret scanning alerts).
5. **Do not rewrite history** unless the owner approves a coordinated force-push (it invalidates 270+ branches and open PRs). Rotation, not rewriting, is the control.

## 3. Verification evidence the owner should attach

- Revocation timestamps / screenshots (no values) for items 1-4.
- Output of a full-history scan (`gitleaks detect --redact`), redacted, showing only already-revoked findings.
- A short attestation committed under `docs/security/` (name, date, items, "values never stored").

## 4. Guardrails already in repo

`scripts/verification/secret-scan.mjs` (`npm run verify:secrets`), the hosted gitleaks job in `verify.yml`, and AD-181 block re-introduction. M0.2-E adds secret scanning + push protection to the desired settings manifest.

## 5. Outstanding owner-dependent actions

All of items 1-4 and the attestation. None can be performed or proven from the repository.
