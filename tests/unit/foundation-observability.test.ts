/**
 * CoreGrid — Phase 01 Foundation: observability behaviour proofs (work item P01-1).
 *
 * The Phase 01 document requires observability by default (§47): logs, metrics,
 * traces, audit and health, correlated by request/trace id, with no secrets or
 * unnecessary personal data ever emitted (§29/§47/§49, AGENTS.md 29/35).
 *
 * Until now the observability modules existed but nothing executable proved their
 * behaviour — the acceptance probe classified the area DECLARED. These tests move
 * it to ENFORCED by proving the real implementation in
 * `frontend/src/lib/runtime-observability.ts`:
 *
 *  - every log entry carries correlation (correlationId/traceId/tenant/actor);
 *  - sensitive fields are redacted and long values truncated (never logged raw);
 *  - metrics compute p50/p95/p99 and stay tenant/capability labelled;
 *  - health aggregates unhealthy > degraded > healthy deterministically.
 *
 * They assert behaviour of the platform primitive only — no manufactured state.
 */
import { describe, expect, it } from "vitest";

import {
  LOG_LEVELS,
  createHealthStatus,
  createLogger,
  createMetricsCollector,
  redactSensitiveFields,
  type LogEntry,
  type LogSink,
} from "@/lib/runtime-observability";
import { correlationId, traceId } from "@/lib/runtime-core";
import { tenantId } from "@/lib/tenant-core";

function collector() {
  const entries: LogEntry[] = [];
  const sink: LogSink = { write: (entry) => entries.push(entry) };
  return { entries, sink };
}

describe("Phase 01 — observability: every log entry is correlated (§47/§48)", () => {
  it("attaches correlation, tenant and actor to every line", () => {
    const { entries, sink } = collector();
    const logger = createLogger(sink, {
      correlationId: correlationId("corr-1"),
      traceId: traceId("trace-1"),
      tenantId: tenantId("tenant-a"),
      actorId: "user-1",
      capability: "foundation-standards-config-secrets-ci",
      operation: "verify",
    });

    logger.info("registry validated");
    logger.warn("secrets scan slow");
    logger.error("verification failed", { phase: "01" }, new Error("boom"));

    expect(entries).toHaveLength(3);
    for (const entry of entries) {
      expect(entry.correlationId).toBe("corr-1");
      expect(entry.traceId).toBe("trace-1");
      expect(entry.tenantId).toBe("tenant-a");
      expect(entry.actorId).toBe("user-1");
      expect(entry.capability).toBe("foundation-standards-config-secrets-ci");
      expect(entry.operation).toBe("verify");
      expect(LOG_LEVELS).toContain(entry.level);
      expect(Number.isNaN(Date.parse(entry.timestamp))).toBe(false);
    }
    expect(entries.map((entry) => entry.level)).toEqual(["info", "warn", "error"]);
  });

  it("defaults missing context to null rather than inventing values", () => {
    const { entries, sink } = collector();
    const logger = createLogger(sink, {
      correlationId: correlationId("corr-2"),
      traceId: traceId("trace-2"),
    });

    logger.debug("no tenant context");

    expect(entries[0]?.tenantId).toBeNull();
    expect(entries[0]?.actorId).toBeNull();
    expect(entries[0]?.capability).toBeNull();
  });

  it("records an error's safe summary and never its stack (§49)", () => {
    const { entries, sink } = collector();
    const logger = createLogger(sink, {
      correlationId: correlationId("corr-3"),
      traceId: traceId("trace-3"),
    });

    logger.error("operation failed", {}, new Error("connection refused"));

    expect(entries[0]?.error).toEqual({ message: "connection refused", category: "error" });
    expect(JSON.stringify(entries[0])).not.toMatch(/at .*\(.*:\d+:\d+\)/);
  });
});

describe("Phase 01 — observability: secrets and personal data are never logged (§29/§34)", () => {
  it("redacts credential, session and personal-data fields", () => {
    const redacted = redactSensitiveFields({
      password: "hunter2",
      apiKey: "sk-live-123",
      token: "jwt.value.here",
      authorization: "Bearer abc",
      cookie: "session=1",
      sessionId: "sess-9",
      privateKey: "-----BEGIN",
      email: "parent@example.com",
      phone: "+2348000000",
      ssn: "123-45-6789",
      creditCard: "4111111111111111",
      safe: "attendance",
    });

    for (const key of [
      "password",
      "apiKey",
      "token",
      "authorization",
      "cookie",
      "sessionId",
      "privateKey",
      "email",
      "phone",
      "ssn",
      "creditCard",
    ]) {
      expect(redacted[key], `${key} must be redacted`).toBe("[REDACTED]");
    }
    expect(redacted.safe).toBe("attendance");
  });

  it("redacts nested objects and truncates oversized values", () => {
    const redacted = redactSensitiveFields({
      nested: { password: "x", keep: 1 },
      long: "y".repeat(600),
    });

    expect(redacted.nested).toEqual({ password: "[REDACTED]", keep: 1 });
    expect(String(redacted.long)).toContain("[REDACTED]");
    expect(String(redacted.long).length).toBeLessThan(600);
  });

  it("applies redaction on the real log path, not only when called directly", () => {
    const { entries, sink } = collector();
    const logger = createLogger(sink, {
      correlationId: correlationId("corr-4"),
      traceId: traceId("trace-4"),
    });

    logger.info("login", { password: "hunter2", email: "a@b.c", tenant: "school-1" });

    expect(entries[0]?.context).toEqual({
      password: "[REDACTED]",
      email: "[REDACTED]",
      tenant: "school-1",
    });
  });
});

describe("Phase 01 — observability: metrics and health are real and deterministic (§47)", () => {
  it("computes p50/p95/p99 from recorded values", () => {
    const metrics = createMetricsCollector();
    for (const value of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
      metrics.record("verify.duration_ms", value, { phase: "01" }, tenantId("tenant-a"), "verify");
    }

    const percentiles = metrics.percentiles("verify.duration_ms");

    // Index convention: floor((count - 1) * pct) over the sorted sample, so a
    // ten-sample p99 sits one rank below the maximum (the nearest-rank quantile).
    expect(percentiles?.count).toBe(10);
    expect(percentiles?.p50).toBe(50);
    expect(percentiles?.p95).toBe(90);
    expect(percentiles?.p99).toBe(90);
    expect(metrics.snapshot()[0]?.tenantId).toBe("tenant-a");
  });

  it("tracks the upper tail as the sample grows", () => {
    const metrics = createMetricsCollector();
    for (let value = 1; value <= 100; value += 1) metrics.record("auth.latency_ms", value);

    const percentiles = metrics.percentiles("auth.latency_ms");

    expect(percentiles?.p50).toBe(50);
    expect(percentiles?.p95).toBe(95);
    expect(percentiles?.p99).toBe(99);
  });

  it("returns null for a metric that was never recorded", () => {
    expect(createMetricsCollector().percentiles("absent")).toBeNull();
  });

  it("aggregates health worst-first: unhealthy > degraded > healthy", () => {
    expect(
      createHealthStatus({
        registry: { status: "healthy" },
        secrets: { status: "degraded", detail: "slow" },
      }).status,
    ).toBe("degraded");

    expect(
      createHealthStatus({
        registry: { status: "healthy" },
        secrets: { status: "unhealthy", detail: "scan failed" },
        build: { status: "degraded" },
      }).status,
    ).toBe("unhealthy");

    const healthy = createHealthStatus({ registry: { status: "healthy" } });
    expect(healthy.status).toBe("healthy");
    expect(healthy.checks.registry?.detail).toBeNull();
    expect(Number.isNaN(Date.parse(healthy.checkedAt))).toBe(false);
  });
});
