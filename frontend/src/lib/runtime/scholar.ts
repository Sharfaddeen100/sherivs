/**
 * Sherivs Scholar — African Education Runtime manifest (Phase 04 reframe).
 *
 * Scholar is NOT Sherivs. Scholar is the first domain runtime registered on
 * the Sherivs universal kernel through the generic domain-runtime manifest
 * contract (`kernel/domain-manifest.ts`). This manifest declares the education
 * ontology as extensions over the universal substrate; removing it leaves the
 * kernel fully valid (Scholar Independence, §111).
 *
 * Status: authored contract, NOT installed. A runtime-registry server function
 * will persist this manifest into `cg_domain_runtime` once the kernel
 * substrate migration is applied and validated.
 */

import { validateManifest, type RuntimeManifest } from "@/lib/kernel/domain-manifest";

export const SCHOLAR_RUNTIME_MANIFEST: RuntimeManifest = {
  id: "runtime:scholar",
  name: "Scholar — African Education Runtime",
  version: "0.1.0",
  status: "proposed",
  ontology: {
    entityTypes: [
      { name: "institution", description: "An educational institution operating as a tenant" },
      { name: "campus", description: "A physical or organizational subdivision of an institution" },
      { name: "learner", description: "A person enrolled in a learning programme" },
      { name: "guardian", description: "A person with a guardianship relationship to a learner" },
      { name: "educator", description: "A person who facilitates learning" },
      {
        name: "learning_group",
        description: "A cohort within which learning and assessment occur",
      },
      { name: "program", description: "A structured course of study" },
    ],
    relationshipTypes: [
      { name: "operates", sourceTypes: ["institution"], targetTypes: ["campus"] },
      { name: "offers", sourceTypes: ["institution"], targetTypes: ["program"] },
      { name: "enrolls", sourceTypes: ["learner"], targetTypes: ["learning_group"] },
      { name: "teaches", sourceTypes: ["educator"], targetTypes: ["learning_group"] },
      { name: "guardians", sourceTypes: ["guardian"], targetTypes: ["learner"] },
      { name: "composes", sourceTypes: ["program"], targetTypes: ["learning_group"] },
    ],
  },
  capabilities: [
    "capability:identity",
    "capability:multi-tenancy",
    "capability:security-engine",
    "capability:event-fabric",
    "capability:workspace-composition",
  ],
  policies: ["policy-set:education-default"],
  interfaces: [
    { name: "scholar-workspace", kind: "ui", description: "Role-projected education workspace" },
    { name: "scholar-api", kind: "api", description: "Education domain API" },
    { name: "scholar-events", kind: "event", description: "Education domain events" },
  ],
};

export function validateScholarManifest(): boolean {
  return validateManifest(SCHOLAR_RUNTIME_MANIFEST).ok;
}
