INSERT INTO public.platform_config (key, value)
VALUES (
  'per_student_fees',
  '{"trial":0,"starter":200,"growth":350,"professional":500,"enterprise":800}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();