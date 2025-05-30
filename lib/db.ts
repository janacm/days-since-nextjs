import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  pgTable,
  text,
  numeric,
  integer,
  timestamp,
  pgEnum,
  serial,
  date,
  uniqueIndex,
  varchar,
  boolean
} from 'drizzle-orm/pg-core';
import { count, eq, ilike, desc, sql, and } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

// Define the schema
export const statusEnum = pgEnum('status', ['active', 'inactive', 'archived']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    username: varchar('username', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => {
    return {
      emailIdx: uniqueIndex('email_idx').on(table.email)
    };
  }
);

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  name: text('name').notNull(),
  status: statusEnum('status').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').notNull(),
  availableAt: timestamp('available_at').notNull()
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  date: varchar('date', { length: 255 }).notNull(),
  resetCount: integer('reset_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reminderDays: integer('reminder_days'),
  reminderSent: boolean('reminder_sent').notNull().default(false)
});

export const eventResets = pgTable('event_resets', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  resetAt: timestamp('reset_at').notNull().defaultNow()
});

// Create the database connection with schema
const schema = { users, events, products, eventResets };

// Check if we have a database URL
if (!process.env.POSTGRES_URL) {
  console.error(
    'POSTGRES_URL environment variable is not set! Database operations will fail.'
  );
}

// Log connection attempt
console.log('Initializing database connection');

export const db = drizzle(neon(process.env.POSTGRES_URL!), { schema });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const insertUserSchema = createInsertSchema(users);

export type SelectProduct = typeof products.$inferSelect;
export const insertProductSchema = createInsertSchema(products);

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type EventReset = typeof eventResets.$inferSelect;
export type InsertEventReset = typeof eventResets.$inferInsert;

// User related database functions
export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    console.log(`Looking up user with email: ${email}`);
    const results = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    console.log(`User lookup results: ${results.length} records found`);
    return results[0];
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

export async function createUser(
  email: string,
  passwordHash: string,
  name?: string
): Promise<User> {
  try {
    console.log(`Creating user with email: ${email}`);
    const result = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name
      })
      .returning();

    console.log('User created successfully');
    return result[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function getProducts(
  search: string,
  offset: number
): Promise<{
  products: SelectProduct[];
  newOffset: number | null;
  totalProducts: number;
}> {
  // Always search the full table, not per page
  if (search) {
    return {
      products: await db
        .select()
        .from(products)
        .where(ilike(products.name, `%${search}%`))
        .limit(1000),
      newOffset: null,
      totalProducts: 0
    };
  }

  if (offset === null) {
    return { products: [], newOffset: null, totalProducts: 0 };
  }

  let totalProducts = await db.select({ count: count() }).from(products);
  let moreProducts = await db.select().from(products).limit(5).offset(offset);
  let newOffset = moreProducts.length >= 5 ? offset + 5 : null;

  return {
    products: moreProducts,
    newOffset,
    totalProducts: totalProducts[0].count
  };
}

export async function deleteProductById(id: number) {
  await db.delete(products).where(eq(products.id, id));
}

export async function getEvents(userId: string): Promise<Event[]> {
  const result = await db
    .select()
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(sql`${events.date} DESC`);

  // Add default value for resetCount if it's missing
  return result.map((event) => ({
    ...event,
    resetCount: 'resetCount' in event ? event.resetCount : 0
  }));
}

export async function createEvent(
  userId: string,
  name: string,
  date: Date
): Promise<Event> {
  // Convert Date to ISO string for Drizzle
  const dateStr = date.toISOString();

  const result = await db
    .insert(events)
    .values({
      userId,
      name,
      date: dateStr
    })
    .returning();

  return result[0];
}

export async function deleteEventById(id: number) {
  await db.delete(events).where(eq(events.id, id));
}

export async function updateEvent(
  id: number,
  name: string,
  date: Date,
  reminderDays?: number | null
): Promise<Event> {
  // Convert Date to ISO string for Drizzle
  const dateStr = date.toISOString();

  const result = await db
    .update(events)
    .set({
      name,
      date: dateStr,
      reminderDays,
      reminderSent: false // Reset reminder status when updating reminder settings
    })
    .where(eq(events.id, id))
    .returning();

  return result[0];
}

export async function getEventResets(eventId: number): Promise<EventReset[]> {
  return await db
    .select()
    .from(eventResets)
    .where(eq(eventResets.eventId, eventId))
    .orderBy(sql`${eventResets.resetAt} DESC`);
}

export async function getEventById(
  id: number,
  userId: string
): Promise<Event | undefined> {
  const result = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)))
    .limit(1);

  return result[0];
}

export async function getEventAnalytics(eventId: number, userId: string) {
  // First verify the event belongs to the user
  const event = await getEventById(eventId, userId);
  if (!event) {
    throw new Error('Event not found or access denied');
  }

  // Get all resets for this event
  const resets = await getEventResets(eventId);

  // Calculate analytics
  const totalResets = resets.length;
  const currentDaysSince = Math.floor(
    (new Date().getTime() - new Date(event.date).getTime()) / (1000 * 3600 * 24)
  );

  // Calculate average days between resets
  let averageDaysBetweenResets = 0;
  if (resets.length > 0) {
    // Calculate actual intervals between consecutive events
    const intervals: number[] = [];
    const eventDate = new Date(event.date);

    // Sort resets by date (oldest first)
    const sortedResets = [...resets].sort(
      (a, b) => new Date(a.resetAt).getTime() - new Date(b.resetAt).getTime()
    );

    // Calculate interval from event start to first reset
    const firstReset = sortedResets[0];
    const firstInterval = Math.max(
      0,
      Math.floor(
        (new Date(firstReset.resetAt).getTime() - eventDate.getTime()) /
          (1000 * 3600 * 24)
      )
    );
    intervals.push(firstInterval);

    // Calculate intervals between consecutive resets
    for (let i = 1; i < sortedResets.length; i++) {
      const current = new Date(sortedResets[i].resetAt);
      const previous = new Date(sortedResets[i - 1].resetAt);
      const interval = Math.max(
        0,
        Math.floor(
          (current.getTime() - previous.getTime()) / (1000 * 3600 * 24)
        )
      );
      intervals.push(interval);
    }

    // Calculate interval from last reset to now (only if positive)
    const lastReset = sortedResets[sortedResets.length - 1];
    const currentInterval = Math.max(
      0,
      Math.floor(
        (new Date().getTime() - new Date(lastReset.resetAt).getTime()) /
          (1000 * 3600 * 24)
      )
    );
    intervals.push(currentInterval);

    // Calculate average from intervals
    averageDaysBetweenResets =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  // Find longest period between resets
  let longestPeriod = currentDaysSince;
  if (resets.length > 0) {
    const intervals: number[] = [];
    const eventDate = new Date(event.date);

    // Calculate interval from event start to first reset
    const firstReset = resets[resets.length - 1];
    intervals.push(
      Math.floor(
        (new Date(firstReset.resetAt).getTime() - eventDate.getTime()) /
          (1000 * 3600 * 24)
      )
    );

    // Calculate intervals between consecutive resets
    for (let i = resets.length - 1; i > 0; i--) {
      const current = new Date(resets[i].resetAt);
      const previous = new Date(resets[i - 1].resetAt);
      intervals.push(
        Math.floor(
          (previous.getTime() - current.getTime()) / (1000 * 3600 * 24)
        )
      );
    }

    longestPeriod = Math.max(...intervals, currentDaysSince);
  }

  // Get recent resets (last 10)
  const recentResets = resets.slice(0, 10);

  return {
    event,
    totalResets,
    currentStreak: currentDaysSince,
    longestStreak: longestPeriod,
    averageDaysBetweenResets: Math.round(averageDaysBetweenResets),
    recentResets,
    allResets: resets
  };
}
