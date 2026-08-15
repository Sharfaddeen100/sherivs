
-- Public can INSERT into student-documents bucket under admissions/<school_id>/...
CREATE POLICY "anon can upload admission docs"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (storage.foldername(name))[1] = 'admissions'
  );

-- School admins (or super admins) can read everything in the bucket scoped to their school
CREATE POLICY "admins read student documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (
      public.is_super_admin()
      OR (storage.foldername(name))[2] = public.get_my_school_id()::text
    )
  );
