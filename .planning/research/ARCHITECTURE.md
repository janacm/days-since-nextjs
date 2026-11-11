# Architecture Patterns

**Domain:** Email notification system for event tracking app
**Researched:** 2026-03-26

## Current Architecture (As-Is)

Before designing the notification system, here is what exists today:

```
[Vercel Cron] --GET /api/cron/check-reminders--> [Route Handler]
                                                      |
                                                      v
                                                 [Neon Postgres]
                                                      |
                                                      v
                                              [Nodemailer SMTP]
                                              (broken - sandbox)

[Browser] --Server Action--> [actions.ts sendTestEmail]
                                      |
                                      v
                               [Nodemailer SMTP]
                               (broken - sandbox)
```

**Problems with current architecture:**
1. Nodemailer transporter is initialized 3 times (actions.ts, cron route, reminders route) with identical SMTP config pointing to Mailtrap sandbox
2. Email sending logic is duplicated across all three locations
3. HTML templates are inline strings with no shared structure
4. No notification preferences -- emails go to everyone with reminderDays set
5. No concept of different notification types (milestones, streaks, digests)
6. userId field stores the user's email address directly, not a foreign key to the users table

## Recommended Architecture (To-Be)

### Component Diagram

```
                    +------------------+
                    |   Vercel Cron    |
                    | (vercel.json)    |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
     /api/cron/       /api/cron/      /api/cron/
     check-reminders  check-milestones weekly-digest
              |              |              |
              +--------------+--------------+
                             |
                             v
                  +--------------------+
                  |  Detection Layer   |
                  |  (lib/notifications/|
                  |   detectors.ts)    |
                  +--------+-----------+
                           |
                           v
                  +--------------------+
                  |  Email Service     |
                  |  (lib/email/       |
                  |   service.ts)      |
                  +--------+-----------+
                           |
                    +------+------+
                    |             |
                    v             v
             +-----------+  +-----------+
             | Templates |  | Mailtrap  |
             | (lib/email|  | Send API  |
             |  templates|  +-----------+
             |  /*.ts)   |
             +-----------+

     +------------------+
     | Settings UI      |  <-- Server Action --> [users table]
     | (notification    |                        (emailNotifications
     |  toggle)         |                         column)
     +------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Location |
|-----------|---------------|-------------------|----------|
| **Email Service** | Single module that sends emails via Mailtrap Send API. All email sending goes through here. | Mailtrap API, Templates | `lib/email/service.ts` |
| **Email Templates** | Functions that return HTML strings for each email type. No sending logic. | Email Service (consumed by) | `lib/email/templates/` |
| **Streak Detector** | Queries events where days since last reset exceeds reminderDays. Respects notification preferences. | Database, Email Service | `lib/notifications/detectors.ts` |
| **Milestone Detector** | Queries events and checks if daysSince matches a milestone threshold (7, 30, 60, 90, 100, 180, 365). Tracks which milestones have been sent. | Database, Email Service | `lib/notifications/detectors.ts` |
| **Digest Generator** | Aggregates all events for a user into a weekly summary. | Database, Email Service | `lib/notifications/detectors.ts` |
| **Cron Route Handlers** | Thin HTTP handlers that authenticate the cron request, call the appropriate detector, and return status. | Detectors | `app/api/cron/*/route.ts` |
| **Notification Preferences** | Server Action + UI toggle for enabling/disabling all email notifications. | Database (users table) | `app/(dashboard)/actions.ts` + settings UI |

### Data Flow

#### Streak-at-Risk Warning (daily cron)

```
1. Vercel Cron hits GET /api/cron/check-reminders
2. Route handler verifies CRON_SECRET
3. Calls detectStreaksAtRisk()
4. Detector queries: events WHERE reminderDays IS NOT NULL
   AND daysSince >= reminderDays
   AND (lastReminderSentAt IS NULL OR lastReminderSentAt < today)
5. Detector joins/checks user notification preference (emailNotifications = true)
6. For each qualifying user+events batch:
   a. Renders streak warning template
   b. Calls emailService.send()
   c. Updates lastReminderSentAt on events
7. Route returns JSON summary
```

#### Milestone Celebration (daily cron)

```
1. Vercel Cron hits GET /api/cron/check-milestones
2. Route handler verifies CRON_SECRET
3. Calls detectMilestones()
4. Detector queries all events and calculates daysSince for each
5. Checks daysSince against milestone thresholds [7, 30, 60, 90, 100, 180, 365]
6. Filters out milestones already sent (needs tracking -- see Schema Changes)
7. Checks user notification preference
8. For each milestone hit:
   a. Renders milestone celebration template
   b. Calls emailService.send()
   c. Records milestone as sent
9. Route returns JSON summary
```

#### Weekly Digest (weekly cron)

```
1. Vercel Cron hits GET /api/cron/weekly-digest (schedule: "0 9 * * 1" = Monday 9am UTC)
2. Route handler verifies CRON_SECRET
3. Calls generateWeeklyDigests()
4. Generator queries all users with emailNotifications = true
5. For each user, aggregates:
   - All events with current daysSince
   - Any milestones hit in the past week
   - Any streaks currently at risk
6. Renders digest template
7. Calls emailService.send()
8. Route returns JSON summary
```

#### Notification Toggle (user action)

```
1. User clicks toggle in settings UI
2. Server Action toggleEmailNotifications() is called
3. Action updates users table: SET emailNotifications = !current
4. Revalidates settings page
```

## Patterns to Follow

### Pattern 1: Single Email Service Module

**What:** One module that wraps the Mailtrap Send API. Every email in the app goes through this single function.

**Why:** The current codebase has 3 separate Nodemailer transporter instances. Consolidating into one module means one place to change credentials, one place to add logging, one place to handle errors.

**Example:**

```typescript
// lib/email/service.ts
import { MailtrapClient } from "mailtrap";

const client = new MailtrapClient({
  token: process.env.MAILTRAP_API_TOKEN!,
});

const SENDER = {
  name: "Days Since",
  email: "reminders@dayssince.app", // Must match verified Mailtrap sending domain
};

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string }> {
  try {
    const response = await client.send({
      from: SENDER,
      to: [{ email: params.to }],
      subject: params.subject,
      html: params.html,
    });
    return { success: true, messageId: response.message_ids?.[0] };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false };
  }
}
```

### Pattern 2: Template Functions Return HTML Strings

**What:** Each email type has a pure function that takes data and returns an HTML string. No side effects, no sending.

**Why:** Keeps templates testable in isolation. Easy to preview. Separation of content from delivery.

**Example:**

```typescript
// lib/email/templates/milestone.ts
export function milestoneEmailHtml(params: {
  userName: string;
  eventName: string;
  daysSince: number;
}): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Milestone reached!</h2>
      <p>${params.eventName}: <strong>${params.daysSince} days</strong></p>
      <p>Keep it going!</p>
    </div>
  `;
}
```

### Pattern 3: Thin Cron Route Handlers

**What:** Cron route handlers do only three things: authenticate, call a detector, return status. No business logic in the route.

**Why:** Business logic in route handlers is hard to test and easy to duplicate (as seen in the current codebase where check-reminders and reminders routes have nearly identical logic).

**Example:**

```typescript
// app/api/cron/check-milestones/route.ts
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await detectAndSendMilestones();
  return NextResponse.json(result);
}
```

### Pattern 4: Batch Emails Per User

**What:** When a user has multiple events triggering notifications, combine them into a single email rather than sending separate emails for each event.

**Why:** The current cron job already does this for reminders. Apply the same pattern to milestones and digests. Reduces email volume and feels less spammy for a personal app.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Sending Emails from Server Actions

**What:** The current `sendTestEmail` in actions.ts sends email directly from a Server Action triggered by user click.

**Why bad:** Server Actions have a 10-second timeout on Vercel (Hobby). External API calls can be slow or fail. If the email service is down, the user gets a cryptic error.

**Instead:** Keep the test email action as a special case (it is admin-only debugging), but all production notification emails should go through cron routes where timeouts are more generous (60s on Hobby, 300s on Pro) and failures do not block the user.

### Anti-Pattern 2: Inline HTML in Route Handlers

**What:** The current cron route builds HTML template strings inline within the handler function.

**Why bad:** Impossible to test email content separately. Changes to email design require editing business logic files.

**Instead:** Template functions in `lib/email/templates/` that are pure functions.

### Anti-Pattern 3: Using userId as Email Address Directly

**What:** The current schema stores the user's email in `events.userId`. The cron job iterates events and uses `event.userId` directly as the recipient email.

**Why bad:** If a user changes their email, events are orphaned. This is an existing design decision that is too disruptive to change in this milestone.

**Instead:** Accept this limitation for now. The notification system will use the same pattern (userId = email). Document this as technical debt for a future milestone.

## Schema Changes Required

### Users Table -- Add Notification Preference

```sql
ALTER TABLE users ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT true;
```

In Drizzle schema:
```typescript
emailNotifications: boolean('email_notifications').notNull().default(true),
```

### New Table -- Milestone Notifications Tracking

To prevent sending the same milestone notification twice:

```typescript
export const milestoneNotifications = pgTable('milestone_notifications', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  milestone: integer('milestone').notNull(), // e.g., 7, 30, 60, 90, 100, 180, 365
  sentAt: timestamp('sent_at').notNull().defaultNow(),
}, (table) => ({
  uniqueMilestone: uniqueIndex('unique_event_milestone').on(table.eventId, table.milestone),
}));
```

**Why a separate table instead of a column on events:** An event can hit multiple milestones (7 days, then 30 days, then 60 days, etc.). A single column cannot track which milestones have been notified. A join table with a unique constraint on (eventId, milestone) cleanly prevents duplicates.

### Existing Fields -- No Changes Needed

The existing `reminderDays`, `reminderSent`, and `lastReminderSentAt` fields on the events table already handle streak-at-risk tracking. No changes needed there.

## Vercel Cron Configuration

Updated `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-reminders",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/check-milestones",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Note:** Vercel Hobby plan supports daily cron (once per day minimum). The weekly digest runs once a week, which is fine. All three crons are within plan limits since they each run at most once per day.

## File Structure

```
lib/
  email/
    service.ts              # Mailtrap Send API wrapper (single sendEmail function)
    templates/
      streak-warning.ts     # HTML template for streak-at-risk emails
      milestone.ts          # HTML template for milestone celebrations
      weekly-digest.ts      # HTML template for weekly digest
      test-email.ts         # HTML template for admin test email
  notifications/
    detectors.ts            # Detection logic for streaks, milestones, digests

app/
  api/
    cron/
      check-reminders/
        route.ts            # Existing -- refactor to use email service + detector
      check-milestones/
        route.ts            # New -- thin handler calling milestone detector
      weekly-digest/
        route.ts            # New -- thin handler calling digest generator
```

## Suggested Build Order

Dependencies between components dictate this order:

1. **Email Service** (lib/email/service.ts) -- Foundation. Everything else depends on this. Replace Nodemailer with Mailtrap Send API. This is also the fix for the broken email delivery.

2. **Schema Migration** -- Add `emailNotifications` to users table and create `milestone_notifications` table. Other components need these to exist.

3. **Refactor Existing Cron** -- Update check-reminders route to use the new email service and extract detection logic into detectors.ts. Validates that the new email service works in production before building new features on top of it.

4. **Notification Preferences UI** -- Simple toggle in settings. Required before sending new notification types (milestones, digests) so users have the ability to opt out.

5. **Milestone Detection + Email** -- New detector, new template, new cron route. Depends on email service, schema, and preferences all being in place.

6. **Streak-at-Risk Improvement** -- The existing reminder system already does basic streak detection. Enhance the template to frame it as "streak at risk" rather than just "reminder due."

7. **Weekly Digest** -- Most complex aggregation logic. Depends on all other notification types existing so it can summarize them. Build last.

**Rationale for this order:**
- Steps 1-3 fix what is broken (email delivery) and lay the foundation
- Step 4 gives users control before sending new email types
- Steps 5-7 add new notification types in order of independence (milestones are standalone, digests depend on everything)

## Scalability Considerations

| Concern | At 10 users | At 100 users | At 1,000 users |
|---------|-------------|--------------|----------------|
| Cron execution time | Under 1s | Under 5s | May approach Vercel timeout (60s Hobby) |
| Database queries | Trivial | Fine | Add indexes on userId, reminderDays |
| Mailtrap API rate limits | No concern | No concern | Check Mailtrap plan limits (free: 1,000/month) |
| Email batching | One query, loop users | Same | Consider chunked processing |

For a personal tracking app, the 10-100 user range is realistic. The architecture handles this without any special optimization. If it ever reaches 1,000+ users, the cron jobs would need to be chunked or moved to a queue-based system -- but that is firmly out of scope.

## Sources

- [Mailtrap Node.js SDK Integration](https://mailtrap.io/integrate-with/nodejs/) -- Official integration guide (HIGH confidence)
- [Mailtrap Node.js Tutorial](https://mailtrap.io/blog/send-emails-with-nodejs/) -- Send API code examples (HIGH confidence)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs) -- Cron configuration and limits (HIGH confidence)
- Existing codebase analysis: `app/api/cron/check-reminders/route.ts`, `app/(dashboard)/actions.ts`, `app/api/reminders/route.ts`, `lib/db.ts` (HIGH confidence -- direct inspection)
