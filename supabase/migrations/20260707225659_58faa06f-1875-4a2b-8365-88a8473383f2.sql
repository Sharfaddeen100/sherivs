-- Upgrade every school to the Enterprise tier so all gated features
-- (bus/transport management, staff advanced tools, etc.) are unlocked
-- for review. Clearing active_features falls back to tier defaults, and
-- enterprise unlocks everything the tier allows.
-- Use a batch loop instead of one full-table UPDATE so the migration does not
-- trip the statement timeout on large datasets.
SET statement_timeout = '0';

DO $$
DECLARE
  rows_updated integer := 0;
BEGIN
  LOOP
    WITH batch AS (
      SELECT id
      FROM public.schools
      WHERE subscription_tier IS DISTINCT FROM 'enterprise'
         OR active_features IS NOT NULL
      ORDER BY id
      LIMIT 500
    )
    UPDATE public.schools AS s
    SET subscription_tier = 'enterprise',
        active_features = NULL
    FROM batch
    WHERE s.id = batch.id;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    EXIT WHEN rows_updated = 0;
  END LOOP;
END $$;

-- Make enterprise the default for any newly created school going forward.
ALTER TABLE public.schools
  ALTER COLUMN subscription_tier SET DEFAULT 'enterprise';