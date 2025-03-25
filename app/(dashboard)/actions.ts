'use server';

import {
  createEvent,
  deleteEventById,
  updateEvent,
  deleteProductById,
  db,
  events,
  eventResets
} from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';

export async function addEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('You must be logged in to add an event');
  }

  const name = formData.get('name') as string;
  const dateStr = formData.get('date') as string;
  const reminderEnabled = formData.get('reminder') === 'on';
  const reminderDays = reminderEnabled
    ? Number(formData.get('reminderDays'))
    : null;

  if (!name || !dateStr) {
    throw new Error('Name and date are required');
  }

  if (reminderEnabled && (!reminderDays || reminderDays < 1)) {
    throw new Error('Please specify a valid number of days for the reminder');
  }

  const date = new Date(dateStr);

  const result = await db
    .insert(events)
    .values({
      userId: session.user.email,
      name,
      date: date.toISOString(),
      reminderDays,
      reminderSent: false
    })
    .returning();

  revalidatePath('/');
  redirect('/');
}

export async function deleteEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('You must be logged in to delete an event');
  }

  const id = Number(formData.get('id'));

  await deleteEventById(id);
  revalidatePath('/');
}

export async function deleteProduct(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('You must be logged in to delete a product');
  }

  const id = Number(formData.get('id'));

  await deleteProductById(id);
  revalidatePath('/products');
}

export async function editEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('You must be logged in to edit an event');
  }

  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const dateStr = formData.get('date') as string;

  if (!name || !dateStr) {
    throw new Error('Name and date are required');
  }

  const date = new Date(dateStr);

  await updateEvent(id, name, date);
  revalidatePath('/');
  redirect('/');
}

export async function resetEvent(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const numericId = parseInt(id, 10);
  const now = new Date();
  const dateStr = now.toISOString();

  try {
    // 1. Update the event's date and increment reset count
    await db
      .update(events)
      .set({
        date: dateStr,
        resetCount: sql`COALESCE(reset_count, 0) + 1`
      })
      .where(eq(events.id, numericId));

    // 2. Add a record to the event_resets table
    await db.insert(eventResets).values({
      eventId: numericId,
      resetAt: now
    });

    revalidatePath('/');
  } catch (error) {
    console.error('Error resetting event:', error);
    throw error;
  }
}
