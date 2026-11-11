-- Add read_only flag to events for immutable events
ALTER TABLE IF EXISTS "events"
  ADD COLUMN IF NOT EXISTS "read_only" BOOLEAN NOT NULL DEFAULT FALSE;


