/**
 * CoreGrid Scholar — flexible school hours / daily routine (Phase-04 §32).
 *
 * The administrator defines the school day: opening time, closing time and a
 * sequence of blocks — instructional periods, breaks, assembly, lunch,
 * prayer, activities and boarding schedules. No block is presumed: an
 * institution that does not run boarding never receives one. Validation keeps
 * the day monotonic (no overlapping blocks) within opening/closing bounds.
 */

export type RoutineBlockKind =
  "instruction" | "break" | "assembly" | "lunch" | "prayer" | "activity" | "boarding" | "closure";

export const ROUTINE_BLOCK_KINDS: readonly RoutineBlockKind[] = [
  "instruction",
  "break",
  "assembly",
  "lunch",
  "prayer",
  "activity",
  "boarding",
  "closure",
] as const;

export interface RoutineBlock {
  kind: RoutineBlockKind;
  label?: string;
  /** HH:MM (24-hour, institution time zone). */
  start: string;
  end: string;
}

export interface SchoolDayRoutine {
  name: string;
  /** Free-form because institutions may run morning and evening sessions. */
  shift?: string | null;
  open: string;
  close: string;
  blocks: RoutineBlock[];
}

export type SchoolHoursValidation =
  { ok: true; routine: SchoolDayRoutine } | { ok: false; issues: string[] };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidHHMM(value: string): boolean {
  return TIME_RE.test(value);
}

export function isBlockAfter(a: string, b: string): boolean {
  return a > b;
}

/** An empty, fully transparent routine with NO invented blocks (§162). */
export function emptyDayRoutine(): SchoolDayRoutine {
  return { name: "", open: "", close: "", blocks: [] };
}

export function validateSchoolDayRoutine(input: SchoolDayRoutine): SchoolHoursValidation {
  const issues: string[] = [];

  if (!input.name.trim()) issues.push("routine requires a name");
  if (!isValidHHMM(input.open)) issues.push("open must be HH:MM");
  if (!isValidHHMM(input.close)) issues.push("close must be HH:MM");
  if (isValidHHMM(input.open) && isValidHHMM(input.close) && input.close <= input.open) {
    issues.push("close must be after open");
  }

  let previousEnd: string | null = null;
  for (const block of input.blocks) {
    if (!ROUTINE_BLOCK_KINDS.includes(block.kind)) {
      issues.push(
        `block "${block.label ?? block.start}": kind must be one of ${ROUTINE_BLOCK_KINDS.join(", ")}`,
      );
    }
    if (!isValidHHMM(block.start))
      issues.push(`block "${block.label ?? block.start}": start must be HH:MM`);
    if (!isValidHHMM(block.end))
      issues.push(`block "${block.label ?? block.start}": end must be HH:MM`);
    if (isValidHHMM(block.start) && isValidHHMM(block.end) && block.end <= block.start) {
      issues.push(`block "${block.label ?? block.start}": end must be after start`);
    }
    if (
      previousEnd !== null &&
      isValidHHMM(block.start) &&
      isValidHHMM(previousEnd) &&
      block.start < previousEnd
    ) {
      issues.push(`block "${block.label ?? block.start}": overlaps the previous block`);
    }
    if (isValidHHMM(block.start) && isValidHHMM(block.end)) previousEnd = block.end;
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, routine: input };
}

/** Duration (minutes) of a block or null when its times are not HH:MM. */
export function blockMinutes(block: RoutineBlock): number | null {
  if (!isValidHHMM(block.start) || !isValidHHMM(block.end)) return null;
  const [sh, sm] = block.start.split(":").map(Number);
  const [eh, em] = block.end.split(":").map(Number);
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return minutes >= 0 ? minutes : null;
}
