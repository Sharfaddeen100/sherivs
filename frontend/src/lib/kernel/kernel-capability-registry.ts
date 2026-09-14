/**
 * CoreGrid — KERNEL capability registry (domain-neutral, Phase 33 substrate).
 *
 * Typed consumption of the platform capability graph (architecture/registry.json).
 * The kernel owns WHAT the platform can do; a domain runtime declares which kernel
 * capabilities it consumes — it never redefines the graph, and the kernel never
 * carries a domain-named helper or a hardcoded set of one domain's phases
 * (Constitution §111 runtime-neutrality law).
 */

export interface KernelCapability {
  id: string;
  label: string;
  ownerPhase: string;
  consumers: readonly string[];
}

function labelFor(id: string): string {
  return id
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export const KERNEL_CAPABILITIES: readonly KernelCapability[] = [
  {
    id: "foundation-standards-config-secrets-ci",
    label: "foundation-standards-config-secrets-ci",
    ownerPhase: "01",
    consumers: ["all"],
  },
  {
    id: "universal-identity",
    label: "universal-identity",
    ownerPhase: "02",
    consumers: ["03", "05", "06", "08", "22", "25", "50"],
  },
  {
    id: "tenancy-isolation-rls",
    label: "tenancy-isolation-rls",
    ownerPhase: "03",
    consumers: ["all"],
  },
  {
    id: "education-reality-ontology",
    label: "education-reality-ontology",
    ownerPhase: "04",
    consumers: ["11", "12", "13", "25"],
  },
  {
    id: "universal-reality-ontology",
    label: "universal-reality-ontology",
    ownerPhase: "33",
    consumers: ["34", "36", "48", "51"],
  },
  { id: "runtime-primitives", label: "runtime-primitives", ownerPhase: "05", consumers: ["all"] },
  {
    id: "workspace-composition",
    label: "workspace-composition",
    ownerPhase: "06",
    consumers: ["19", "24", "50"],
  },
  {
    id: "agent-runtime",
    label: "agent-runtime",
    ownerPhase: "07",
    consumers: ["26", "35", "47", "50"],
  },
  {
    id: "security-enforcement",
    label: "security-enforcement",
    ownerPhase: "08",
    consumers: ["all"],
  },
  { id: "trust-fabric", label: "trust-fabric", ownerPhase: "09", consumers: ["08", "42"] },
  {
    id: "communication-messaging",
    label: "communication-messaging",
    ownerPhase: "10",
    consumers: ["24", "43"],
  },
  {
    id: "academic-intelligence",
    label: "academic-intelligence",
    ownerPhase: "11",
    consumers: ["12", "18"],
  },
  { id: "scheduling", label: "scheduling", ownerPhase: "12", consumers: ["04", "25"] },
  { id: "financial-ledger", label: "financial-ledger", ownerPhase: "13", consumers: ["27", "49"] },
  { id: "data-platform", label: "data-platform", ownerPhase: "14", consumers: ["all"] },
  {
    id: "hardware-device-telemetry",
    label: "hardware-device-telemetry",
    ownerPhase: "15",
    consumers: ["16", "44"],
  },
  {
    id: "live-digital-twin",
    label: "live-digital-twin",
    ownerPhase: "16",
    consumers: ["17", "18", "46"],
  },
  {
    id: "automation-workflow-runtime",
    label: "automation-workflow-runtime",
    ownerPhase: "17",
    consumers: ["all"],
  },
  {
    id: "analytics-decision-intelligence",
    label: "analytics-decision-intelligence",
    ownerPhase: "18",
    consumers: ["19", "34"],
  },
  {
    id: "command-centre-surface",
    label: "command-centre-surface",
    ownerPhase: "19",
    consumers: ["control-plane"],
  },
  {
    id: "government-sovereign-deployments",
    label: "government-sovereign-deployments",
    ownerPhase: "20",
    consumers: ["44"],
  },
  { id: "cloud-fabric-byoc", label: "cloud-fabric-byoc", ownerPhase: "21", consumers: ["44"] },
  {
    id: "mobile-client-platform",
    label: "mobile-client-platform",
    ownerPhase: "22",
    consumers: ["runtime-001"],
  },
  {
    id: "web-client-platform",
    label: "web-client-platform",
    ownerPhase: "23",
    consumers: ["runtime-001"],
  },
  { id: "experience-design", label: "experience-design", ownerPhase: "24", consumers: ["50"] },
  {
    id: "onboarding-workforce-identity",
    label: "onboarding-workforce-identity",
    ownerPhase: "25",
    consumers: ["runtime-001"],
  },
  {
    id: "ai-intelligence-gateway",
    label: "ai-intelligence-gateway",
    ownerPhase: "26",
    consumers: ["07", "34", "35"],
  },
  { id: "marketplace", label: "marketplace", ownerPhase: "27", consumers: ["49", "51"] },
  {
    id: "developer-platform",
    label: "developer-platform",
    ownerPhase: "28",
    consumers: ["27", "51"],
  },
  {
    id: "integration-adapters",
    label: "integration-adapters",
    ownerPhase: "29",
    consumers: ["43"],
  },
  { id: "globalization", label: "globalization", ownerPhase: "30", consumers: ["04", "50"] },
  { id: "enterprise-scale", label: "enterprise-scale", ownerPhase: "31", consumers: ["40"] },
  { id: "evolution-lifecycle", label: "evolution-lifecycle", ownerPhase: "32", consumers: ["47"] },
  {
    id: "cognitive-architecture",
    label: "cognitive-architecture",
    ownerPhase: "34",
    consumers: ["26", "35"],
  },
  {
    id: "multi-agent-society-governance",
    label: "multi-agent-society-governance",
    ownerPhase: "35",
    consumers: ["07"],
  },
  {
    id: "memory-knowledge-civilization",
    label: "memory-knowledge-civilization",
    ownerPhase: "36",
    consumers: ["34", "35", "07"],
  },
  { id: "simulation-engine", label: "simulation-engine", ownerPhase: "37", consumers: ["41"] },
  {
    id: "governance-alignment",
    label: "governance-alignment",
    ownerPhase: "39",
    consumers: ["51"],
  },
  {
    id: "universal-runtime-fabric",
    label: "universal-runtime-fabric",
    ownerPhase: "40",
    consumers: ["51"],
  },
  { id: "sandbox-runtime", label: "sandbox-runtime", ownerPhase: "41", consumers: ["37", "47"] },
  {
    id: "zero-trust-adversarial-defense",
    label: "zero-trust-adversarial-defense",
    ownerPhase: "42",
    consumers: ["08"],
  },
  {
    id: "universal-interface-connectivity",
    label: "universal-interface-connectivity",
    ownerPhase: "43",
    consumers: ["50", "51"],
  },
  {
    id: "planetary-infrastructure",
    label: "planetary-infrastructure",
    ownerPhase: "44",
    consumers: ["15", "21"],
  },
  { id: "ai-compute", label: "ai-compute", ownerPhase: "45", consumers: ["26"] },
  {
    id: "twin-civilization-federation",
    label: "twin-civilization-federation",
    ownerPhase: "46",
    consumers: ["16"],
  },
  {
    id: "autonomous-engineering-self-improvement",
    label: "autonomous-engineering-self-improvement",
    ownerPhase: "47",
    consumers: ["32", "38", "39"],
  },
  {
    id: "civilization-knowledge-graph",
    label: "civilization-knowledge-graph",
    ownerPhase: "48",
    consumers: ["33", "36"],
  },
  {
    id: "autonomous-economy",
    label: "autonomous-economy",
    ownerPhase: "49",
    consumers: ["13", "27"],
  },
  {
    id: "human-civilization-interface",
    label: "human-civilization-interface",
    ownerPhase: "50",
    consumers: ["06", "24"],
  },
  {
    id: "reality-os-kernel-composition",
    label: "reality-os-kernel-composition",
    ownerPhase: "51",
    consumers: ["all"],
  },
];

export function kernelCapabilityById(id: string): KernelCapability | undefined {
  return KERNEL_CAPABILITIES.find((capability) => capability.id === id);
}

export function kernelCapabilitiesForPhase(phaseId: string): KernelCapability[] {
  return KERNEL_CAPABILITIES.filter((capability) => capability.ownerPhase === phaseId);
}

/**
 * Capabilities whose registered consumer list names `consumerRef` — for example
 * a runtime registry id such as "runtime-001".
 *
 * NEUTRALITY LAW (Constitution §111; Phase 01 foundation §93 boundary rules):
 * the kernel answers this query generically and knows no runtime by name. Which
 * capabilities a *particular* runtime consumes is declared by that runtime, in
 * its own layer (`frontend/src/lib/runtime/*`). This keeps the Runtime
 * Independence Test true: removing or replacing an installed runtime removes a
 * declaration file, never kernel behaviour.
 */
export function kernelCapabilitiesByConsumer(consumerRef: string): KernelCapability[] {
  return KERNEL_CAPABILITIES.filter((capability) => capability.consumers.includes(consumerRef));
}
