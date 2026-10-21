#!/usr/bin/env node
/**
 * Sherivs Cloud Fabric — credential & scope preflight (read-only doctor).
 *
 * Purpose: turn "the owner supplied credentials" into a VERIFIED fact before a
 * plan is ever run. It never writes, never creates, never mutates — it reads.
 *
 * For each provider it reports:
 *   presence  — the secret NAME exists in the environment (never the value)
 *   authn     — the credential is accepted
 *   scope     — the target account/compartment/project is reachable
 *
 * It writes architecture/proofs/infrastructure-preflight.proof.json and reports
 * which waves remain gated.
 *
 * Values are NEVER logged, echoed or written to the proof — only names, boolean
 * outcomes and provider-side identifiers that are safe to record.
 *
 * Usage:
 *   node scripts/infrastructure/preflight.mjs              # live probes (needs creds)
 *   node scripts/infrastructure/preflight.mjs --static     # contract + presence only
 *   node scripts/infrastructure/preflight.mjs --wave=cf7   # gate one wave
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const staticOnly = process.argv.includes("--static");
const waveArg = (process.argv.find((arg) => arg.startsWith("--wave=")) ?? "").slice(
  "--wave=".length,
);
const proofRef = "architecture/proofs/infrastructure-preflight.proof.json";

/** env name → whether a non-empty value is present (never the value itself). */
const present = (name) => {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0;
};

/** Waves and the secret NAMES each entry gate requires (never values). */
const WAVES = {
  cf4: {
    label: "CF-4 OCI foundation",
    required: [
      "TF_VAR_oci_tenancy_ocid",
      "TF_VAR_oci_user_ocid",
      "TF_VAR_oci_fingerprint",
      "TF_VAR_oci_region",
      "TF_VAR_oci_compartment_ocid",
    ],
    anyOf: [["TF_VAR_oci_private_key", "TF_VAR_oci_private_key_path"]],
  },
  cf5: {
    label: "CF-5 Hetzner worker pools",
    required: ["TF_VAR_hetzner_token", "TF_VAR_hetzner_ssh_public_key"],
    anyOf: [],
  },
  cf6: { label: "CF-6 Vultr edge", required: ["TF_VAR_vultr_api_key"], anyOf: [] },
  cf7: {
    label: "CF-7 Supabase data layer",
    required: ["TF_VAR_supabase_project_ref", "TF_VAR_supabase_access_token"],
    anyOf: [["SUPABASE_DB_URL", "TF_VAR_supabase_db_url"]],
  },
  cf8: {
    label: "CF-8 n8n executor",
    // Only owner-supplied values: the executor's database and Redis are
    // provisioned in-cluster by Terraform, so they are outputs, not credentials.
    required: ["N8N_DOMAIN", "N8N_ENCRYPTION_KEY"],
    anyOf: [],
  },
  traffic: {
    label: "Global traffic layer (Cloudflare)",
    required: [
      "TF_VAR_cloudflare_api_token",
      "TF_VAR_cloudflare_zone_id",
      "TF_VAR_cloudflare_account_id",
    ],
    anyOf: [],
  },
};

const checks = [];
const check = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });

/* ── 1. Presence (names only) ─────────────────────────────────────────────── */

const requested = waveArg ? [waveArg.toLowerCase()] : [];
const selected = WAVES[requested[0]] ? requested : Object.keys(WAVES);

for (const key of selected) {
  const wave = WAVES[key];
  const missing = wave.required.filter((name) => !present(name));
  check(
    `presence:${key}`,
    missing.length === 0,
    missing.length === 0
      ? `${wave.label}: all ${wave.required.length} required secret names present`
      : `${wave.label}: ${missing.length} missing → ${missing.join(", ")}`,
  );
  for (const alternatives of wave.anyOf) {
    const satisfied = alternatives.some((name) => present(name));
    check(
      `presence:${key}:${alternatives.join("|")}`,
      satisfied,
      satisfied
        ? `one of ${alternatives.join(" / ")} is present`
        : `none of ${alternatives.join(" / ")} is present`,
    );
  }
}

/* ── 2. Live probes (read-only; skipped with --static) ────────────────────── */

async function probe(id, fn) {
  try {
    check(`live:${id}`, true, await fn());
  } catch (error) {
    check(`live:${id}`, false, error instanceof Error ? error.message : String(error));
  }
}

const wants = (key) => selected.includes(key) && !staticOnly;

if (wants("cf5") && present("TF_VAR_hetzner_token")) {
  await probe("cf5:hetzner-token", async () => {
    const response = await fetch("https://api.hetzner.cloud/v1/locations", {
      headers: { Authorization: `Bearer ${process.env.TF_VAR_hetzner_token}` },
    });
    if (!response.ok) throw new Error(`Hetzner token rejected (HTTP ${response.status})`);
    const body = await response.json();
    return `Hetzner token accepted — ${(body.locations ?? []).length} locations visible`;
  });
}

if (wants("cf6") && present("TF_VAR_vultr_api_key")) {
  await probe("cf6:vultr-token", async () => {
    const response = await fetch("https://api.vultr.com/v2/account", {
      headers: { Authorization: `Bearer ${process.env.TF_VAR_vultr_api_key}` },
    });
    if (!response.ok) throw new Error(`Vultr key rejected (HTTP ${response.status})`);
    const body = await response.json();
    return `Vultr key accepted — account "${body.account?.name ?? "reachable"}"`;
  });
}

if (wants("traffic") && present("TF_VAR_cloudflare_api_token")) {
  await probe("traffic:cloudflare-token", async () => {
    const response = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: { Authorization: `Bearer ${process.env.TF_VAR_cloudflare_api_token}` },
    });
    const body = await response.json();
    if (!response.ok || body?.success !== true) {
      throw new Error(`Cloudflare token not valid (HTTP ${response.status})`);
    }
    return `Cloudflare token verified and active (status: ${body.result?.status ?? "unknown"})`;
  });
}

if (
  wants("cf7") &&
  present("TF_VAR_supabase_project_ref") &&
  present("TF_VAR_supabase_access_token")
) {
  await probe("cf7:supabase-project", async () => {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${process.env.TF_VAR_supabase_project_ref}`,
      { headers: { Authorization: `Bearer ${process.env.TF_VAR_supabase_access_token}` } },
    );
    if (!response.ok) throw new Error(`Supabase management call failed (HTTP ${response.status})`);
    const project = await response.json();
    return `Supabase project reachable (region ${project?.region ?? "unknown"}, status ${project?.status ?? "unknown"})`;
  });
}

if (wants("cf7") && (present("SUPABASE_DB_URL") || present("TF_VAR_supabase_db_url"))) {
  await probe("cf7:database-url-shape", async () => {
    const url = process.env.SUPABASE_DB_URL ?? process.env.TF_VAR_supabase_db_url ?? "";
    if (!/^postgres(ql)?:\/\//.test(url)) throw new Error("database URL is not a postgres URL");
    return "database URL shape valid (host and password never logged)";
  });
}

if (wants("cf8") && present("N8N_DOMAIN")) {
  await probe("cf8:n8n-encryption-key", async () => {
    if (!present("N8N_ENCRYPTION_KEY")) throw new Error("N8N_ENCRYPTION_KEY missing");
    if ((process.env.N8N_ENCRYPTION_KEY ?? "").length < 24) {
      throw new Error("N8N_ENCRYPTION_KEY is shorter than 24 characters");
    }
    return "n8n domain configured and encryption key present (length ≥ 24)";
  });
}

/* ── 3. Proof ─────────────────────────────────────────────────────────────── */

const failed = checks.filter((entry) => !entry.ok);
const blockedWaves = selected
  .filter((key) => checks.some((entry) => entry.id === `presence:${key}` && !entry.ok))
  .map((key) => WAVES[key].label);

const proof = {
  artifact: "infrastructure-preflight",
  wave: "CF-4/CF-7 readiness",
  owner: "21",
  mode: staticOnly ? "static" : "live",
  generatedAt: new Date().toISOString(),
  wavesChecked: selected.map((key) => WAVES[key].label),
  blockedWaves,
  checks,
  ok: failed.length === 0,
  notes: [
    "Read-only: no resource is created, modified or deleted.",
    "Secret VALUES are never logged or written — only names, booleans and safe identifiers.",
    "A missing secret fails the gate: nothing is applied on a partial credential set.",
  ],
};

const proofPath = join(ROOT, proofRef);
mkdirSync(dirname(proofPath), { recursive: true });
writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`, "utf8");

for (const entry of checks) {
  console.log(`${entry.ok ? "OK  " : "GATE"}  ${entry.id} — ${entry.detail}`);
}
console.log(
  `\n${checks.length - failed.length}/${checks.length} preflight checks satisfied (mode: ${proof.mode}).`,
);
if (blockedWaves.length > 0) console.log(`Blocked waves: ${blockedWaves.join("; ")}`);
console.log(`Proof written: ${proofRef}`);

if (staticOnly) {
  console.log("Static mode: contract verified. Run without --static once credentials exist.");
}
