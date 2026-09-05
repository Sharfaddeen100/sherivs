/**
 * CoreGrid Scholar — entrepreneurship education (Phase-04 §16).
 *
 * Business projects, enterprise creation, financial literacy, cooperative
 * projects, market simulations, student businesses and practical
 * entrepreneurship are configuration — the runtime never presumes a business
 * model or an economy.
 */

export type EntrepreneurshipMode =
  | "business_projects"
  | "enterprise_creation"
  | "financial_literacy"
  | "cooperative_projects"
  | "market_simulations"
  | "student_businesses"
  | "practical_entrepreneurship"
  | "custom";

export const ENTREPRENEURSHIP_MODES: readonly EntrepreneurshipMode[] = [
  "business_projects",
  "enterprise_creation",
  "financial_literacy",
  "cooperative_projects",
  "market_simulations",
  "student_businesses",
  "practical_entrepreneurship",
  "custom",
] as const;

export interface EntrepreneurshipProgramme {
  id: string;
  name: string;
  modes: EntrepreneurshipMode[];
  notes?: string | null;
}

export type EntrepreneurshipValidation =
  { ok: true; programmes: EntrepreneurshipProgramme[] } | { ok: false; issues: string[] };

export function validateEntrepreneurshipEducation(
  input: readonly EntrepreneurshipProgramme[],
): EntrepreneurshipValidation {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const programme of input) {
    const id = programme.id.trim();
    if (!id) {
      issues.push("an entrepreneurship programme requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate programme id "${id}"`);
    ids.add(id);
    if (!programme.name.trim()) issues.push(`programme "${id}": name is required`);
    for (const mode of programme.modes) {
      if (!ENTREPRENEURSHIP_MODES.includes(mode)) {
        issues.push(`programme "${id}": mode must be one of ${ENTREPRENEURSHIP_MODES.join(", ")}`);
      }
    }
  }

  return issues.length === 0 ? { ok: true, programmes: [...input] } : { ok: false, issues };
}
