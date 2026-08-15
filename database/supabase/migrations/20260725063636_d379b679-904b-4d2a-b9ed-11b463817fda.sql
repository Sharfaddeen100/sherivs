
-- Hostel
CREATE TABLE IF NOT EXISTS public.hostel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  room_name text NOT NULL,
  block text,
  floor text,
  capacity integer NOT NULL DEFAULT 4,
  gender text CHECK (gender IN ('male','female','mixed')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostel_rooms TO authenticated;
GRANT ALL ON public.hostel_rooms TO service_role;
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hostel_rooms_school_isolation" ON public.hostel_rooms
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

CREATE TABLE IF NOT EXISTS public.hostel_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.hostel_rooms(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  bed_number integer,
  session text,
  term text,
  allocated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostel_allocations TO authenticated;
GRANT ALL ON public.hostel_allocations TO service_role;
ALTER TABLE public.hostel_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hostel_allocations_school_isolation" ON public.hostel_allocations
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

CREATE TABLE IF NOT EXISTS public.hostel_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.hostel_rooms(id) ON DELETE SET NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  night_check text CHECK (night_check IN ('present','absent','leave','clinic')),
  morning_check text CHECK (morning_check IN ('present','absent','leave','clinic')),
  notes text,
  recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hostel_attendance TO authenticated;
GRANT ALL ON public.hostel_attendance TO service_role;
ALTER TABLE public.hostel_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hostel_attendance_school_isolation" ON public.hostel_attendance
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

-- Clinic
CREATE TABLE IF NOT EXISTS public.clinic_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  visit_time time NOT NULL DEFAULT CURRENT_TIME,
  complaint text,
  diagnosis text,
  treatment text,
  medication_given text,
  temperature numeric,
  blood_pressure text,
  outcome text CHECK (outcome IN ('treated_released','referred','resting','sent_home','emergency')),
  parent_notified boolean NOT NULL DEFAULT false,
  parent_notified_at timestamptz,
  attending_nurse text,
  follow_up_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_visits TO authenticated;
GRANT ALL ON public.clinic_visits TO service_role;
ALTER TABLE public.clinic_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic_visits_school_isolation" ON public.clinic_visits
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

-- Library
CREATE TABLE IF NOT EXISTS public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text,
  isbn text,
  category text,
  copies_total integer NOT NULL DEFAULT 1,
  copies_available integer NOT NULL DEFAULT 1,
  shelf_location text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_books TO authenticated;
GRANT ALL ON public.library_books TO service_role;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "library_books_school_isolation" ON public.library_books
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

CREATE TABLE IF NOT EXISTS public.library_borrowings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  book_id uuid REFERENCES public.library_books(id) ON DELETE SET NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  borrowed_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  returned_date date,
  status text NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed','returned','overdue')),
  fine_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_borrowings TO authenticated;
GRANT ALL ON public.library_borrowings TO service_role;
ALTER TABLE public.library_borrowings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "library_borrowings_school_isolation" ON public.library_borrowings
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

-- Discipline
CREATE TABLE IF NOT EXISTS public.discipline_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  incident_type text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor','moderate','serious','critical')),
  action_taken text,
  parent_notified boolean NOT NULL DEFAULT false,
  parent_notified_at timestamptz,
  follow_up_required boolean NOT NULL DEFAULT false,
  follow_up_date date,
  resolved boolean NOT NULL DEFAULT false,
  recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discipline_records TO authenticated;
GRANT ALL ON public.discipline_records TO service_role;
ALTER TABLE public.discipline_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discipline_records_school_isolation" ON public.discipline_records
  FOR ALL TO authenticated
  USING (school_id = public.get_my_school_id())
  WITH CHECK (school_id = public.get_my_school_id());

-- updated_at triggers
CREATE TRIGGER hostel_rooms_touch BEFORE UPDATE ON public.hostel_rooms FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER hostel_allocations_touch BEFORE UPDATE ON public.hostel_allocations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER hostel_attendance_touch BEFORE UPDATE ON public.hostel_attendance FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER clinic_visits_touch BEFORE UPDATE ON public.clinic_visits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER library_books_touch BEFORE UPDATE ON public.library_books FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER library_borrowings_touch BEFORE UPDATE ON public.library_borrowings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER discipline_records_touch BEFORE UPDATE ON public.discipline_records FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS hostel_rooms_school_idx ON public.hostel_rooms(school_id);
CREATE INDEX IF NOT EXISTS hostel_allocations_school_idx ON public.hostel_allocations(school_id, is_active);
CREATE INDEX IF NOT EXISTS hostel_attendance_school_date_idx ON public.hostel_attendance(school_id, date);
CREATE INDEX IF NOT EXISTS clinic_visits_school_date_idx ON public.clinic_visits(school_id, visit_date);
CREATE INDEX IF NOT EXISTS library_books_school_idx ON public.library_books(school_id, is_active);
CREATE INDEX IF NOT EXISTS library_borrowings_school_status_idx ON public.library_borrowings(school_id, status);
CREATE INDEX IF NOT EXISTS discipline_records_school_idx ON public.discipline_records(school_id, incident_date);
