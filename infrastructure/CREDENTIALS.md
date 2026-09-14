# CoreGrid Cloud Fabric — Credential Checklist

> **This file contains no secrets and must never contain secrets.** It lists what
> the Cloud Fabric needs, why, the minimum privilege it should carry, where the
> value is stored, and how to verify it works.
>
> **Step-by-step acquisition (click paths, CLI, rotation):**
> `infrastructure/CREDENTIALS-WALKTHROUGH.md`.

## How to supply credentials (read this first)

1. **Never paste credential values into chat, issues, commits, manifests or IaC.**
   Store them in **GitHub Environments** (`infrastructure-oci`,
   `infrastructure-hetzner`, `infrastructure-vultr`, `infrastructure-cloudflare`,
   `infrastructure-data`, `infrastructure-automation`) or your own secret manager.
2. Terraform receives them as **environment variables** (`TF_VAR_*`) or via the
   provider's own OIDC/instance-identity mechanism where available. Only variable
   *names* appear in this repository.
3. Every secret has an **owner, a rotation interval and a revocation step**.
   Rotate on personnel change and on suspected exposure; break-glass usage is
   alerted (Phase 21 §CD).
4. Prefer **machine identities with scoped roles** over personal accounts. Where a
   provider supports OIDC federation (GitHub → provider), use it instead of
   long-lived keys.
5. After supplying credentials, the operator confirms readiness by running the
   entry gate for the wave (`architecture/cloud-fabric-migration-plan.md`).

## 1. Oracle Cloud Infrastructure (OCI) — primary control plane

| Secret (env var) | Purpose | Minimum privilege | Notes |
| --- | --- | --- | --- |
| `TF_VAR_oci_tenancy_ocid` | tenancy scope | identifier | kept out of git anyway |
| `TF_VAR_oci_user_ocid` | API user | identifier | prefer a dedicated automation user |
| `TF_VAR_oci_fingerprint` | API key fingerprint | identifier | identifies the key pair |
| `TF_VAR_oci_private_key` | API signing key | **secret** | store in a secret manager |
| `TF_VAR_oci_region` | home region | identifier | owner confirms (e.g. `eu-frankfurt-1`) |
| `TF_VAR_oci_compartment_ocid` | target compartment | scoped to the CoreGrid compartment | create a dedicated compartment |
| `TF_VAR_oci_availability_domains` | AD list for HA | identifiers | from the owner's tenancy |

Minimum policy for the automation identity: manage the CoreGrid compartment only
(VCN, compute, Kubernetes, object storage, IAM on its own resources) — **never** a
tenancy-wide administrator policy.

## 2. Hetzner — elastic compute fabric

| Secret (env var) | Purpose | Minimum privilege |
| --- | --- | --- |
| `TF_VAR_hetzner_token` | create/manage servers, networks, firewalls, volumes | scoped project token (read/write), not an account-owner token |
| `TF_VAR_hetzner_ssh_public_key` | node bootstrap | public key only (never a private key) |

## 3. Vultr — edge fabric

| Secret (env var) | Purpose | Minimum privilege |
| --- | --- | --- |
| `TF_VAR_vultr_api_key` | regional instances, cache, firewalls | API key limited to the CoreGrid account |
| `TF_VAR_vultr_regions` | region list | identifiers (not secret) |

## 4. Cloudflare — global traffic layer

| Secret (env var) | Purpose | Minimum privilege |
| --- | --- | --- |
| `TF_VAR_cloudflare_api_token` | DNS, CDN, WAF, load balancing, health checks | scoped token: Zone:DNS:Edit, Zone:Zone Settings:Edit, Account:Load Balancing:Edit — for the CoreGrid zone only |
| `TF_VAR_cloudflare_zone_id` | target zone | identifier |
| `TF_VAR_cloudflare_account_id` | account scope | identifier |
| `COREGRID_ROOT_DOMAIN` | primary domain (owner decision) | name only |

Never use a Global API Key, and never grant `Zone:Zone:Edit` (it can delete a zone).

## 5. Supabase — reality data layer

| Secret (env var) | Purpose | Minimum privilege |
| --- | --- | --- |
| `TF_VAR_supabase_project_ref` | project scope | identifier |
| `TF_VAR_supabase_access_token` | project settings as code (backups, PITR, network rules) | personal access token, tightly scoped and rotated after use |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | application runtime | publishable |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | application runtime | publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only administration | **server-only secret**, never `VITE_`-prefixed |
| `SUPABASE_DB_URL` | migrations / restore drills | database password, rotated on schedule |

## 6. GitHub — pipeline identity

| Secret | Purpose | Notes |
| --- | --- | --- |
| `infrastructure-*` Environments | hold provider credentials per provider | protect with required reviewers |
| OIDC trust (preferred) | short-lived credentials in CI | avoids long-lived keys where supported |
| `GITHUB_TOKEN` | repository-scoped, workflow-provided | never elevated beyond workflow needs |

## 7. n8n — automation executor

| Secret | Purpose | Notes |
| --- | --- | --- |
| `N8N_DOMAIN` | executor hostname (owner decision) | DNS via Cloudflare |
| `N8N_ENCRYPTION_KEY` | n8n credential encryption | **secret**; losing it invalidates stored credentials |
| `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` | initial UI protection | replace with SSO/OIDC where available |
| `N8N_DB_URL` | n8n's own PostgreSQL | separate database from tenant data |
| `N8N_REDIS_URL` | queue mode | separate logical database |

n8n must **never** hold tenant data of record, and its database is never the
CoreGrid database.

## 8. Optional intelligence layers (only if the owner elects to run them)

| Secret | Purpose | Non-dependency rule |
| --- | --- | --- |
| `HERMES_API_KEY` / `HERMES_ENDPOINT` | reasoning enhancement | absent ⇒ CoreGrid continues (degradation check must pass) |
| `JARVIS_API_KEY` / `JARVIS_ENDPOINT` | orchestration accelerator | absent ⇒ CoreGrid native orchestration continues |

## 9. Readiness checklist (operator)

- [ ] OCI: tenancy/user/fingerprint/private key/compartment supplied; automation
      user carries **only** the CoreGrid compartment policy.
- [ ] Hetzner: project-scoped token supplied.
- [ ] Vultr: API key supplied; region list confirmed.
- [ ] Cloudflare: scoped token + zone/account ids supplied; root domain decided.
- [ ] Supabase: project ref, access token, DB URL, service-role key supplied;
      backup/PITR window agreed.
- [ ] GitHub Environments created with required reviewers for plan/apply.
- [ ] n8n: domain decided; encryption key generated and stored; DNS record agreed.
- [ ] Rotation dates recorded for every secret above.
- [ ] Break-glass procedure agreed and alerted (Phase 21 §CD).

**Until every box for a wave is ticked, that wave stays BLOCKED — the fabric is
authored, not deployed, and no partial credential set is "close enough".**

