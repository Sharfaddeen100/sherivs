/**
 * Load and verify the pinned 71-file restore source.
 *
 * Working tree may be the 69-file default branch. This module does not switch
 * branches. It loads bytes from the pinned Git commit when git is available,
 * or from an explicit migrationsDir that already matches the manifest.
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  PINNED_MIGRATION_COUNT,
  PINNED_MIGRATION_DIRECTORY,
  PINNED_SOURCE_COMMIT,
  PINNED_SOURCE_TREE,
  TRANSPORT_FIRST,
  TRANSPORT_SECOND,
} from "./constants.mjs";

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const MANIFEST_PATH = fileURLToPath(
  new URL("./approved-manifest.json", import.meta.url),
);

export function loadApprovedManifest(pathname = MANIFEST_PATH) {
  const manifest = JSON.parse(readFileSync(pathname, "utf8"));
  if (manifest.sourceCommit !== PINNED_SOURCE_COMMIT) {
    throw Object.assign(
      new Error("MANIFEST_COMMIT_MISMATCH: approved-manifest.json commit pin"),
      { code: "MANIFEST_COMMIT_MISMATCH" },
    );
  }
  if (manifest.sourceTree !== PINNED_SOURCE_TREE) {
    throw Object.assign(
      new Error("MANIFEST_TREE_MISMATCH: approved-manifest.json tree pin"),
      { code: "MANIFEST_TREE_MISMATCH" },
    );
  }
  if (manifest.count !== PINNED_MIGRATION_COUNT || manifest.files.length !== 71) {
    throw Object.assign(
      new Error("MANIFEST_COUNT_MISMATCH: expected 71 files"),
      { code: "MANIFEST_COUNT_MISMATCH" },
    );
  }
  return manifest;
}

function fail(code, detail) {
  const err = new Error(`${code}: ${detail}`);
  err.code = code;
  throw err;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function defaultGit(args, cwd = ROOT) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "buffer",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString("utf8") : "";
    fail("GIT_COMMAND_FAILED", `git ${args[0]} failed: ${stderr.slice(0, 200)}`);
  }
  return result.stdout;
}

export function inspectWorkingTree(root = ROOT) {
  const dir = join(root, PINNED_MIGRATION_DIRECTORY);
  if (!existsSync(dir)) {
    return { present: false, count: 0, files: [], missingFromPin: [], extra: [] };
  }
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql") && !f.endsWith(".sql.proposed"))
    .sort();
  const manifest = loadApprovedManifest();
  const pinnedNames = manifest.files.map((f) => f.filename);
  const missingFromPin = pinnedNames.filter((n) => !files.includes(n));
  const extra = files.filter((n) => !pinnedNames.includes(n));
  return {
    present: true,
    count: files.length,
    files,
    missingFromPin,
    extra,
    matchesPin:
      files.length === 71 &&
      missingFromPin.length === 0 &&
      extra.length === 0,
  };
}

export function verifyTransportPair(files) {
  const names = files.map((f) => f.filename);
  const first = names.indexOf(TRANSPORT_FIRST);
  const second = names.indexOf(TRANSPORT_SECOND);
  if (first < 0 || second < 0) {
    fail(
      "TRANSPORT_PAIR_MISSING",
      `${TRANSPORT_FIRST} and ${TRANSPORT_SECOND} must both be present`,
    );
  }
  if (!(first < second)) {
    fail(
      "TRANSPORT_PAIR_ORDER",
      `${TRANSPORT_FIRST} must precede ${TRANSPORT_SECOND}`,
    );
  }
  return { firstSeq: first + 1, secondSeq: second + 1 };
}

export function verifyLoadedFiles(loaded, manifest = loadApprovedManifest()) {
  const proposed = loaded.filter((f) => f.filename.endsWith(".sql.proposed"));
  if (proposed.length) {
    fail(
      "PROPOSED_SQL_EXCLUDED",
      `refused ${proposed.map((p) => p.filename).join(", ")}`,
    );
  }
  const names = loaded.map((f) => f.filename);
  const unique = new Set(names);
  if (unique.size !== names.length) {
    fail("DUPLICATE_MIGRATION", "duplicate filenames in loaded set");
  }
  if (loaded.length !== manifest.count) {
    fail(
      loaded.length < manifest.count ? "MISSING_MIGRATION" : "ADDITIONAL_MIGRATION",
      `loaded ${loaded.length} files, expected ${manifest.count}`,
    );
  }
  for (let i = 0; i < manifest.files.length; i += 1) {
    const expected = manifest.files[i];
    const actual = loaded[i];
    if (!actual) {
      fail("MISSING_MIGRATION", `missing ${expected.filename}`);
    }
    if (actual.filename !== expected.filename) {
      fail(
        "MIGRATION_REORDERED",
        `position ${expected.seq}: expected ${expected.filename}, got ${actual.filename}`,
      );
    }
    const digest = sha256(actual.bytes);
    if (digest !== expected.sha256) {
      fail(
        "CHECKSUM_MISMATCH",
        `${expected.filename} sha256 ${digest} != ${expected.sha256}`,
      );
    }
  }
  const extra = names.filter(
    (n) => !manifest.files.some((f) => f.filename === n),
  );
  if (extra.length) {
    fail("ADDITIONAL_MIGRATION", `unexpected ${extra.join(", ")}`);
  }
  verifyTransportPair(loaded);
  return {
    ok: true,
    count: loaded.length,
    manifestId: manifest.manifestId,
    sourceCommit: manifest.sourceCommit,
    sourceTree: manifest.sourceTree,
    loaded,
    files: loaded.map((f, i) => ({
      seq: manifest.files[i].seq,
      filename: f.filename,
      sha256: manifest.files[i].sha256,
    })),
  };
}

export function loadFromGitCommit(
  commit = PINNED_SOURCE_COMMIT,
  git = defaultGit,
  manifest = loadApprovedManifest(),
) {
  if (commit !== manifest.sourceCommit) {
    fail(
      "WRONG_SOURCE_COMMIT",
      `commit ${commit} is not the pinned source ${manifest.sourceCommit}`,
    );
  }
  const tree = git(["rev-parse", `${commit}:${PINNED_MIGRATION_DIRECTORY}`])
    .toString("utf8")
    .trim();
  if (tree !== manifest.sourceTree) {
    fail(
      "WRONG_GIT_TREE",
      `tree ${tree} is not the pinned tree ${manifest.sourceTree}`,
    );
  }
  const names = git(["ls-tree", "--name-only", `${commit}:${PINNED_MIGRATION_DIRECTORY}`])
    .toString("utf8")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const loaded = names.map((filename) => ({
    filename,
    bytes: git(["show", `${commit}:${PINNED_MIGRATION_DIRECTORY}/${filename}`]),
  }));
  return verifyLoadedFiles(loaded, manifest);
}

export function loadFromDirectory(dir, manifest = loadApprovedManifest()) {
  const names = readdirSync(dir)
    .filter((f) => f.endsWith(".sql") || f.endsWith(".sql.proposed"))
    .sort();
  const loaded = names.map((filename) => ({
    filename,
    bytes: readFileSync(join(dir, filename)),
  }));
  return verifyLoadedFiles(loaded, manifest);
}

/**
 * Prefer the pinned Git commit. Never silently use a 69-file working tree.
 */
export function resolvePinnedSource(options = {}) {
  const manifest = options.manifest ?? loadApprovedManifest();
  const working = inspectWorkingTree(options.root ?? ROOT);
  const report = {
    workingTreeMatchesPin: working.matchesPin,
    workingCount: working.count,
    workingMissing: working.missingFromPin,
    note: working.matchesPin
      ? "working tree matches pin"
      : `working tree has ${working.count} sql files; restore source is git ${manifest.sourceCommit} tree ${manifest.sourceTree}`,
  };
  if (options.migrationsDir) {
    const verified = loadFromDirectory(options.migrationsDir, manifest);
    return { ...verified, sourceKind: "directory", working: report };
  }
  if (options.git !== false) {
    const verified = loadFromGitCommit(
      options.commit ?? PINNED_SOURCE_COMMIT,
      options.gitFn ?? defaultGit,
      manifest,
    );
    return { ...verified, sourceKind: "git-commit", working: report };
  }
  fail(
    "SOURCE_UNAVAILABLE",
    "no git loader and no migrationsDir; refused to use unmatched working tree",
  );
}

export { PINNED_SOURCE_COMMIT, PINNED_SOURCE_TREE, MANIFEST_PATH, ROOT };
