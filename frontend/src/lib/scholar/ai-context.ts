/**
 * Sherivs Scholar — AI context object (Phase-04 §116–118, O3).
 *
 * AI systems must consume the educational runtime rather than inventing school
 * reality (§116). Every AI request resolves an AI CONTEXT OBJECT (§118) naming
 * the tenant, the requesting identity, the roles the P08 gate actually granted,
 * and the context entities involved — so downstream models receive bounded,
 * authorized context and nothing else.
 */

import type { RoleGateKind } from "@/lib/security-role-gate";

export interface AiContextInput {
  tenantId: string;
  identityId: string;
  /** Server-resolved roles — never client-claimed. */
  roles: RoleGateKind[];
  /** Optional context anchors (learner/class/subject refs). */
  subjectRef?: string | null;
  purpose: string;
}

export interface AiContext {
  tenantId: string;
  identityId: string;
  roles: RoleGateKind[];
  subjectRef: string | null;
  purpose: string;
  /** Context object is bounded — see role-scoped search for entity access. */
}

export function buildAiContext(input: AiContextInput): AiContext | { issue: string } {
  if (!input.tenantId.trim()) return { issue: "AI context requires a tenant" };
  if (!input.identityId.trim()) return { issue: "AI context requires an identity" };
  if (!input.purpose.trim()) return { issue: "AI context requires a purpose" };
  return {
    tenantId: input.tenantId,
    identityId: input.identityId,
    roles: [...input.roles],
    subjectRef: input.subjectRef ?? null,
    purpose: input.purpose,
  };
}
