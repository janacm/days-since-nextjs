import { NextRequest, NextResponse } from 'next/server';
import { db, events } from '@/lib/db';
import { sql, and, or, inArray } from 'drizzle-orm';
import nodemailer from 'nodemailer';

// Create transporter for sending emails
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

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET is not configured');
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured' },
        { status: 500 }
      );
    }

    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running reminder check cron job...');

    // Verify SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP configuration is incomplete');
      return NextResponse.json(
        { error: 'SMTP configuration is incomplete' },
        { status: 500 }
      );
    }

    console.log('SMTP configuration verified:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? '***configured***' : 'missing'
    });

    // Get events that need reminders
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

    console.log(
      `Found ${eventsNeedingReminders.length} events needing reminders`
    );

    const eventsByUser = new Map<
      string,
      (typeof eventsNeedingReminders)[number][]
    >();

    for (const event of eventsNeedingReminders) {
      const userEvents = eventsByUser.get(event.userId) ?? [];
      userEvents.push(event);
      eventsByUser.set(event.userId, userEvents);
    }

    let sentCount = 0;

    for (const [userEmail, userEvents] of Array.from(eventsByUser)) {
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

        const mailOptions = {
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
        };

        const emailResult = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully for user ${userEmail}:`, {
          messageId: emailResult.messageId,
          to: userEmail,
          events: eventSummaries.map((summary) => summary.id)
        });

        await db
          .update(events)
          .set({ reminderSent: true, lastReminderSentAt: now })
          .where(inArray(events.id, eventSummaries.map((summary) => summary.id)));

        sentCount++;
        console.log(`Sent reminder email to ${userEmail}`);
      } catch (error) {
        console.error(`Failed to send reminder email to ${userEmail}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          eventIds: userEvents.map((event) => event.id),
          userId: userEmail
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} reminder emails`,
      checkedEvents: eventsNeedingReminders.length,
      notifiedUsers: sentCount
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
