
-- Social media columns on schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS social_media_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_facebook_url text,
  ADD COLUMN IF NOT EXISTS social_twitter_url text,
  ADD COLUMN IF NOT EXISTS social_instagram_url text,
  ADD COLUMN IF NOT EXISTS social_youtube_url text,
  ADD COLUMN IF NOT EXISTS social_linkedin_url text,
  ADD COLUMN IF NOT EXISTS social_tiktok_url text,
  ADD COLUMN IF NOT EXISTS admission_deadline date,
  ADD COLUMN IF NOT EXISTS admission_timeline jsonb DEFAULT '[]'::jsonb;

-- ============ admission_applications ============
CREATE TABLE IF NOT EXISTS public.admission_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  application_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','interview_scheduled','accepted','rejected','withdrawn')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  student_first_name text NOT NULL,
  student_last_name text NOT NULL,
  student_date_of_birth date NOT NULL,
  student_gender text,
  student_nationality text,
  student_religion text,
  student_blood_group text,
  student_genotype text,
  student_address text,
  applying_for_class text NOT NULL,
  academic_year_applying text NOT NULL,
  previous_school_name text,
  previous_school_address text,
  previous_class_completed text,
  year_completed text,
  reason_for_leaving text,
  academic_achievements text,
  was_disciplined boolean DEFAULT false,
  discipline_explanation text,
  parent_one_name text NOT NULL,
  parent_one_relationship text NOT NULL,
  parent_one_phone text NOT NULL,
  parent_one_email text NOT NULL,
  parent_one_occupation text,
  parent_one_address text,
  parent_two_name text,
  parent_two_relationship text,
  parent_two_phone text,
  parent_two_email text,
  parent_two_occupation text,
  parent_two_address text,
  guardian_name text,
  guardian_relationship text,
  guardian_phone text,
  emergency_contact_name text,
  emergency_contact_relationship text,
  emergency_contact_phone text,
  medical_conditions text,
  has_special_needs boolean DEFAULT false,
  disabilities_or_special_needs text,
  has_allergies boolean DEFAULT false,
  allergies_detail text,
  interview_date timestamptz,
  interview_notes text,
  decision_notes text,
  documents_uploaded jsonb NOT NULL DEFAULT '{}'::jsonb,
  interview_responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.admission_applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.admission_applications TO authenticated;
GRANT ALL ON public.admission_applications TO service_role;

ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (public form)
CREATE POLICY "public can submit applications"
  ON public.admission_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only school admins / super admins can read / update
CREATE POLICY "school admins read applications"
  ON public.admission_applications FOR SELECT
  TO authenticated
  USING (school_id = public.get_my_school_id() OR public.is_super_admin());

CREATE POLICY "school admins update applications"
  ON public.admission_applications FOR UPDATE
  TO authenticated
  USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());

CREATE TRIGGER admission_applications_touch
  BEFORE UPDATE ON public.admission_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS admission_applications_school_idx
  ON public.admission_applications (school_id, submitted_at DESC);

-- ============ Face lockout columns on users ============
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS face_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS face_locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS face_lock_reason text,
  ADD COLUMN IF NOT EXISTS is_face_locked boolean NOT NULL DEFAULT false;

-- ============ Digital twin tables (enterprise-gated in app) ============
CREATE TABLE IF NOT EXISTS public.digital_twin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid UNIQUE NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  twin_name text NOT NULL DEFAULT 'School Delegate',
  twin_voice text NOT NULL DEFAULT 'professional_female',
  twin_personality text NOT NULL DEFAULT 'professional, caring, authoritative',
  school_knowledge jsonb NOT NULL DEFAULT '{}'::jsonb,
  trigger_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_twin_config TO authenticated;
GRANT ALL ON public.digital_twin_config TO service_role;

ALTER TABLE public.digital_twin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage twin config"
  ON public.digital_twin_config FOR ALL
  TO authenticated
  USING (school_id = public.get_my_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_my_school_id() AND public.is_school_admin());

CREATE TRIGGER digital_twin_config_touch
  BEFORE UPDATE ON public.digital_twin_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.digital_twin_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  twin_config_id uuid REFERENCES public.digital_twin_config(id) ON DELETE SET NULL,
  call_type text CHECK (call_type IN ('outbound','inbound')),
  trigger_event text,
  recipient_name text,
  recipient_phone text,
  recipient_role text,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  call_status text NOT NULL DEFAULT 'pending' CHECK (call_status IN ('pending','in_progress','completed','failed','no_answer')),
  call_duration_seconds integer,
  call_transcript text,
  call_summary text,
  call_outcome text,
  call_recording_url text,
  twilio_call_sid text,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_twin_calls TO authenticated;
GRANT ALL ON public.digital_twin_calls TO service_role;

ALTER TABLE public.digital_twin_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read twin calls"
  ON public.digital_twin_calls FOR SELECT
  TO authenticated
  USING (school_id = public.get_my_school_id() AND public.is_school_admin());

CREATE POLICY "admins insert twin calls"
  ON public.digital_twin_calls FOR INSERT
  TO authenticated
  WITH CHECK (school_id = public.get_my_school_id() AND public.is_school_admin());

CREATE POLICY "admins update twin calls"
  ON public.digital_twin_calls FOR UPDATE
  TO authenticated
  USING (school_id = public.get_my_school_id() AND public.is_school_admin())
  WITH CHECK (school_id = public.get_my_school_id() AND public.is_school_admin());

CREATE INDEX IF NOT EXISTS digital_twin_calls_school_idx
  ON public.digital_twin_calls (school_id, created_at DESC);
