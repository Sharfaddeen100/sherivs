/**
 * CoreGrid Scholar — school calendar (Phase-04 §31).
 *
 * The calendar holds instructional days, holidays, examinations, events,
 * breaks, training days, public holidays and institutional closures as typed
 * entries. Validation keeps the calendar honest: valid ISO dates, known
 * period references, and no contradictory classification of the same day
 * (a day cannot be simultaneously instructional and closed).
 */

import { isValidIsoDate } from "./academic-period";

export type CalendarEntryKind =
  | "instructional_day"
  | "holiday"
  | "examination"
  | "event"
  | "break"
  | "training_day"
  | "public_holiday"
  | "closure";

export const CALENDAR_ENTRY_KINDS: readonly CalendarEntryKind[] = [
  "instructional_day",
  "holiday",
  "examination",
  "event",
  "break",
  "training_day",
  "public_holiday",
  "closure",
] as const;

export interface CalendarEntry {
  kind: CalendarEntryKind;
  date: string;
  name: string;
  periodCode?: string | null;
  notes?: string | null;
}

export type CalendarValidation =
  { ok: true; entries: CalendarEntry[] } | { ok: false; issues: string[] };

/** Day classifications that contradict an instructional day on the same date. */
const NON_INSTRUCTIONAL: readonly CalendarEntryKind[] = [
  "closure",
  "break",
  "holiday",
  "public_holiday",
];

export function validateCalendar(
  entries: readonly CalendarEntry[],
  knownPeriodCodes?: ReadonlySet<string> | null,
): CalendarValidation {
  const issues: string[] = [];

  for (const entry of entries) {
    if (!CALENDAR_ENTRY_KINDS.includes(entry.kind)) {
      issues.push(`entry "${entry.name}": kind must be one of ${CALENDAR_ENTRY_KINDS.join(", ")}`);
    }
    if (!entry.name.trim()) issues.push("a calendar entry requires a name");
    if (!isValidIsoDate(entry.date)) issues.push(`entry "${entry.name}": date must be YYYY-MM-DD`);
    if (entry.periodCode != null && knownPeriodCodes && !knownPeriodCodes.has(entry.periodCode)) {
      issues.push(
        `entry "${entry.name}": references unknown academic period "${entry.periodCode}"`,
      );
    }
  }

  // Same-day contradiction checks (E5 sanity): a single day cannot be both an
  // instructional day and a closure/break/holiday/public holiday.
  const byDate = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const list = byDate.get(entry.date) ?? [];
    list.push(entry);
    byDate.set(entry.date, list);
  }
  for (const [date, dayEntries] of byDate) {
    const instructional = dayEntries.some((e) => e.kind === "instructional_day");
    if (!instructional) continue;
    for (const entry of dayEntries) {
      if (NON_INSTRUCTIONAL.includes(entry.kind)) {
        issues.push(
          `${date} is marked "${entry.kind}" ("${entry.name}") but also as an instructional day`,
        );
      }
    }
  }

  return issues.length === 0 ? { ok: true, entries: [...entries] } : { ok: false, issues };
}

/** Group the calendar by day classification (for rendering + reports). */
export function classifyCalendarDays(entries: readonly CalendarEntry[]): {
  instructional: string[];
  closed: string[];
  other: string[];
} {
  const instructional = new Set<string>();
  const closed = new Set<string>();
  const other = new Set<string>();
  for (const entry of entries) {
    if (entry.kind === "instructional_day") instructional.add(entry.date);
    else if (NON_INSTRUCTIONAL.includes(entry.kind)) closed.add(entry.date);
    else other.add(entry.date);
  }
  return {
    instructional: [...instructional].sort(),
    closed: [...closed].sort(),
    other: [...other].sort(),
  };
}
