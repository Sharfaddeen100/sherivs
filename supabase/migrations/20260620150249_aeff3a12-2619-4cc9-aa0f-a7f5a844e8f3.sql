
-- Auto-calc trigger for grades
CREATE OR REPLACE FUNCTION public.grades_autocalc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  ca numeric := COALESCE(NEW.ca_score, 0);
  ex numeric := COALESCE(NEW.exam_score, 0);
  tot numeric;
BEGIN
  IF NEW.ca_score IS NULL AND NEW.exam_score IS NULL THEN
    RETURN NEW;
  END IF;
  tot := LEAST(100, ca + ex);
  IF NEW.total_score IS NULL THEN
    NEW.total_score := tot;
  ELSE
    tot := NEW.total_score;
  END IF;
  IF NEW.grade IS NULL OR NEW.grade = '' THEN
    NEW.grade := CASE
      WHEN tot >= 70 THEN 'A'
      WHEN tot >= 60 THEN 'B'
      WHEN tot >= 50 THEN 'C'
      WHEN tot >= 45 THEN 'D'
      WHEN tot >= 40 THEN 'E'
      ELSE 'F'
    END;
  END IF;
  IF NEW.grade_remark IS NULL OR NEW.grade_remark = '' THEN
    NEW.grade_remark := CASE NEW.grade
      WHEN 'A' THEN 'Excellent'
      WHEN 'B' THEN 'Very Good'
      WHEN 'C' THEN 'Good'
      WHEN 'D' THEN 'Pass'
      WHEN 'E' THEN 'Weak Pass'
      ELSE 'Fail'
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grades_autocalc ON public.grades;
CREATE TRIGGER trg_grades_autocalc
BEFORE INSERT OR UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.grades_autocalc();

-- Tighten RLS on grades
DROP POLICY IF EXISTS tenant_all_grades ON public.grades;

-- Admins / principals / super admins: full access within school
CREATE POLICY grades_admin_all ON public.grades
FOR ALL TO authenticated
USING ((school_id = public.get_my_school_id() AND public.is_school_admin()) OR public.is_super_admin())
WITH CHECK ((school_id = public.get_my_school_id() AND public.is_school_admin()) OR public.is_super_admin());

-- Teachers: read all in school, write only own rows
CREATE POLICY grades_teacher_read ON public.grades
FOR SELECT TO authenticated
USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'teacher');

CREATE POLICY grades_teacher_write ON public.grades
FOR INSERT TO authenticated
WITH CHECK (
  school_id = public.get_my_school_id()
  AND public.get_my_role() = 'teacher'
  AND teacher_id = auth.uid()
);

CREATE POLICY grades_teacher_update ON public.grades
FOR UPDATE TO authenticated
USING (school_id = public.get_my_school_id() AND teacher_id = auth.uid())
WITH CHECK (school_id = public.get_my_school_id() AND teacher_id = auth.uid());

CREATE POLICY grades_teacher_delete ON public.grades
FOR DELETE TO authenticated
USING (school_id = public.get_my_school_id() AND teacher_id = auth.uid());

-- Students: only own published grades
CREATE POLICY grades_student_read ON public.grades
FOR SELECT TO authenticated
USING (
  is_published = true
  AND student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

-- Parents: linked children's published grades
CREATE POLICY grades_parent_read ON public.grades
FOR SELECT TO authenticated
USING (
  is_published = true
  AND student_id IN (
    SELECT student_id FROM public.parent_student_map WHERE parent_id = auth.uid()
  )
);
