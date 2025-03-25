// This file is similar to lib/db.ts but without server-only dependencies
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  serial,
  pgTable,
  varchar,
  integer,
  timestamp
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set!');
}

// Configure neon to work in Node.js environment
neonConfig.fetchConnectionCache = true;

export const db = drizzle(neon(process.env.DATABASE_URL));

// Define tables
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  date: varchar('date', { length: 255 }).notNull(),
  resetCount: integer('reset_count').notNull().default(0)
});

export const eventResets = pgTable('event_resets', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  resetAt: timestamp('reset_at').notNull().defaultNow()
});
