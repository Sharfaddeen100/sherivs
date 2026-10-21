/**
 * Sherivs — Phase 03 universal tenant registry: typed contract for
 * `cg_tenant` (H1 Tenant Entity, L2 model 20260904020000).
 *
 * Mirrors the database truth (H2 status enum, slug CHECK, defaults). Boundary:
 * performs NO persistence and owns NO state — server functions record through
 * service-role adapters (deny-by-default RLS). Platform (P03) module; never
 * imported by kernel/ contracts.
 */

export const TENANT_STATUSES = [
  "PROVISIONING",
  "ACTIVE",
  "RESTRICTED",
  "SUSPENDED",
  "MIGRATING",
  "ARCHIVED",
  "TERMINATING",
  "TERMINATED",
] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

export const TENANT_ENVIRONMENTS = ["development", "staging", "production"] as const;
export type TenantEnvironment = (typeof TENANT_ENVIRONMENTS)[number];

const TENANT_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/;

export function isTenantStatus(value: unknown): value is TenantStatus {
  return (TENANT_STATUSES as readonly unknown[]).includes(value);
}

export function isTenantEnvironment(value: unknown): value is TenantEnvironment {
  return (TENANT_ENVIRONMENTS as readonly unknown[]).includes(value);
}

export interface TenantDraftInput {
  tenantType: string;
  name: string;
  slug: string;
  status?: TenantStatus;
  parentTenantId?: string | null;
  region?: string | null;
  environment?: TenantEnvironment;
}

export interface TenantRegistryRow {
  tenant_type: string;
  name: string;
  slug: string;
  status: TenantStatus;
  parent_tenant_id: string | null;
  region: string | null;
  environment: TenantEnvironment;
  created_at: string;
  updated_at: string;
}

/** Build an insert-ready cg_tenant row (mirrors CHECK clauses + defaults). */
export function tenantDraft(input: TenantDraftInput, now: string): TenantRegistryRow {
  const tenantType = input.tenantType?.trim() ?? "";
  if (tenantType.length < 1 || tenantType.length > 80) {
    throw new Error("tenant_type must be 1–80 characters");
  }
  const name = input.name?.trim() ?? "";
  if (name.length < 1 || name.length > 200) {
    throw new Error("name must be 1–200 characters");
  }
  const slug = input.slug?.trim() ?? "";
  if (!TENANT_SLUG_RE.test(slug)) {
    throw new Error(`slug must match ^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$ (got "${slug}")`);
  }
  const status = input.status ?? "PROVISIONING";
  if (!isTenantStatus(status)) {
    throw new Error(`status is not a registered tenant status (got "${status}")`);
  }
  const environment = input.environment ?? "development";
  if (!isTenantEnvironment(environment)) {
    throw new Error(`environment is not a registered tenant environment (got "${environment}")`);
  }
  return {
    tenant_type: tenantType,
    name,
    slug,
    status,
    parent_tenant_id: input.parentTenantId?.trim() ? input.parentTenantId.trim() : null,
    region: input.region?.trim() ? input.region.trim() : null,
    environment,
    created_at: now,
    updated_at: now,
  };
}
