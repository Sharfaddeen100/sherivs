/**
 * CoreGrid — workforce-position typed contract (Phase 25 Workforce Identity).
 *
 * The tenant-scoped appointment record returned by the org-admin RPC surface
 * (`list_workforce_positions`, migration 20260907000300) and used by HR UI.
 * Pure contract: no persistence, no authorization — the RPC layer enforces
 * scope; this module only validates shape and offers display grouping.
 */
import { z } from "zod";

export const WORKFORCE_EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "volunteer",
  "intern",
  "seconded",
] as const;
export type WorkforceEmploymentType = (typeof WORKFORCE_EMPLOYMENT_TYPES)[number];

export const WORKFORCE_POSITION_STATUSES = [
  "proposed",
  "active",
  "on_leave",
  "suspended",
  "ended",
  "revoked",
] as const;
export type WorkforcePositionStatus = (typeof WORKFORCE_POSITION_STATUSES)[number];

export const workforcePositionViewSchema = z.object({
  id: z.string().uuid(),
  /** Auth identity (user) holding the appointment, as text. */
  identity_ref: z.string().uuid(),
  kind_code: z.string().min(1),
  kind_title: z.string().min(1),
  family: z.string().min(1),
  employment_type: z.enum(WORKFORCE_EMPLOYMENT_TYPES),
  started_on: z.string().min(1),
  ended_on: z.string().nullable(),
  status: z.enum(WORKFORCE_POSITION_STATUSES),
  is_primary: z.boolean(),
  authority_group: z.string().min(1),
});

export type WorkforcePositionView = z.infer<typeof workforcePositionViewSchema>;

export function isWorkforceEmploymentType(value: string): value is WorkforceEmploymentType {
  return (WORKFORCE_EMPLOYMENT_TYPES as readonly string[]).includes(value);
}

export function isWorkforcePositionStatus(value: string): value is WorkforcePositionStatus {
  return (WORKFORCE_POSITION_STATUSES as readonly string[]).includes(value);
}

/** Positions that still count against the current staff roll. */
export function isOpenWorkforcePosition(status: WorkforcePositionStatus): boolean {
  return status === "active" || status === "on_leave" || status === "proposed";
}

/** Display label: "Head Teacher" / "Subject Teacher • primary" / "... (ended)". */
export function workforcePositionSummary(row: WorkforcePositionView): string {
  const primary = row.is_primary ? " • primary" : "";
  const suffix = row.status === "active" ? "" : ` (${row.status})`;
  return `${row.kind_title}${primary}${suffix}`;
}

export function parseWorkforcePositionView(input: unknown): WorkforcePositionView {
  return workforcePositionViewSchema.parse(input);
}
