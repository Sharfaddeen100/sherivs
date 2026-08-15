ALTER TABLE public.transport_buses REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'transport_buses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transport_buses;
  END IF;
END $$;