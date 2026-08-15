CREATE TABLE IF NOT EXISTS public.student_platform_fee_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  term text NOT NULL,
  fee_type text NOT NULL DEFAULT 'student_intelligence',
  amount numeric NOT NULL DEFAULT 500,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','collected','waived','refunded')),
  collected_at timestamptz,
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, student_id, academic_year, term, fee_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_platform_fee_ledger TO authenticated;
GRANT ALL ON public.student_platform_fee_ledger TO service_role;

ALTER TABLE public.student_platform_fee_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_fee_ledger_school_access"
  ON public.student_platform_fee_ledger
  FOR ALL
  TO authenticated
  USING (
    school_id = public.get_my_school_id()
    OR public.is_super_admin()
  )
  WITH CHECK (
    school_id = public.get_my_school_id()
    OR public.is_super_admin()
  );

CREATE INDEX IF NOT EXISTS idx_platform_fee_ledger
  ON public.student_platform_fee_ledger(school_id, student_id, academic_year, term);

CREATE TRIGGER trg_platform_fee_ledger_updated_at
  BEFORE UPDATE ON public.student_platform_fee_ledger
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();