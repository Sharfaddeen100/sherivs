/**
 * CoreGrid Scholar — Educational Reality Role Engine.
 *
 * A universal educational reality role architecture: WHO can exist inside an
 * educational reality (government, regulatory, institutional, teaching,
 * vocational, technical, agricultural, religious, traditional, community,
 * residential, examination, quality, platform), and how that reality turns into
 * roles, permissions, workspaces and context.
 *
 * Reality configuration → role registry → definition/permission model →
 * workspace generation → dynamic experience. No `if (role === "teacher")` and
 * no `if (schoolType === "secondary")` anywhere in the engine: every decision
 * is data (feature keys, templates, categories, grants, policies).
 *
 * Boundaries:
 *  - roles are reality CONFIGURATION; authorization stays in Phase 08/09 + RLS;
 *  - the engine consumes the P25 workforce-kind catalog and links to it rather
 *    than redefining posts (no role duplication);
 *  - the engine holds no UI and no persistence.
 */

export * from "./role-categories";
export * from "./role-workspaces";
export * from "./role-definition";
export * from "./role-catalog-groups";
export * from "./role-registry";
export * from "./role-catalog-audit";
export * from "./role-template-engine";
export * from "./role-borrowing-engine";
export * from "./role-inheritance-engine";
export * from "./role-permission-engine";
export * from "./role-workspace-engine";
export * from "./role-context-engine";

export const EDUCATION_REALITY_ROLE_ENGINE_ID = "scholar:education-reality-role-engine";
export const EDUCATION_REALITY_ROLE_ENGINE_VERSION = "1.0.0";
