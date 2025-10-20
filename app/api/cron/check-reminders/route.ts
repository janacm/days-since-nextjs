import { NextRequest, NextResponse } from 'next/server';
import { db, events } from '@/lib/db';
import { sql, and, or, inArray } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running reminder check cron job...');

    // Verify SendGrid configuration
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('SendGrid configuration is incomplete');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    console.log('SendGrid configuration verified:', {
      from: process.env.SENDGRID_FROM_EMAIL,
      sandbox: process.env.SENDGRID_SANDBOX_MODE === 'true'
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

    // Group events by user using a plain object to avoid iterator requirements
    const eventsByUser: Record<string, (typeof eventsNeedingReminders)[number][]> = {};
    for (let i = 0; i < eventsNeedingReminders.length; i++) {
      const ev = eventsNeedingReminders[i];
      (eventsByUser[ev.userId] ||= []).push(ev);
    }

    let sentCount = 0;

    for (const userEmail in eventsByUser) {
      const userEvents = eventsByUser[userEmail];
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

        await sendEmail({
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
        console.log(`Email sent successfully for user ${userEmail}:`, {
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
