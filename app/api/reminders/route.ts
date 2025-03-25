import { Resend } from 'resend';
import { db, events } from '@/lib/db';
import { eq, and, lt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    // Find all events that need reminders
    const eventsNeedingReminders = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.reminderSent, false),
          lt(
            events.reminderDays,
            sql`EXTRACT(DAY FROM (NOW() - ${events.date}::timestamp))`
          )
        )
      );

    for (const event of eventsNeedingReminders) {
      // Send reminder email
      await resend.emails.send({
        from: 'Days Since <reminders@dayssince.app>',
        to: event.userId,
        subject: `Reminder: ${event.name}`,
        html: `
          <h1>Reminder: ${event.name}</h1>
          <p>It's been ${event.reminderDays} days since ${event.name}.</p>
          <p>You set this reminder to check in on this event.</p>
        `
      });

      // Mark reminder as sent
      await db
        .update(events)
        .set({ reminderSent: true })
        .where(eq(events.id, event.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
