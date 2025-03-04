-- Add password_hash column to users table
ALTER TABLE IF EXISTS "users" 
ADD COLUMN IF NOT EXISTS "password_hash" VARCHAR(255) NOT NULL DEFAULT ''; 