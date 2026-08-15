
CREATE TABLE IF NOT EXISTS public.school_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text,
  avatar_url text,
  bio text,
  subject_specialty text,
  qualification text,
  years_experience integer,
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.school_staff TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_staff TO authenticated;
GRANT ALL ON public.school_staff TO service_role;
ALTER TABLE public.school_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published staff"
  ON public.school_staff FOR SELECT
  USING (is_published = true);

CREATE POLICY "School admins manage staff"
  ON public.school_staff FOR ALL
  TO authenticated
  USING (public.is_school_admin() AND school_id = public.get_my_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.get_my_school_id());

CREATE TABLE IF NOT EXISTS public.school_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text,
  caption text,
  image_url text NOT NULL,
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.school_gallery TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_gallery TO authenticated;
GRANT ALL ON public.school_gallery TO service_role;
ALTER TABLE public.school_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published gallery"
  ON public.school_gallery FOR SELECT
  USING (is_published = true);

CREATE POLICY "School admins manage gallery"
  ON public.school_gallery FOR ALL
  TO authenticated
  USING (public.is_school_admin() AND school_id = public.get_my_school_id())
  WITH CHECK (public.is_school_admin() AND school_id = public.get_my_school_id());
