/**
 * Phase 23 — Web Platform contract (seeded authoring).
 *
 * The web client capability: storage discipline, performance budgets, routing
 * and platform behaviour for the browser delivery of any runtime.
 */

import { definePhaseContractFromSeed } from "./define-phase";

export const PHASE_23_WEB_PLATFORM = definePhaseContractFromSeed({
  id: "23",
  name: "Web Platform",
  phaseDoc: "architecture/phase-23-web-platform.md",
  layer: "Runtime",
  stage: "S6",
  status: "implementing",
  owner: "23",
  capability: "web-client-platform",
  consumes: [
    "foundation-standards-config-secrets-ci",
    "tenancy-isolation-rls",
    "workspace-composition",
    "mobile-client-platform",
  ],
  purpose:
    "Own browser delivery: client storage rules, performance budgets, routing and rendering behaviour so a runtime's surfaces load fast and never leak state across tenants.",
  ownership:
    "Single owner of web storage policy, performance budgets, routing conventions and platform-level client behaviour.",
  boundaryStatement:
    "The web platform owns delivery mechanics, never domain presentation rules, and browser storage is never a place where tenant data may persist beyond policy.",
  excludes: [
    "design-system-ownership (phase 24)",
    "domain-surfaces (consuming runtimes)",
    "mobile-native-behaviour (phase 22)",
  ],
  principle:
    "Fast by budget, safe by default: every route respects a stated performance budget and every storage write respects a stated retention rule.",
  dependsOn: ["01", "03", "05", "06", "22"],
  consumers: ["runtime:scholar"],
  substrates: ["web storage policy", "performance budget records", "route registry"],
  tests: ["tests/unit/web-core.test.ts", "tests/unit/web-platform.test.ts"],
  provides: [
    { id: "web:resolve-route", kind: "query", description: "resolve a route definition" },
    { id: "web:storage-policy", kind: "query", description: "read storage policy" },
    { id: "web:budget-status", kind: "query", description: "read performance budget state" },
  ],
  consumesContracts: [
    { id: "workspace:resolve-composition", kind: "query" },
    { id: "mobile:resolve-capabilities", kind: "query" },
  ],
  canonicalTruth: {
    owners: ["route registry", "storage policy", "performance budgets"],
    derived: ["bundle analyses", "performance trends"],
  },
  requiresApprovalFor: ["storage-policy-relaxation", "budget-threshold-change"],
  sections: {
    security:
      "No secrets or tenant payloads in browser storage; server enforcement remains the only authority, and client-side checks are treated as convenience only.",
  },
});
