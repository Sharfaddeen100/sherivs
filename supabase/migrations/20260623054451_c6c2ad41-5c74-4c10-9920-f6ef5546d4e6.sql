
-- Threads + attachments on messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS thread_id uuid,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_size integer;

-- Backfill thread_id = id for legacy rows so threads work
UPDATE public.messages SET thread_id = id WHERE thread_id IS NULL;

ALTER TABLE public.messages
  ALTER COLUMN thread_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN thread_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS messages_thread_idx ON public.messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON public.messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id, created_at DESC);

-- Notification preferences (per user)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email_messages boolean NOT NULL DEFAULT true,
  email_announcements boolean NOT NULL DEFAULT true,
  email_grades boolean NOT NULL DEFAULT true,
  email_attendance boolean NOT NULL DEFAULT true,
  email_fees boolean NOT NULL DEFAULT true,
  inapp_messages boolean NOT NULL DEFAULT true,
  inapp_announcements boolean NOT NULL DEFAULT true,
  inapp_grades boolean NOT NULL DEFAULT true,
  inapp_attendance boolean NOT NULL DEFAULT true,
  inapp_fees boolean NOT NULL DEFAULT true,
  digest_frequency text NOT NULL DEFAULT 'instant',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pref_select_own" ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "pref_insert_own" ON public.notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND school_id = public.get_my_school_id());

CREATE POLICY "pref_update_own" ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER notification_preferences_touch
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime for messages + notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
