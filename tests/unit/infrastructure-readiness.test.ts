/**
 * CoreGrid — Cloud Fabric readiness tests (CF-4/CF-7 entry gates).
 *
 * The fabric may only be applied once its gates are OPEN — and "open" must be a
 * verified fact, not an assumption. This suite proves:
 *
 *  - the preflight doctor runs read-only and reports exactly which secret NAMES
 *    each wave still needs (never a value);
 *  - the preflight proof is bound to a mode and lists the blocked waves;
 *  - the bootstrap helper never writes secrets and always prints a reproducible
 *    command sequence;
 *  - residency is declared data with a fail-closed tenant-data gate;
 *  - the fabric holds no hard dependency on an optional layer (n8n/Hermes/Jarvis).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const PREFLIGHT_PROOF = "architecture/proofs/infrastructure-preflight.proof.json";

interface PreflightProof {
  artifact: string;
  mode: "static" | "live";
  wavesChecked: readonly string[];
  blockedWaves: readonly string[];
  checks: readonly { id: string; ok: boolean; detail: string }[];
  ok: boolean;
  notes: readonly string[];
}

const read = (ref: string) => readFileSync(join(ROOT, ref), "utf8").replace(/\r\n/g, "\n");
const run = (script: string, args: string[] = []) =>
  execFileSync("node", [script, ...args], { encoding: "utf8", cwd: ROOT });

describe("Cloud Fabric — credential gates are verified, not assumed", () => {
  it("runs the preflight read-only and reports the gate state", () => {
    const output = run("scripts/infrastructure/preflight.mjs", ["--static"]);
    expect(output).toMatch(/preflight checks satisfied \(mode: static\)/);
    expect(output).toContain("Blocked waves:");
    // The doctor reports NAMES only — a value would look like a long literal.
    expect(output).not.toMatch(/(?:sk|pk|ghp)-[A-Za-z0-9]{16,}/);
    expect(output).not.toMatch(/BEGIN [A-Z ]*PRIVATE KEY/);
  });

  it("writes a preflight proof that names the blocked waves", () => {
    const proof = JSON.parse(read(PREFLIGHT_PROOF)) as PreflightProof;
    expect(proof.artifact).toBe("infrastructure-preflight");
    expect(proof.mode).toBe("static");
    expect(proof.wavesChecked.length).toBeGreaterThanOrEqual(6);
    expect(proof.blockedWaves.length).toBeGreaterThan(0);
    expect(proof.notes.join(" ")).toMatch(/read-only|never logged/i);
    for (const entry of proof.checks) {
      expect(entry.detail).not.toMatch(/BEGIN [A-Z ]*PRIVATE KEY/);
    }
  });

  it("gates CF-4 and CF-7 (the first move) and names their secrets", () => {
    const output = run("scripts/infrastructure/preflight.mjs", ["--wave=cf4", "--static"]);
    expect(output).toContain("CF-4 OCI foundation");
    for (const name of [
      "TF_VAR_oci_tenancy_ocid",
      "TF_VAR_oci_user_ocid",
      "TF_VAR_oci_fingerprint",
      "TF_VAR_oci_compartment_ocid",
    ]) {
      expect(output, `${name} must be reported as required`).toContain(name);
    }

    const cf7 = run("scripts/infrastructure/preflight.mjs", ["--wave=cf7", "--static"]);
    expect(cf7).toContain("CF-7 Supabase data layer");
    expect(cf7).toContain("SUPABASE_DB_URL");
  });

  it("keeps the bootstrap helper dry by default and secret-free", () => {
    const output = run("scripts/infrastructure/bootstrap.mjs", ["--root=oci"]);
    expect(output).toContain("bootstrap checks satisfied");
    expect(output).toContain("terraform -chdir=infrastructure/terraform/oci init");
    expect(output).toContain("apply fabric.tfplan");
    // Dry run must not have written a backend file.
    expect(existsSync(join(ROOT, "infrastructure/terraform/oci/backend.hcl"))).toBe(false);
    const source = read("scripts/infrastructure/bootstrap.mjs");
    expect(source).toMatch(/no credential value is ever written/i);
  });
});

describe("Cloud Fabric — residency is declared data with a fail-closed gate", () => {
  const regions = read("infrastructure/terraform/regions.tf");

  it("declares region records with jurisdiction and sovereignty", () => {
    const ids = [...regions.matchAll(/"(oci|hetzner|vultr):[a-z0-9-]+"\s*=\s*\{/g)];
    expect(ids.length).toBeGreaterThanOrEqual(6);
    for (const field of ["jurisdiction", "sovereign", "permitted_for_tenancy_data"]) {
      expect(regions).toContain(field);
    }
  });

  it("refuses to place tenant data on compute or edge regions", () => {
    // Worker and edge regions are compute-only: no tenant data at rest.
    const workerAndEdge = regions
      .split(/\n\s{4}"/)
      .filter((block) => /^(hetzner|vultr):/.test(block));
    expect(workerAndEdge.length).toBeGreaterThan(0);
    for (const block of workerAndEdge) {
      expect(block).toContain("permitted_for_tenancy_data = false");
    }
    expect(regions).toContain("tenant_data_regions");
    expect(regions).toContain("stateless_regions");
  });

  it("keeps every region referenced in the fabric inside the inventory", () => {
    const declared = new Set(
      [...regions.matchAll(/"(oci|hetzner|vultr):([a-z0-9-]+)"/g)].map((match) => match[2]),
    );
    const referenced = ["fsn1", "nbg1", "jnb", "ams", "sgp"].every((region) =>
      declared.has(region),
    );
    expect(referenced, "edge/worker defaults must be declared").toBe(true);
  });
});

describe("Cloud Fabric — no hard dependency on an optional layer", () => {
  it("contains no required Terraform resource for n8n, Hermes or Jarvis", () => {
    const terraform = ["versions.tf", "regions.tf", "environments/production/main.tf"]
      .filter((ref) => existsSync(join(ROOT, "infrastructure/terraform", ref)))
      .map((ref) => read(`infrastructure/terraform/${ref}`))
      .join("\n")
      .toLowerCase();
    for (const optional of ["hermes", "jarvis", "n8n"]) {
      expect(terraform, `${optional} must not be part of the required baseline`).not.toContain(
        optional,
      );
    }
  });

  it("states the degraded-mode obligation where the optional layers are described", () => {
    const blueprint = read("architecture/cloud-fabric-implementation-blueprint.md");
    expect(blueprint).toMatch(/optional/i);
    expect(blueprint).toMatch(/degraded-mode|degradation/i);
    expect(blueprint).toMatch(/cannot work without|non-dependency/i);
  });

  it("keeps the automation executor out of the runtime's critical path", () => {
    const plan = read("architecture/cloud-fabric-migration-plan.md");
    expect(plan).toMatch(/n8n/i);
    expect(plan).toMatch(/CoreGrid automation still functions|degradation check/i);
    // n8n is a workspace of its own: never inside the runtime namespaces.
    const workloads = read("infrastructure/workloads/README.md");
    expect(workloads).toMatch(/CF-8/);
    expect(workloads).toMatch(/dedicated/);
  });

  it("documents the first move: CF-7 with CF-4, and the R42 coupling", () => {
    const plan = read("architecture/cloud-fabric-migration-plan.md");
    expect(plan).toMatch(/CF-7[\s\S]{0,400}CF-4|CF-4[\s\S]{0,400}CF-7/);
    expect(plan).toMatch(/R42|role-assignment substrate/i);
  });
});
