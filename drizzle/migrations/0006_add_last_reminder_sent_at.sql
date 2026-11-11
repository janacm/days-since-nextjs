-- Track when reminders were last delivered so they can be sent daily
ALTER TABLE IF EXISTS "events"
  ADD COLUMN IF NOT EXISTS "last_reminder_sent_at" TIMESTAMPTZ;

-- Backfill existing data: any event previously marked as reminded should
-- get a timestamp so we don't resend immediately after deploying.
UPDATE "events"
SET "last_reminder_sent_at" = COALESCE("last_reminder_sent_at", NOW())
WHERE "reminder_sent" = TRUE;
