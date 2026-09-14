# CoreGrid Cloud Fabric — Kubernetes baseline

Declarative cluster baseline for the fabric. Apply order matters:

```bash
# 1. Validate everything without talking to a cluster (CI does this too)
kubectl apply --dry-run=client -f infrastructure/kubernetes/ --recursive
kubeconform -strict -summary infrastructure/kubernetes/

# 2. Review the diff against the live cluster
kubectl diff -f infrastructure/kubernetes/ --recursive

# 3. Apply the baseline (namespaces → governance → policy → references → RBAC)
kubectl apply -f infrastructure/kubernetes/namespaces.yaml
kubectl apply -f infrastructure/kubernetes/resource-governance.yaml
kubectl apply -f infrastructure/kubernetes/network-policies.yaml
kubectl apply -f infrastructure/kubernetes/secret-refs.yaml
kubectl apply -f infrastructure/kubernetes/rbac/ --recursive
kubectl apply -f infrastructure/kubernetes/sandbox/ --recursive
```

## What this baseline guarantees

| Law | Where enforced |
| --- | --- |
| Exactly eight namespaces, no more by default | `namespaces.yaml` + `verify:infrastructure` |
| Default-deny ingress **and** egress everywhere | `network-policies.yaml` (default-deny per namespace) |
| DNS is the only universal egress | `allow-dns-egress` in each namespace |
| Agents and runtimes never touch the Kubernetes API | `rbac/service-accounts.yaml` (`automountServiceAccountToken: false`) |
| No `cluster-admin` for any workload | RBAC baseline (only namespace-scoped `Role`s + one read-only cluster role for scraping) |
| Pod Security `restricted` everywhere | namespace labels |
| Sandbox cannot reach tenant namespaces, has TTL and lowest priority | `sandbox/sandbox-isolation.yaml` |
| Secrets are references only | `secret-refs.yaml` (ExternalSecret keys; no values) |
| Quotas and limit ranges per namespace | `resource-governance.yaml` |

## Not in this directory

Workload manifests (deployments for platform services, the runtime, n8n, the
observability stack) belong in `infrastructure/workloads/**` and are applied by
CD after images are built, signed and digest-pinned. Cluster provisioning is
Terraform (`infrastructure/terraform/**`), never `kubectl`.

The `coregrid-scholar` namespace holds the **first domain runtime** as a
*consumer* of this fabric — the fabric would be identical if that runtime were a
hospital or a mine. Nothing here names, or depends on, a vertical.

## Verification

`npm run verify:infrastructure` re-checks these laws from source on every change —
including the exact namespace set, default-deny coverage, PSA labels, quota
coverage, sandbox isolation and the absence of `:latest` images or credentials.
