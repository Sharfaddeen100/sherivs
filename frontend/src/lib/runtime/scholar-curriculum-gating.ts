/**
 * Sherivs Scholar — curriculum-per-school-type gating (dynamic display).
 *
 * Maps the school-profile features (R-13) onto the curriculum modules the
 * Scholar runtime can surface. Gating is DATA-DRIVEN and shrink-only for
 * display: a school that selects "Religious & moral education" sees the
 * religious curriculum module; a school that does not never sees it forced on
 * them. The core national curriculum is always available.
 */
export const CURRICULUM_MODULE_ORDER = [
  "curriculum-core",
  "curriculum-traditional",
  "curriculum-religious",
  "curriculum-technical",
  "curriculum-vocational",
  "curriculum-agricultural",
  "curriculum-entrepreneurship",
] as const;

export type CurriculumModuleKey = (typeof CURRICULUM_MODULE_ORDER)[number];

const MODULE_FEATURE: Readonly<Record<CurriculumModuleKey, string | null>> = {
  "curriculum-core": null, // always available
  "curriculum-traditional": null, // formal mainstream delivery, always available
  "curriculum-religious": "curriculum.religious",
  "curriculum-technical": "curriculum.technical",
  "curriculum-vocational": "curriculum.vocational",
  "curriculum-agricultural": "curriculum.agricultural",
  "curriculum-entrepreneurship": "curriculum.entrepreneurship",
};

/** Curriculum modules that surface for a school profile (core always first). */
export function curriculumModulesForProfile(features: ReadonlySet<string>): CurriculumModuleKey[] {
  const modules: CurriculumModuleKey[] = ["curriculum-core"];
  for (const module of CURRICULUM_MODULE_ORDER) {
    if (module === "curriculum-core") continue;
    const requiredFeature = MODULE_FEATURE[module];
    if (requiredFeature === null || features.has(requiredFeature)) modules.push(module);
  }
  return modules;
}

export function isCurriculumModuleShown(
  module: CurriculumModuleKey,
  features: ReadonlySet<string>,
): boolean {
  if (module === "curriculum-core") return true;
  const requiredFeature = MODULE_FEATURE[module];
  return requiredFeature === null || features.has(requiredFeature);
}
