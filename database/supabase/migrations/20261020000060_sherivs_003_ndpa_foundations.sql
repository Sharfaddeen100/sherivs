-- =============================================================================
-- SHERIVS-003: NDPA 2023 compliance foundations.
-- Verified ONLY on a local disposable loopback Supabase stack.
--
-- Adds (all school_id-scoped, RLS enabled, client writes revoked):
--   consent_records / consent_events                 purpose-based guardian consent
--   data_subject_requests / data_subject_request_events   access/erasure workflow
--   security_incidents                                breach register (72h NDPC clock)
--   retention_dry_run()                               read-only report, never deletes
-- Writes to consent_*, DSR status workflow and security_incidents happen only
-- through server functions using the service role. LEGAL REVIEW REQUIRED for
-- the retention periods surfaced by retention_dry_run() (provisional defaults,
-- see architecture/coregrid-mvp-architecture/RETENTION_POLICY_SCHEDULE.json).
-- =============================================================================
BEGIN;

-- ---------------------------------------------------------------- helpers ---
CREATE OR REPLACE FUNCTION public.is_guardian_of_student(_student_id uuid, _school_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.parent_student_map psm
     WHERE psm.parent_id = auth.uid()
       AND psm.student_id = _student_id
       AND psm.school_id = _school_id
  );
$$;
REVOKE ALL ON FUNCTION public.is_guardian_of_student(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_guardian_of_student(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ndpa_forbid_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME USING ERRCODE = '42501';
END;
$$;

-- ---------------------------------------------------------- consent_records --
CREATE TABLE public.consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guardian_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  purpose text NOT NULL CHECK (purpose IN ('core_education','photos_media','ai_processing','messaging_sms_whatsapp')),
  status text NOT NULL CHECK (status IN ('granted','withdrawn')),
  policy_version text NOT NULL,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  capture_method text NOT NULL CHECK (capture_method IN ('web_form','paper_signed','verbal_recorded','admin_entered')),
  captured_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, purpose)
);
CREATE INDEX idx_consent_records_school ON public.consent_records(school_id);

CREATE TABLE public.consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  consent_id uuid NOT NULL REFERENCES public.consent_records(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('core_education','photos_media','ai_processing','messaging_sms_whatsapp')),
  action text NOT NULL CHECK (action IN ('grant','withdraw')),
  policy_version text NOT NULL,
  actor_id uuid,
  capture_method text NOT NULL CHECK (capture_method IN ('web_form','paper_signed','verbal_recorded','admin_entered')),
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_consent_events_school ON public.consent_events(school_id);
CREATE INDEX idx_consent_events_consent ON public.consent_events(consent_id);

CREATE OR REPLACE FUNCTION public.consent_records_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = NEW.student_id AND school_id = NEW.school_id) THEN
    RAISE EXCEPTION 'consent_records: student does not belong to school' USING ERRCODE = '23514';
  END IF;
  IF NEW.guardian_user_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.guardian_user_id AND school_id = NEW.school_id) THEN
    RAISE EXCEPTION 'consent_records: guardian does not belong to school' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.school_id <> OLD.school_id OR NEW.student_id <> OLD.student_id OR NEW.purpose <> OLD.purpose) THEN
    RAISE EXCEPTION 'consent_records: school/student/purpose are immutable' USING ERRCODE = '23514';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_consent_records_guard BEFORE INSERT OR UPDATE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION public.consent_records_guard();
CREATE TRIGGER trg_consent_events_append_only BEFORE UPDATE OR DELETE ON public.consent_events
  FOR EACH ROW EXECUTE FUNCTION public.ndpa_forbid_mutation();

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY consent_records_select ON public.consent_records FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (public.is_school_admin() AND school_id = public.get_my_school_id())
    OR public.is_guardian_of_student(student_id, school_id)
  );
CREATE POLICY consent_events_select ON public.consent_events FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (public.is_school_admin() AND school_id = public.get_my_school_id())
    OR public.is_guardian_of_student(student_id, school_id)
  );

-- ------------------------------------------------------ data_subject_requests --
CREATE TABLE public.data_subject_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  subject_type text NOT NULL CHECK (subject_type IN ('student','user')),
  subject_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  subject_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  requester_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('access_export','erasure')),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','verified','completed','rejected')),
  received_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  verified_by uuid,
  verified_at timestamptz,
  completed_at timestamptz,
  rejection_reason text,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (subject_type = 'student' AND subject_student_id IS NOT NULL AND subject_user_id IS NULL)
    OR (subject_type = 'user' AND subject_user_id IS NOT NULL AND subject_student_id IS NULL)
  )
);
CREATE INDEX idx_dsr_school ON public.data_subject_requests(school_id);
CREATE INDEX idx_dsr_requester ON public.data_subject_requests(requester_user_id);

CREATE TABLE public.data_subject_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.data_subject_requests(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid,
  note text,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dsr_events_school ON public.data_subject_request_events(school_id);
CREATE INDEX idx_dsr_events_request ON public.data_subject_request_events(request_id);

CREATE OR REPLACE FUNCTION public.dsr_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.requester_user_id AND school_id = NEW.school_id) THEN
    RAISE EXCEPTION 'data_subject_requests: requester does not belong to school' USING ERRCODE = '23514';
  END IF;
  IF NEW.subject_student_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.students WHERE id = NEW.subject_student_id AND school_id = NEW.school_id) THEN
    RAISE EXCEPTION 'data_subject_requests: student does not belong to school' USING ERRCODE = '23514';
  END IF;
  IF NEW.subject_user_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.subject_user_id AND school_id = NEW.school_id) THEN
    RAISE EXCEPTION 'data_subject_requests: user does not belong to school' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.school_id <> OLD.school_id OR NEW.requester_user_id <> OLD.requester_user_id
       OR NEW.request_type <> OLD.request_type OR NEW.subject_type <> OLD.subject_type THEN
      RAISE EXCEPTION 'data_subject_requests: identity fields are immutable' USING ERRCODE = '23514';
    END IF;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_dsr_guard BEFORE INSERT OR UPDATE ON public.data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION public.dsr_guard();
CREATE TRIGGER trg_dsr_events_append_only BEFORE UPDATE OR DELETE ON public.data_subject_request_events
  FOR EACH ROW EXECUTE FUNCTION public.ndpa_forbid_mutation();

ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_request_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY dsr_select ON public.data_subject_requests FOR SELECT TO authenticated
  USING (
    requester_user_id = auth.uid()
    OR public.is_super_admin()
    OR (public.is_school_admin() AND school_id = public.get_my_school_id())
  );
CREATE POLICY dsr_insert ON public.data_subject_requests FOR INSERT TO authenticated
  WITH CHECK (
    requester_user_id = auth.uid()
    AND school_id = public.get_my_school_id()
    AND status = 'received'
    AND (
      (subject_type = 'user' AND subject_user_id = auth.uid())
      OR (subject_type = 'student' AND public.is_guardian_of_student(subject_student_id, school_id))
    )
  );
CREATE POLICY dsr_events_select ON public.data_subject_request_events FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (public.is_school_admin() AND school_id = public.get_my_school_id())
    OR EXISTS (SELECT 1 FROM public.data_subject_requests r
                WHERE r.id = request_id AND r.requester_user_id = auth.uid())
  );

-- ------------------------------------------------------- security_incidents --
-- command-incidents.ts is an in-memory contract with no backing table, so the
-- breach register is created here. school_id NULL = platform-wide incident.
CREATE TABLE public.security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  detected_at timestamptz NOT NULL DEFAULT now(),
  reported_by uuid,
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  category text NOT NULL,
  description text NOT NULL,
  personal_data_involved boolean NOT NULL DEFAULT false,
  affected_subjects_estimate integer CHECK (affected_subjects_estimate IS NULL OR affected_subjects_estimate >= 0),
  ndpc_notification_due_at timestamptz NOT NULL,
  ndpc_notified_at timestamptz,
  guardians_notified_at timestamptz,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','contained','notified','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_security_incidents_school ON public.security_incidents(school_id);

-- timestamptz + interval is not immutable, so a generated column is not allowed.
CREATE OR REPLACE FUNCTION public.security_incidents_set_due()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.ndpc_notification_due_at := COALESCE(NEW.ndpc_notification_due_at, NEW.detected_at + interval '72 hours');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_security_incidents_due BEFORE INSERT ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION public.security_incidents_set_due();

ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY security_incidents_select ON public.security_incidents FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (school_id IS NOT NULL AND public.is_school_admin() AND school_id = public.get_my_school_id())
  );

-- ------------------------------------------------------------------ grants --
REVOKE ALL ON public.consent_records, public.consent_events,
              public.data_subject_requests, public.data_subject_request_events,
              public.security_incidents FROM anon, authenticated;
GRANT SELECT ON public.consent_records, public.consent_events,
                public.data_subject_request_events, public.security_incidents TO authenticated;
GRANT SELECT ON public.data_subject_requests TO authenticated;
GRANT INSERT (school_id, subject_type, subject_student_id, subject_user_id, requester_user_id, request_type)
  ON public.data_subject_requests TO authenticated;
GRANT ALL ON public.consent_records, public.consent_events,
             public.data_subject_requests, public.data_subject_request_events,
             public.security_incidents TO service_role;

-- --------------------------------------------------------- retention dry run --
-- Mirrors RETENTION_POLICY_SCHEDULE.json education-institution defaults
-- (PROVISIONAL, LEGAL REVIEW REQUIRED). Reports only; NEVER deletes.
CREATE OR REPLACE FUNCTION public.retention_dry_run()
RETURNS TABLE (category text, table_name text, record_count bigint, oldest timestamptz, retention text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- current_user is the owner inside SECURITY DEFINER; the session role GUC is the caller's.
  IF NOT (current_setting('role', true) = 'service_role' OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Forbidden: retention_dry_run is restricted to service_role or super admin'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT 'attendance-activity'::text, 'attendance'::text, count(*), min(a.date)::timestamptz,
         'RP-ATTND-EDU 730d'::text
    FROM public.attendance a WHERE a.date < (now() - interval '730 days')::date
  UNION ALL
  SELECT 'communication', 'messages', count(*), min(m.created_at), 'RP-COMMS-EDU 365d'
    FROM public.messages m WHERE m.created_at < now() - interval '365 days'
  UNION ALL
  SELECT 'financial', 'fees', count(*), min(f.created_at), 'RP-FINAN-EDU 2555d'
    FROM public.fees f WHERE f.created_at < now() - interval '2555 days'
  UNION ALL
  SELECT 'financial', 'student_platform_fee_ledger', count(*), min(l.created_at), 'RP-FINAN-EDU 2555d'
    FROM public.student_platform_fee_ledger l WHERE l.created_at < now() - interval '2555 days'
  UNION ALL
  SELECT 'financial', 'staff_payroll', count(*), min(p.created_at), 'RP-FINAN-EDU 2555d'
    FROM public.staff_payroll p WHERE p.created_at < now() - interval '2555 days'
  UNION ALL
  SELECT 'audit', 'audit_logs', count(*), min(al.created_at), 'RP-AUDIT-EDU 2555d (tombstone only, ADR-005)'
    FROM public.audit_logs al WHERE al.created_at < now() - interval '2555 days';
END;
$$;
REVOKE ALL ON FUNCTION public.retention_dry_run() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.retention_dry_run() TO authenticated, service_role;

COMMIT;
