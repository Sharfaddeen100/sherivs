# CoreGrid Cloud Fabric — monitoring values

The observability stack runs in `coregrid-monitoring`. This directory holds the
declarative values/configuration it is deployed with (CF-9).

## Signals

| Signal | Source | Retention | Notes |
| --- | --- | --- | --- |
| Metrics | node/pod/service exporters + application `/metrics` | 30d (raw) → object storage (long term) | scrape targets opt in via `coregrid.io/scrape=enabled` |
| Logs | container stdout/stderr + cluster audit | 30d | never log secrets or unnecessary private data (Constitution §29) |
| Traces | application instrumentation | 7d | sampled; tenant ref present, payload never |
| Alerts | rule evaluation → routing policy | — | routing is policy data, not hard-coded channels |

## What is monitored (Phase 21 §BH–BM)

- compute: CPU, memory, GPU utilisation, node pressure, pool saturation
- data: database health, connection saturation, replication lag, backup freshness
- API: latency percentiles, error rate, saturation — SLO-based with an error budget
- jobs: queue depth, failure rate, autoscale floor/ceiling hits
- fabric: provider health, quota consumption, drift, cost per tenant
- autonomy: agent and workflow failure rates, approval backlog

## Status

**Not deployed.** CF-9 requires a running cluster (CF-4/CF-5) and credentials.
The stack choice (managed observability vs self-hosted) is an owner decision
recorded as an ADR before CF-9 applies — the tables above are the contract either
way, so the decision does not change what we measure, only where it runs.
