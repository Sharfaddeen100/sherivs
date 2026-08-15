
CREATE OR REPLACE FUNCTION public.public_school_stats(_slug text)
RETURNS TABLE(student_count bigint, teacher_count bigint, program_count bigint, founded_year integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.students s WHERE s.school_id = sc.id),
    (SELECT count(*) FROM public.users u WHERE u.school_id = sc.id AND u.role = 'teacher' AND u.is_active = true),
    (SELECT count(*) FROM public.academic_programs ap WHERE ap.school_id = sc.id AND ap.is_published = true),
    sc.founded_year
  FROM public.schools sc
  WHERE sc.slug = _slug AND sc.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.public_teachers(_slug text)
RETURNS TABLE(id uuid, full_name text, avatar_url text, subject_specialty text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.full_name, u.avatar_url, u.subject_specialty
  FROM public.users u
  JOIN public.schools sc ON sc.id = u.school_id
  WHERE sc.slug = _slug
    AND sc.is_active = true
    AND u.role = 'teacher'
    AND u.is_active = true
  ORDER BY u.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.public_school_stats(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_teachers(text) TO anon, authenticated;
