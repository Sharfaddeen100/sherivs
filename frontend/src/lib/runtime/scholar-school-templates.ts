/**
 * CoreGrid Scholar (R-001) — school template catalog.
 *
 * Institution templates that match how an African school ACTUALLY runs:
 * public/private day schools, religious (Christian/Islamic) schools, TVET and
 * technical institutes, entrepreneurship and agricultural streams, boarding
 * schools, double-shift schools and multi-campus groups. The engine
 * (`onboarding/template-engine.ts`) recommends these from whatever features
 * the school selects — CoreGrid adapts to the school; the school never adapts
 * to CoreGrid.
 */
import type { InstitutionTemplate } from "../onboarding/template-engine";

export interface TemplateFeature {
  key: string;
  label: string;
  group: string;
}

export const SCHOLAR_TEMPLATE_FEATURES: readonly TemplateFeature[] = [
  { key: "curriculum.core", label: "Core national curriculum", group: "Curriculum" },
  { key: "curriculum.religious", label: "Religious & moral education", group: "Curriculum" },
  { key: "curriculum.vocational", label: "Vocational / TVET subjects", group: "Curriculum" },
  { key: "curriculum.technical", label: "Technical & workshop subjects", group: "Curriculum" },
  { key: "curriculum.agricultural", label: "Agriculture & school farm", group: "Curriculum" },
  {
    key: "curriculum.entrepreneurship",
    label: "Entrepreneurship & enterprise",
    group: "Curriculum",
  },
  { key: "schedule.day_full", label: "Full school day", group: "Schedule" },
  { key: "schedule.double_shift", label: "Double shift (morning & afternoon)", group: "Schedule" },
  { key: "schedule.boarding", label: "Boarding & extended day", group: "Schedule" },
  { key: "site.multi_campus", label: "Multiple campuses / branches", group: "Site" },
  { key: "site.multiple_premises", label: "Multiple premises & sites", group: "Site" },
  { key: "community.public_govt", label: "Public / government school", group: "Community" },
  { key: "community.private", label: "Private school", group: "Community" },
];

export const SCHOLAR_TEMPLATE_FEATURE_SET: ReadonlySet<string> = new Set(
  SCHOLAR_TEMPLATE_FEATURES.map((feature) => feature.key),
);

export const SCHOLAR_SCHOOL_TEMPLATES: readonly InstitutionTemplate[] = [
  {
    id: "public_day",
    title: "Public day school",
    description: "Government day school running the national curriculum in a single daily session.",
    featureKeys: ["curriculum.core", "schedule.day_full", "community.public_govt"],
  },
  {
    id: "private_day",
    title: "Private day school",
    description: "Independent day school with the core curriculum and a full daily session.",
    featureKeys: ["curriculum.core", "schedule.day_full", "community.private"],
  },
  {
    id: "religious_christian",
    title: "Christian mission school",
    description: "Core curriculum plus religious and moral education as a full subject.",
    featureKeys: [
      "curriculum.core",
      "curriculum.religious",
      "schedule.day_full",
      "community.private",
    ],
  },
  {
    id: "islamic_madrassa",
    title: "Islamic / madrassa school",
    description: "Core curriculum with Arabic and Islamic studies integrated into the week.",
    featureKeys: ["curriculum.core", "curriculum.religious", "schedule.day_full"],
  },
  {
    id: "vocational_tvet",
    title: "Vocational / TVET school",
    description: "Skills-first institute with vocational trades and workshop time.",
    featureKeys: ["curriculum.core", "curriculum.vocational", "schedule.day_full"],
  },
  {
    id: "technical_institute",
    title: "Technical institute",
    description: "Technical and workshop-centred curriculum with practical sessions.",
    featureKeys: ["curriculum.core", "curriculum.technical", "schedule.day_full"],
  },
  {
    id: "agricultural_school",
    title: "Agricultural school",
    description: "School farm and agriculture-centred learning alongside the core curriculum.",
    featureKeys: ["curriculum.core", "curriculum.agricultural", "schedule.day_full"],
  },
  {
    id: "entrepreneurship_academy",
    title: "Entrepreneurship academy",
    description: "Enterprise and business creation woven through the core programme.",
    featureKeys: ["curriculum.core", "curriculum.entrepreneurship", "schedule.day_full"],
  },
  {
    id: "boarding_school",
    title: "Boarding school",
    description: "Full boarding with extended day, evening study and weekend activities.",
    featureKeys: ["curriculum.core", "schedule.boarding", "schedule.day_full"],
  },
  {
    id: "double_shift",
    title: "Double-shift school",
    description: "Two daily sessions serving more learners on the same premises.",
    featureKeys: ["curriculum.core", "schedule.double_shift"],
  },
  {
    id: "multi_campus_group",
    title: "Multi-campus school group",
    description: "One governing body across several campuses and premises.",
    featureKeys: ["curriculum.core", "site.multi_campus", "site.multiple_premises"],
  },
];
