-- Add resettable column to events and migrate from legacy read_only
ALTER TABLE IF EXISTS "events"
  ADD COLUMN IF NOT EXISTS "resettable" BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill from read_only if it exists (resettable = NOT read_only)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'read_only'
  ) THEN
    EXECUTE 'UPDATE "events" SET "resettable" = NOT COALESCE("read_only", FALSE)';
  END IF;
END $$;

-- Drop legacy column if present (no longer used in application code)
ALTER TABLE IF EXISTS "events"
  DROP COLUMN IF EXISTS "read_only";


