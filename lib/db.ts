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
  date
} from 'drizzle-orm/pg-core';
import { count, eq, ilike, desc } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

// Define the schema
export const statusEnum = pgEnum('status', ['active', 'inactive', 'archived']);

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
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Create the database connection with schema
const schema = { events, products };
export const db = drizzle(neon(process.env.POSTGRES_URL!), { schema });

export type SelectProduct = typeof products.$inferSelect;
export const insertProductSchema = createInsertSchema(products);

export type Event = typeof events.$inferSelect;

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
  return db
    .select()
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(desc(events.date));
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
