
-- ============================================================
-- UNIVERSAL SCHOOL OS — Foundation schema
-- ============================================================

-- ---------- schools (tenant root) ----------
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  domain text UNIQUE,
  address text,
  phone text,
  email text,
  logo_url text,
  about text,
  motto text,
  founded_year integer,
  school_vision text,
  school_mission text,
  admission_requirements text,
  website_url text,
  facebook_url text,
  twitter_url text,
  instagram_url text,
  office_hours text,
  primary_color text DEFAULT '#0d9488',
  secondary_color text DEFAULT '#f59e0b',
  subscription_tier text DEFAULT 'trial' CHECK (subscription_tier IN ('trial','starter','growth','professional','enterprise')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active','suspended','expired','cancelled')),
  subscription_expires_at timestamptz,
  monthly_fee numeric,
  paystack_public_key text,
  paystack_secret_key text,
  active_features jsonb DEFAULT '{}'::jsonb,
  section_hero_enabled boolean DEFAULT true,
  section_about_enabled boolean DEFAULT true,
  section_programs_enabled boolean DEFAULT true,
  section_facilities_enabled boolean DEFAULT true,
  section_faculty_enabled boolean DEFAULT true,
  section_news_enabled boolean DEFAULT true,
  section_testimonials_enabled boolean DEFAULT true,
  section_faqs_enabled boolean DEFAULT true,
  section_contact_enabled boolean DEFAULT true,
  section_why_us_enabled boolean DEFAULT true,
  section_blog_enabled boolean DEFAULT false,
  section_admissions_enabled boolean DEFAULT true,
  section_rules_enabled boolean DEFAULT true,
  section_privacy_enabled boolean DEFAULT true,
  hero_headline text,
  hero_subheadline text,
  hero_cta_text text DEFAULT 'Apply for Admission',
  privacy_policy text,
  school_rules text,
  terms_conditions text,
  max_students integer DEFAULT 100,
  max_teachers integer DEFAULT 10,
  is_active boolean DEFAULT true,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ---------- super_admins ----------
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text DEFAULT 'super_admin',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ---------- users ----------
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL CHECK (role IN ('admin','principal','teacher','parent','student','bursar','hq')),
  avatar_url text,
  address text,
  gender text,
  date_of_birth date,
  nin text,
  emergency_contact text,
  emergency_contact_name text,
  subject_specialty text,
  qualification text,
  years_experience integer DEFAULT 0,
  employment_type text DEFAULT 'full_time',
  salary numeric,
  bank_name text,
  account_number text,
  account_name text,
  date_enrolled date,
  next_of_kin_name text,
  next_of_kin_phone text,
  face_biometric jsonb,
  face_registered_at timestamptz,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_users_school ON public.users(school_id);

-- ============================================================
-- Helper functions (SECURITY DEFINER, avoid RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE id = auth.uid() AND is_active = true);
$$;

CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','principal'));
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============================================================
-- Remaining tenant tables
-- ============================================================

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  grade_level text,
  teacher_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  academic_year text,
  capacity integer DEFAULT 40,
  room text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_classes_school ON public.classes(school_id);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  admission_number text,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  date_of_birth date,
  gender text,
  blood_group text,
  genotype text,
  home_address text,
  state_of_origin text,
  lga text,
  religion text,
  nationality text DEFAULT 'Nigerian',
  medical_conditions text,
  disability_notes text,
  parent_name text,
  parent_phone text,
  parent_email text,
  parent_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  previous_school text,
  enrollment_date date DEFAULT current_date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (school_id, admission_number)
);
CREATE INDEX idx_students_school ON public.students(school_id);
CREATE INDEX idx_students_class ON public.students(class_id);

CREATE TABLE public.parent_student_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship text DEFAULT 'Parent',
  is_primary_contact boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (parent_id, student_id)
);
CREATE INDEX idx_psm_school ON public.parent_student_map(school_id);

CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  subject text NOT NULL,
  ca_score numeric DEFAULT 0,
  exam_score numeric DEFAULT 0,
  total_score numeric GENERATED ALWAYS AS (COALESCE(ca_score,0) + COALESCE(exam_score,0)) STORED,
  grade text,
  grade_remark text,
  term text NOT NULL,
  academic_year text NOT NULL,
  teacher_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, subject, term, academic_year)
);
CREATE INDEX idx_grades_school ON public.grades(school_id);

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present','absent','late','excused')),
  marked_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, date)
);
CREATE INDEX idx_attendance_school ON public.attendance(school_id);

CREATE TABLE public.attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('sign_in','sign_out')),
  "timestamp" timestamptz DEFAULT now(),
  gps_latitude numeric,
  gps_longitude numeric,
  inside_geofence boolean,
  face_match_score numeric,
  face_matched boolean DEFAULT false,
  verified boolean DEFAULT false,
  fraud_detected boolean DEFAULT false,
  fraud_flags jsonb DEFAULT '{}'::jsonb,
  qr_token text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_attlogs_school ON public.attendance_logs(school_id);

CREATE TABLE public.lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  title text NOT NULL,
  subject text,
  topic text,
  date_planned date,
  duration_minutes integer DEFAULT 60,
  description text,
  learning_objectives jsonb DEFAULT '[]'::jsonb,
  materials_needed jsonb DEFAULT '[]'::jsonb,
  activities jsonb DEFAULT '[]'::jsonb,
  assessment_methods jsonb DEFAULT '[]'::jsonb,
  homework_assignment text,
  file_urls jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','needs_revision')),
  review_notes text,
  admin_viewed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_lp_school ON public.lesson_plans(school_id);

CREATE TABLE public.timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  term text NOT NULL,
  generated_by text DEFAULT 'ai',
  is_active boolean DEFAULT true,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (class_id, academic_year, term)
);

CREATE TABLE public.timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id uuid NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  period_number integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  subject text NOT NULL,
  teacher_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  room text,
  is_break boolean DEFAULT false,
  break_label text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (timetable_id, day_of_week, period_number)
);

CREATE TABLE public.school_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  event_type text DEFAULT 'general',
  color text DEFAULT '#0d9488',
  all_day boolean DEFAULT true,
  start_time time,
  end_time time,
  target_audience text DEFAULT 'all',
  location text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category text DEFAULT 'general',
  cover_image_url text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  target_audience text DEFAULT 'all',
  is_pinned boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  event_date date NOT NULL,
  end_date date,
  event_time time,
  end_time time,
  event_type text DEFAULT 'general',
  target_audience text DEFAULT 'all',
  is_published boolean DEFAULT true,
  cover_image_url text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.teacher_performance_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attendance_rate numeric DEFAULT 0,
  punctuality_score numeric DEFAULT 0,
  late_count_30d integer DEFAULT 0,
  absent_count_30d integer DEFAULT 0,
  lesson_plans_uploaded integer DEFAULT 0,
  avg_lesson_plan_quality numeric DEFAULT 0,
  curriculum_coverage numeric DEFAULT 0,
  student_avg_improvement numeric DEFAULT 0,
  burnout_risk_score numeric DEFAULT 0,
  burnout_risk_level text DEFAULT 'none',
  resignation_probability numeric DEFAULT 0,
  promotion_readiness_score numeric DEFAULT 0,
  overall_teacher_health_score numeric DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE (school_id, teacher_id)
);

CREATE TABLE public.fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_type text NOT NULL,
  amount numeric NOT NULL,
  due_date date,
  paid_amount numeric DEFAULT 0,
  status text DEFAULT 'unpaid' CHECK (status IN ('unpaid','partial','paid')),
  paystack_reference text,
  paystack_access_code text,
  paid_at timestamptz,
  term text,
  academic_year text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.fraud_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  attempted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  fraud_type text,
  fraud_score numeric,
  fraud_flags jsonb DEFAULT '{}'::jsonb,
  captured_face_url text,
  face_similarity numeric,
  gps_latitude numeric,
  gps_longitude numeric,
  status text DEFAULT 'blocked',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  type text CHECK (type IN ('sign_in','sign_out')),
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text,
  message text NOT NULL,
  type text DEFAULT 'system',
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  avatar_url text,
  rating integer DEFAULT 5,
  is_published boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.academic_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  age_range text,
  duration text,
  features jsonb DEFAULT '[]'::jsonb,
  subjects jsonb DEFAULT '[]'::jsonb,
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.school_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🏫',
  image_url text,
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.why_us_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text DEFAULT '✅',
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_image_url text,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category text DEFAULT 'general',
  is_published boolean DEFAULT false,
  published_at timestamptz,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (school_id, slug)
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  plan text NOT NULL,
  status text DEFAULT 'active',
  amount_paid numeric DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  paystack_reference text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.super_admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.super_admins(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  provider text DEFAULT 'paystack',
  event_type text,
  payload jsonb,
  processing_status text DEFAULT 'pending',
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject text,
  body text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- updated_at triggers
CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_lp_updated BEFORE UPDATE ON public.lesson_plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_news_updated BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_blog_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- GRANTS + RLS + POLICIES
-- ============================================================

-- Convenience: bulk grant authenticated + service_role on every tenant table
DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'schools','super_admins','users','classes','students','parent_student_map',
  'grades','attendance','attendance_logs','lesson_plans','timetables','timetable_slots',
  'school_calendar','news','events','teacher_performance_profiles','fees',
  'fraud_attempts','qr_tokens','notifications','testimonials','faqs',
  'academic_programs','school_facilities','why_us_items','blog_posts',
  'subscriptions','super_admin_logs','webhook_logs','messages','audit_logs'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Public anon SELECT on public-readable tables
GRANT SELECT ON public.schools TO anon;
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT ON public.academic_programs TO anon;
GRANT SELECT ON public.school_facilities TO anon;
GRANT SELECT ON public.why_us_items TO anon;
GRANT SELECT ON public.news TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.blog_posts TO anon;

-- ---------- schools policies ----------
CREATE POLICY "Anyone can read active schools" ON public.schools FOR SELECT
  USING (is_active = true OR public.is_super_admin() OR id = public.get_my_school_id());
CREATE POLICY "Super admin manages schools" ON public.schools FOR ALL
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "School admin updates own school" ON public.schools FOR UPDATE
  USING (id = public.get_my_school_id() AND public.is_school_admin())
  WITH CHECK (id = public.get_my_school_id() AND public.is_school_admin());

-- ---------- super_admins policies ----------
CREATE POLICY "Super admin reads super_admins" ON public.super_admins FOR SELECT
  USING (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Super admin manages super_admins" ON public.super_admins FOR ALL
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ---------- users policies ----------
CREATE POLICY "User reads self" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Same school users can see each other" ON public.users FOR SELECT
  USING (school_id = public.get_my_school_id() OR public.is_super_admin());
CREATE POLICY "User updates self" ON public.users FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "School admin manages users" ON public.users FOR ALL
  USING ((school_id = public.get_my_school_id() AND public.is_school_admin()) OR public.is_super_admin())
  WITH CHECK ((school_id = public.get_my_school_id() AND public.is_school_admin()) OR public.is_super_admin());

-- ---------- generic tenant tables: school_id = mine ----------
DO $$
DECLARE t text;
DECLARE tenant_tables text[] := ARRAY[
  'classes','students','parent_student_map','grades','attendance','attendance_logs',
  'lesson_plans','timetables','timetable_slots','school_calendar',
  'teacher_performance_profiles','fees','fraud_attempts','qr_tokens',
  'notifications','subscriptions','webhook_logs','messages','audit_logs'
];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format($p$CREATE POLICY "tenant_all_%1$s" ON public.%1$I FOR ALL
      USING (school_id = public.get_my_school_id() OR public.is_super_admin())
      WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin())$p$, t);
  END LOOP;
END $$;

-- ---------- marketing CMS: tenant write, public read of published ----------
DO $$
DECLARE t text;
DECLARE cms_tables text[] := ARRAY[
  'testimonials','faqs','academic_programs','school_facilities','why_us_items','news','events','blog_posts'
];
BEGIN
  FOREACH t IN ARRAY cms_tables LOOP
    EXECUTE format($p$CREATE POLICY "tenant_manage_%1$s" ON public.%1$I FOR ALL
      USING (school_id = public.get_my_school_id() OR public.is_super_admin())
      WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin())$p$, t);
    EXECUTE format($p$CREATE POLICY "public_read_%1$s" ON public.%1$I FOR SELECT
      USING (is_published = true)$p$, t);
  END LOOP;
END $$;

-- ---------- super_admin_logs ----------
CREATE POLICY "Super admin reads logs" ON public.super_admin_logs FOR ALL
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
