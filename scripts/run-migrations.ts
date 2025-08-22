import { db } from '../lib/db-migration';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running migrations...');

  // Add reminder columns to events table
  await db.execute(sql`
    ALTER TABLE events 
    ADD COLUMN IF NOT EXISTS reminder_days INTEGER,
    ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  // Introduce resettable column (inverse of legacy read_only)
  await db.execute(sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS resettable BOOLEAN NOT NULL DEFAULT TRUE;
  `);
  // Backfill from read_only if it exists
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'read_only'
      ) THEN
        EXECUTE 'UPDATE events SET resettable = NOT COALESCE(read_only, FALSE)';
      END IF;
    END $$;
  `);
  // Drop legacy column if present
  await db.execute(sql`
    ALTER TABLE events
    DROP COLUMN IF EXISTS read_only;
  `);

  console.log('Migrations completed successfully');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
