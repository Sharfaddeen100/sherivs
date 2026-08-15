
-- =============================================================
-- Phase 1: Tenant Routing Foundation, Maps, Facilities, Transport,
-- Expenses, Complaints, Ad Campaigns, Digital Twin Opt-Out,
-- AI Admissions Review fields, Driver Role support.
-- =============================================================

-- ----------- Schools: maps & geofence -----------
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS google_maps_embed_url text,
  ADD COLUMN IF NOT EXISTS geofence_latitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS geofence_longitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS geofence_radius_meters integer DEFAULT 200,
  ADD COLUMN IF NOT EXISTS show_map_on_website boolean DEFAULT false;

-- ----------- Users: driver role & twin opt-out -----------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS digital_twin_opt_out boolean DEFAULT false;

-- Allow driver role on users table (relax check if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_check' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_role_check;
  END IF;
END$$;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (
    role IN ('admin','principal','teacher','parent','student','bursar','hq','alumni','driver')
  );

-- ----------- Admissions: AI review -----------
ALTER TABLE public.admission_applications
  ADD COLUMN IF NOT EXISTS ai_review_result jsonb,
  ADD COLUMN IF NOT EXISTS ai_reviewed_at timestamptz;

-- =============================================================
-- school_sports
-- =============================================================
CREATE TABLE IF NOT EXISTS public.school_sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sport_name text NOT NULL,
  sport_category text,
  gender_category text DEFAULT 'mixed' CHECK (gender_category IN ('male','female','mixed')),
  age_groups text,
  coach_name text,
  coach_qualification text,
  training_days text,
  training_time text,
  achievements text,
  facilities_description text,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_sports TO authenticated;
GRANT SELECT ON public.school_sports TO anon;
GRANT ALL ON public.school_sports TO service_role;
ALTER TABLE public.school_sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sports_school_rw" ON public.school_sports
  FOR ALL USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
CREATE POLICY "sports_public_read" ON public.school_sports
  FOR SELECT TO anon USING (is_active = true);
CREATE TRIGGER trg_school_sports_touch BEFORE UPDATE ON public.school_sports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================================
-- school_meals (one row per school)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.school_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  meal_service_enabled boolean DEFAULT false,
  meal_provider text,
  meal_provider_type text CHECK (meal_provider_type IN ('in_house','contracted','both')),
  breakfast_enabled boolean DEFAULT false,
  breakfast_time text,
  breakfast_menu_description text,
  lunch_enabled boolean DEFAULT true,
  lunch_time text,
  lunch_menu_description text,
  snack_enabled boolean DEFAULT false,
  snack_time text,
  has_vegetarian_option boolean DEFAULT false,
  has_halal_option boolean DEFAULT true,
  has_allergy_accommodation boolean DEFAULT false,
  allergy_accommodation_detail text,
  monthly_meal_fee numeric(10,2),
  meal_fee_currency text DEFAULT 'NGN',
  dietitian_on_staff boolean DEFAULT false,
  hygiene_certification text,
  last_inspection_date date,
  meal_rating_by_students text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_meals TO authenticated;
GRANT SELECT ON public.school_meals TO anon;
GRANT ALL ON public.school_meals TO service_role;
ALTER TABLE public.school_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meals_school_rw" ON public.school_meals
  FOR ALL USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
CREATE POLICY "meals_public_read" ON public.school_meals
  FOR SELECT TO anon USING (meal_service_enabled = true);
CREATE TRIGGER trg_school_meals_touch BEFORE UPDATE ON public.school_meals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================================
-- school_transport (one row per school)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.school_transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  transport_enabled boolean DEFAULT false,
  fleet_size integer DEFAULT 0,
  transport_provider text,
  provider_type text CHECK (provider_type IN ('school_owned','contracted','mixed')),
  coverage_areas text,
  morning_pickup_start text,
  morning_arrival_time text,
  afternoon_departure_time text,
  live_tracking_enabled boolean DEFAULT false,
  tracking_provider text,
  parent_tracking_app text,
  monthly_transport_fee numeric(10,2),
  annual_transport_fee numeric(10,2),
  safety_features text,
  driver_background_checked boolean DEFAULT true,
  buses_air_conditioned boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_transport TO authenticated;
GRANT SELECT ON public.school_transport TO anon;
GRANT ALL ON public.school_transport TO service_role;
ALTER TABLE public.school_transport ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_school_rw" ON public.school_transport
  FOR ALL USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
CREATE POLICY "transport_public_read" ON public.school_transport
  FOR SELECT TO anon USING (transport_enabled = true);
CREATE TRIGGER trg_school_transport_touch BEFORE UPDATE ON public.school_transport
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================================
-- transport_buses
-- =============================================================
CREATE TABLE IF NOT EXISTS public.transport_buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  bus_number text NOT NULL,
  registration_plate text,
  bus_type text,
  capacity integer,
  driver_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  current_latitude numeric(10,7),
  current_longitude numeric(10,7),
  last_location_update timestamptz,
  current_status text DEFAULT 'idle'
    CHECK (current_status IN ('idle','en_route','at_school','returning','maintenance')),
  route_name text,
  assigned_students jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transport_buses TO authenticated;
GRANT ALL ON public.transport_buses TO service_role;
ALTER TABLE public.transport_buses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buses_school_rw" ON public.transport_buses
  FOR ALL USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
CREATE TRIGGER trg_transport_buses_touch BEFORE UPDATE ON public.transport_buses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Enable realtime for buses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'transport_buses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transport_buses;
  END IF;
END $$;

-- =============================================================
-- school_staff_types
-- =============================================================
CREATE TABLE IF NOT EXISTS public.school_staff_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  staff_type text NOT NULL,
  staff_type_category text NOT NULL,
  is_enabled boolean DEFAULT false,
  staff_count integer DEFAULT 0,
  notes text,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_staff_types TO authenticated;
GRANT SELECT ON public.school_staff_types TO anon;
GRANT ALL ON public.school_staff_types TO service_role;
ALTER TABLE public.school_staff_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_types_school_rw" ON public.school_staff_types
  FOR ALL USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
CREATE POLICY "staff_types_public_read" ON public.school_staff_types
  FOR SELECT TO anon USING (is_enabled = true);
CREATE TRIGGER trg_school_staff_types_touch BEFORE UPDATE ON public.school_staff_types
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================================
-- school_expenses
-- =============================================================
CREATE TABLE IF NOT EXISTS public.school_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  expense_title text NOT NULL,
  expense_category text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'NGN',
  expense_date date NOT NULL,
  vendor_name text,
  payment_method text DEFAULT 'cash'
    CHECK (payment_method IN ('cash','bank_transfer','card','cheque','other')),
  receipt_url text,
  description text,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_recurring boolean DEFAULT false,
  recurring_frequency text,
  tags text[],
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_expenses TO authenticated;
GRANT ALL ON public.school_expenses TO service_role;
ALTER TABLE public.school_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_school_rw" ON public.school_expenses
  FOR ALL USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
CREATE TRIGGER trg_school_expenses_touch BEFORE UPDATE ON public.school_expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS idx_expenses_school_date ON public.school_expenses(school_id, expense_date DESC);

-- =============================================================
-- school_expense_budgets
-- =============================================================
CREATE TABLE IF NOT EXISTS public.school_expense_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category text NOT NULL,
  monthly_budget numeric(12,2) NOT NULL CHECK (monthly_budget >= 0),
  academic_year text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, category, academic_year)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_expense_budgets TO authenticated;
GRANT ALL ON public.school_expense_budgets TO service_role;
ALTER TABLE public.school_expense_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budgets_school_rw" ON public.school_expense_budgets
  FOR ALL USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
CREATE TRIGGER trg_expense_budgets_touch BEFORE UPDATE ON public.school_expense_budgets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================================
-- platform_complaints
-- =============================================================
CREATE TABLE IF NOT EXISTS public.platform_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  complaint_type text NOT NULL CHECK (complaint_type IN
    ('technical_bug','billing_issue','feature_request','account_issue',
     'data_issue','urgent_support','general_feedback','other')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  subject text NOT NULL,
  description text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','closed')),
  super_admin_response text,
  responded_at timestamptz,
  responded_by uuid REFERENCES public.super_admins(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_complaints TO authenticated;
GRANT ALL ON public.platform_complaints TO service_role;
ALTER TABLE public.platform_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "complaints_school_read" ON public.platform_complaints
  FOR SELECT USING (school_id = public.get_my_school_id() OR public.is_super_admin());
CREATE POLICY "complaints_school_insert" ON public.platform_complaints
  FOR INSERT WITH CHECK (school_id = public.get_my_school_id() AND submitted_by = auth.uid());
CREATE POLICY "complaints_super_admin_all" ON public.platform_complaints
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE TRIGGER trg_platform_complaints_touch BEFORE UPDATE ON public.platform_complaints
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================================
-- school_ad_campaigns
-- =============================================================
CREATE TABLE IF NOT EXISTS public.school_ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN
    ('admission_drive','brand_awareness','event_promotion',
     'achievement_showcase','enrollment_boost')),
  target_platform text NOT NULL CHECK (target_platform IN ('meta','tiktok','both')),
  target_location text,
  target_radius_km integer DEFAULT 10,
  target_age_group text DEFAULT '25-55',
  campaign_objective text,
  budget_naira numeric(10,2) NOT NULL CHECK (budget_naira >= 10000),
  campaign_duration_days integer NOT NULL CHECK (campaign_duration_days > 0),
  start_date date,
  status text DEFAULT 'requested' CHECK (status IN
    ('requested','approved','running','paused','completed','rejected')),
  impressions integer DEFAULT 0,
  reach integer DEFAULT 0,
  clicks integer DEFAULT 0,
  leads_generated integer DEFAULT 0,
  admission_inquiries integer DEFAULT 0,
  vibeora_notes text,
  rejection_reason text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_ad_campaigns TO authenticated;
GRANT ALL ON public.school_ad_campaigns TO service_role;
ALTER TABLE public.school_ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_school_read" ON public.school_ad_campaigns
  FOR SELECT USING (school_id = public.get_my_school_id() OR public.is_super_admin());
CREATE POLICY "ads_school_insert" ON public.school_ad_campaigns
  FOR INSERT WITH CHECK (school_id = public.get_my_school_id());
CREATE POLICY "ads_super_admin_all" ON public.school_ad_campaigns
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE TRIGGER trg_school_ad_campaigns_touch BEFORE UPDATE ON public.school_ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =============================================================
-- Default staff types seeder function (idempotent, called per school)
-- =============================================================
CREATE OR REPLACE FUNCTION public.seed_default_staff_types(_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seeds text[][] := ARRAY[
    -- category, staff_type
    ['Teaching','Head Teacher'], ['Teaching','Class Teacher'],
    ['Teaching','Subject Teacher'], ['Teaching','Special Needs Teacher'],
    ['Teaching','Music Teacher'], ['Teaching','Physical Education Teacher'],
    ['Teaching','Library Teacher'], ['Teaching','ICT Teacher'],
    ['Teaching','Counselor'],
    ['Administrative','School Secretary'], ['Administrative','Administrative Officer'],
    ['Administrative','Admissions Officer'], ['Administrative','Examinations Officer'],
    ['Administrative','Records Officer'],
    ['Support','School Driver'], ['Support','School Bus Conductor'],
    ['Support','Cook'], ['Support','Kitchen Assistant'], ['Support','Cleaner'],
    ['Support','Janitor'], ['Support','Groundskeeper'], ['Support','Security Guard'],
    ['Support','Gate Man'], ['Support','Nurse'], ['Support','School Doctor'],
    ['Support','Laboratory Technician'], ['Support','IT Support'], ['Support','Librarian'],
    ['Care','Nanny'], ['Care','Daycare Attendant'], ['Care','School Nurse'],
    ['Management','Principal'], ['Management','Vice Principal'],
    ['Management','Bursar'], ['Management','Accountant'],
    ['Management','Public Relations Officer'], ['Management','School Chaplain'],
    ['Management','Head of Department']
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(seeds, 1) LOOP
    INSERT INTO public.school_staff_types
      (school_id, staff_type_category, staff_type, order_index)
    VALUES (_school_id, seeds[i][1], seeds[i][2], i)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.seed_default_staff_types(uuid) TO authenticated, service_role;
