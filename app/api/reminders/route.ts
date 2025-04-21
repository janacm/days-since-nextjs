import nodemailer from 'nodemailer';
import { db, events } from '@/lib/db';
import { eq, and, lt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST as string,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string
  }
});

export async function POST() {
  console.log('📧 Reminders API: Request received');

  try {
    // Ensure SMTP is configured
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.error('📧 Reminders API: SMTP config is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    console.log('📧 Reminders API: Mailtrap transporter configured', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT
    });

    // Find all events that need reminders
    console.log('📧 Reminders API: Querying for events needing reminders');

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

    console.log('📧 Reminders API: Found events needing reminders', {
      count: eventsNeedingReminders.length,
      eventIds: eventsNeedingReminders.map((e) => e.id)
    });

    for (const event of eventsNeedingReminders) {
      console.log('📧 Reminders API: Processing event', {
        eventId: event.id,
        eventName: event.name,
        userId: event.userId
      });

      try {
        // Send reminder email
        console.log('📧 Reminders API: Sending reminder email', {
          to: event.userId
        });

        const info = await transporter.sendMail({
          from: 'Days Since <reminders@dayssince.app>',
          to: event.userId,
          subject: `Reminder: ${event.name}`,
          html: `
            <h1>Reminder: ${event.name}</h1>
            <p>It's been ${event.reminderDays} days since ${event.name}.</p>
            <p>You set this reminder to check in on this event.</p>
          `
        });

        console.log('📧 Reminders API: Email sent successfully', {
          info,
          eventId: event.id
        });

        // Mark reminder as sent
        console.log('📧 Reminders API: Marking reminder as sent', {
          eventId: event.id
        });

        await db
          .update(events)
          .set({ reminderSent: true })
          .where(eq(events.id, event.id));

        console.log('📧 Reminders API: Reminder marked as sent', {
          eventId: event.id
        });
      } catch (error) {
        console.error('📧 Reminders API: Error processing event', {
          eventId: event.id,
          error: error instanceof Error ? error.message : String(error)
        });
        // Continue with other events even if one fails
      }
    }

    console.log('📧 Reminders API: All reminders processed successfully');
    return NextResponse.json({
      success: true,
      processedCount: eventsNeedingReminders.length
    });
  } catch (error) {
    console.error('📧 Reminders API: Error sending reminders', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
