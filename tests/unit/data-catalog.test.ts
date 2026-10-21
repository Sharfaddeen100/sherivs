/**
 * Sherivs Scholar — Phase 14 Data Platform unit tests (data-catalog).
 *
 * Validates:
 * - Data catalog registration (AN).
 * - Data discovery by name/domain/sensitivity/owner/tags, tenant-scoped (AO).
 * - Source registry metadata (S).
 * - Schema registry with compatibility flagging (Y, Z).
 * - Data contracts and contract compliance (AA, AB).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import {
  registerCatalogEntry,
  discoverDatasets,
  registerDataSource,
  registerSchemaVersion,
  createDataContract,
  validateContractCompliance,
  type CatalogEntry,
} from "@/lib/data-catalog";

const TENANT_A = tenantId("tenant-a");
const TENANT_B = tenantId("tenant-b");
const NOW = "2026-01-01T00:00:00Z";

function makeEntry(overrides: Partial<CatalogEntry> = {}): CatalogEntry {
  const created = registerCatalogEntry({
    datasetName: "academic.attendance",
    tenantId: TENANT_A,
    domain: "academic",
    owner: "phase-04",
    description: "Attendance records for term 1",
    sensitivity: "SENSITIVE",
    tags: ["attendance", "term"],
    now: NOW,
  });
  if (!created.ok) throw new Error("fixture failed");
  return { ...created.entry, ...overrides };
}

describe("Data catalog (AN)", () => {
  it("registers a catalog entry", () => {
    const entry = makeEntry();
    expect(entry.datasetName).toBe("academic.attendance");
  });

  it("rejects an entry without a dataset name", () => {
    const result = registerCatalogEntry({
      datasetName: "",
      tenantId: TENANT_A,
      domain: "academic",
      owner: "o",
      description: "",
      sensitivity: "INTERNAL",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});

describe("Data discovery (AO)", () => {
  it("finds datasets by text and domain within the tenant", () => {
    const entries = [
      makeEntry(),
      makeEntry({
        datasetName: "financial.fees",
        domain: "financial",
        sensitivity: "SENSITIVE",
        description: "Fee ledger",
      }),
    ];
    const byText = discoverDatasets(entries, { text: "attendance" }, TENANT_A);
    expect(byText).toHaveLength(1);
    const byDomain = discoverDatasets(entries, { domain: "financial" }, TENANT_A);
    expect(byDomain[0].datasetName).toBe("financial.fees");
  });

  it("never returns results across tenants", () => {
    const entries = [makeEntry(), makeEntry({ datasetName: "other.tenant", tenantId: TENANT_B })];
    const results = discoverDatasets(entries, { text: "" }, TENANT_A);
    expect(results.every((r) => r.tenantId === TENANT_A)).toBe(true);
  });

  it("filters by tags", () => {
    const entries = [makeEntry(), makeEntry({ datasetName: "academic.grades", tags: ["grades"] })];
    const results = discoverDatasets(entries, { tags: ["grades"] }, TENANT_A);
    expect(results).toHaveLength(1);
    expect(results[0].datasetName).toBe("academic.grades");
  });
});

describe("Source registry (S)", () => {
  it("registers a data source with reliability bounds", () => {
    const result = registerDataSource({
      sourceId: "gov-sis-1",
      tenantId: TENANT_A,
      provider: "government",
      owner: "ministry",
      urlOrApi: "https://sis.example.gov",
      authenticationMethod: "oauth",
      schemaName: "gov.students",
      refreshFrequencySeconds: 86_400,
      reliability: 0.9,
      license: "government",
      jurisdiction: "NG",
      sensitivity: "SENSITIVE",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects out-of-range reliability", () => {
    const result = registerDataSource({
      sourceId: "s1",
      tenantId: TENANT_A,
      provider: "p",
      owner: "o",
      urlOrApi: "u",
      authenticationMethod: "a",
      schemaName: "s",
      refreshFrequencySeconds: 60,
      reliability: 2,
      license: "l",
      jurisdiction: "NG",
      sensitivity: "INTERNAL",
    });
    expect(result.ok).toBe(false);
  });
});

describe("Schema registry (Y, Z)", () => {
  it("flags breaking schema changes", () => {
    const compatible = registerSchemaVersion({
      schemaName: "financial.invoice",
      tenantId: TENANT_A,
      version: 2,
      fields: ["id", "amount"],
      backwardCompatible: true,
      now: NOW,
    });
    if (!compatible.ok) throw new Error("fixture failed");
    expect(compatible.schema.compatibility).toBe("compatible");

    const breaking = registerSchemaVersion({
      schemaName: "financial.invoice",
      tenantId: TENANT_A,
      version: 3,
      fields: ["id"],
      backwardCompatible: false,
      now: NOW,
    });
    if (!breaking.ok) throw new Error("fixture failed");
    expect(breaking.schema.compatibility).toBe("breaking");
  });

  it("rejects a schema without fields", () => {
    const result = registerSchemaVersion({
      schemaName: "s",
      tenantId: TENANT_A,
      version: 1,
      fields: [],
      backwardCompatible: true,
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});

describe("Data contracts (AA, AB)", () => {
  it("creates a data contract between producer and consumer", () => {
    const result = createDataContract({
      tenantId: TENANT_A,
      producer: "phase-13-financial",
      consumer: "phase-18-analytics",
      schemaName: "financial.invoice",
      semantics: "Invoices are authoritative financial records",
      freshnessSeconds: 3600,
      qualityRequirements: ["validity"],
      owner: "phase-13",
      securityClassification: "SENSITIVE",
    });
    expect(result.ok).toBe(true);
  });

  it("enforces contract compliance on freshness and quality (AB)", () => {
    const created = createDataContract({
      tenantId: TENANT_A,
      producer: "p",
      consumer: "c",
      schemaName: "s",
      semantics: "x",
      freshnessSeconds: 3600,
      qualityRequirements: ["validity"],
      owner: "o",
      securityClassification: "INTERNAL",
    });
    if (!created.ok) throw new Error("fixture failed");

    expect(validateContractCompliance(created.contract, 1800, true).ok).toBe(true);
    expect(validateContractCompliance(created.contract, 7200, true).ok).toBe(false);
    expect(validateContractCompliance(created.contract, 1800, false).ok).toBe(false);
  });
});
