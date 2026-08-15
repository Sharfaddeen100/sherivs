-- Part 11: Vibeora Intelligence delta — fills gaps left from earlier migrations.

-- 1. AI admissions recommendation column
ALTER TABLE public.admission_applications
  ADD COLUMN IF NOT EXISTS ai_recommendation text;

-- 2. Bootstrap new feature flags on every existing school (preserve current values)
UPDATE public.schools
SET active_features = COALESCE(active_features, '{}'::jsonb) || jsonb_build_object(
  'vibeora_intelligence',        COALESCE(active_features->'vibeora_intelligence',        'false'::jsonb),
  'digital_twin',                COALESCE(active_features->'digital_twin',                'false'::jsonb),
  'digital_twin_outbound_calls', COALESCE(active_features->'digital_twin_outbound_calls', 'false'::jsonb),
  'school_economy_score',        COALESCE(active_features->'school_economy_score',        'false'::jsonb),
  'bus_live_tracking',           COALESCE(active_features->'bus_live_tracking',           'false'::jsonb),
  'sports_management',           COALESCE(active_features->'sports_management',           'false'::jsonb),
  'meal_management',             COALESCE(active_features->'meal_management',             'false'::jsonb),
  'expense_tracker',             COALESCE(active_features->'expense_tracker',             'false'::jsonb)
);
