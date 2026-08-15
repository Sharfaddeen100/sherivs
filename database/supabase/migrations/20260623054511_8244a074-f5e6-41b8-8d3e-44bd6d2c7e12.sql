
CREATE POLICY "msg_attach_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "msg_attach_read_participants" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.attachment_url = storage.objects.name
        AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
  );

CREATE POLICY "msg_attach_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
