/**
 * CoreGrid Scholar — organization school-profile contract (persisted, R-24).
 *
 * Scholar's own profile key + validation over the domain-neutral org-profile
 * store (cg_org_profile). The kernel stores JSON; Scholar defines the shape.
 * The profile records what the school ACTUALLY runs (template features +
 * closing model) so every surface can adapt automatically.
 */
import { z } from "zod";
import { SCHOLAR_TEMPLATE_FEATURES } from "./scholar-school-templates";
import { DAY_PRESETS } from "../scholar/day-recommendation";

export const SCHOLAR_SCHOOL_PROFILE_KEY = "school_profile_v1";

export const SCHOLAR_PROFILE_CLOSING_PRESETS = Object.keys(DAY_PRESETS) as Array<
  keyof typeof DAY_PRESETS
>;

const FEATURE_KEYS = new Set(SCHOLAR_TEMPLATE_FEATURES.map((feature) => feature.key));

export const scholarSchoolProfileSchema = z.object({
  version: z.literal(1).default(1),
  /** Template features the school selected (validated against the catalog). */
  features: z
    .array(z.string())
    .max(24)
    .default([])
    .refine((features) => features.every((feature) => FEATURE_KEYS.has(feature)), {
      message: "Unknown school profile feature",
    }),
  closingPreset: z
    .enum(["halfDay_12", "halfDay_13", "early_14", "fullDay_17", "extended_18"])
    .default("fullDay_17"),
});

export type ScholarSchoolProfile = z.infer<typeof scholarSchoolProfileSchema>;

export function parseScholarSchoolProfile(input: unknown): ScholarSchoolProfile {
  return scholarSchoolProfileSchema.parse(input);
}
