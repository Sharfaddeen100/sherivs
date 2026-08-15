
CREATE TABLE public.staff_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  basic_salary numeric NOT NULL DEFAULT 0,
  housing_allowance numeric DEFAULT 0,
  transport_allowance numeric DEFAULT 0,
  other_allowances numeric DEFAULT 0,
  tax_deduction numeric DEFAULT 0,
  pension_deduction numeric DEFAULT 0,
  other_deductions numeric DEFAULT 0,
  loan_deduction numeric DEFAULT 0,
  gross_salary numeric GENERATED ALWAYS AS (basic_salary + COALESCE(housing_allowance,0) + COALESCE(transport_allowance,0) + COALESCE(other_allowances,0)) STORED,
  net_salary numeric GENERATED ALWAYS AS (basic_salary + COALESCE(housing_allowance,0) + COALESCE(transport_allowance,0) + COALESCE(other_allowances,0) - COALESCE(tax_deduction,0) - COALESCE(pension_deduction,0) - COALESCE(other_deductions,0) - COALESCE(loan_deduction,0)) STORED,
  status text DEFAULT 'draft' CHECK (status IN ('draft','approved','paid')),
  payment_date date,
  approved_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, user_id, month, year)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_payroll TO authenticated;
GRANT ALL ON public.staff_payroll TO service_role;

ALTER TABLE public.staff_payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_payroll_school_isolation" ON public.staff_payroll
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

CREATE INDEX idx_staff_payroll_school_month ON public.staff_payroll(school_id, year, month);
CREATE INDEX idx_staff_payroll_user ON public.staff_payroll(user_id);

CREATE TABLE public.staff_leave (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('annual','sick','maternity','paternity','study','emergency','unpaid')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested integer,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_leave TO authenticated;
GRANT ALL ON public.staff_leave TO service_role;

ALTER TABLE public.staff_leave ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_leave_school_isolation" ON public.staff_leave
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

CREATE INDEX idx_staff_leave_school_status ON public.staff_leave(school_id, status);
CREATE INDEX idx_staff_leave_user ON public.staff_leave(user_id);
