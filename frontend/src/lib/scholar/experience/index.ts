/**
 * Sherivs Scholar — Dynamic Experience & Website Generation engine.
 *
 * Organizations do not buy modules; they declare their reality and Sherivs
 * generates their public presence, their internal application and the
 * workspaces each person receives. The engine consumes the Educational Reality
 * Role Engine for roles/workspaces and the institution vocabulary for reality.
 *
 * Boundaries: no UI, no routes, no persistence, no authorization. Every
 * generated experience must pass governance (tenant isolation, audience
 * exposure, human approval for AI-authored content).
 */

export * from "./experience-catalog";
export * from "./experience-brand";
export * from "./experience-engine";
export * from "./experience-personalization";
export * from "./experience-governance";

export const SCHOLAR_EXPERIENCE_ENGINE_ID = "scholar:experience-generation-engine";
export const SCHOLAR_EXPERIENCE_ENGINE_VERSION = "1.0.0";
