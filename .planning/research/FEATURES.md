# Feature Research

**Domain:** Email notifications for a personal event/streak tracker app
**Researched:** 2026-03-26
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist once you offer email notifications. Missing these means the notification system feels broken or half-baked.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Working email delivery | Literally the foundation -- nothing else matters if emails don't arrive | LOW | Switch from Mailtrap sandbox SMTP to Mailtrap Send API. Current Nodemailer + sandbox config only captures to test inbox. |
| Consolidated email service | Scattered transporter instances (actions.ts + cron route) will cause maintenance bugs | LOW | Single module wrapping Mailtrap Send API, used everywhere. Prerequisite for all other email features. |
| Global notification opt-out | Users must be able to stop all emails with one action. Legal requirement (CAN-SPAM) and basic respect. | LOW | Simple boolean on users table + unsubscribe link in every email footer. |
| Unsubscribe link in every email | CAN-SPAM compliance. Gmail/Outlook may flag emails without it. | LOW | Static link to settings page or one-click unsubscribe token. Add to email template footer. |
| Streak-at-risk reminders | The existing `reminderDays` field already promises this behavior -- users configured it expecting emails. Broken promise if not delivered. | MEDIUM | Query events where days_since >= reminderDays and no recent reminder sent. Already partially implemented in cron route, just needs working delivery. |
| Clean, readable HTML email templates | Ugly or plain-text-only emails feel like spam. Simple branded template with logo, good typography, brand colors. | MEDIUM | Single base template with content slots. No complex layouts, no images beyond logo. Inline CSS for email client compatibility. |
| Idempotent sends / duplicate prevention | Sending the same milestone or reminder email twice erodes trust fast | LOW | Track what was sent with `lastReminderSentAt` (exists), add `lastMilestoneNotified` for milestones. Check before sending. |

### Differentiators (Competitive Advantage)

Features that make the notification experience feel thoughtful rather than generic.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Milestone celebration emails | Emotional payoff for commitment. Most tracker apps only do in-app celebrations -- email brings the celebration to the user without requiring app opens. Hit 30 days? 100 days? 365 days? Users love acknowledgment. | MEDIUM | Thresholds: 7, 30, 60, 90, 100, 180, 365 days. Cron job checks days_since against milestone list. Need `lastMilestoneNotified` field to avoid re-sends. Encouraging, positive tone is key. |
| Weekly digest summary | Single email showing all tracked events, recent milestones, and upcoming reminder thresholds. Replaces "should I open the app?" anxiety with a regular pulse. | MEDIUM | Separate cron schedule (weekly). Aggregate all user events into one email. Show days_since for each, highlight milestones hit that week, flag events approaching reminderDays threshold. |
| Positive/encouraging message tone | Research shows framing matters enormously. "You showed up for 42 days straight -- incredible!" beats "42 days since X" by a mile. Loss-aversion-aware messaging turns routine notifications into micro-celebrations. | LOW | Copywriting concern, not code complexity. Build a small message generator that picks encouraging phrases based on milestone tier. |
| Event name in email subject line | "Congrats! 100 days since Quit Smoking" is personal and compelling. Generic "Days Since Update" gets ignored. | LOW | Template the event name into subject. Already partially done in current reminder code. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for a solo-dev personal tracker.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Per-notification-type toggles (milestone on/off, reminders on/off, digest on/off) | Granular control sounds user-friendly | Multiplies UI complexity, settings state, and edge cases. For a personal app with one user type, this is over-engineering. Users either want emails or they don't. | Simple global on/off toggle. Revisit granular controls only if users actively request it post-launch. |
| Daily digest option | "I want to check in every day" | Daily emails from a personal tracker app feel spammy fast. Users will unsubscribe from everything. Weekly is the right cadence for a digest -- it's a summary, not a feed. | Weekly digest only. Streak-at-risk reminders already cover urgent daily-cadence needs. |
| User-configurable milestone thresholds | "I want to celebrate 15 days, not 30" | Custom thresholds add per-event configuration UI, validation, storage, and edge cases. Round numbers are universally understood and expected. | Fixed milestone set: 7, 30, 60, 90, 100, 180, 365. Add more thresholds to the fixed list if patterns emerge. |
| Rich HTML email templates with images | "Make the emails beautiful" | Image-heavy emails get clipped by Gmail (>102KB), blocked by Outlook, and look broken on half of email clients. Complex layouts are a maintenance nightmare. | Simple, clean HTML with inline CSS, brand colors, good typography, minimal structure. One logo at most. |
| Real-time email on event reset | "Confirm my reset via email" | Transactional emails for every user action are noisy and add latency to the reset flow. No one needs email confirmation that they just clicked a button. | No email on reset. Cron-based batch processing only. |
| Auto-detected streak patterns | "Detect my habits automatically" | Requires pattern analysis, ML-adjacent logic, false positive handling. Way too complex for the value. | Use existing `reminderDays` field -- user explicitly says "remind me after N days." No guessing needed. |
| Push notifications / in-app notification center | "I want notifications in the app too" | Adds service workers, notification permissions, a notification UI component, read/unread state management. Entirely separate infrastructure from email. | Email only for this milestone. If push is needed later, it's a separate milestone with its own research. |
| Timezone-aware send scheduling | "Send my digest at 8am my local time" | Requires storing user timezone, converting cron logic per-user, complicating the batch job significantly. | Send all emails at a fixed UTC time via Vercel Cron. For a personal app, "sometime in the morning" is fine. Timezone support is a v2 concern. |

## Feature Dependencies

```
[Consolidated email service]
    |
    +---> [Working email delivery]
    |         |
    |         +---> [Streak-at-risk reminders] (already partially built)
    |         |
    |         +---> [Milestone celebration emails]
    |         |
    |         +---> [Weekly digest summary]
    |
    +---> [Clean HTML email template]
              |
              +---> [Unsubscribe link in footer]

[Global notification toggle on users table]
    |
    +---> All email features check this before sending

[Milestone tracking field (lastMilestoneNotified)]
    |
    +---> [Milestone celebration emails]
```

### Dependency Notes

- **All email features require consolidated email service:** Must exist before building any notification type. Currently email code is scattered across two files with broken SMTP config.
- **Milestone emails require new DB field:** Need `lastMilestoneNotified` (integer) on events table to track highest milestone sent, preventing duplicate celebrations.
- **Unsubscribe link requires notification toggle:** The link destination needs the toggle to exist in the UI and DB.
- **Weekly digest is independent of other notification types:** Can be built in parallel with milestone emails once the email service and template are in place.
- **Streak-at-risk reminders are nearly complete:** Existing cron job logic works, just needs the email service swap and template upgrade.

## MVP Definition

### Launch With (v1)

Minimum viable notification system -- validate that users want and engage with emails.

- [ ] Consolidated email service using Mailtrap Send API -- foundation for everything
- [ ] Clean HTML email base template with unsubscribe link -- shared across all email types
- [ ] Global notification on/off toggle -- users table boolean, settings UI toggle
- [ ] Fixed streak-at-risk reminders -- repair existing cron job with working delivery
- [ ] Milestone celebration emails -- 7, 30, 60, 90, 100, 180, 365 day thresholds

### Add After Validation (v1.x)

Features to add once core emails are working and users confirm they engage with them.

- [ ] Weekly digest summary -- add after milestone + reminder emails prove users open emails
- [ ] Richer milestone messaging -- expand encouraging copy variants based on which milestones resonate

### Future Consideration (v2+)

Features to defer until email engagement data exists.

- [ ] Per-notification-type toggles -- only if users ask to keep some emails but not others
- [ ] Timezone-aware scheduling -- only if users complain about send times
- [ ] Additional milestone thresholds -- only if users request specific ones

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Consolidated email service (Mailtrap Send API) | HIGH | LOW | P1 |
| Clean HTML email template | HIGH | MEDIUM | P1 |
| Global notification toggle + unsubscribe | HIGH | LOW | P1 |
| Streak-at-risk reminders (fix existing) | HIGH | LOW | P1 |
| Milestone celebration emails | HIGH | MEDIUM | P1 |
| Duplicate send prevention | HIGH | LOW | P1 |
| Positive/encouraging message tone | MEDIUM | LOW | P1 |
| Weekly digest summary | MEDIUM | MEDIUM | P2 |
| Per-type notification toggles | LOW | MEDIUM | P3 |
| Timezone-aware scheduling | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- email service, templates, toggle, reminders, milestones
- P2: Should have, add when possible -- weekly digest
- P3: Nice to have, future consideration -- granular controls, timezone

## Competitor Feature Analysis

| Feature | Duolingo (streak leader) | Streaks App | Habitify | Our Approach |
|---------|--------------------------|-------------|----------|--------------|
| Streak-at-risk warning | Push notification, in-app nudge | Push notification | Push + email | Email reminder using existing reminderDays field |
| Milestone celebrations | Animated confetti, shareable badges | Badge system | Progress rings | Email celebration with encouraging copy, no complex graphics |
| Digest/summary | Weekly email recap | None | Weekly summary | Weekly digest email with all events, milestones, upcoming reminders |
| Notification control | Granular per-type toggles | Basic on/off | Per-type toggles | Simple on/off toggle (appropriate for personal app scale) |
| Tone | Gamified, sometimes guilt-trippy ("Duo is sad") | Neutral | Neutral | Positive and encouraging, never guilt-based |

## Sources

- [Designing A Streak System: The UX And Psychology Of Streaks (Smashing Magazine, Feb 2026)](https://www.smashingmagazine.com/2026/02/designing-streak-system-ux-psychology/) -- milestone thresholds, grace mechanisms, messaging tone
- [Design Guidelines For Better Notifications UX (Smashing Magazine)](https://www.smashingmagazine.com/2025/07/design-guidelines-better-notifications-ux/) -- notification preference patterns, gradual permission
- [Build a better email digest (Data Operations)](https://www.finddataops.com/p/build-a-better-email-digest) -- digest content density, frequency patterns
- [When Your App Needs a Streak Feature (Trophy)](https://trophy.so/blog/when-your-app-needs-streak-feature) -- streak notification timing
- Existing codebase analysis: `app/api/cron/check-reminders/route.ts`, `lib/db.ts` schema

---
*Feature research for: Email notifications in personal event/streak tracker*
*Researched: 2026-03-26*
