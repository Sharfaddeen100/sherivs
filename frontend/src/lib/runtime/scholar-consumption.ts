/**
 * CoreGrid Scholar (runtime R-001) — declared kernel-capability consumption.
 *
 * The kernel exposes the capability graph plus one generic query
 * (`kernelCapabilitiesByConsumer`). Consumption belongs to the runtime: this
 * module is the single place where Scholar declares the registry runtime id it
 * is registered under, the owner phases whose single capability it consumes as
 * a domain layer, and the runtime id the 51 phase contracts bind as
 * `runtimeBindings.firstRuntime`.
 *
 * Kernel-neutrality law (Constitution §111): moving, renaming or retiring
 * Scholar changes THIS file. The kernel keeps compiling and stays architecturally
 * valid without it, because no kernel module names a domain runtime.
 *
 * Boundary: declaration only. It owns no capability, grants no authority and
 * adds no authorization — ownership stays in architecture/registry.json and
 * enforcement stays with phase 08.
 */

import {
  KERNEL_CAPABILITIES,
  kernelCapabilitiesByConsumer,
  kernelCapabilitiesForPhase,
  type KernelCapability,
} from "@/lib/kernel/kernel-capability-registry";

/** Contract-chain runtime id (manifest-style, per kernel/domain-manifest.ts). */
export const SCHOLAR_RUNTIME_ID = "runtime:scholar";

/** Ledger row id for the same runtime in architecture/registry.json. */
export const SCHOLAR_REGISTRY_RUNTIME_ID = "runtime-001";

/**
 * Owner phases whose single owned capability this runtime consumes as its
 * domain layer. Declared here — never in the kernel, which has no domain phases.
 */
export const SCHOLAR_CONSUMED_OWNER_PHASES: readonly string[] = [
  "04",
  "10",
  "11",
  "12",
  "13",
  "15",
  "16",
  "17",
  "18",
  "20",
  "25",
] as const;

/** Kernel capabilities this runtime consumes, in kernel registry order. */
export function scholarConsumedKernelCapabilities(): KernelCapability[] {
  const consumed = new Set<string>();
  for (const capability of kernelCapabilitiesByConsumer(SCHOLAR_REGISTRY_RUNTIME_ID)) {
    consumed.add(capability.id);
  }
  for (const phase of SCHOLAR_CONSUMED_OWNER_PHASES) {
    for (const capability of kernelCapabilitiesForPhase(phase)) consumed.add(capability.id);
  }
  return KERNEL_CAPABILITIES.filter((capability) => consumed.has(capability.id));
}
