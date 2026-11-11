-- Add is_private column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;