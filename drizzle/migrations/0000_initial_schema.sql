-- Create status enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
        CREATE TYPE "status" AS ENUM ('active', 'inactive', 'archived');
    END IF;
END$$;

-- Create products table
CREATE TABLE IF NOT EXISTS "products" (
  "id" SERIAL PRIMARY KEY,
  "image_url" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "status" NOT NULL,
  "price" NUMERIC(10, 2) NOT NULL,
  "stock" INTEGER NOT NULL,
  "available_at" TIMESTAMP NOT NULL
);

-- Create events table
CREATE TABLE IF NOT EXISTS "events" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
); 