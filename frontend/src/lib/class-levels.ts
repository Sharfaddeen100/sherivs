/** Canonical Nigerian school ladder used to bootstrap the classes list. */
export const CLASS_LEVELS: Array<{ group: string; levels: string[] }> = [
  { group: "Early years", levels: ["Playgroup", "Nursery 1", "Nursery 2", "Nursery 3"] },
  {
    group: "Primary",
    levels: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"],
  },
  { group: "Junior secondary", levels: ["JSS 1", "JSS 2", "JSS 3"] },
  { group: "Senior secondary", levels: ["SS 1", "SS 2", "SS 3"] },
];

export const ALL_LEVELS = CLASS_LEVELS.flatMap((g) => g.levels);

export const SECTIONS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export function className(level: string, section: string | null) {
  return section ? `${level}${section}` : level;
}
