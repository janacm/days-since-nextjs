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
import nodemailer from 'nodemailer';

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST as string,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string
  }
});

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

export async function addEventWithoutRedirect(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error('You must be logged in to add an event');
  }

  const name = formData.get('name') as string;
  const dateStr = formData.get('date') as string;
  const reminderEnabled = formData.get('reminder') === 'on';
  const reminderDays = reminderEnabled ? Number(formData.get('reminderDays')) : null;

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
  return result[0];
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
    .update(events)
    .set({
      name,
      date: date.toISOString(),
      reminderDays,
      reminderSent: false // Reset reminder status when updating reminder settings
    })
    .where(eq(events.id, id))
    .returning();

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

export async function resetEventWithDate(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const customDate = formData.get('resetDate') as string;
  const numericId = parseInt(id, 10);

  if (!customDate) {
    throw new Error('Reset date is required');
  }

  const resetDate = new Date(customDate);
  const dateStr = resetDate.toISOString();

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
      resetAt: resetDate
    });

    revalidatePath('/');
  } catch (error) {
    console.error('Error resetting event with custom date:', error);
    throw error;
  }
}

export async function sendTestEmail() {
  console.log('🔍 sendTestEmail: Function called');
  const session = await auth();
  console.log('🔍 sendTestEmail: Session check', {
    hasSession: !!session,
    hasEmail: !!session?.user?.email
  });

  if (!session?.user?.email) {
    console.error('🔍 sendTestEmail: No user email found in session');
    throw new Error('You must be logged in to send test emails');
  }

  console.log('🔍 sendTestEmail: User email found', {
    email: session.user.email
  });

  // Ensure SMTP is configured
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.error('🔍 sendTestEmail: SMTP config is not configured');
    throw new Error('Email service is not configured properly');
  }

  console.log('🔍 sendTestEmail: Transporter configured', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT
  });

  try {
    console.log(
      '🔍 sendTestEmail: Attempting to send email to',
      session.user.email
    );

    const info = await transporter.sendMail({
      from: 'Days Since <reminders@dayssince.app>',
      to: session.user.email,
      subject: 'Test Email from Days Since App',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from the Days Since App.</p>
        <p>If you're receiving this, email sending is working correctly!</p>
      `
    });

    console.log('🔍 sendTestEmail: Email sent successfully', { info });

    // Redirect back to the admin page
    revalidatePath('/admin');
  } catch (error) {
    console.error('🔍 sendTestEmail: Error sending test email', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      email: session.user.email
    });
    throw error;
  }
}
