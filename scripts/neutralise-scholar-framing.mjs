#!/usr/bin/env node
/**
 * Sherivs — kernel framing law: only a runtime layer may name a runtime.
 *
 * Sherivs is the platform. Scholar is runtime-001: an application built ON the
 * kernel, never the owner of it (owner decision, 2026-09-16). A kernel or
 * capability module that introduces itself as "Sherivs Scholar — …" claims a
 * scope it does not have, and that framing quietly teaches every later phase
 * that the platform *is* one application.
 *
 * The law, machine-enforced by `tests/unit/platform-neutrality.test.ts`:
 *   inside frontend/src and scripts/, the phrase "Sherivs Scholar" may appear
 *   only under the runtime layer —
 *     lib/scholar/**  ·  lib/scholar-*.ts  ·  lib/runtime/scholar*.ts
 *     routes/_authenticated/scholar/**  ·  a script verifying runtime-001's config
 *
 * This script is the remediation half of that law. It rewrites COMMENT lines
 * only: a comment cannot change behaviour, so the change is provably inert,
 * and the diff is one readable line per module. Non-comment occurrences (UI
 * copy, identifiers, strings) are never rewritten automatically — they are
 * reported so a human decides, because a string may be a real product name.
 *
 * Usage:
 *   node scripts/neutralise-scholar-framing.mjs            # rewrite comment lines
 *   node scripts/neutralise-scholar-framing.mjs --check    # report only, exit 1 on violation
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CHECK_ONLY = process.argv.includes("--check");

/** The runtime layer: the only place a runtime's own name belongs. */
const RUNTIME_LAYER = [
  /^frontend\/src\/lib\/scholar\//,
  /^frontend\/src\/lib\/scholar-[^/]+\.tsx?$/,
  /^frontend\/src\/lib\/runtime\/scholar[^/]*\.tsx?$/,
  /^frontend\/src\/routes\/_authenticated\/scholar\//,
  // A script that exists to verify runtime-001's own configuration.
  /^scripts\/[^/]*scholar[^/]*$/,
];

/** A comment line that self-identifies the file as a runtime's subsystem. */
const COMMENT_SELF_IDENTIFICATION = /^(\s*(?:\/\*\*?|(?:\s*\*)|(?:\/\/))\s*)CoreGrid Scholar\b/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const files = ["frontend/src", "scripts"]
  .flatMap((root) => walk(join(ROOT, root)))
  .filter((file) => {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    return !RUNTIME_LAYER.some((pattern) => pattern.test(rel));
  });

const rewritten = [];
const needsHuman = [];

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  let changed = 0;
  const next = lines.map((line) => {
    if (COMMENT_SELF_IDENTIFICATION.test(line)) {
      changed += 1;
      return line.replace("CoreGrid Scholar", "CoreGrid");
    }
    // Any other occurrence is a decision for a human: it may be a product name.
    if (line.includes("CoreGrid Scholar")) needsHuman.push(`${rel}: ${line.trim()}`);
    return line;
  });

  if (changed > 0) {
    rewritten.push(`${rel} (${changed} comment line${changed === 1 ? "" : "s"})`);
    if (!CHECK_ONLY) writeFileSync(file, next.join("\n"), "utf8");
  }
}

console.log(
  `${CHECK_ONLY ? "Checked" : "Rewrote"} ${files.length} kernel/capability file(s) — ${rewritten.length} claimed to be a runtime's subsystem:`,
);
for (const row of rewritten) console.log(`  ${CHECK_ONLY ? "VIOLATION" : "neutralised"}  ${row}`);

if (needsHuman.length > 0) {
  console.log(
    `\n${needsHuman.length} occurrence(s) outside comments — reported, never rewritten automatically:`,
  );
  for (const row of needsHuman) console.log(`  ${row}`);
}

process.exit(CHECK_ONLY && (rewritten.length > 0 || needsHuman.length > 0) ? 1 : 0);
