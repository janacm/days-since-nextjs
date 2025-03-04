-- Add created_at column to users table
ALTER TABLE IF EXISTS "users" 
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT NOW(); 