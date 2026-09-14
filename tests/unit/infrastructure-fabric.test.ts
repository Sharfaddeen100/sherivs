/**
 * CoreGrid — Cloud Fabric foundation tests (wave CF-3).
 *
 * Phase 21 owns the fabric; this suite proves the instantiation is faithful:
 *
 *  - the verifier runs clean and re-emits a proof bound to the code's digest;
 *  - the fabric obeys its own laws (secrets, state, pinning, tagging, cluster
 *    policy, sandbox isolation, domain neutrality);
 *  - the fabric builds no duplicate engine (identity, authorization, analytics,
 *    automation, twins) — it only hosts what those phases own;
 *  - every wave that would touch a cloud is credential-gated and recorded as such.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const INFRA = join(ROOT, "infrastructure");
const PROOF_REF = "architecture/proofs/cloud-fabric-foundation.proof.json";

interface ProofCheck {
  id: string;
  ok: boolean;
  detail: string;
  category: string;
}
interface FabricProof {
  artifact: string;
  wave: string;
  owner: string;
  capability: string;
  mode: string;
  infrastructureFiles: number;
  inventoryDigest: string;
  providers: readonly string[];
  modules: readonly string[];
  namespaces: readonly string[];
  checks: readonly ProofCheck[];
  ok: boolean;
  nextWaves: readonly string[];
  limitations: readonly string[];
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const infraFiles = walk(INFRA)
  .map((full) => relative(ROOT, full).replace(/\\/g, "/"))
  .sort();
const infraText = (ref: string) => readFileSync(join(ROOT, ref), "utf8").replace(/\r\n/g, "\n");
const proof = JSON.parse(readFileSync(join(ROOT, PROOF_REF), "utf8")) as FabricProof;

const recomputedDigest = `sha256:${createHash("sha256")
  .update(infraFiles.map((ref) => `${ref}\n${infraText(ref)}`).join("\n---\n"))
  .digest("hex")}`;

const NAMESPACES = [
  "coregrid-system",
  "coregrid-security",
  "coregrid-platform",
  "coregrid-agents",
  "coregrid-scholar",
  "coregrid-monitoring",
  "coregrid-dev",
  "coregrid-staging",
];

describe("CF-3 — the fabric verifier proves what it claims", () => {
  it("runs cleanly and reports the invariant count", () => {
    const output = execFileSync("node", ["scripts/verify-infrastructure.mjs"], {
      encoding: "utf8",
      cwd: ROOT,
    });
    expect(output).toMatch(/fabric invariants hold \(mode: static/);
    expect(output).not.toContain("FAIL");
  });

  it("binds the proof to a digest of every infrastructure file", () => {
    // Read fresh: the verifier runs in the test above and rewrites the proof,
    // so the digest must be compared against what is on disk NOW.
    const current = JSON.parse(readFileSync(join(ROOT, PROOF_REF), "utf8")) as FabricProof;
    expect(current.artifact).toBe("cloud-fabric-foundation");
    expect(current.wave).toBe("CF-3");
    expect(current.owner).toBe("21");
    expect(current.capability).toBe("cloud-fabric-byoc");
    expect(current.mode).toBe("static");
    expect(current.infrastructureFiles).toBe(infraFiles.length);
    expect(current.inventoryDigest).toBe(recomputedDigest);
  });

  it("passes every recorded invariant across all nine law categories", () => {
    expect(proof.ok).toBe(true);
    expect(proof.checks.length).toBeGreaterThanOrEqual(55);
    for (const entry of proof.checks) {
      expect(entry.ok, `${entry.id}: ${entry.detail}`).toBe(true);
    }
    const categories = new Set(proof.checks.map((entry) => entry.category));
    expect([...categories].sort()).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
  });

  it("declares the provider, module and namespace surface", () => {
    expect(proof.providers).toEqual(["oci", "hetzner", "vultr", "cloudflare", "supabase"]);
    expect(proof.modules).toHaveLength(6);
    expect([...proof.namespaces].sort()).toEqual([...NAMESPACES].sort());
  });

  it("states its own limitations and what remains credential-gated", () => {
    expect(proof.limitations.join(" ")).toMatch(/static mode|deployed/i);
    expect(proof.nextWaves.join(" ")).toMatch(/CF-4/);
    expect(proof.nextWaves.join(" ")).toMatch(/credential|credentials/i);
  });
});

describe("CF-3 — fabric laws re-asserted independently of the script", () => {
  it("keeps every credential out of the repository", () => {
    const patterns = [
      /BEGIN [A-Z ]*PRIVATE KEY/,
      /\b(?:sk|pk|ghp|xox[baprs])-[A-Za-z0-9]{16,}\b/,
      /\beyJ[A-Za-z0-9_-]{20,}/,
      /(?:api_key|api_token|password)\s*=\s*"[^"$][^"]{7,}"/,
    ];
    const offenders: string[] = [];
    for (const ref of infraFiles) {
      const text = infraText(ref);
      for (const pattern of patterns) {
        if (pattern.test(text)) offenders.push(`${ref}: ${pattern}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("marks every secret-grade string variable sensitive", () => {
    const offenders: string[] = [];
    for (const ref of infraFiles.filter((file) => file.endsWith(".tf"))) {
      for (const block of infraText(ref)
        .split(/\nvariable\s+"/)
        .slice(1)) {
        const name = block.slice(0, block.indexOf('"'));
        if (!/type\s*=\s*string/.test(block)) continue;
        if (!/(token|secret|password|private_key|access_token|api_key|db_url)/i.test(name))
          continue;
        if (
          /public_key|_present$|zone_id|account_id|project_ref|namespace|tenancy_ocid/.test(name)
        ) {
          continue;
        }
        if (!/sensitive\s*=\s*true/.test(block)) offenders.push(`${ref}: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("uses remote state everywhere and ignores state locally", () => {
    const roots = ["oci", "hetzner", "vultr", "cloudflare", "supabase", "environments/production"];
    for (const root of roots) {
      expect(infraText(`infrastructure/terraform/${root}/main.tf`)).toMatch(
        /backend\s+"s3"\s*\{\}/,
      );
    }
    const ignore = infraText("infrastructure/.gitignore");
    for (const pattern of ["*.tfstate", ".terraform/", "*.tfvars", "!*.tfvars.example"]) {
      expect(ignore).toContain(pattern);
    }
  });

  it("pins versions and never ships a floating image tag", () => {
    for (const ref of infraFiles.filter((file) => /\.(tf|ya?ml)$/.test(file))) {
      expect(infraText(ref)).not.toMatch(/:latest\b/);
      expect(infraText(ref)).not.toMatch(/version\s*=\s*"latest"/);
    }
    const versions = infraText("infrastructure/terraform/versions.tf");
    for (const source of [
      "oracle/oci",
      "hetznercloud/hcloud",
      "vultr/vultr",
      "cloudflare/cloudflare",
    ]) {
      const index = versions.indexOf(`source  = "${source}"`);
      expect(index, `${source} must be pinned`).toBeGreaterThan(-1);
      expect(versions.slice(index, index + 120)).toContain('version = "~>');
    }
  });

  it("enforces the cluster baseline: namespaces, PSA, default-deny, quotas", () => {
    const namespaces = infraText("infrastructure/kubernetes/namespaces.yaml");
    const declared = [
      ...new Set([...namespaces.matchAll(/name:\s+(coregrid-[a-z]+)/g)].map((m) => m[1])),
    ];
    expect(declared.sort()).toEqual([...NAMESPACES].sort());
    expect(
      (namespaces.match(/pod-security\.kubernetes\.io\/enforce:\s*restricted/g) ?? []).length,
    ).toBe(NAMESPACES.length);

    const policies = infraText("infrastructure/kubernetes/network-policies.yaml");
    for (const namespace of NAMESPACES) {
      expect(
        new RegExp(
          `name:\\s*default-deny[\\s\\S]{0,200}namespace:\\s*${namespace}[\\s\\S]{0,200}policyTypes:\\s*\\[Ingress, Egress\\]`,
        ).test(policies),
        `${namespace} must be default-deny`,
      ).toBe(true);
    }

    const governance = infraText("infrastructure/kubernetes/resource-governance.yaml");
    for (const namespace of NAMESPACES) {
      expect(governance, `${namespace} needs quota/limits`).toContain(`namespace: ${namespace}`);
    }
  });
});

describe("CF-3 — containment, neutrality and ownership", () => {
  it("contains the sandbox: isolation, TTL, no credentials, lowest priority", () => {
    const sandbox = infraText("infrastructure/kubernetes/sandbox/sandbox-isolation.yaml");
    expect(sandbox).toContain("sandbox-default-deny");
    expect(sandbox).toContain("deny-from-sandbox-to-runtimes");
    expect(sandbox).toContain("activeDeadlineSeconds");
    expect(sandbox).toContain("priorityClassName: coregrid-sandbox");
    expect(sandbox).not.toMatch(/SUPABASE_(URL|SERVICE_ROLE_KEY|PUBLISHABLE_KEY)/);
  });

  it("keeps the fabric domain-neutral", () => {
    const forbidden = [
      "student",
      "teacher",
      "classroom",
      "curriculum",
      "examination",
      "timetable",
      "hostel",
      "lesson",
      "bursary",
      "parent portal",
    ];
    const offenders: string[] = [];
    for (const ref of infraFiles) {
      const haystack = infraText(ref).toLowerCase();
      for (const term of forbidden) {
        if (haystack.includes(term)) offenders.push(`${ref}: ${term}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("builds no duplicate engine — it only hosts what owners provide", () => {
    const allText = infraFiles
      .map((ref) => infraText(ref))
      .join("\n")
      .toLowerCase();
    for (const duplicate of ["keycloak", "auth0", "okta", "superset"]) {
      expect(allText).not.toContain(duplicate);
    }
    const blueprint = infraText("architecture/cloud-fabric-implementation-blueprint.md");
    for (const owner of [
      "universal-identity",
      "security-enforcement",
      "automation-workflow-runtime",
      "live-digital-twin",
    ]) {
      expect(blueprint, `blueprint must name the owner of ${owner}`).toContain(owner);
    }
  });

  it("keeps every cloud-touching wave credential-gated", () => {
    const plan = infraText("architecture/cloud-fabric-migration-plan.md");
    for (let wave = 4; wave <= 12; wave += 1) {
      expect(plan, `CF-${wave} must be recorded`).toContain(`CF-${wave}`);
    }
    expect((plan.match(/⛔ BLOCKED/g) ?? []).length).toBeGreaterThanOrEqual(9);

    const credentials = infraText("infrastructure/CREDENTIALS.md");
    for (const secret of [
      "TF_VAR_oci_private_key",
      "TF_VAR_hetzner_token",
      "TF_VAR_vultr_api_key",
      "TF_VAR_cloudflare_api_token",
      "TF_VAR_supabase_access_token",
    ]) {
      expect(credentials, `${secret} must be listed`).toContain(secret);
    }
    expect(credentials).toMatch(/[Nn]ever paste/);
  });

  it("registers the fabric on the phase-21 contract and registry surface", () => {
    const contract = infraText("frontend/src/lib/kernel/phase-contracts/phase-21-cloud-fabric.ts");
    expect(contract).toContain("cloud-fabric-iac");
    expect(contract).toContain("tests/unit/infrastructure-fabric.test.ts");

    const registry = JSON.parse(infraText("architecture/registry.json")) as {
      phases: Array<{ id: string; modules: string[] }>;
    };
    const phase21 = registry.phases.find((entry) => entry.id === "21");
    expect(phase21?.modules).toContain("cloud-fabric-iac");
    expect(existsSync(join(ROOT, "infrastructure/terraform/versions.tf"))).toBe(true);
  });

  it("exposes the fabric verifier as a first-class npm contract", () => {
    const pkg = JSON.parse(infraText("package.json")) as { scripts: Record<string, string> };
    expect(pkg.scripts["verify:infrastructure"]).toBe("node scripts/verify-infrastructure.mjs");
  });
});
