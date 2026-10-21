/**
 * Sherivs — kernel substrate admin-client surface.
 *
 * The generated `Database` type does not yet include the cg_* substrate
 * tables (migration 20260903000000_coregrid_universal_kernel_substrate.sql
 * authored 2026-09-03, NOT applied/regenerated). Kernel-table server functions
 * therefore use a structural service-role client until the DB-backed
 * validation pass regenerates the types. This module is application-layer
 * tooling (never imported by kernel/ contracts).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type KernelAdminClient = any;

export function asKernelAdmin(admin: unknown): KernelAdminClient {
  return admin as KernelAdminClient;
}
