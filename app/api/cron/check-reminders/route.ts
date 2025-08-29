import { NextRequest, NextResponse } from 'next/server';
import { db, events } from '@/lib/db';
import { sql, eq, and, lt } from 'drizzle-orm';
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
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
          eq(events.reminderSent, false),
          sql`${events.reminderDays} IS NOT NULL`,
          sql`EXTRACT(DAY FROM (NOW() - ${events.date}::timestamp)) >= ${events.reminderDays}`
        )
      );

    console.log(
      `Found ${eventsNeedingReminders.length} events needing reminders`
    );

    let sentCount = 0;

    for (const event of eventsNeedingReminders) {
      try {
        // Calculate days since
        const eventDate = new Date(event.date);
        const now = new Date();
        const daysSince = Math.floor(
          (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send reminder email
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: event.userId, // Assuming userId is the email
          subject: `Reminder: ${event.name} - ${daysSince} days since`,
          html: `
            <h2>Days Since Reminder</h2>
            <p>This is a reminder about your event: <strong>${event.name}</strong></p>
            <p>It has been <strong>${daysSince} days</strong> since this event occurred.</p>
            <p>You requested to be reminded after ${event.reminderDays} days.</p>
            <br>
            <p>Visit your dashboard to update or manage your events.</p>
          `
        };

        const emailResult = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully for event ${event.id}:`, {
          messageId: emailResult.messageId,
          to: event.userId,
          daysSince
        });

        // Mark reminder as sent
        await db
          .update(events)
          .set({ reminderSent: true })
          .where(eq(events.id, event.id));

        sentCount++;
        console.log(`Sent reminder for event: ${event.name}`);
      } catch (error) {
        console.error(`Failed to send reminder for event ${event.id}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          eventName: event.name,
          userId: event.userId
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} reminders`,
      checkedEvents: eventsNeedingReminders.length
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
