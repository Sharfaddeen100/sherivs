/**
 * Facilities server functions — Meals & Transport singletons (one row per school).
 *
 * Sports records are managed through the generic CrudList directly against
 * `public.school_sports`, so they don't need a dedicated server fn here.
 *
 * Geofence validation lives in maps.functions.ts (Haversine distance check).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const nullableNumber = (max?: number) =>
  z
    .union([z.number(), z.string(), z.null()])
    .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
    .refine((v) => v === null || (Number.isFinite(v) && (max === undefined || v <= max)), {
      message: max ? `Must be ≤ ${max}` : "Must be a number",
    });

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null));

const mealsSchema = z.object({
  meal_service_enabled: z.boolean(),
  meal_provider: text(160),
  meal_provider_type: z.enum(["in_house", "contracted", "both"]).nullable().optional(),
  breakfast_enabled: z.boolean(),
  breakfast_time: text(60),
  breakfast_menu_description: text(2000),
  lunch_enabled: z.boolean(),
  lunch_time: text(60),
  lunch_menu_description: text(2000),
  snack_enabled: z.boolean(),
  snack_time: text(60),
  has_vegetarian_option: z.boolean(),
  has_halal_option: z.boolean(),
  has_allergy_accommodation: z.boolean(),
  allergy_accommodation_detail: text(1000),
  monthly_meal_fee: nullableNumber(),
  meal_fee_currency: text(8),
  dietitian_on_staff: z.boolean(),
  hygiene_certification: text(200),
  last_inspection_date: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  meal_rating_by_students: text(400),
});

const transportSchema = z.object({
  transport_enabled: z.boolean(),
  fleet_size: nullableNumber(),
  transport_provider: text(160),
  provider_type: z.enum(["school_owned", "contracted", "mixed"]).nullable().optional(),
  coverage_areas: text(2000),
  morning_pickup_start: text(60),
  morning_arrival_time: text(60),
  afternoon_departure_time: text(60),
  live_tracking_enabled: z.boolean(),
  tracking_provider: text(160),
  parent_tracking_app: text(160),
  monthly_transport_fee: nullableNumber(),
  annual_transport_fee: nullableNumber(),
  safety_features: text(2000),
  driver_background_checked: z.boolean(),
  buses_air_conditioned: z.boolean(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(ctx: { supabase: any }) {
  const { data: isAdmin, error } = await ctx.supabase.rpc("is_school_admin");
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden: school admin only");
  const { data: schoolId, error: e2 } = await ctx.supabase.rpc("get_my_school_id");
  if (e2) throw new Error(e2.message);
  if (!schoolId) throw new Error("No school in scope");
  return schoolId as string;
}

export const upsertSchoolMeals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => mealsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const schoolId = await assertAdmin(context);
    const { error } = await context.supabase
      .from("school_meals")
      .upsert({ school_id: schoolId, ...data }, { onConflict: "school_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertSchoolTransport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => transportSchema.parse(input))
  .handler(async ({ data, context }) => {
    const schoolId = await assertAdmin(context);
    const { error } = await context.supabase
      .from("school_transport")
      .upsert({ school_id: schoolId, ...data }, { onConflict: "school_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type MealsValues = z.infer<typeof mealsSchema>;
export type TransportValues = z.infer<typeof transportSchema>;
