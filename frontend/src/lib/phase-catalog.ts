/**
 * CoreGrid Phase Catalog — the canonical 51-phase architecture map used by
 * the Command Centre's dynamic workspace.
 *
 * Mirrors `REGISTRY.md` (authoritative phase sequence) and `PROGRESS.md`
 * (status truth). Each entry lists domain-module file prefixes for the phase
 * and, where measured, the phase's unit-test count (sourced from PROGRESS.md
 * rows). Phases 33–51 carry status "architecture" (documents complete;
 * implementation pending) and therefore no measured test count yet. Display
 * layers are groupings only; registry ownership is authoritative.
 */

export type PhaseStatus = "active" | "architecture";

export interface PhaseCatalogEntry {
  phase: string;
  name: string;
  layer: string;
  modules: string[];
  testCount?: number;
  status?: PhaseStatus;
}

export const PHASE_CATALOG: readonly PhaseCatalogEntry[] = [
  { phase: "01", name: "Foundation", layer: "Foundations", modules: ["scripts", "infrastructure", "verification"] },
  { phase: "02", name: "Identity", layer: "Foundations", modules: ["tenant-core", "identity"] },
  { phase: "03", name: "Multi-Tenancy", layer: "Foundations", modules: ["tenant-core", "multi-tenancy", "rls-policy"] },
  { phase: "04", name: "Education Reality Engine", layer: "Foundations", modules: ["education-core", "education-curriculum", "education-assessment", "education-governance"] },
  { phase: "05", name: "Core Application Runtime", layer: "Foundations", modules: ["runtime-core", "runtime-jobs", "runtime-resilience", "runtime-observability", "runtime-feature-flags"] },
  { phase: "06", name: "Workspace Engine", layer: "Foundations", modules: ["workspace-core", "workspace-membership", "workspace-composition", "workspace-governance"] },
  { phase: "07", name: "AI Agent System", layer: "Intelligence", modules: ["agent-core", "agent-memory", "agent-tasks", "agent-plans"] },
  { phase: "08", name: "Security Engine", layer: "Foundations", modules: ["security-core", "security-policy", "security-risk", "security-session", "security-agent-controls"] },
  { phase: "09", name: "Security Trust Fabric", layer: "Foundations", modules: ["trust-entities", "trust-verification"] },
  { phase: "10", name: "Communication Platform", layer: "Runtime", modules: ["communication-conversation", "communication-channels"] },
  { phase: "11", name: "Academic Intelligence", layer: "Intelligence", modules: ["academic-core", "academic-mastery", "academic-pathways", "academic-risk"] },
  { phase: "12", name: "Scheduling Intelligence", layer: "Runtime", modules: ["scheduling-core", "scheduling-availability"] },
  { phase: "13", name: "Financial System", layer: "Commerce", modules: ["financial-core", "financial-payments", "financial-controls", "subscription-tiers"] },
  { phase: "14", name: "Data Platform", layer: "Foundations", modules: ["data-quality", "data-governance"] },
  { phase: "15", name: "Hardware Integration", layer: "Runtime", modules: ["hardware-devices", "hardware-fleet"] },
  { phase: "16", name: "Digital Twin", layer: "Intelligence", modules: ["digital-twin-core", "digital-twin-events"] },
  { phase: "17", name: "Automation Engine", layer: "Runtime", modules: ["automation-core", "automation-workflows"] },
  { phase: "18", name: "Analytics Intelligence", layer: "Intelligence", modules: ["analytics-core", "analytics-decisions", "analytics-governance"] },
  { phase: "19", name: "Command Centre", layer: "Runtime", modules: ["command-core", "command-alerts", "command-governance"] },
  { phase: "20", name: "Government Education Cloud", layer: "Global", modules: ["government-core", "government-policy", "government-data", "government-governance"], testCount: 59 },
  { phase: "21", name: "Global Cloud Fabric", layer: "Global", modules: ["cloud-core", "cloud-byoc", "cloud-governance"], testCount: 46 },
  { phase: "22", name: "Mobile Platform", layer: "Runtime", modules: ["platform-core", "platform-device", "platform-offline", "platform-observability"], testCount: 49 },
  { phase: "23", name: "Web Platform", layer: "Runtime", modules: ["web-core", "web-storage", "web-performance", "web-platform"], testCount: 41 },
  { phase: "24", name: "Experience & Design Intelligence", layer: "Intelligence", modules: ["experience-core", "experience-personalization", "experience-accessibility", "experience-governance"], testCount: 33 },
  { phase: "25", name: "Institutional Onboarding & Workforce", layer: "Runtime", modules: ["institution-core", "workforce-core", "onboarding-core", "attendance-identity", "institution-admin"], testCount: 53 },
  { phase: "26", name: "AI Intelligence Layer", layer: "Intelligence", modules: ["ai-core", "ai-context", "ai-reasoning", "ai-governance", "ai-services"], testCount: 66 },
  { phase: "27", name: "Marketplace", layer: "Commerce", modules: ["marketplace-core", "marketplace-vendor", "marketplace-package", "marketplace-entitlement", "marketplace-governance"], testCount: 52 },
  { phase: "28", name: "Developer Platform", layer: "Commerce", modules: ["dev-core", "dev-api", "dev-env", "dev-build", "dev-governance"], testCount: 47 },
  { phase: "29", name: "CoreGrid Integration", layer: "Runtime", modules: ["integration-core", "integration-transform", "integration-connect", "integration-ops", "integration-governance"], testCount: 52 },
  { phase: "30", name: "Globalization", layer: "Global", modules: ["globalization-core", "localization-content", "regional-context", "global-formats", "global-governance"], testCount: 93 },
  { phase: "31", name: "Enterprise Scale", layer: "Global", modules: ["enterprise-core", "enterprise-capacity", "enterprise-reliability", "enterprise-operations", "enterprise-governance"], testCount: 58 },
  { phase: "32", name: "Future Evolution", layer: "Global", modules: ["evolution-core", "evolution-experiments", "evolution-migration", "evolution-intelligence", "evolution-governance"], testCount: 49 },
  { phase: "33", name: "Reality Intelligence Kernel", layer: "Universal", status: "architecture", modules: ["reality-core", "reality-observations", "reality-provenance", "reality-grounding", "reality-governance"] },
  { phase: "34", name: "Universal Cognitive Intelligence Engine", layer: "Universal", status: "architecture", modules: ["cognition-core", "cognition-pipeline", "cognition-models", "cognition-trace", "cognition-governance"] },
  { phase: "35", name: "Autonomous Agent Civilization OS", layer: "Universal", status: "architecture", modules: ["civilization-core", "civilization-messaging", "civilization-markets", "civilization-reputation", "civilization-governance"] },
  { phase: "36", name: "Universal Memory & Knowledge Civilization Engine", layer: "Universal", status: "architecture", modules: ["memory-core", "memory-knowledge-graph", "memory-retention", "memory-synthesis", "memory-governance"] },
  { phase: "37", name: "Simulation & Future Intelligence Engine", layer: "Universal", status: "architecture", modules: ["simulation-core", "simulation-scenarios", "simulation-models", "simulation-sandbox", "simulation-governance"] },
  { phase: "38", name: "Evolution Engine", layer: "Universal", status: "architecture", modules: ["evolution-engine-core", "evolution-rollout", "evolution-migration", "evolution-deprecation", "evolution-governance"] },
  { phase: "39", name: "Governance & Alignment Engine", layer: "Universal", status: "architecture", modules: ["governance-core", "governance-alignment", "governance-audit", "governance-escalation", "governance-constitution"] },
  { phase: "40", name: "Universal Runtime Fabric", layer: "Universal", status: "architecture", modules: ["fabric-core", "fabric-events", "fabric-capability", "fabric-compute", "fabric-observability"] },
  { phase: "41", name: "Reality Simulation & Autonomous Sandbox Civilization Engine", layer: "Civilization", status: "architecture", modules: ["sandbox-core", "sandbox-worlds", "sandbox-civilizations", "sandbox-epochs", "sandbox-governance"] },
  { phase: "42", name: "Zero Trust Security & Adversarial Defense Civilization Engine", layer: "Civilization", status: "architecture", modules: ["defense-core", "defense-campaigns", "defense-threat-intel", "defense-response", "defense-governance"] },
  { phase: "43", name: "Universal Interface & Connectivity Intelligence", layer: "Civilization", status: "architecture", modules: ["interface-core", "interface-protocols", "interface-multimodal", "interface-connectivity", "interface-governance"] },
  { phase: "44", name: "Planetary Distributed Infrastructure Engine", layer: "Civilization", status: "architecture", modules: ["planetary-core", "planetary-regions", "planetary-mesh", "planetary-sync", "planetary-governance"] },
  { phase: "45", name: "AI Compute Civilization Engine", layer: "Civilization", status: "architecture", modules: ["aicompute-core", "aicompute-serving", "aicompute-optimization", "aicompute-markets", "aicompute-governance"] },
  { phase: "46", name: "Universal Digital Twin Civilization Layer", layer: "Civilization", status: "architecture", modules: ["twinciv-core", "twinciv-registry", "twinciv-contracts", "twinciv-federation", "twinciv-governance"] },
  { phase: "47", name: "Autonomous Engineering Self-Improvement Engine", layer: "Civilization", status: "architecture", modules: ["selfeng-core", "selfeng-pipelines", "selfeng-healing", "selfeng-gates", "selfeng-governance"] },
  { phase: "48", name: "Civilization Knowledge Graph", layer: "Civilization", status: "architecture", modules: ["knowgraph-core", "knowgraph-entities", "knowgraph-inference", "knowgraph-federation", "knowgraph-governance"] },
  { phase: "49", name: "Autonomous Economy Engine", layer: "Civilization", status: "architecture", modules: ["autoecon-core", "autoecon-markets", "autoecon-contracts", "autoecon-settlement", "autoecon-governance"] },
  { phase: "50", name: "Human Civilization Interface Layer", layer: "Civilization", status: "architecture", modules: ["humaniface-core", "humaniface-consent", "humaniface-transparency", "humaniface-override", "humaniface-governance"] },
  { phase: "51", name: "Universal Reality Operating System Kernel", layer: "Civilization", status: "architecture", modules: ["realityos-core", "realityos-kernel", "realityos-composition", "realityos-isolation", "realityos-governance"] },
] as const;

export const PHASE_LAYERS: readonly string[] = [
  "Foundations", "Intelligence", "Runtime", "Commerce", "Global", "Universal", "Civilization",
] as const;

export const PHASES_TOTAL = PHASE_CATALOG.length;
