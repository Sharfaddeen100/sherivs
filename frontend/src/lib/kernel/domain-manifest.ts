/**
 * Sherivs — Phase 33 Universal Reality Kernel: domain-runtime manifest schema.
 *
 * A domain runtime is installed on Sherivs through a manifest — a declaration
 * of the runtime's ontology (entity + relationship types it extends over the
 * universal substrate), the canonical capabilities it consumes, the policies
 * it requires, and the interfaces it exposes. The kernel accepts any manifest
 * that satisfies this schema; it never embeds any domain's ontology.
 *
 * This makes runtime installation a data operation over a stable contract
 * (Constitution §20): installing, suspending or retiring a runtime never
 * requires rewriting the kernel.
 *
 * Boundary: this module validates manifest structure only. It performs no
 * persistence and owns no state. A substrate table for registered runtimes is
 * authored separately (NOT_VALIDATED); this contract pre-positions the types
 * and rules that registry consumers (P04/P40) will rely on.
 */

/* ─────────────────────────────────────────────────────────────
 * Status lifecycle
 * ────────────────────────────────────────────────────────────*/

export type RuntimeManifestStatus =
  "proposed" | "review" | "approved" | "active" | "suspended" | "retired";

export const RUNTIME_MANIFEST_STATUSES: readonly RuntimeManifestStatus[] = [
  "proposed",
  "review",
  "approved",
  "active",
  "suspended",
  "retired",
] as const;

export type RuntimeInterfaceKind = "api" | "event" | "ui";

export const RUNTIME_INTERFACE_KINDS: readonly RuntimeInterfaceKind[] = [
  "api",
  "event",
  "ui",
] as const;

export function isRuntimeManifestStatus(value: unknown): value is RuntimeManifestStatus {
  return (RUNTIME_MANIFEST_STATUSES as readonly unknown[]).includes(value);
}

export function isRuntimeInterfaceKind(value: unknown): value is RuntimeInterfaceKind {
  return (RUNTIME_INTERFACE_KINDS as readonly unknown[]).includes(value);
}

/* ─────────────────────────────────────────────────────────────
 * Manifest model
 * ────────────────────────────────────────────────────────────*/

export interface ManifestEntityType {
  /** Singular ontology name, e.g. "actor". */
  name: string;
  description?: string;
}

export interface ManifestRelationshipType {
  name: string;
  /** Must reference declared entity-type names (universal kinds allowed). */
  sourceTypes: string[];
  targetTypes: string[];
  description?: string;
}

export interface ManifestInterface {
  name: string;
  kind: RuntimeInterfaceKind;
  description?: string;
}

export interface RuntimeManifest {
  /** Canonical runtime id, e.g. "runtime:education". */
  id: string;
  name: string;
  version: string;
  status: RuntimeManifestStatus;
  ontology: {
    entityTypes: ManifestEntityType[];
    relationshipTypes: ManifestRelationshipType[];
  };
  /** Canonical capability ids the runtime consumes (owners stay in the kernel). */
  capabilities: string[];
  /** Policy-set references the runtime operates under. */
  policies: string[];
  interfaces?: ManifestInterface[];
}

/* ─────────────────────────────────────────────────────────────
 * Validation
 * ────────────────────────────────────────────────────────────*/

export type ManifestValidation = { ok: true } | { ok: false; issues: string[] };

const MANIFEST_ID_RE = /^[a-z][a-z0-9]*:[a-z0-9-]+$/;
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const TYPE_NAME_RE = /^[a-z][a-z0-9_]{0,63}$/;

export function isValidManifestId(id: string): boolean {
  return MANIFEST_ID_RE.test(id);
}

export function isValidManifestVersion(version: string): boolean {
  return SEMVER_RE.test(version);
}

export function isValidTypeName(name: string): boolean {
  return TYPE_NAME_RE.test(name);
}

/** Universal pseudo-types any manifest may reference without declaring them. */
const UNIVERSAL_TYPES: readonly string[] = ["actor", "entity", "relationship", "event"] as const;

/**
 * Validate a runtime manifest structurally.
 *
 * Rules:
 *  1. id must match `namespace:slug`; version must be semver.
 *  2. status and interface kinds must be registered.
 *  3. entity-type names must be unique and match the type-name pattern.
 *  4. relationship types must be unique; their source/target sets must
 *     reference declared entity types or the universal pseudo-types.
 *  5. relationship source/target sets must be non-empty.
 *  6. a manifest must declare at least one capability (consumption contract).
 */
export function validateManifest(manifest: RuntimeManifest): ManifestValidation {
  const issues: string[] = [];

  if (!isValidManifestId(manifest.id)) {
    issues.push(`id must match namespace:slug (got "${manifest.id}")`);
  }
  if (!manifest.name || manifest.name.trim().length > 80) {
    issues.push("name is required and must be at most 80 characters");
  }
  if (!isValidManifestVersion(manifest.version)) {
    issues.push(`version must be semantic (major.minor.patch), got "${manifest.version}"`);
  }
  if (!isRuntimeManifestStatus(manifest.status)) {
    issues.push(`status is not a registered runtime-manifest status (got "${manifest.status}")`);
  }
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
    issues.push("a runtime manifest must declare at least one consumed capability");
  }

  const entityTypes = manifest.ontology?.entityTypes ?? [];
  const relationshipTypes = manifest.ontology?.relationshipTypes ?? [];

  const seenEntityNames = new Set<string>();
  for (const type of entityTypes) {
    if (!isValidTypeName(type.name)) {
      issues.push(`entity type name "${type.name}" must match ^[a-z][a-z0-9_]{0,63}$`);
    } else if (seenEntityNames.has(type.name)) {
      issues.push(`duplicate entity type "${type.name}"`);
    }
    seenEntityNames.add(type.name);
  }

  const knownTypes = new Set<string>([...seenEntityNames, ...UNIVERSAL_TYPES]);
  const seenRelationshipNames = new Set<string>();
  for (const rel of relationshipTypes) {
    if (!isValidTypeName(rel.name)) {
      issues.push(`relationship type name "${rel.name}" must match ^[a-z][a-z0-9_]{0,63}$`);
    } else if (seenRelationshipNames.has(rel.name)) {
      issues.push(`duplicate relationship type "${rel.name}"`);
    }
    seenRelationshipNames.add(rel.name);

    if (!rel.sourceTypes?.length || !rel.targetTypes?.length) {
      issues.push(`relationship "${rel.name}" must declare non-empty source and target sets`);
    }
    for (const source of rel.sourceTypes ?? []) {
      if (!knownTypes.has(source))
        issues.push(`relationship "${rel.name}" references undeclared source type "${source}"`);
    }
    for (const target of rel.targetTypes ?? []) {
      if (!knownTypes.has(target))
        issues.push(`relationship "${rel.name}" references undeclared target type "${target}"`);
    }
  }

  for (const iface of manifest.interfaces ?? []) {
    if (!isRuntimeInterfaceKind(iface.kind)) {
      issues.push(`interface "${iface.name}" has an unregistered kind "${iface.kind}"`);
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
