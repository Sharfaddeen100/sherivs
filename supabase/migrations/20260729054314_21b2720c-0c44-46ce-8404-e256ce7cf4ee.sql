CREATE TABLE IF NOT EXISTS public.teacher_biometrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  enrollment_status text DEFAULT 'pending' CHECK (enrollment_status IN ('pending','enrolled','suspended')),
  enrolled_at timestamptz,
  device_id text,
  device_model text,
  face_template_hash text,
  enrollment_attempts integer DEFAULT 0,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.school_geofence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  campus_name text DEFAULT 'Main Campus',
  latitude numeric(10,7) NOT NULL,
  longitude numeric(10,7) NOT NULL,
  radius_meters integer DEFAULT 150,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, campus_name)
);

CREATE TABLE IF NOT EXISTS public.attendance_verification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  verification_type text DEFAULT 'qr_face',
  verification_time timestamptz DEFAULT now(),
  latitude numeric(10,7),
  longitude numeric(10,7),
  accuracy_meters numeric(8,2),
  within_geofence boolean DEFAULT false,
  face_verified boolean DEFAULT false,
  device_id text,
  result text DEFAULT 'pending' CHECK (result IN ('success','failed','flagged','pending')),
  failure_reason text,
  qr_token_used text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS push_token text,
  ADD COLUMN IF NOT EXISTS push_token_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  portal text NOT NULL,
  title text,
  messages jsonb DEFAULT '[]'::jsonb,
  message_count integer DEFAULT 0,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_interaction_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  portal text NOT NULL,
  prompt_text text,
  response_text text,
  model_used text,
  tokens_in integer DEFAULT 0,
  tokens_out integer DEFAULT 0,
  latency_ms integer,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id),
  subject text,
  duration_minutes integer,
  session_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_biometrics TO authenticated;
GRANT ALL ON public.teacher_biometrics TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_geofence TO authenticated;
GRANT ALL ON public.school_geofence TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_verification_log TO authenticated;
GRANT ALL ON public.attendance_verification_log TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_interaction_log TO authenticated;
GRANT ALL ON public.ai_interaction_log TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;

ALTER TABLE public.teacher_biometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_geofence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_verification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interaction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename = 'teacher_biometrics' AND policyname = 'school_isolation') THEN
    CREATE POLICY "school_isolation" ON public.teacher_biometrics TO authenticated
      USING (school_id = public.get_my_school_id() OR public.is_super_admin())
      WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename = 'school_geofence' AND policyname = 'school_isolation') THEN
    CREATE POLICY "school_isolation" ON public.school_geofence TO authenticated
      USING (school_id = public.get_my_school_id() OR public.is_super_admin())
      WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename = 'attendance_verification_log' AND policyname = 'school_isolation') THEN
    CREATE POLICY "school_isolation" ON public.attendance_verification_log TO authenticated
      USING (school_id = public.get_my_school_id() OR public.is_super_admin())
      WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename = 'ai_conversations' AND policyname = 'user_own_conversations') THEN
    CREATE POLICY "user_own_conversations" ON public.ai_conversations TO authenticated
      USING (user_id = auth.uid() OR public.is_super_admin())
      WITH CHECK (user_id = auth.uid() OR public.is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename = 'ai_interaction_log' AND policyname = 'school_isolation') THEN
    CREATE POLICY "school_isolation" ON public.ai_interaction_log TO authenticated
      USING (school_id = public.get_my_school_id() OR public.is_super_admin())
      WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename = 'study_sessions' AND policyname = 'school_isolation') THEN
    CREATE POLICY "school_isolation" ON public.study_sessions TO authenticated
      USING (school_id = public.get_my_school_id() OR public.is_super_admin())
      WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, portal, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_log_school_time ON public.ai_interaction_log(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_student ON public.study_sessions(student_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_verification_log_user ON public.attendance_verification_log(user_id, verification_time DESC);
CREATE INDEX IF NOT EXISTS idx_biometrics_user ON public.teacher_biometrics(user_id, school_id);