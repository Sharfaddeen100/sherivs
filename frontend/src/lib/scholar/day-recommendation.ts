/**
 * Sherivs Scholar — dynamic school-day recommendation (Phase-04 extension).
 *
 * Builds VALIDATED day routines from what an African school actually runs:
 * any opening/closing pair (12:00, 13:00, 14:00, 17:00, 18:00 closings are
 * all just data), double-shift windows (morning + afternoon sessions) and
 * boarding evening-study windows. It never invents blocks (§162): routines
 * carry only the windows the school declared, and every produced routine is
 * run through `validateSchoolDayRoutine` before it is returned.
 */
import { validateSchoolDayRoutine, type RoutineBlock, type SchoolDayRoutine } from "./school-hours";

export interface AcademicWindow {
  /** HH:MM */
  open: string;
  /** HH:MM */
  close: string;
}

export interface DayProfileChoices {
  /** Institution-chosen label, e.g. "Morning shift" or "Full day". */
  name: string;
  /** One window for a single session; two for a double-shift school. */
  windows: AcademicWindow[];
  /** Optional boarding evening-study window (after the academic day). */
  boardingPrep?: AcademicWindow | null;
}

export interface DayRecommendation {
  routines: SchoolDayRoutine[];
  issues: string[];
}

function routineFor(
  name: string,
  window: AcademicWindow,
  blocks: RoutineBlock[],
): SchoolDayRoutine {
  return { name, shift: null, open: window.open, close: window.close, blocks };
}

/** Produce validated routines for the school's declared windows. */
export function recommendDayRoutines(input: DayProfileChoices): DayRecommendation {
  const routines: SchoolDayRoutine[] = [];
  const issues: string[] = [];

  if (input.windows.length === 0) {
    issues.push("at least one academic window is required");
  }
  if (input.windows.length > 2) {
    issues.push("a school day cannot declare more than two academic windows");
  }

  for (const [index, window] of input.windows.entries()) {
    const routine = routineFor(
      input.windows.length > 1
        ? `${input.name} ${index === 0 ? "morning" : "afternoon"}`
        : input.name,
      window,
      [],
    );
    const validation = validateSchoolDayRoutine(routine);
    if (validation.ok) routines.push(validation.routine);
    else issues.push(...validation.issues);
  }

  if (input.boardingPrep) {
    const prep = input.boardingPrep;
    const routine = routineFor(`${input.name} boarding prep`, prep, [
      { kind: "boarding", label: "Evening study", start: prep.open, end: prep.close },
    ]);
    const validation = validateSchoolDayRoutine(routine);
    if (validation.ok) routines.push(validation.routine);
    else issues.push(...validation.issues);
  }

  return { routines, issues };
}

/** Convenience presets for common African closing models. */
export const DAY_PRESETS = {
  halfDay_12: { open: "07:30", close: "12:00" },
  halfDay_13: { open: "07:30", close: "13:00" },
  early_14: { open: "07:30", close: "14:00" },
  fullDay_17: { open: "07:30", close: "17:00" },
  extended_18: { open: "07:30", close: "18:00" },
} as const satisfies Readonly<Record<string, AcademicWindow>>;

export interface CampusSchoolWindow {
  /** Stable campus/branch reference (multi-campus environment). */
  campusRef: string;
  /** Display name, e.g. "Main Campus". */
  name: string;
  windows: AcademicWindow[];
  boardingPrep?: AcademicWindow | null;
}

export interface SiteRecommendation {
  sites: Array<{ campusRef: string; routines: SchoolDayRoutine[] }>;
  issues: string[];
}

/**
 * Build validated routines for every campus of a multi-campus group. Each
 * campus keeps its OWN windows — morning/afternoon shifts and boarding prep
 * are resolved per campus so the timetable surface can bind sessions to a
 * campus reference instead of assuming a single site.
 */
export function recommendSiteRoutines(sites: readonly CampusSchoolWindow[]): SiteRecommendation {
  const issues: string[] = [];
  const resolved: SiteRecommendation["sites"] = [];

  for (const site of sites) {
    if (!site.campusRef.trim()) {
      issues.push("every campus requires a campusRef");
      continue;
    }
    const recommendation = recommendDayRoutines({
      name: site.name,
      windows: site.windows,
      boardingPrep: site.boardingPrep ?? null,
    });
    for (const issue of recommendation.issues) {
      issues.push(`[${site.campusRef}] ${issue}`);
    }
    resolved.push({ campusRef: site.campusRef, routines: recommendation.routines });
  }

  return { sites: resolved, issues };
}
