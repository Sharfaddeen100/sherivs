# CoreGrid Cloud Fabric — workloads (empty until CD exists)

Deployable service manifests land here as waves CF-8…CF-12 complete:

| Wave | Workload | Namespace |
| --- | --- | --- |
| CF-8 | n8n (queue mode) + its PostgreSQL/Redis | dedicated |
| CF-9 | observability stack (metrics, logs, traces, alerts) | `coregrid-monitoring` |
| CF-10 | secret-sync + policy/signing operators | `coregrid-security` |
| CF-11 | agent runtime + evaluation harness | `coregrid-agents` |
| CF-12 | the first domain runtime (Scholar) | `coregrid-scholar` |

**Why this directory is empty:** workloads are applied by CD after images are
built, signed and **digest-pinned** — never by hand, never with a floating tag.
Writing manifests now would create files no pipeline can deploy and that no test
can verify. The baseline they will land on already exists in
`infrastructure/kubernetes/**`, and every namespace above is already quota'd and
default-deny.

Nothing in this directory may carry a credential value: workloads read secrets
through the external-secrets references declared in
`infrastructure/kubernetes/secret-refs.yaml`.
