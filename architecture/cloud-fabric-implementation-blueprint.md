# CoreGrid Cloud Fabric — Implementation Blueprint

> **Status:** AUTHORED (Phase 3 of the Cloud Fabric command). Nothing in this
> document is deployed. Infrastructure is code under `infrastructure/**`,
> machine-checked by `npm run verify:infrastructure`.
>
> **Owner:** Phase 21 — Global Cloud Fabric (`architecture/phase-21-global-cloud-fabric.md`,
> 3032 lines, 30+ sections A–…, capability `cloud-fabric-byoc`).
> This document is the **instantiation map**: it turns Phase 21's contract into
> concrete, vendor-neutral infrastructure. It does not restate Phase 21, and it
> introduces no new authority.

---

## 0. Authority, ownership and the duplication boundary

CoreGrid's Architectural Immune System forbids rebuilding what another phase
owns. The Cloud Fabric therefore **consumes** the following owners and never
re-implements them:

| Concern | Owner phase | Capability | Cloud Fabric's relationship |
| --- | --- | --- | --- |
| Foundation, standards, config, **secrets, CI** | 01 | `foundation-standards-config-secrets-ci` | consumes: pipeline + secret-reference standards |
| Identity | 02 | `universal-identity` | consumes: no separate fleet identity service |
| Tenancy / RLS | 03 | `tenancy-isolation-rls` | enforces: isolation is never weakened for capacity |
| Data platform | 14 | `data-platform` | consumes: fabric never owns the data model |
| **Cloud fabric / BYOC** | **21** | `cloud-fabric-byoc` | **owner of this blueprint** |
| Automation / workflow runtime | 17 | `automation-workflow-runtime` | consumes: n8n is an *executor*, not the engine |
| Analytics / decision intelligence | 18 | `analytics-decision-intelligence` | consumes: no second metrics truth |
| Security enforcement | 08 | `security-enforcement` | consumes: policy checks, approvals |
| Trust fabric | 09 | `trust-fabric` | consumes: break-glass and privileged access |
| Enterprise scale | 31 | `enterprise-scale` | consumes: scale envelopes |
| Agent runtime | 07 | `agent-runtime` | deploys the runtime; owns no agent semantics |
| Sandbox runtime | 41 | `sandbox-runtime` | deploys isolation; owns no simulation model |
| Zero-trust / adversarial defence | 42 | `zero-trust-adversarial-defense` | enforces at infrastructure layer |
| Planetary distributed infrastructure | 44 | `planetary-infrastructure` | consumes (44 consumes fabric) |
| AI compute | 45 | `ai-compute` | provisions GPU capacity; owns no model logic |
| Live digital twin / twin civilization | 16 / 46 | `live-digital-twin`, `twin-civilization-federation` | carries twin *infrastructure* only, never domain twins |
| Universal runtime fabric | 40 | `universal-runtime-fabric` | hosts runtimes; owns no runtime semantics |
| Marketplace | 27 | `marketplace` | distributes runtime bundles; no infra coupling |
| Integration adapters | 29 | `integration-adapters` | provider SDKs live behind adapters |

**Non-negotiable consequences**

1. The fabric ships **no** identity, authorization, policy, analytics or workflow
   engine — only the infrastructure that hosts them.
2. The fabric is **domain-neutral**: no education vocabulary (enforced
   mechanically, see §17).
3. Scholar is the **first consumer** of this fabric, never a design input to it.

---

## 1. Current state (Phase 1 evidence)

Verified by inspection of this repository on 2026-09-13:

| Layer | Reality today | Evidence |
| --- | --- | --- |
| Application | TanStack Start SSR app (`frontend/src`), built to `dist/` | `vite.config.ts`, `package.json` |
| Data | Hosted Supabase project (`SUPABASE_URL`, anon + service-role keys) | `.env.example`, `database/supabase/migrations` (54+ files) |
| Identity/authz | Supabase auth + RLS + `security-role-gate` / `security-policy` | `frontend/src/lib/security-*.ts` |
| Domain contracts | 51 phase contracts machine-validated | `architecture/registry.json`, `frontend/src/lib/kernel/phase-contracts/**` |
| Cloud fabric **model** | Implemented in TypeScript: `cloud-core.ts`, `cloud-byoc.ts`, `cloud-governance.ts` (46 tests) | `tests/unit/cloud-*.test.ts` |
| IaC | **None** — `infrastructure/` contained a single placeholder README | `infrastructure/README.md` (pre-wave) |
| Containers | **None** — no Dockerfile, no container registry | repo-wide search |
| Orchestration | **None** — no cluster, no namespace, no ingress | repo-wide search |
| CI | One workflow: typecheck + unit tests + build (`verify.yml`) | `.github/workflows/verify.yml` |
| CD | **None** — no deploy job, no environment approvals | — |
| Cache / queue / event bus deployment | **None** — kernel outbox + events exist in-process only | `frontend/src/lib/kernel/outbox.ts` |
| Observability stack | **None** outside the application (no metrics backend, no traces, no alert routing) | repo-wide search |
| Automation executor | **None** — automation engine exists as domain modules only | `frontend/src/lib/automation-*.ts` |
| Secrets management | Environment variables + `.env` (never committed) | `.env.example`, secret-scan script |
| Tooling available in this environment | Node + git only — **no terraform, kubectl, helm or docker** | tool probe |

**Honest limitation:** because no Terraform/Kubernetes/container tooling exists in
this workspace, the IaC in this wave is validated **structurally** by
`scripts/verify-infrastructure.mjs` (invariants, no credential literals, provider
coverage, isolation laws) and **not** by `terraform validate` / `kubectl
--dry-run`. Those commands are recorded as mandatory CI gates in
`.github/workflows/infrastructure-verify.yml` and must run before any apply.

---

## 2. Target topology (provider responsibility assignment)

```
                              USERS / DEVICES
                                    │
                       ┌────────────▼────────────┐
                       │  Cloudflare  (global)   │  DNS · CDN · DDoS · WAF
                       │  edge routing + health  │  load balancing · cache
                       └────────────┬────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────┐        ┌─────────▼─────────┐       ┌─────────▼─────────┐
│ VULTR (edge)   │        │ OCI (PRIMARY)     │       │ HETZNER (compute) │
│ regional APIs  │◄──────►│ control plane     │◄─────►│ elastic workers   │
│ regional cache │        │ k8s control plane │       │ AI/data/batch/    │
│ latency paths  │        │ platform services │       │ simulation jobs   │
│ Africa/APAC/EU │        │ secrets · policy  │       │ GPU-attached pools│
└────────────────┘        └─────────┬─────────┘       └───────────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │ Supabase PostgreSQL     │  REALITY DATA LAYER
                       │ (via DbAdapter)         │  RLS · backups · PITR
                       └─────────────────────────┘
```

**Why this split (rationale, not preference):**

| Provider | Role | Justification | Exit path |
| --- | --- | --- | --- |
| **OCI** | Primary control plane + platform services | Cost-efficient dedicated compute, strong IAM/audit, private networking, GPU SKUs for Phase 45 | Terraform module swap to any k8s-capable provider |
| **Hetzner** | Elastic compute fabric (workers) | Lowest cost per core for bursty, interruptible work; 5→500 workers without redesign | Node pool re-point; workloads are k8s-native |
| **Vultr** | Global edge fabric | Regional presence (Africa/EU/APAC) for latency-sensitive APIs and cache | Edge adapter swap; edge services are stateless |
| **Cloudflare** | Global traffic layer | DNS/CDN/DDoS/WAF/LB/health in front of every provider | DNS and edge rules declared as code |
| **Supabase** | Reality data layer | Already the system of record; RLS is the enforcement layer | `DbAdapter` contract (§6) + migration tooling |

Providers are **interchangeable by contract**, not by hope: every provider is
reached only through a `ProviderAdapter` (`cloud-core.ts`) and every environment
is a registered `CloudAccount`/`Region` record, so adding a provider is a new
adapter + a new Terraform root — never an application change.

---

## 3. Control plane

The control plane is the **management** plane (it never serves tenant traffic):

| Responsibility | Delivered by | Where |
| --- | --- | --- |
| infrastructure orchestration | Terraform roots per provider + environment composition | `infrastructure/terraform/**` |
| provider abstraction | `ProviderAdapter` records + adapter plugin contract (Phase 21 §FC) | `cloud-core.ts`, `infrastructure/terraform/modules/**` |
| deployment management | plan/apply workflow with environment approvals and rollback | `.github/workflows/infrastructure-plan-apply.yml` |
| service discovery | Kubernetes Services + CoreGrid service registry (Phase 28/29-owned contracts) | `infrastructure/kubernetes/workloads/**` |
| configuration management | Phase 01 standards; no config duplication inside IaC | `docs/stack.md`, `frontend/src/lib/config-*` |
| secrets integration | external secret **references** only; values stay in GitHub Environments / provider secret store | `infrastructure/kubernetes/secret-refs.yaml`, `CREDENTIALS.md` |
| monitoring & health | observability stack (§16) + fabric health model (`InfraSLO`, `InfrastructureHealth`) | `infrastructure/monitoring/**` |
| scaling | node-pool autoscaling (OCI), worker autoscaling (Hetzner), edge autoscaling (Vultr) | `modules/node_pool`, `hetzner/` |
| disaster recovery | replicated state + provider-level DR plans with RPO/RTO | `modules/object_storage`, §15 |
| provider switching | portability levels (Phase 21 §X) + per-root modules | `infrastructure/terraform/README.md` |
| workload routing | Cloudflare LB + health checks → provider origins | `terraform/cloudflare/` |

**Control-plane law:** it holds **no tenant data** and never bypasses Phase
08/09/42 policy checks. Infrastructure changes are change records
(`InfraChangeRecord`) and require approval for the actions listed in §20.


---

## 4. Kubernetes fabric

One **management cluster** (OCI, HA control plane) hosts the control plane and
platform services. Regional/workload capacity arrives as **node pools**:

| Pool | Provider | Purpose | Autoscaling |
| --- | --- | --- | --- |
| `system` | OCI | control plane, ingress, DNS, operators | 3 (fixed HA) |
| `platform` | OCI | platform services, API surfaces | 3→12 |
| `workers-cpu` | Hetzner | background jobs, embeddings, documents, analytics | 5→500 |
| `workers-ai` | Hetzner / OCI GPU | agent execution, inference batches (Phase 45) | 0→N by queue depth |
| `sandbox` | OCI (isolated) | agent/simulation sandbox (Phase 41) | 0→20, network-isolated |
| `edge` | Vultr | regional stateless APIs/cache | per region 2→10 |

Namespaces (exactly these eight by default):

```
coregrid-system      control plane, operators, ingress
coregrid-security    policy, secret refs, audit, scanning
coregrid-platform    platform services and APIs
coregrid-agents      agent runtime (Phase 07) — never cluster-admin
coregrid-scholar     first domain runtime (runtime:scholar)
coregrid-monitoring  metrics, logs, traces, alerting
coregrid-dev         ephemeral developer environments
coregrid-staging     pre-production
```

Machine-enforced by `verify:infrastructure`: exactly these namespaces, default-deny
ingress+egress in every namespace with explicit allowances, resource quotas and
limit ranges per namespace, Pod Security `restricted` everywhere except `sandbox`
(stricter + isolated), non-root by default, and no `:latest` image tags anywhere.

---

## 5. Compute fabric and elastic workers (Hetzner role)

```
OCI control plane ──▶ task queues (Redis streams / Kafka-compatible) ──▶ Hetzner worker pool ──▶ jobs
                                    ▲                                          │
                                    └──────────── autoscale by queue depth ─────┘
```

- Workers are **disposable**: no persistent state, no tenant data at rest beyond
  the job's own scratch volume (encrypted, destroyed on completion).
- Scaling is **queue-depth driven** (KEDA-compatible metric) with a floor of 5 and
  a ceiling of 500; the ceiling is a *policy value*, not an architecture change.
- Job classes: `embedding`, `document-generation`, `analytics-batch`,
  `simulation` (Phase 37/41), `agent-execution` (Phase 07).
- Every job carries tenant identity in its envelope; workers never widen scope
  (they execute with the tenant context the API minted).

## 6. Data layer and abstraction (Supabase is a provider, not the platform)

- `DbAdapter` contract: the application depends on a **neutral interface**
  (`reality-read`, `reality-write`, `policy-evaluate`), implemented today by
  Supabase (PostgREST + RLS) and swappable for self-hosted PostgreSQL, distributed
  PostgreSQL or an enterprise database without touching domain code.
- **RLS remains the enforcement layer** (Phase 03). Infrastructure never
  replicates around RLS; replicas and backups inherit the same policy set.
- **Backups:** daily logical backup + continuous WAL/PITR where the plan allows;
  restore drills are recorded in the validation ledger, not assumed.
- **Resilience:** read replica for analytics; cross-region backup targets in
  object storage (§7); documented RPO/RTO per environment (§15).
- **Schema versioning:** migrations remain the single source (`database/supabase/migrations`);
  no schema mutation outside migrations, ever.

## 7. Storage fabric

- `StorageAdapter` contract with OCI Object Storage as the primary backend and
  S3-compatible / Wasabi as alternates.
- Buckets are **tenant-scoped by prefix and policy**, encrypted at rest, with
  lifecycle rules (hot → cold → archive) and versioning for AI artifacts,
  documents, media and backups.
- Signed URLs only; no public buckets; no cross-tenant prefixes granted.

## 8. Cache fabric

- Redis-compatible (managed or self-hosted in-cluster) with namespaces for
  sessions, API responses, hot reference data, AI context and workflow state.
- **Never a source of truth:** every cache entry is derived and reconstructible;
  cache loss is a performance event, never a correctness event.
- Tenant-separated keys; no cache key may span tenants.


## 9. Event and message fabric

- The fabric deploys the **transport**; the event *contracts* stay where they
  already live (kernel outbox + `scholar-events.ts` + Phase 14 data platform).
- Transports: Redis Streams (default), Kafka-compatible cluster (scale-out),
  and provider queues — selectable per environment by configuration.
- Event envelope (unchanged from the kernel): `id`, `type`, `tenantRef`,
  `aggregateRef`, `occurredAt`, `payload`, `provenance`.
- Canonical examples already in use: `institution.created`, `student.enrolled`,
  `payment.completed`, `agent.task.created`, `device.connected`,
  `workflow.executed`, `security.alert.created`.
- **Delivery law:** at-least-once with idempotent consumers; every consumer
  declares its tenant scope; a consumer that cannot resolve tenant context fails
  closed (dead-letter queue, never a silent drop).

## 10. Automation executor (n8n) — and its boundary

```
CoreGrid workflow intelligence (Phase 17 — owner)
        │  decision: "this trigger, this action, this context, this approval"
        ▼
Execution adapter (CoreGrid interface)
        ▼
n8n executor (self-hosted, queue mode)  ──▶  external systems
```

- n8n runs **inside** CoreGrid infrastructure (PostgreSQL + Redis queue mode,
  its own namespace, its own credentials), reachable only from the platform layer.
- n8n **never** holds CoreGrid policy, permissions or tenant context of record:
  CoreGrid decides *whether* and *with what context* an action runs; n8n performs
  the external calls.
- If n8n is removed, CoreGrid automation continues to function (native actions);
  n8n is an accelerator, exactly like Hermes/Jarvis below.

## 11. Optional intelligence layers (Hermes, Jarvis) — hard non-dependency

| Layer | Contribution | If absent |
| --- | --- | --- |
| **Hermes** | advanced reasoning, domain interpretation, planning | CoreGrid native intelligence (Phase 26 gateway) answers; degraded quality, zero functional loss |
| **Jarvis** | multi-agent orchestration, resource allocation | CoreGrid native orchestration (Phase 07 agent runtime + Phase 40 runtime fabric) continues |

**Proving the non-dependency is a test, not a promise:** the deployment keeps
Hermes/Jarvis behind adapter interfaces with health-gated routing, and CI runs a
`degraded-mode` check asserting that the platform boots and serves with both
adapters disabled. A "cannot work without X" dependency is an architectural
defect, classified as such in review.

## 12. Agent runtime fabric and sandbox

- **Agent runtime (Phase 07 owns semantics):** dedicated `coregrid-agents`
  namespace, one ServiceAccount per agent class, no cluster-admin, memory and
  tool access declared per agent, egress restricted by network policy, and every
  agent action written to the audit trail with its tenant and purpose.
- **Agent sandbox (Phase 41 owns the model):** a separate namespace on a separate
  node pool with no route to tenant data, synthetic fixtures only, strict quota,
  no provider credentials, and a TTL that destroys the environment after the run.
- Agent lifecycle (`PROPOSED → REVIEWED → APPROVED → DEPLOYED → MONITORED →
  SUSPENDED → RETIRED`) is enforced by the runtime, not by convention.

## 13. Digital twin infrastructure

The fabric provides **only** what twins need to exist physically: device
connectivity (Phase 15-owned contracts), time-series/event ingestion (Phase 14),
and compute/storage placement. It **never** defines a twin, a twin relationship
or a domain twin model — those belong to Phase 16 (live digital twin) and Phase 46
(twin civilization federation). No `school twin`, `hospital twin` or any
domain-named twin exists in the fabric layer (machine-checked).

## 14. Security fabric

| Control | Implementation |
| --- | --- |
| Zero trust | no implicit network trust; every namespace default-deny; service identity per workload (Phase 42) |
| Identity / authz | consumed from Phases 02/08/09 — never re-implemented in the fabric |
| RBAC / ABAC / PBAC / ReBAC | evaluated by Phase 08 at the API; infrastructure only enforces the decision |
| Tenant isolation | database (RLS) + application + permission + runtime levels; infra adds network & namespace isolation |
| Encryption | TLS in transit everywhere; encryption at rest for volumes, object storage and backups; customer-managed keys supported (BYOC §Phase 21 DA–DP) |
| Secrets | references only in IaC/manifests; values in GitHub Environments / provider secret store; rotation documented per secret (see `CREDENTIALS.md`) |
| Privileged access | break-glass is a recorded, time-boxed, alerted action (Phase 21 §CD) |
| Supply chain | pinned image digests, SBOM generation, vulnerability scanning, signature verification, patch/rollback policy |
| Audit | every infrastructure change is a change record with actor, approval, diff and outcome |

**Forbidden, permanently:** unrestricted AI actions, secret exposure, privilege
escalation, policy bypass, and any infrastructure path that widens tenant scope
for capacity or convenience.


## 15. Disaster recovery, residency and multi-region

| Concern | Primary | Recovery target | Status |
| --- | --- | --- | --- |
| Database | Supabase Postgres | daily logical + PITR; cross-region backup copies | to be evidenced after apply (R42-style proof) |
| Object storage | OCI Object Storage | versioned + cross-region replica | declared in IaC |
| Cluster state | Terraform remote state | versioned backend, locking, no local state | `terraform/README.md` |
| Control plane | OCI HA (3 control nodes) | rebuild from IaC in < 1 hour | IaC-proven |
| Regional traffic | Cloudflare LB + health checks | automatic origin removal; Vultr region promotion | declared in IaC |

- **RPO/RTO are declared per environment** (`DisasterRecoveryPlan` in
  `cloud-core.ts`) and a plan is `untested` until a drill is recorded — the domain
  model already refuses to pretend otherwise.
- **Residency:** placement is policy-driven. A tenant whose policy requires a
  jurisdiction is placed only in regions registered as permitted for it, and a
  placement that cannot satisfy residency **fails closed** rather than silently
  degrading isolation (Phase 21 §Q/§R).

## 16. Observability and self-healing

Signals (metrics, logs, traces) are collected in-cluster and routed through the
monitoring namespace; alert routing is a policy, not a hard-coded channel.

| Signal | What we watch |
| --- | --- |
| Compute | CPU, memory, GPU utilisation, node pressure, pool saturation |
| Data | database health, connection saturation, replication lag, backup freshness |
| API | latency p50/p95/p99, error rate, saturation (SLO-based, not vanity) |
| Jobs | queue depth, job failure rate, autoscale floor/ceiling hits |
| Fabric | provider health, quota consumption, drift detection, cost per tenant |
| Autonomy | agent failure rate, workflow failure rate, approval backlog |

**Reliability agents (Phase 21 §FE, Phase 47-owned improvement):** observe →
analyse → plan → policy check → **approval** → execute → verify. Reversible,
low-blast-radius actions (restart a crash-looping pod, scale a pool within its
declared bounds) may run supervised; anything touching data, security, cost
ceilings or tenant isolation is **approval-gated** and audited. Kill switch:
`InfraKillSwitch` (already modelled) must be reachable without the agent runtime.

## 17. Infrastructure as Code — structure and law

```
infrastructure/
├── README.md                     state, layout, how to run, approval model
├── CREDENTIALS.md                credential checklist (names only, never values)
├── .gitignore                    state, plans, tfvars, kubeconfig
├── terraform/
│   ├── versions.tf               provider pins (no :latest, no floating majors)
│   ├── modules/                  reusable, provider-agnostic building blocks
│   │   ├── network/              VPC/VNet, subnets, firewalls, private egress
│   │   ├── kubernetes/           managed cluster baseline (HA, versions)
│   │   ├── node_pool/            pool with autoscaling + labels/taints
│   │   ├── object_storage/       buckets, versioning, lifecycle, encryption
│   │   ├── secret_refs/          external secret references (no values)
│   │   └── dns_edge/             DNS records, LB, health checks, WAF rules
│   ├── oci/                      primary: network, cluster, system/platform pools, GPU
│   ├── hetzner/                  compute: worker pools 5→500, volumes, firewall
│   ├── vultr/                    edge: regional instances/clusters, cache
│   ├── cloudflare/               global: DNS, CDN, WAF, LB, health checks
│   ├── supabase/                 data: project settings as code, backups, hooks
│   └── environments/production/  composition of the above + tfvars example
├── kubernetes/                   cluster baseline (namespaces, policy, quotas)
│   ├── namespaces.yaml           8 namespaces, declarative
│   ├── resource-governance.yaml  quotas, limit ranges, priority classes
│   ├── network-policies.yaml     default-deny + explicit allowances
│   ├── pod-security.yaml         PSA labels (restricted; sandbox stricter)
│   ├── secret-refs.yaml          ExternalSecret references (no values)
│   ├── rbac/                     service accounts, roles, bindings
│   └── sandbox/                  isolated sandbox namespace + policies
├── monitoring/                   observability deployment values
└── workloads/                    deployable service manifests (images injected by CI)
```

**IaC laws (machine-checked):**

1. **No credentials, ever, in any file** — only variable *references*. Secret
   variables are `sensitive = true`; `terraform.tfvars` is git-ignored, and only
   `*.tfvars.example` with empty values is committed.
2. **Remote state only** — local state is a defect; backends are configured by
   variables so no project id lands in git.
3. **Every provider visited through a module** — no direct resource sprawl in
   roots; a provider can be replaced by swapping modules.
4. **Domain-neutral** — no education vocabulary anywhere in `infrastructure/**`.
5. **Pinned versions** — providers, Kubernetes versions and image digests are
   pinned; `latest` is forbidden.
6. **Tag everything** — provider-side resources carry `coregrid:*` tags
   (environment, owner phase, tenant scope, cost centre) for inventory, cost
   allocation and leak detection.
7. **Change control** — plan output is reviewed; apply requires an approval
   environment; every apply is a change record.


## 18. CI/CD (Phase 01 owns pipeline standards; this is the infrastructure instance)

| Pipeline | Trigger | What it does | Credentials |
| --- | --- | --- | --- |
| `verify.yml` (exists) | PR + push | typecheck, 2600+ unit tests, registry validation, build | none |
| `infrastructure-verify.yml` (new) | PR + push on `infrastructure/**` | `verify:infrastructure` structural laws, `terraform fmt -check`, `terraform validate` per root, `kubectl --dry-run=server`/kubeconform on manifests | none |
| `infrastructure-plan-apply.yml` (new) | `workflow_dispatch` (+ PR comment plan) | plan → human review → **environment-gated apply** → post-apply health check → rollback path | GitHub Environment secrets (never in repo) |

Deployment sequencing per environment: `dev` → `staging` → `production`, with
approval required at `staging` and `production`. Rollback is a first-class path:
previous plan is retained, blue/green and canary are declared per workload, and
database migrations remain forward-only with explicit compensating migrations.

## 19. Cost governance (FinOps)

- Every resource is tagged (`coregrid:environment`, `coregrid:owner-phase`,
  `coregrid:cost-centre`, `coregrid:tenant-scope`) so cost is allocatable.
- Budgets and ceilings are **policy values** in IaC, not surprises on an invoice.
- Idle detection: worker pools scale to their declared floor; sandboxes have TTLs;
  orphaned volumes/IPs are reported by the leak detector (Phase 21 §AO/§BS).
- Cost allocation model: platform baseline (shared) vs tenant-attributed
  consumption, published per environment.

## 20. Governance: what requires approval

| Action | Approval | Rationale |
| --- | --- | --- |
| Environment (BYOC) registration | required | new trust boundary |
| Placement / residency policy change | required | legal + isolation impact |
| Region failover | required | blast radius |
| Production apply (any provider) | required | change control |
| Secret rotation affecting production | required | availability impact |
| Scale ceiling increase | required | cost + capacity policy |
| Sandbox TTL extension | not required (within declared max) | bounded, isolated |
| Worker pool scale within declared bounds | not required | reversible, monitored |
| Pod restart / crash-loop remediation | not required (supervised, audited) | reversible |

## 21. Definition of done for this fabric

A provider or capability is "done" only when **all** hold:

1. Terraform module + root exist, `fmt`/`validate` clean, versions pinned.
2. State is remote, tagged, and destroy-safe; no credentials in git.
3. Kubernetes baseline applied: namespace, quota, default-deny policy, PSA label.
4. Secrets are references; values live outside the repository; rotation documented.
5. Observability: metrics + logs + alerts with a named SLO for the component.
6. DR: RPO/RTO declared; restore/rebuild path written and drilled once.
7. Security: least privilege evidenced; scanning + SBOM enabled where applicable.
8. Rollback path documented and tested in staging.
9. Cost is attributed; ceilings declared.
10. Evidence recorded: proof artifact + validation-ledger row (no claim without
    evidence — `scripts/verify-infrastructure.mjs` writes the artifact).

## 22. Explicitly out of scope for the fabric

- Domain semantics (education/health/finance/…): owned by domain runtimes.
- Identity, authorization, policy engines, analytics, workflow intelligence,
  agent cognition, simulation models, twin models: owned by phases 02/08/09,
  18, 17, 07, 37/41, 16/46 respectively.
- Application code and its data model: owned by runtimes; the fabric only hosts.
- Any change that would make CoreGrid unable to run without OCI, Hetzner, Vultr,
  Cloudflare, Supabase, n8n, Hermes or Jarvis.

