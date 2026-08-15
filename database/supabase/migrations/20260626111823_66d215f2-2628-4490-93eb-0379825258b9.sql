
-- Schools: subscription, features, geofence, school days
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS school_days jsonb DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]'::jsonb;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS geofence jsonb;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS active_features jsonb DEFAULT '{}'::jsonb;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='schools' AND column_name='subscription_tier') THEN
    ALTER TABLE public.schools ADD COLUMN subscription_tier text DEFAULT 'trial';
    ALTER TABLE public.schools ADD CONSTRAINT schools_subscription_tier_check
      CHECK (subscription_tier IN ('trial','starter','growth','professional','enterprise'));
  END IF;
END $$;

-- Users: face biometric
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS face_biometric jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS face_registered_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS face_skip_count integer DEFAULT 0;

-- attendance_logs: geofence + face columns (add only if missing)
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS gps_latitude numeric;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS gps_longitude numeric;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS inside_geofence boolean;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS face_match_score numeric;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS face_matched boolean DEFAULT false;
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS fraud_detected boolean DEFAULT false;

-- school_api_keys
CREATE TABLE IF NOT EXISTS public.school_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE,
  paystack_public_key text,
  paystack_secret_key_encrypted text,
  flutterwave_public_key text,
  flutterwave_secret_key_encrypted text,
  stripe_publishable_key text,
  stripe_secret_key_encrypted text,
  whatsapp_phone_id text,
  whatsapp_token_encrypted text,
  africas_talking_username text,
  africas_talking_key_encrypted text,
  active_payment_provider text DEFAULT 'paystack' CHECK (active_payment_provider IN ('paystack','flutterwave','stripe')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_api_keys TO authenticated;
GRANT ALL ON public.school_api_keys TO service_role;
ALTER TABLE public.school_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "api_keys_school_isolation" ON public.school_api_keys;
CREATE POLICY "api_keys_school_isolation" ON public.school_api_keys
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_my_school_id() AND public.is_school_admin());

-- platform_config
CREATE TABLE IF NOT EXISTS public.platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.platform_config TO authenticated;
GRANT ALL ON public.platform_config TO service_role;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_config_read_all" ON public.platform_config;
CREATE POLICY "platform_config_read_all" ON public.platform_config
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "platform_config_super_admin_write" ON public.platform_config;
CREATE POLICY "platform_config_super_admin_write" ON public.platform_config
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- news_reads
CREATE TABLE IF NOT EXISTS public.news_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(news_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_reads TO authenticated;
GRANT ALL ON public.news_reads TO service_role;
ALTER TABLE public.news_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "news_reads_school" ON public.news_reads;
CREATE POLICY "news_reads_school" ON public.news_reads
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id() AND user_id = auth.uid());

-- updated_at trigger reuse
DROP TRIGGER IF EXISTS school_api_keys_touch ON public.school_api_keys;
CREATE TRIGGER school_api_keys_touch BEFORE UPDATE ON public.school_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS platform_config_touch ON public.platform_config;
CREATE TRIGGER platform_config_touch BEFORE UPDATE ON public.platform_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed platform_config pricing
INSERT INTO public.platform_config (key, value) VALUES
  ('subscription_tiers_pricing', '{
    "trial": {"price_monthly": 0, "price_annual": 0},
    "starter": {"price_monthly": 15000, "price_annual": 150000},
    "growth": {"price_monthly": 35000, "price_annual": 350000},
    "professional": {"price_monthly": 75000, "price_annual": 750000},
    "enterprise": {"price_monthly": 0, "price_annual": 0}
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
