# Technology Stack

**Project:** Days Since — Email Notifications
**Researched:** 2026-03-26

## Recommended Stack

### Email Sending

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `mailtrap` (official SDK) | ^4.5.1 | Send transactional emails via Mailtrap Send API | Official Node.js SDK with TypeScript support. Replaces Nodemailer+SMTP with HTTP API calls. Already have MAILTRAP_API_TOKEN. Sandbox/production toggle via single flag. |

**Confidence: HIGH** — Verified via official Mailtrap docs, GitHub README, and npm registry.

The `mailtrap` npm package provides `MailtrapClient` with a `send()` method that accepts HTML directly. This is the correct replacement for the broken Nodemailer+sandbox SMTP setup.

```typescript
import { MailtrapClient } from "mailtrap";

const client = new MailtrapClient({
  token: process.env.MAILTRAP_API_TOKEN!,
});

await client.send({
  from: { name: "Days Since", email: "notifications@yourdomain.com" },
  to: [{ email: recipientEmail }],
  subject: "Your milestone!",
  html: "<h1>Congrats!</h1><p>...</p>",
  category: "milestone", // for tracking in Mailtrap dashboard
});
```

### Email Templates

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Plain TypeScript template functions | N/A | Generate HTML email strings | No library needed. Simple string templates with inline CSS. The project scope explicitly excludes complex email templates. For a solo dev with 3 email types, functions returning HTML strings are the right call. |

**Confidence: HIGH** — This is a design decision aligned with project constraints, not a technology bet.

Template approach: TypeScript functions that return HTML strings with inline CSS. One function per email type (milestone, streak warning, weekly digest), plus a shared layout wrapper.

```typescript
// lib/email/templates.ts
export function milestoneEmail(data: { eventName: string; days: number }): string {
  return baseLayout(`
    <h1>${data.days} days!</h1>
    <p>Your event "${data.eventName}" hit a milestone.</p>
  `);
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      ${content}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #6b7280; font-size: 12px;">Days Since App</p>
    </body></html>`;
}
```

### Scheduling (Cron)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel Cron Jobs | N/A (platform feature) | Trigger daily/weekly email checks | Already in use for check-reminders. Extend vercel.json with additional cron paths. Zero additional dependencies. |

**Confidence: HIGH** — Already working in the codebase (`vercel.json` has daily cron at midnight).

**Critical constraint on Hobby plan:** Only 1 cron job execution per day. All daily checks (reminders, milestones, streak warnings) must run in a SINGLE cron endpoint, not separate ones. The weekly digest can use the same endpoint with day-of-week logic, or add a separate weekly cron entry.

Recommended approach: One daily endpoint that handles all email types, with day-of-week branching for weekly digest.

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-emails",
      "schedule": "0 0 * * *"
    }
  ]
}
```

If on Pro plan (hourly crons allowed), you could separate them. But for Hobby, consolidate.

### Database Schema Additions

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Drizzle ORM | ^0.31.4 (existing) | New columns for milestone tracking and notification preferences | Already in use. No new ORM needed. Add columns to existing `events` and `users` tables. |

**Confidence: HIGH** — Extending existing schema, no new technology.

New fields needed:
- `users` table: `emailNotifications` boolean (default true) — the on/off toggle
- `events` table: `lastMilestoneNotified` integer (nullable) — tracks last milestone day count notified (7, 30, 60, etc.) to avoid duplicate sends

### Removed Dependencies

| Technology | Action | Why |
|------------|--------|-----|
| `nodemailer` | **REMOVE** | Replaced entirely by `mailtrap` SDK. Currently broken (sandbox SMTP). No reason to keep both. |
| `@types/nodemailer` | **REMOVE** | No longer needed once nodemailer is removed. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Email sending | `mailtrap` SDK (HTTP API) | Nodemailer with Mailtrap SMTP | Nodemailer+SMTP is what's broken now. The HTTP API is more reliable on serverless (no persistent SMTP connections needed), simpler config (one token vs host/port/user/pass), and is Mailtrap's recommended approach. |
| Email sending | `mailtrap` SDK | Resend API (`resend` npm) | Project already has MAILTRAP_API_TOKEN and chose Mailtrap. Resend API key exists but switching providers adds unnecessary decision overhead. |
| Email sending | `mailtrap` SDK | Raw `fetch()` to Mailtrap REST API | SDK handles auth headers, error parsing, TypeScript types, and sandbox toggling. Not worth reimplementing for 3 email types. |
| Email templates | Plain TS functions | React Email (`@react-email/components`) | Massive over-engineering for 3 simple email types. React Email is great for teams with dozens of templates and a design system. Solo dev with milestone/streak/digest emails does not need JSX-to-HTML compilation. |
| Email templates | Plain TS functions | MJML | Another templating layer with its own syntax. Adds build complexity. Inline CSS in template functions is fine for simple layouts. |
| Email templates | Plain TS functions | Mailtrap Templates (server-side) | Mailtrap offers template management via their dashboard/API. But this means managing templates in two places (code + Mailtrap dashboard). Keep everything in code for a solo dev. |
| Scheduling | Vercel Cron | External cron service (cron-job.org, Upstash QStash) | Already have Vercel Cron working. Adding an external service for a personal app is unnecessary complexity. |
| Scheduling | Single daily endpoint | Separate endpoints per email type | Vercel Hobby limits to 1 cron/day. Must consolidate. Even on Pro, fewer endpoints = simpler maintenance. |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| `nodemailer` | The root cause of the current broken state. SMTP on serverless is fragile — connections time out, sandbox SMTP never delivers. Remove it. |
| `@react-email/components` | 15+ packages for what amounts to 3 HTML templates. Over-engineered for this use case. |
| `email-templates` (npm package) | Requires EJS + Juice + Nodemailer integration. More moving parts than needed. |
| Mailtrap SMTP (port 587/2525) | HTTP API is more reliable on Vercel's serverless functions. SMTP requires persistent connections that serverless doesn't guarantee. |
| `mjml` | Custom markup language that compiles to HTML. Learning curve and build step for minimal benefit on simple templates. |
| Bull/BullMQ job queues | No Redis available on Vercel. Cron + direct sends is sufficient for this scale. |

## Installation

```bash
# Add
npm install mailtrap

# Remove
npm uninstall nodemailer @types/nodemailer
```

## Environment Variables

```bash
# Already exists (keep)
MAILTRAP_API_TOKEN=your_token_here
CRON_SECRET=your_cron_secret

# New (required)
MAILTRAP_SENDER_EMAIL=notifications@yourdomain.com  # Must be from a verified domain in Mailtrap

# Remove
# SMTP_HOST (no longer needed)
# SMTP_PORT (no longer needed)
# SMTP_USER (no longer needed)
# SMTP_PASS (no longer needed)
# SMTP_FROM (no longer needed)
```

**Important:** Mailtrap Send API requires a verified sending domain. The sender email must use a domain you've verified in Mailtrap's dashboard. You cannot send from arbitrary addresses like `reminders@dayssince.app` unless `dayssince.app` is verified.

## Mailtrap Free Plan Limits

| Limit | Value | Impact |
|-------|-------|--------|
| Daily sends | 150 emails/day | More than enough for a personal app |
| Monthly sends | ~3,500-4,000/month | Sufficient unless user count grows significantly |
| Hourly rate (new accounts) | 150 emails/hour | Not a concern at personal app scale |

For a personal event tracker, these limits are generous. A user with 20 events would receive at most 1 digest + a few milestone/streak emails per week.

## Sources

- [Mailtrap Node.js SDK Guide](https://docs.mailtrap.io/guides/sdk/nodejs) — Official setup documentation
- [Mailtrap Node.js GitHub](https://github.com/mailtrap/mailtrap-nodejs) — SDK source, README with full API
- [Mailtrap API Integration](https://docs.mailtrap.io/email-api-smtp/setup/api-integration) — Production setup
- [Mailtrap Sending Limits](https://docs.mailtrap.io/email-api-smtp/setup/sending-limits) — Rate limits documentation
- [Mailtrap Pricing](https://mailtrap.io/pricing/) — Free plan details
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) — Scheduling documentation
- [Vercel Cron Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) — Hobby vs Pro limits
- [mailtrap on npm](https://www.npmjs.com/package/mailtrap) — Package version 4.5.1
