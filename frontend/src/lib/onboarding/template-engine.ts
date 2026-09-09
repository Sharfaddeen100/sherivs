/**
 * CoreGrid — institution template engine (domain-neutral).
 *
 * Given what an organization SAYS it does (selected feature keys), this engine
 * RECOMMENDS matching institution templates. It never forces anything: a
 * template is a data bundle of feature keys the organization can accept or
 * ignore, and every choice is reversible. Domain runtimes (Scholar first)
 * publish their template data against this contract; the engine holds no
 * domain vocabulary.
 */
export interface InstitutionTemplate {
  id: string;
  title: string;
  description: string;
  /** Feature keys this template bundles (validated against the runtime catalog). */
  featureKeys: readonly string[];
}

export interface TemplateRecommendation {
  template: InstitutionTemplate;
  /** How many of the organization's selected features this template covers. */
  matchedKeys: number;
  /** Features the organization selected that this template does NOT cover. */
  uncoveredKeys: readonly string[];
}

/** Score: matched = how many selected features the template covers. */
export function matchTemplate(
  template: InstitutionTemplate,
  selected: ReadonlySet<string>,
): TemplateRecommendation {
  let matched = 0;
  const uncovered: string[] = [];
  for (const key of selected) {
    if (template.featureKeys.includes(key)) matched += 1;
    else uncovered.push(key);
  }
  return { template, matchedKeys: matched, uncoveredKeys: uncovered };
}

/** Rank templates for the selected features; empty selection matches nothing. */
export function recommendTemplates(
  templates: ReadonlyArray<InstitutionTemplate>,
  selected: ReadonlySet<string>,
): TemplateRecommendation[] {
  if (selected.size === 0) return [];
  return templates
    .map((template) => matchTemplate(template, selected))
    .filter((recommendation) => recommendation.matchedKeys > 0)
    .sort(
      (a, b) =>
        b.matchedKeys - a.matchedKeys ||
        a.uncoveredKeys.length - b.uncoveredKeys.length ||
        a.template.id.localeCompare(b.template.id),
    );
}

/** Structural audit: unique ids and non-empty, key-referencing templates. */
export function auditTemplates(
  templates: ReadonlyArray<InstitutionTemplate>,
  catalog: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const template of templates) {
    if (seen.has(template.id)) issues.push(`duplicate template id "${template.id}"`);
    seen.add(template.id);
    if (template.title.trim().length === 0) issues.push(`${template.id}: empty title`);
    for (const key of template.featureKeys) {
      if (!catalog.has(key)) issues.push(`${template.id}: unknown feature key "${key}"`);
    }
  }
  return issues;
}
