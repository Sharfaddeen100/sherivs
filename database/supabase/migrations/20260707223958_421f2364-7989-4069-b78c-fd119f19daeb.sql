
-- Allow authenticated users to upload / read / delete objects in school-media
-- scoped by their school (first folder segment = school_id).
CREATE POLICY "school-media read own school"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'school-media' AND (storage.foldername(name))[1] = public.get_my_school_id()::text);

CREATE POLICY "school-media insert own school"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'school-media' AND (storage.foldername(name))[1] = public.get_my_school_id()::text);

CREATE POLICY "school-media update own school"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'school-media' AND (storage.foldername(name))[1] = public.get_my_school_id()::text);

CREATE POLICY "school-media delete own school"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'school-media' AND (storage.foldername(name))[1] = public.get_my_school_id()::text);

-- Public read: allow anonymous visitors to read files in school-media so that
-- signed URLs are not needed for the public-facing site.
CREATE POLICY "school-media public read"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'school-media');
