import { sql } from 'drizzle-orm';
import { db } from '../db';

async function main() {
  console.log('Adding event_resets table and reset_count column...');

  // Add reset_count column to events table
  await db.execute(sql`
    ALTER TABLE events 
    ADD COLUMN IF NOT EXISTS reset_count INTEGER NOT NULL DEFAULT 0;
  `);

  // Create event_resets table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS event_resets (
      id SERIAL PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      reset_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  console.log('Migration completed successfully');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
