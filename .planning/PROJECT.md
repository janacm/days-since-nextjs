# Days Since — Email Notifications

## What This Is

Days Since is a personal event tracker where users log events and track how many days since they happened, with reset tracking and per-event analytics. This milestone adds a working email notification system — fixing the broken email delivery, then expanding into milestone celebrations, streak-at-risk warnings, and weekly digest summaries.

## Core Value

Users receive timely, interesting email notifications about their tracked events — milestones hit, streaks at risk, and weekly summaries — without any manual checking.

## Requirements

### Validated

- ✓ User can create, edit, and delete events — existing
- ✓ User can reset events and track reset history — existing
- ✓ User can view per-event analytics (reset charts) — existing
- ✓ User can sign up and log in with email/password — existing
- ✓ User can set reminder days per event — existing
- ✓ User can mark events as private or non-resettable — existing
- ✓ User can search and sort events — existing
- ✓ Dark/light theme support — existing
- ✓ PWA support — existing
- ✓ Vercel Cron job infrastructure for scheduled tasks — existing

### Active

- [ ] Fix email delivery — switch from Mailtrap sandbox SMTP to Mailtrap Send API for production delivery
- [ ] Milestone celebration emails — notify when events hit round-number thresholds (7, 30, 60, 90, 100, 180, 365 days)
- [ ] Streak-at-risk warnings — warn users when events haven't been reset within their configured reminderDays threshold
- [ ] Weekly digest email — summarize all tracked events, recent milestones, and upcoming reminders in one weekly email
- [ ] Simple email notification toggle — users can opt in/out of all email notifications with a single on/off switch
- [ ] Simple, clean HTML email templates — styled with brand colors, good typography, no complex layouts
- [ ] Consolidate email sending — single email service module using Mailtrap Send API, replacing scattered Nodemailer transporter instances

### Out of Scope

- WYSIWYG email editor — solo developer, templates built in code
- Per-notification-type opt-in/out — too much UI complexity for v1, simple on/off toggle instead
- Daily digest option — weekly is sufficient, avoids feeling spammy
- User-configurable milestone thresholds — round numbers only for v1
- Auto-detected streak patterns — use existing reminderDays field instead
- Rich branded email templates — simple and clean is the goal
- Push notifications / in-app notifications — email only for this milestone

## Context

- **Current state:** Email sending exists but is broken. Uses Nodemailer with Mailtrap's sandbox SMTP (sandbox.smtp.mailtrap.io:2525) which only captures emails in a test inbox — never delivers to real recipients.
- **Available credentials:** MAILTRAP_API_TOKEN for the Send API, plus SMTP credentials for sandbox testing. Also has RESEND_API_KEY but choosing Mailtrap for consistency.
- **Email code is scattered:** Nodemailer transporter is initialized in both `app/(dashboard)/actions.ts` and `app/api/cron/check-reminders/route.ts` — needs consolidation into a single email service.
- **Cron infrastructure exists:** Vercel Cron already hits `/api/cron/check-reminders` daily at midnight. This can be expanded for milestone checks and weekly digests.
- **Database schema:** Events table has `reminderDays`, `reminderSent`, `lastReminderSentAt` fields already. May need new fields for milestone tracking and notification preferences.
- **Tech stack:** Next.js 16 App Router, React 19, Drizzle ORM, Neon Postgres, deployed on Vercel.

## Constraints

- **Email service:** Mailtrap Send API — already has API token configured
- **Hosting:** Vercel — cron jobs limited to once per day on free tier, once per hour on Pro
- **Solo developer:** Keep everything simple and maintainable
- **No new major dependencies:** Prefer Mailtrap's API directly over adding email template libraries

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mailtrap Send API over Resend | Already have API token, keep Mailtrap sandbox for testing + Send API for production | — Pending |
| Round-number milestones only | Avoids per-event configuration UI complexity | — Pending |
| Weekly digest, not daily | Less spammy for a personal tracking app | — Pending |
| Simple on/off notification toggle | Minimal UI for v1, can expand to per-type later | — Pending |
| reminderDays for streak warnings | Reuses existing field, no new UX needed | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after initialization*
