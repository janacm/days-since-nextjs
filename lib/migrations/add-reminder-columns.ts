import { sql } from 'drizzle-orm';
import { db } from '../db';

async function main() {
  console.log('Adding reminder columns to events table...');

  // Add reminder columns to events table
  await db.execute(sql`
    ALTER TABLE events 
    ADD COLUMN IF NOT EXISTS reminder_days INTEGER,
    ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  console.log('Migration completed successfully');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
