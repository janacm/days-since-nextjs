# Project Research Summary

**Project:** Days Since — Email Notifications
**Domain:** Email notification system for personal event/streak tracker
**Researched:** 2026-03-26
**Confidence:** HIGH

## Executive Summary

Days Since is a personal event tracker with a broken email notification system. The current implementation uses Nodemailer with Mailtrap's sandbox SMTP, which captures emails in a test inbox but never delivers to real recipients. The fix is straightforward: replace Nodemailer with the Mailtrap Send API (official SDK), consolidate scattered email code into a single service module, and build notification features on top of that foundation. This is a well-understood problem domain with high-quality official documentation for every component.

The recommended approach is a layered build: fix email delivery first (Mailtrap Send API + consolidated service module), add notification preferences and unsubscribe compliance, then build notification types in dependency order (streak warnings already partially exist, milestones next, weekly digest last). The architecture follows a clean separation -- thin cron route handlers delegate to detection logic, which calls template functions, which feed into the single email service. No new major dependencies are needed beyond the `mailtrap` npm package.

The key risks are operational, not technical. Mailtrap domain verification must happen before any code ships (DNS propagation takes hours). The existing CRON_SECRET env variable name mismatch between code and `.env.local` may be silently blocking cron execution today. Duplicate email sends from cron retries need idempotency protection built in from day one. And CAN-SPAM compliance (unsubscribe link + opt-out toggle) must ship with the first production email, not as a follow-up.

## Key Findings

### Recommended Stack

The stack is minimal. One new dependency (`mailtrap` npm package), two removed (`nodemailer`, `@types/nodemailer`), and extensions to the existing Drizzle schema and Vercel Cron configuration. Everything else builds on what already exists in the codebase.

**Core technologies:**
- **Mailtrap SDK (`mailtrap` ^4.5.1):** Send transactional emails via HTTP API -- replaces broken Nodemailer SMTP, works reliably on Vercel serverless
- **Plain TypeScript template functions:** Generate HTML email strings with inline CSS -- no template library needed for 3 email types
- **Vercel Cron Jobs:** Already in use, extend with additional cron paths for milestones and weekly digest
- **Drizzle ORM (existing):** Add `emailNotifications` column to users table, create `milestone_notifications` tracking table

**Critical setup requirement:** Mailtrap Send API requires a verified sending domain with DNS records (CNAME, DKIM, SPF, DMARC). This must be completed before any Send API code is deployed.

### Expected Features

**Must have (table stakes):**
- Working email delivery via Mailtrap Send API
- Consolidated email service module (replace 3 scattered Nodemailer instances)
- Global notification on/off toggle with unsubscribe link in every email
- Streak-at-risk reminders (partially built, needs working delivery)
- Milestone celebration emails (7, 30, 60, 90, 100, 180, 365 days)
- Duplicate send prevention (idempotency)

**Should have (differentiators):**
- Weekly digest summary (all events, recent milestones, at-risk streaks)
- Positive/encouraging message tone rather than neutral or guilt-based
- Event name in email subject lines for personalization

**Defer (v2+):**
- Per-notification-type toggles (on/off per email type)
- Timezone-aware send scheduling
- User-configurable milestone thresholds

### Architecture Approach

The architecture separates concerns into four layers: cron route handlers (thin HTTP auth + delegation), detection logic (query DB, determine who gets notified), email templates (pure functions returning HTML strings), and a single email service (Mailtrap API wrapper). A new `milestone_notifications` join table tracks which milestones have been sent per event, using a unique constraint on (eventId, milestone) to prevent duplicates at the database level.

**Major components:**
1. **Email Service** (`lib/email/service.ts`) -- Single Mailtrap Send API wrapper, all email sending flows through here
2. **Email Templates** (`lib/email/templates/`) -- Pure functions per email type, return HTML strings, no side effects
3. **Notification Detectors** (`lib/notifications/detectors.ts`) -- Query logic for streaks-at-risk, milestone hits, and digest aggregation
4. **Cron Route Handlers** (`app/api/cron/*/route.ts`) -- Thin handlers: authenticate, call detector, return status
5. **Notification Preferences** -- Server Action + settings UI toggle, `emailNotifications` boolean on users table

### Critical Pitfalls

1. **Duplicate email sends from cron retries** -- Mark events as "processing" BEFORE sending (optimistic lock). Use `milestone_notifications` table with unique constraint. Do not update DB after send; update before.
2. **CRON_SECRET env variable mismatch** -- Code reads `CRON_SECRET`, `.env.local` defines `CRON_SECRET_KEY`. Audit and align env vars across code, `.env.local`, and Vercel dashboard before any work begins.
3. **Mailtrap domain verification blocking production** -- Verify sending domain DNS records before writing Send API code. DNS propagation can take hours. Do not plan to verify and ship same day.
4. **No unsubscribe mechanism** -- Build notification toggle and unsubscribe link BEFORE sending any production emails. Gmail/Outlook will flag emails without unsubscribe, damaging domain reputation permanently.
5. **userId stores email address, not a foreign key** -- The new email service must resolve userId through the users table rather than assuming userId is the email. Prevents breakage if auth model ever changes.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Email Foundation

**Rationale:** Everything depends on working email delivery. The current system is broken. Fix the foundation before building features on top of it.
**Delivers:** Working email sending, consolidated service module, notification preferences, env var fixes, domain verification
**Addresses:** Working email delivery, consolidated email service, global notification toggle, unsubscribe link, duplicate prevention
**Avoids:** CRON_SECRET mismatch, domain verification blocking, no-unsubscribe compliance risk, duplicate sends

Includes:
- Verify Mailtrap sending domain (DNS setup, pre-coding)
- Install `mailtrap` SDK, remove `nodemailer`
- Create `lib/email/service.ts` with single `sendEmail` function
- Create base HTML email template with unsubscribe footer
- Add `emailNotifications` boolean to users table (Drizzle migration)
- Create `milestone_notifications` table (Drizzle migration)
- Fix CRON_SECRET env variable alignment
- Add notification toggle to settings UI
- Refactor existing check-reminders cron to use new email service

### Phase 2: Milestone Celebrations

**Rationale:** Milestones are the highest-value new feature and are independent of other notification types. Builds on the email foundation without requiring digest aggregation logic.
**Delivers:** Milestone detection, celebration email templates, new cron route
**Addresses:** Milestone celebration emails, encouraging message tone, event name in subjects
**Avoids:** Missed milestones from exact-day matching (detect "passed" milestones, not just exact matches), duplicate milestone sends

Includes:
- Create milestone detection logic in `lib/notifications/detectors.ts`
- Create milestone email template with encouraging copy
- Create `/api/cron/check-milestones` route
- Handle milestone detection for events that skip days (day 29 to day 31 should still trigger 30-day milestone)
- Update streak warning template with improved "at risk" framing

### Phase 3: Weekly Digest

**Rationale:** Digest depends on all other notification types existing so it can summarize them. Most complex aggregation logic. Build last.
**Delivers:** Weekly digest email aggregating all events per user
**Addresses:** Weekly digest summary, reduced need for manual app checking
**Avoids:** Conflicting notifications (exclude events from digest that already triggered milestone/streak emails that week), email fatigue

Includes:
- Create digest aggregation logic in detectors
- Create weekly digest email template
- Create `/api/cron/weekly-digest` route (Monday 9am UTC)
- Deduplicate: events with milestone/streak emails that week are noted but not double-reported

### Phase Ordering Rationale

- **Phase 1 first because nothing works without it.** The email service is broken today. Every other feature depends on working delivery, and CAN-SPAM compliance (unsubscribe) must ship with the first real email.
- **Phase 2 before Phase 3 because milestones are standalone.** Milestone detection only needs the email service and the tracking table. No dependency on other notification types.
- **Phase 3 last because digests aggregate everything.** The weekly digest summarizes milestones hit, streaks at risk, and all events. It needs the other notification types to exist first to avoid duplication logic gaps.
- **Schema migrations in Phase 1** so both Phase 2 and 3 have the tables they need without migration overhead during feature work.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Mailtrap domain verification process -- confirm exact DNS records needed and verify the sending domain before coding begins. Also audit what `userId` actually contains in production data.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Milestone detection is straightforward date arithmetic plus DB lookups. Well-documented patterns.
- **Phase 3:** Digest email aggregation is standard query + template work. No novel patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Mailtrap docs, npm registry, existing codebase analysis. One new dependency. |
| Features | HIGH | Feature set derived from competitor analysis (Duolingo, Streaks, Habitify) and UX research. Clear table-stakes vs. differentiators. |
| Architecture | HIGH | Patterns directly informed by existing codebase problems. Component boundaries are clean and testable. |
| Pitfalls | HIGH | Pitfalls identified from codebase inspection (CRON_SECRET mismatch, userId-as-email) and documented platform constraints (Vercel timeouts, Mailtrap domain verification). |

**Overall confidence:** HIGH

### Gaps to Address

- **Production data audit:** Verify what `userId` field actually contains in production -- email addresses or user IDs. The notification system's email resolution logic depends on this.
- **Mailtrap free plan limits:** 150 emails/day is generous for a personal app, but if the user base grows, this becomes a constraint. Monitor usage after launch.
- **Vercel Hobby cron limits:** Documentation says 1 cron job per day on Hobby, but the architecture proposes 3 cron entries. Verify whether Hobby plan supports multiple cron entries (each running once/day) or only a single cron entry total.
- **Email rendering across clients:** HTML email templates need manual testing in Gmail, Outlook, and Apple Mail. No automated solution for this -- plan for manual QA during Phase 1.

## Sources

### Primary (HIGH confidence)
- [Mailtrap Node.js SDK Guide](https://docs.mailtrap.io/guides/sdk/nodejs) -- Send API setup, authentication
- [Mailtrap Node.js GitHub](https://github.com/mailtrap/mailtrap-nodejs) -- SDK API, TypeScript types
- [Mailtrap Sending Domain Setup](https://docs.mailtrap.io/email-api-smtp/setup/sending-domain) -- DNS verification requirements
- [Mailtrap Sending Limits](https://docs.mailtrap.io/email-api-smtp/setup/sending-limits) -- Free plan: 150/day
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs) -- Configuration, timing, plan limits
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) -- 60s timeout on Hobby
- Existing codebase: `check-reminders/route.ts`, `actions.ts`, `lib/db.ts`, `.env.local`, `vercel.json`

### Secondary (MEDIUM confidence)
- [Designing A Streak System (Smashing Magazine, Feb 2026)](https://www.smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/) -- Milestone thresholds, messaging tone
- [Design Guidelines For Better Notifications UX (Smashing Magazine)](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/) -- Notification preferences patterns
- [Engineering Idempotency Keys (Resend blog)](https://resend.com/blog/engineering-idempotency-keys) -- Duplicate prevention patterns

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
