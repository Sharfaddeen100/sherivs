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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_biometrics TO authenticated;
GRANT ALL ON public.teacher_biometrics TO service_role;
ALTER TABLE public.teacher_biometrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "biometrics_school_isolation" ON public.teacher_biometrics
  TO authenticated
  USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());

CREATE TABLE IF NOT EXISTS public.attendance_verification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  verification_type text DEFAULT 'qr_face' CHECK (verification_type IN ('qr_face','manual','admin_override')),
  verification_time timestamptz DEFAULT now(),
  latitude numeric(10,7),
  longitude numeric(10,7),
  accuracy_meters numeric(8,2),
  within_geofence boolean DEFAULT false,
  face_verified boolean DEFAULT false,
  device_id text,
  ip_address text,
  result text DEFAULT 'pending' CHECK (result IN ('success','failed','flagged','pending')),
  failure_reason text,
  qr_token_used text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_verification_log TO authenticated;
GRANT ALL ON public.attendance_verification_log TO service_role;
ALTER TABLE public.attendance_verification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verification_log_school_isolation" ON public.attendance_verification_log
  TO authenticated
  USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());

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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_geofence TO authenticated;
GRANT ALL ON public.school_geofence TO service_role;
ALTER TABLE public.school_geofence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geofence_school_isolation" ON public.school_geofence
  TO authenticated
  USING (school_id = public.get_my_school_id() OR public.is_super_admin())
  WITH CHECK (school_id = public.get_my_school_id() OR public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_verification_log_school_time
  ON public.attendance_verification_log(school_id, verification_time DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_biometrics_user
  ON public.teacher_biometrics(user_id, school_id);