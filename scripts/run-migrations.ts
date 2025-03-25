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

  console.log('Migrations completed successfully');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
