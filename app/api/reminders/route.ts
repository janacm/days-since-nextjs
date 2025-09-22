import nodemailer from 'nodemailer';
import { db, events } from '@/lib/db';
import { and, or, sql, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST as string,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // Use secure for port 465, otherwise false
  auth: {
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
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
          sql`${events.reminderDays} IS NOT NULL`,
          sql`EXTRACT(DAY FROM (NOW() - ${events.date}::timestamp)) >= ${events.reminderDays}`,
          or(
            sql`${events.lastReminderSentAt} IS NULL`,
            sql`${events.lastReminderSentAt}::date < CURRENT_DATE`
          )
        )
      );

    console.log('📧 Reminders API: Found events needing reminders', {
      count: eventsNeedingReminders.length,
      eventIds: eventsNeedingReminders.map((e) => e.id)
    });

    const eventsByUser = new Map<
      string,
      (typeof eventsNeedingReminders)[number][]
    >();

    for (const event of eventsNeedingReminders) {
      const userEvents = eventsByUser.get(event.userId) ?? [];
      userEvents.push(event);
      eventsByUser.set(event.userId, userEvents);
    }

    for (const [userEmail, userEvents] of eventsByUser) {
      console.log('📧 Reminders API: Processing reminders for user', {
        userId: userEmail,
        eventIds: userEvents.map((event) => event.id)
      });

      try {
        const now = new Date();
        const eventSummaries = userEvents.map((event) => {
          const eventDate = new Date(event.date);
          const daysSince = Math.floor(
            (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            id: event.id,
            name: event.name,
            reminderDays: event.reminderDays,
            daysSince,
            date: eventDate
          };
        });

        const listItemsHtml = eventSummaries
          .map(
            (summary) => `
              <li>
                <strong>${summary.name}</strong><br />
                ${summary.daysSince} days since (${summary.date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC'
                })})<br />
                Reminder requested after ${summary.reminderDays} days
              </li>
            `
          )
          .join('');

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: userEmail,
          subject: `Days Since reminders: ${eventSummaries.length} event${
            eventSummaries.length === 1 ? '' : 's'
          } due`,
          html: `
            <h2>Days Since Reminder</h2>
            <p>You have the following event${eventSummaries.length === 1 ? '' : 's'} with reminders due today:</p>
            <ul>
              ${listItemsHtml}
            </ul>
            <p>Visit your dashboard to update or manage your events.</p>
          `
        });

        console.log('📧 Reminders API: Email sent successfully', {
          info,
          userId: userEmail
        });

        const nowIso = now.toISOString();

        await db
          .update(events)
          .set({ reminderSent: true, lastReminderSentAt: nowIso })
          .where(inArray(events.id, eventSummaries.map((summary) => summary.id)));

        console.log('📧 Reminders API: Reminder marked as sent', {
          userId: userEmail,
          eventIds: eventSummaries.map((summary) => summary.id)
        });
      } catch (error) {
        console.error('📧 Reminders API: Error processing reminders for user', {
          userId: userEmail,
          eventIds: userEvents.map((event) => event.id),
          error: error instanceof Error ? error.message : String(error)
        });
        // Continue with other users even if one fails
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
