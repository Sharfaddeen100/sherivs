/**
 * Sherivs Scholar — language model + multilingual education (Phase-04 §17–18).
 *
 * Languages are configurable entities. An institution may declare
 * instructional, administrative, local, examination and communication
 * languages (§17); a CLASS may then declare a primary instructional language,
 * a secondary instructional language, a local language and a language-support
 * programme (§18). No language — and no default linguistic assumption — is
 * hard-coded.
 */

export type LanguageUse =
  "instructional" | "administrative" | "local" | "examination" | "communication";

export const LANGUAGE_USES: readonly LanguageUse[] = [
  "instructional",
  "administrative",
  "local",
  "examination",
  "communication",
] as const;

export interface InstitutionLanguage {
  /** Institution-defined language code (e.g. ISO 639 where applicable). */
  code: string;
  name: string;
  uses: LanguageUse[];
}

export type LanguagesValidation =
  { ok: true; languages: InstitutionLanguage[] } | { ok: false; issues: string[] };

export function validateInstitutionLanguages(
  input: readonly InstitutionLanguage[],
): LanguagesValidation {
  const issues: string[] = [];
  const codes = new Set<string>();

  for (const language of input) {
    const code = language.code.trim();
    if (!code) {
      issues.push("a language requires a code");
      continue;
    }
    if (codes.has(code)) issues.push(`duplicate language code "${code}"`);
    codes.add(code);
    if (!language.name.trim()) issues.push(`language "${code}": name is required`);
    if (language.uses.length === 0) issues.push(`language "${code}": at least one use is required`);
    for (const use of language.uses) {
      if (!LANGUAGE_USES.includes(use)) {
        issues.push(`language "${code}": use must be one of ${LANGUAGE_USES.join(", ")}`);
      }
    }
  }

  return issues.length === 0 ? { ok: true, languages: [...input] } : { ok: false, issues };
}

export interface ClassLanguageProfile {
  classId: string;
  primaryInstructionalLanguage?: string | null;
  secondaryInstructionalLanguage?: string | null;
  localLanguage?: string | null;
  languageSupportProgramme?: string | null;
}

export type ClassLanguagesValidation =
  { ok: true; profiles: ClassLanguageProfile[] } | { ok: false; issues: string[] };

export function validateClassLanguageProfiles(
  input: readonly ClassLanguageProfile[],
  knownLanguageCodes?: ReadonlySet<string> | null,
): ClassLanguagesValidation {
  const issues: string[] = [];

  for (const profile of input) {
    if (!profile.classId.trim()) issues.push("a class language profile requires a classId");
    const declared = [
      profile.primaryInstructionalLanguage,
      profile.secondaryInstructionalLanguage,
      profile.localLanguage,
    ];
    for (const code of declared) {
      if (code == null || code.trim() === "") continue;
      if (knownLanguageCodes && !knownLanguageCodes.has(code)) {
        issues.push(`class "${profile.classId}": unknown language "${code}"`);
      }
    }
    // §18: primary and secondary instructional languages must differ. The local
    // language may legitimately double as an instructional language.
    if (
      profile.primaryInstructionalLanguage &&
      profile.secondaryInstructionalLanguage &&
      profile.primaryInstructionalLanguage === profile.secondaryInstructionalLanguage
    ) {
      issues.push(
        `class "${profile.classId}": primary and secondary instructional languages must differ`,
      );
    }
  }

  return issues.length === 0 ? { ok: true, profiles: [...input] } : { ok: false, issues };
}
