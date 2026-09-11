/**
 * CoreGrid — Scholar vertical binding map (kernel capability ↔ Scholar vertical).
 *
 * The 51-phase contract chain is complete; this suite locks the CONSUMER side:
 *  - every kernel capability Scholar consumes is bound to a real Scholar
 *    vertical, with evidence paths that exist in the repository;
 *  - every bound capability resolves to a contract phase, and that phase's
 *    contract declares `runtime:scholar` as its first runtime;
 *  - the ledger row (architecture/registry.json runtime-001) lists exactly the
 *    phases that own the capabilities Scholar consumes;
 *  - the validator rejects maps that invent capabilities, duplicate bindings,
 *    cite no evidence, or leave a vertical / consumption unbound;
 *  - the Command Centre publishes the binding summary for operators.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { KERNEL_CAPABILITIES } from "@/lib/kernel/kernel-capability-registry";
import { PHASE_CONTRACTS, phaseContractById } from "@/lib/kernel/phase-contracts";
import { PHASE_CATALOG } from "@/lib/phase-catalog";
import {
  SCHOLAR_REGISTRY_RUNTIME_ID,
  SCHOLAR_RUNTIME_ID,
  SCHOLAR_VERTICALS,
  SCHOLAR_VERTICAL_BINDINGS,
  scholarVerticalBindingSummary,
  validateScholarVerticalBindings,
  type ScholarVerticalBinding,
} from "@/lib/runtime/scholar-vertical-bindings";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const summary = scholarVerticalBindingSummary();

describe("Scholar vertical bindings — coverage law", () => {
  it("binds every kernel capability Scholar consumes", () => {
    expect(summary.consumedCapabilities.length).toBeGreaterThan(0);
    expect(summary.unboundCapabilities).toEqual([]);
    expect([...summary.boundCapabilities].sort()).toEqual([...summary.consumedCapabilities].sort());
  });

  it("covers every Scholar vertical exactly once in the summary", () => {
    expect(summary.verticals).toEqual([...SCHOLAR_VERTICALS]);
    expect(summary.byVertical).toHaveLength(SCHOLAR_VERTICALS.length);
    for (const entry of summary.byVertical) {
      expect(entry.capabilities.length, `capabilities for ${entry.vertical}`).toBeGreaterThan(0);
    }
  });

  it("declares the runtime the contracts and the ledger identify", () => {
    expect(summary.runtime).toBe(SCHOLAR_RUNTIME_ID);
    expect(SCHOLAR_RUNTIME_ID).toBe("runtime:scholar");
    expect(SCHOLAR_REGISTRY_RUNTIME_ID).toBe("runtime-001");
  });

  it("passes its own validator with zero issues", () => {
    const result = validateScholarVerticalBindings();
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });
});

describe("Scholar vertical bindings — contract-chain coupling", () => {
  it("resolves every bound capability to an authored contract phase", () => {
    for (const row of summary.rows) {
      expect(row.phase, `owner phase for ${row.capability}`).toMatch(/^\d{2}$/);
      const contract = phaseContractById(row.phase);
      expect(contract, `contract for phase ${row.phase}`).toBeDefined();
      expect(row.phaseName).toBe(contract?.name);
      expect(
        contract?.capabilities.owns,
        `phase ${row.phase} must own ${row.capability}`,
      ).toContain(row.capability);
    }
  });

  it("agrees with the first runtime every contract declares", () => {
    for (const contract of PHASE_CONTRACTS) {
      expect(contract.runtimeBindings.firstRuntime, `firstRuntime of ${contract.id}`).toBe(
        SCHOLAR_RUNTIME_ID,
      );
    }
  });

  it("keeps the registry ledger row in step with the consumed capability owners", () => {
    const registry = JSON.parse(readFileSync(join(ROOT, "architecture/registry.json"), "utf8")) as {
      runtimes: Array<{ id: string; name: string; phases: string[] }>;
    };
    const row = registry.runtimes.find((runtime) => runtime.id === SCHOLAR_REGISTRY_RUNTIME_ID);
    expect(row, `registry runtime ${SCHOLAR_REGISTRY_RUNTIME_ID}`).toBeDefined();
    const ownerPhases = [...new Set(summary.rows.map((entry) => entry.phase))].sort();
    expect([...(row?.phases ?? [])].sort()).toEqual(ownerPhases);
  });

  it("binds only capabilities the kernel registry owns and registers", () => {
    const registered = new Set(KERNEL_CAPABILITIES.map((capability) => capability.id));
    for (const row of summary.rows) {
      expect(registered.has(row.capability), `${row.capability} must be registered`).toBe(true);
      expect(
        PHASE_CATALOG.some((entry) => entry.phase === row.phase),
        `phase ${row.phase} must be catalogued`,
      ).toBe(true);
    }
  });
});

describe("Scholar vertical bindings — evidence", () => {
  it("cites evidence that exists and is non-empty", () => {
    for (const binding of SCHOLAR_VERTICAL_BINDINGS) {
      const pair = `${binding.vertical}:${binding.capability}`;
      expect(binding.evidence.length, `evidence for ${pair}`).toBeGreaterThan(0);
      for (const path of binding.evidence) {
        const absolute = join(ROOT, path);
        expect(existsSync(absolute), `missing evidence ${path} (${pair})`).toBe(true);
        expect(statSync(absolute).size, `empty evidence ${path} (${pair})`).toBeGreaterThan(0);
      }
    }
  });

  it("cites evidence inside the frontend source tree only", () => {
    for (const binding of SCHOLAR_VERTICAL_BINDINGS) {
      for (const path of binding.evidence) {
        expect(path.startsWith("frontend/src/"), `evidence path ${path}`).toBe(true);
      }
    }
  });

  it("counts its evidence", () => {
    const expected = SCHOLAR_VERTICAL_BINDINGS.reduce(
      (total, binding) => total + binding.evidence.length,
      0,
    );
    expect(summary.evidenceCount).toBe(expected);
    expect(summary.evidenceCount).toBeGreaterThanOrEqual(SCHOLAR_VERTICAL_BINDINGS.length);
  });
});

describe("Scholar vertical bindings — validator rejects unsound maps", () => {
  const valid: ScholarVerticalBinding = SCHOLAR_VERTICAL_BINDINGS[0];
  const soundEvidence = "frontend/src/lib/runtime/scholar.ts";

  it("rejects an empty map", () => {
    const result = validateScholarVerticalBindings([]);
    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/empty/);
  });

  it("rejects an invented capability", () => {
    const result = validateScholarVerticalBindings([
      { vertical: "admin", capability: "invented-capability", evidence: [soundEvidence] },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/not registered in the kernel/);
  });

  it("rejects a capability Scholar does not consume", () => {
    const result = validateScholarVerticalBindings([
      {
        vertical: "admin",
        capability: "reality-os-kernel-composition",
        evidence: [soundEvidence],
      },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/not consumed by Scholar/);
  });

  it("rejects duplicates, empty evidence, foreign evidence and unbound verticals", () => {
    const result = validateScholarVerticalBindings([
      valid,
      valid,
      { vertical: "teacher", capability: valid.capability, evidence: [] },
      { vertical: "runtime", capability: "scheduling", evidence: ["documentation/planned.md"] },
    ]);
    const issues = result.issues.join(" ");
    expect(result.ok).toBe(false);
    expect(issues).toMatch(/duplicate binding/);
    expect(issues).toMatch(/cites no evidence/);
    expect(issues).toMatch(/outside frontend\/src/);
    expect(issues).toMatch(/has no binding/);
  });

  it("stays sound for the authored map", () => {
    expect(validateScholarVerticalBindings().issues).toEqual([]);
  });
});

describe("Scholar vertical bindings — operator surface", () => {
  const surface = readFileSync(
    join(ROOT, "frontend/src/components/command-centre/command-centre.tsx"),
    "utf8",
  );

  it("publishes the binding summary on the Command Centre", () => {
    expect(surface).toContain("scholarVerticalBindingSummary");
    expect(surface).toContain("<ScholarBindingCard />");
    expect(surface).toContain("bindings.byVertical");
    expect(surface).toContain("bindings.unboundCapabilities");
    expect(surface).toContain("bindings.registryRuntimeId");
  });
});
