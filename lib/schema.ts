import {
  serial,
  pgTable,
  varchar,
  integer,
  timestamp
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const eventResets = pgTable('event_resets', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  resetAt: timestamp('reset_at').notNull().defaultNow()
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  date: varchar('date', { length: 255 }).notNull(),
  resetCount: integer('reset_count').notNull().default(0)
});

export type EventReset = typeof eventResets.$inferSelect;
export type InsertEventReset = typeof eventResets.$inferInsert;
