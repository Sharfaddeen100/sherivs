/**
 * CoreGrid — Command Centre contract-governance view (Phase 19 displays, Phase 08
 * authorizes).
 *
 * K-8 binds the kernel contract chain into the surface operators already use.
 * These tests assert the surface renders the kernel projector rather than any
 * hand-maintained summary:
 *  - `phaseContractGovernance()` is a projection of the coverage snapshot plus
 *    the runtime binding facts (no independent chain facts);
 *  - the governance rows join 1:1 with the phase catalog the runway renders, so
 *    every runway row shows real contract health and nothing is fabricated;
 *  - the Command Centre renders the governance card and the contract/autonomy/
 *    runtime columns from that projection, with no literal chain totals;
 *  - the panel stays view-only (it never becomes an authorization input).
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ENGINEERING_SECTION_COUNT } from "@/lib/kernel/engineering-sections";
import {
  PHASE_CONTRACTS,
  phaseContractCoverageSnapshot,
  phaseContractGovernance,
  phaseContractHealthById,
} from "@/lib/kernel/phase-contracts";
import { KERNEL_CAPABILITIES } from "@/lib/kernel/kernel-capability-registry";
import { PHASE_CATALOG } from "@/lib/phase-catalog";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const governance = phaseContractGovernance();

describe("phase-contract governance projector (Command Centre data)", () => {
  it("projects the coverage snapshot instead of owning new chain facts", () => {
    const snapshot = phaseContractCoverageSnapshot();
    expect(governance.generatedFrom).toBe("kernel/phase-contracts");
    expect(governance.schemaVersion).toBe(snapshot.schemaVersion);
    expect(governance.total).toBe(snapshot.total);
    expect(governance.sectionsPerPhase).toBe(snapshot.sectionsPerPhase);
    expect(governance.sectionsComplete).toBe(snapshot.sectionsComplete);
    expect(governance.byLayer).toEqual(snapshot.byLayer);
    expect(governance.byAsiTier).toEqual(snapshot.byAsiTier);
    expect(governance.roots).toEqual(snapshot.roots);
    expect(governance.rows.map((row) => row.id)).toEqual(snapshot.rows.map((row) => row.id));
  });

  it("reports the chain as contract-complete", () => {
    expect(governance.total).toBe(51);
    expect(governance.rows).toHaveLength(51);
    expect(governance.sectionsPerPhase).toBe(ENGINEERING_SECTION_COUNT);
    expect(governance.sectionsComplete).toBe(governance.total);
    expect(governance.compliant).toBe(true);
    expect(governance.rows.every((row) => row.contractComplete)).toBe(true);
  });

  it("binds every phase to the Scholar runtime and keeps neutral seats reserved", () => {
    expect(governance.firstRuntimes).toEqual(["runtime:scholar"]);
    expect(governance.neutralSeatDomains).toEqual(
      expect.arrayContaining(["healthcare", "government", "commerce"]),
    );
    for (const row of governance.rows) {
      expect(row.firstRuntime, `first runtime for phase ${row.id}`).toBe("runtime:scholar");
      expect(row.neutralSeatDomains.length, `neutral seats for phase ${row.id}`).toBeGreaterThan(0);
    }
  });

  it("derives every row from its own contract", () => {
    for (const contract of PHASE_CONTRACTS) {
      const row = governance.rows.find((candidate) => candidate.id === contract.id);
      expect(row, `governance row for phase ${contract.id}`).toBeDefined();
      expect(row?.name).toBe(contract.name);
      expect(row?.layer).toBe(contract.layer);
      expect(row?.capability).toBe(contract.capabilities.owns[0] ?? null);
      expect(row?.sectionsDeclared).toBe(ENGINEERING_SECTION_COUNT);
      expect(row?.sectionsTotal).toBe(ENGINEERING_SECTION_COUNT);
      expect(row?.asiTier).toBe(contract.asi.tier);
      expect(row?.autonomyLevel).toBe(contract.asi.autonomy.level);
      expect(row?.neutralSeatDomains).toEqual(
        contract.runtimeBindings.neutralSeats.map((seat) => seat.domain),
      );
      expect(row?.dependencies).toBe(contract.dependsOn.length);
      expect(row?.consumers).toBe(contract.consumers.length);
      expect(row?.autonomyLevel).toBeLessThanOrEqual(3);
    }
  });

  it("joins 1:1 with the phase catalog the runway renders", () => {
    const catalogIds = PHASE_CATALOG.map((entry) => entry.phase);
    expect(catalogIds).toHaveLength(governance.total);
    for (const id of catalogIds) {
      expect(phaseContractHealthById(id), `contract health for catalog phase ${id}`).toBeDefined();
    }
    for (const row of governance.rows) {
      expect(catalogIds, `catalog entry for contract phase ${row.id}`).toContain(row.id);
    }
    expect(phaseContractHealthById("99")).toBeUndefined();
  });

  it("never reports a capability the kernel does not own", () => {
    const registered = new Set(KERNEL_CAPABILITIES.map((capability) => capability.id));
    for (const row of governance.rows) {
      if (row.capability === null) continue;
      expect(
        registered.has(row.capability),
        `capability ${row.capability} must be registered`,
      ).toBe(true);
    }
  });
});
