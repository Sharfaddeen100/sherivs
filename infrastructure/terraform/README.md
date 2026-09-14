# CoreGrid Cloud Fabric — Terraform

Provider-neutral infrastructure for Phase 21 (Global Cloud Fabric). Read
`architecture/cloud-fabric-implementation-blueprint.md` first: it explains the
topology, the ownership boundaries and the laws this code enforces.

## Layout

```
terraform/
├── versions.tf                  provider pins (no floating majors, no :latest)
├── modules/                     reusable building blocks, provider-agnostic shape
│   ├── network/                 VCN, subnets, gateways, security lists
│   ├── kubernetes/              HA management cluster (private endpoint)
│   ├── node_pool/               pool with a declared autoscaling envelope
│   ├── object_storage/          buckets (private, versioned, lifecycle-managed)
│   ├── secret_refs/             presence gate for required secret NAMES
│   └── dns_edge/                DNS, health checks, load balancing
├── oci/                         CF-4 primary infrastructure
├── hetzner/                     CF-5 elastic compute fabric
├── vultr/                       CF-6 global edge fabric
├── cloudflare/                  global traffic layer
├── supabase/                    CF-7 data-layer configuration check
└── environments/production/     the only root intended for apply
```

## Running it

```bash
# Validate structure without credentials (works today, no cluster required)
terraform -chdir=infrastructure/terraform/oci fmt -check
terraform -chdir=infrastructure/terraform/oci init -backend=false
terraform -chdir=infrastructure/terraform/oci validate

# Plan/apply, in dependency order, with credentials in the environment
terraform -chdir=infrastructure/terraform/environments/production init \
  -backend-config=backend.hcl
terraform -chdir=infrastructure/terraform/environments/production plan \
  -var-file=terraform.tfvars -out=fabric.tfplan
terraform -chdir=infrastructure/terraform/environments/production apply fabric.tfplan
```

`terraform validate` and `fmt -check` run in CI on every change
(`.github/workflows/infrastructure-verify.yml`); apply runs only from
`infrastructure-plan-apply.yml` behind an approval environment.

## Laws (machine-checked by `npm run verify:infrastructure`)

1. No credential values anywhere — only variable references; secret variables are
   `sensitive` with no committed default.
2. Remote state only; `*.tfstate`, plans and `*.tfvars` are git-ignored.
3. Every provider is consumed **through a module** — a provider can be replaced by
   swapping a root/module, not by editing application code.
4. Versions are pinned; `latest` is forbidden.
5. All provider resources carry `coregrid:*` tags (environment, owner phase, cost).
6. The fabric is domain-neutral: no vertical's vocabulary appears in IaC.

## Adding a provider

1. Add the provider pin to `versions.tf`.
2. Create `terraform/<provider>/` with `main.tf`, `variables.tf`, `outputs.tf`,
   reusing `modules/**` wherever the shape matches.
3. Register the directory in `scripts/verify-infrastructure.mjs` (provider list)
   and in the blueprint's provider table.
4. Supply credentials per `infrastructure/CREDENTIALS.md`, then run the plan.

## Status

Authored, not applied. The `terraform` CLI is not present in the authoring
environment, so `fmt`/`validate` are pending their first CI run; the structural
laws above are proven today by `verify:infrastructure` (see
`architecture/proofs/cloud-fabric-foundation.proof.json`).
