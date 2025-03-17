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
  varchar
} from 'drizzle-orm/pg-core';
import { count, eq, ilike, desc, sql } from 'drizzle-orm';
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
  createdAt: timestamp('created_at').defaultNow().notNull()
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
  date: Date
): Promise<Event> {
  // Convert Date to ISO string for Drizzle
  const dateStr = date.toISOString();

  const result = await db
    .update(events)
    .set({
      name,
      date: dateStr
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
