# CoreGrid Cloud Fabric — Execution & Migration Plan

> Companion to `architecture/cloud-fabric-implementation-blueprint.md`.
> Owner: Phase 21. Every wave below has an **entry gate**, **artifacts**, an
> **exit proof**, and — where it touches production or trust — an **approval
> checkpoint** (⛔).

**Operating rules**

1. No wave starts before its entry gate is satisfied and its predecessor's exit
   proof is recorded in `PROGRESS.md` §20.
2. Nothing is applied without credentials supplied **out-of-band** by the owner
   (`infrastructure/CREDENTIALS.md`). Credentials are never pasted into chat,
   issues, commits or IaC files.
3. Every apply is a change record: plan diff reviewed, approval environment
   approved, post-apply health check executed, rollback path known.
4. The fabric stays domain-neutral: no wave may introduce education (or any other
   vertical's) vocabulary into `infrastructure/**`.

---

## Wave map

| # | Directive phase | Wave | Status |
| --- | --- | --- | --- |
| 1 | Inspect existing repository | **CF-0** | ✅ DONE |
| 2 | Map current architecture | **CF-1** | ✅ DONE (blueprint §0–§2) |
| 3 | Create infrastructure blueprint | **CF-2** | ✅ DONE (`cloud-fabric-implementation-blueprint.md`) |
| 4 | Create Terraform foundation | **CF-3** | ✅ DONE (authored; `fmt`/`validate` pending a Terraform toolchain) |
| 5 | Deploy OCI foundation | **CF-4** | ⛔ BLOCKED — OCI credentials |
| 6 | Deploy Hetzner workers | **CF-5** | ⛔ BLOCKED — Hetzner token |
| 7 | Deploy Vultr edge | **CF-6** | ⛔ BLOCKED — Vultr API key |
| 8 | Connect Supabase | **CF-7** | ⛔ BLOCKED — Supabase project + service key (abstraction authored) |
| 9 | Deploy n8n | **CF-8** | ⛔ BLOCKED — domain + auth settings + DNS |
| 10 | Deploy monitoring | **CF-9** | ⛔ BLOCKED — cluster from CF-4/CF-5 |
| 11 | Deploy security fabric | **CF-10** | ⛔ BLOCKED — cluster + secret store |
| 12 | Deploy agent runtime | **CF-11** | ⛔ BLOCKED — CF-10 + Phase 07 runtime image |
| 13 | Connect Scholar runtime | **CF-12** | ⛔ BLOCKED — CF-4…CF-7 + runtime container image |

---

## CF-0 / CF-1 / CF-2 — Inspect, map, blueprint (done)

**Artifacts:** `architecture/cloud-fabric-implementation-blueprint.md`; PROGRESS
current-state section.
**Exit proof:** ownership table resolving every directive concept to an existing
phase owner (no duplicate engines); current-state table with repository evidence;
tooling probe recorded (no terraform/kubectl/helm/docker in the authoring
environment).

## CF-3 — Terraform foundation (done, awaiting tooling validation)

**Artifacts:** `infrastructure/terraform/**` (pinned providers, six reusable
modules, five provider roots, production composition), `infrastructure/kubernetes/**`
(8 namespaces, quotas, default-deny policies, PSA labels, RBAC, sandbox),
`scripts/verify-infrastructure.mjs` + proof artifact, CI verify workflow.

**Exit proof (machine-checked today):** `npm run verify:infrastructure` green;
structural laws enforced (no credential literals, sensitive variables declared,
pinned versions, remote state, complete namespace set, default-deny everywhere,
sandbox isolation, domain-neutral vocabulary, tags on provider resources).

**Outstanding (needs tooling, not credentials):** `terraform fmt -check`,
`terraform validate` per root, `kubeconform` on manifests — these run in
`infrastructure-verify.yml` the first time a Terraform toolchain is available;
until then the structural proof is the evidence and is labelled as such.

## CF-4 — OCI foundation ⛔

**Entry gate:** OCI credentials in a GitHub Environment (`infrastructure-oci`) or an
equivalent secret store; tenancy/compartment decisions confirmed by the owner.

**Steps:** bootstrap remote state bucket + locking → `terraform plan` for the OCI
root (network, HA cluster, `system` + `platform` pools, private egress, IAM
bindings, audit sink) → **⛔ approval** → apply → verify cluster health, node
labels, PSA, quotas → record change record + proof.

**Exit proof:** cluster reachable, 3 control-plane nodes healthy, baseline applied,
no drift, cost report captured.
**Rollback:** `terraform destroy` on the OCI root is scoped and rehearsed; no
production traffic depends on it yet.

## CF-5 — Hetzner worker pools ⛔

**Entry gate:** Hetzner token; CF-4 cluster accepted.

**Steps:** worker firewall + private network + nodes joined to the cluster →
`workers-cpu` pool floor 5 → queue-depth autoscaling → scale drill 5→50→5 in
staging → **⛔ approval** for production apply.

**Exit proof:** jobs execute on workers; scale up/down evidence captured; job
envelopes carry tenant context; no persistent tenant data on workers.

## CF-6 — Vultr edge ⛔

**Entry gate:** Vultr API key; CF-4 accepted.

**Steps:** regional instances (Africa/EU/APAC) → regional cache → edge API
deployment → latency measurement → health checks wired to Cloudflare.

**Exit proof:** regional latency improvement measured; edge services stateless;
cache drain is non-fatal (tested).

## CF-7 — Supabase connection and data abstraction ⛔

**Entry gate:** Supabase project URL + service key + database URL; owner approval
for backup/PITR settings.

**Steps:** `DbAdapter` implementation bound to Supabase → verify RLS remains the
enforcement layer → backups + PITR configured → restore drill in staging →
migration tooling verified against a production snapshot.

**Exit proof:** restore drill recorded with timings; migration replay on a snapshot
succeeds; no schema mutation outside migrations.

## CF-8 — n8n automation executor ⛔

**Entry gate:** n8n domain + auth settings + DNS credentials; CF-4/CF-7 accepted.

**Steps:** namespace + secret references + PostgreSQL + Redis queue mode +
authentication + monitoring → CoreGrid execution adapter registered (Phase 17 owns
decisions) → end-to-end test: CoreGrid decides, n8n executes, result audited →
**⛔ approval** before enabling in production.

**Exit proof:** one real workflow executed with tenant context and audit trail; with
n8n disabled CoreGrid automation still functions (degradation check).

## CF-9 — Monitoring ⛔

**Steps:** metrics + logs + traces in `coregrid-monitoring` → dashboards (compute,
data, API SLO, jobs, fabric, autonomy) → alert routing policy → error-budget rules
→ synthetic probes from each region.

**Exit proof:** an injected fault is detected and alerted within the declared SLO
window; alert routes verified end to end.

## CF-10 — Security fabric ⛔

**Steps:** secret store integration (external secret operator) → policy hooks
against Phase 08/42 decisions → image scanning + SBOM + signature verification →
incident/break-glass runbooks → least-privilege review of every ServiceAccount.

**Exit proof:** no workload holds cluster-admin; secret rotation rehearsed; a
deliberately non-compliant workload is blocked in staging.

## CF-11 — Agent runtime fabric ⛔

**Steps:** `coregrid-agents` namespace baseline → per-agent ServiceAccounts →
memory/tool scopes declared → egress restricted → sandbox namespace on an isolated
pool with TTL → evaluation harness wired → audit trail confirmed.

**Exit proof:** an agent runs, is contained by policy, is fully auditable, and a
sandbox run cannot reach tenant data (tested).

## CF-12 — Connect the Scholar runtime ⛔

**Steps:** build + sign the runtime container image → deploy to `coregrid-scholar`
with the image digest pinned → wire database, cache, event fabric, storage, n8n
adapter → health checks + SLO → cut over via Cloudflare canary (1% → 10% → 100%)
with rollback armed → **⛔ approval** at each step increase.

**Exit proof:** production traffic served from the fabric, error budget intact,
rollback tested, cost and observability dashboards live — and the first domain
runtime is running as a **consumer** of the fabric rather than the reason for it.

---

## Cross-cutting checkpoints (every wave)

| Checkpoint | Question asked before proceeding |
| --- | --- |
| Ownership | Does this duplicate an existing phase's capability? |
| Isolation | Can this widen tenant scope or bypass RLS/policy? |
| Residency | Does this move data outside its permitted boundary? |
| Secrets | Are all credentials references, never values? |
| Reversibility | What is the rollback, and has it been rehearsed? |
| Cost | What ceiling does this create, and is it attributed? |
| Evidence | What artifact proves this wave worked? |
| Neutrality | Would this fabric still make sense for a hospital or a mine? |

