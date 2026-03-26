# Pitfalls Research

**Domain:** Email notification system for Next.js/Vercel personal event tracker
**Researched:** 2026-03-26
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Duplicate Email Sends from Cron Retries and Race Conditions

**What goes wrong:**
Vercel cron jobs can trigger anywhere within a 59-minute window of the scheduled time. If a cron job times out or returns an error, Vercel may retry it. Without idempotency protection, users receive the same milestone celebration or streak warning email multiple times. The existing code updates `lastReminderSentAt` after sending, but if the function crashes between sending the email and writing to the database, the next run re-sends.

**Why it happens:**
The current cron handler sends emails and then updates the database in sequence (lines 128-138 of `check-reminders/route.ts`). There is no atomic "claim-then-send" pattern. On a retry or concurrent execution, the same events get picked up again because the DB has not been updated yet.

**How to avoid:**
1. Mark events as "processing" in the database BEFORE sending the email (optimistic lock). Set `lastReminderSentAt = NOW()` before the send call, not after.
2. Use a `notificationLog` table that records `(userId, notificationType, eventId, sentDate)` with a unique constraint. Check this table before sending.
3. Include an idempotency key in the Mailtrap API call if supported, or generate one from `userId + eventId + date` to deduplicate.

**Warning signs:**
- Users report receiving the same email twice in a single day
- Cron job logs show the same event IDs being processed in consecutive runs
- `lastReminderSentAt` timestamps cluster suspiciously close together

**Phase to address:**
Phase 1 (email service consolidation) -- build the deduplicated send pattern into the new email service module from the start.

---

### Pitfall 2: CRON_SECRET Env Variable Mismatch Already Exists

**What goes wrong:**
The cron route checks `process.env.CRON_SECRET` (line 24) but `.env.local` defines `CRON_SECRET_KEY`. This means the cron endpoint is either always rejecting requests (returning 401) or Vercel has a separately configured `CRON_SECRET`. If the Vercel environment variable does not match, the cron job silently fails every day with a 401 -- emails never send and there are no user-visible errors.

**Why it happens:**
Variable naming drift between local development and deployment. The existing code was never delivering real emails (sandbox SMTP), so this mismatch may have gone unnoticed.

**How to avoid:**
1. Audit env variable names in code vs. `.env.local` vs. Vercel dashboard before any email work begins.
2. Use Vercel's built-in `CRON_SECRET` which is auto-injected for cron requests -- no custom variable needed.
3. Add a health check endpoint or startup log that confirms cron auth is configured correctly.

**Warning signs:**
- Cron job returns 401 in Vercel function logs
- Zero emails sent despite events meeting reminder criteria
- `notifiedUsers: 0` in every cron response

**Phase to address:**
Phase 1 -- fix this immediately when consolidating the email service. Verify Vercel dashboard env vars match code expectations.

---

### Pitfall 3: Mailtrap Domain Verification Blocking Production Sends

**What goes wrong:**
Switching from Mailtrap sandbox SMTP to the Send API requires a verified sending domain with DNS records (CNAME for domain verification, DKIM x2, SPF, DMARC, tracking domain). Without verification, the API rejects all send requests. Developers switch the code, deploy, and then discover emails silently fail because the domain is not verified.

**Why it happens:**
The sandbox SMTP needs zero domain setup -- it captures everything. The Send API is a production service that requires sender authentication. This is a fundamentally different setup requirement that is easy to overlook when treating it as "just swapping the transport."

**How to avoid:**
1. Set up and verify the sending domain in Mailtrap dashboard BEFORE writing any Send API code.
2. DNS propagation takes 15 minutes to several hours. Do not plan to verify and ship on the same day.
3. Verify the "from" address matches the verified domain exactly.
4. Keep sandbox SMTP available for local/preview environments while Send API is used in production.

**Warning signs:**
- Mailtrap API returns 401 or domain-not-verified errors
- Email sends succeed in local dev (sandbox) but fail in production
- No "Verified" badge on the domain in Mailtrap dashboard

**Phase to address:**
Phase 1 -- domain verification is a prerequisite step before any Send API integration code.

---

### Pitfall 4: Vercel Function Timeout with Growing User Base

**What goes wrong:**
The cron handler fetches ALL events needing notifications across ALL users in a single query, then loops through them sequentially sending emails one by one. On the Hobby plan, serverless functions timeout at 60 seconds. With Mailtrap's API latency (~200-500ms per call), this limits throughput to roughly 120-300 emails per cron run. The function times out mid-loop, some users get emails, others do not, and the partially-processed batch leaves the database in an inconsistent state.

**Why it happens:**
Sequential email sending in a single function invocation works fine for 5 users but fails at scale. The current code has no batching, no pagination, and no partial-completion handling.

**How to avoid:**
1. Process users in batches with early exit if approaching the timeout threshold (check elapsed time, bail at 50 seconds).
2. Use the "mark before send" pattern so partially-completed batches do not re-send on the next run.
3. For this project's scale (personal app, likely <50 users), this is unlikely to be an immediate problem, but the architecture should not prevent scaling.
4. Consider splitting milestone checks, streak warnings, and digest emails into separate cron endpoints to distribute work.

**Warning signs:**
- Vercel function logs show TIMEOUT errors on the cron route
- Some users receive emails but others consistently do not
- Cron response never returns (no success/error JSON)

**Phase to address:**
Phase 2-3 (when adding milestone and digest emails) -- the workload increases with each notification type. Design the cron architecture to handle multiple notification types without a single monolithic handler.

---

### Pitfall 5: userId-as-Email Assumption in Event Schema

**What goes wrong:**
The events table stores `userId` as `varchar(255)` and the cron route uses `event.userId` directly as the email recipient address (line 77: `for (const [userEmail, userEvents] of ...`). This conflates user identity with email address. If authentication ever changes (e.g., OAuth login where userId is a UUID), emails go to nonsensical addresses or fail silently. Even now, if a user changes their email, old events still point to the old address.

**Why it happens:**
Early design decision to use email as the user identifier. Works until it doesn't.

**How to avoid:**
1. In the new email service, always look up the user's current email from the `users` table by joining `events.userId` to `users.email` (or `users.id` if userId stores the numeric ID).
2. Never pass `event.userId` directly as an email recipient. Always resolve it through the users table.
3. This is a data integrity concern -- audit what `userId` actually contains in production data.

**Warning signs:**
- Email sent to addresses that are not valid email format
- Emails go to old addresses after a user updates their email
- Bounce rate increases over time

**Phase to address:**
Phase 1 -- the new consolidated email service should include a `getUserEmail(userId)` lookup rather than assuming userId is the email.

---

### Pitfall 6: No Notification Preferences Means No Unsubscribe

**What goes wrong:**
Adding email notifications without an opt-out mechanism violates CAN-SPAM (US) and GDPR (EU) regulations. Even for a personal app, email providers (Gmail, Outlook) will mark emails as spam if recipients have no way to unsubscribe, which damages the sending domain's reputation permanently.

**Why it happens:**
Developers focus on sending logic and defer the unsubscribe flow as "nice to have." But email reputation damage from even a few spam complaints is disproportionate and hard to recover from.

**How to avoid:**
1. Build the notification preferences toggle (on/off) and the database field BEFORE sending any production emails.
2. Include an unsubscribe link in every email template from day one.
3. Check the user's notification preference in the cron job query (filter out opted-out users at the DB level, not in application code).

**Warning signs:**
- Users reply to emails asking to stop receiving them
- Spam complaint rate visible in Mailtrap dashboard increases
- Emails start landing in spam folders

**Phase to address:**
Phase 1 -- the notification toggle and unsubscribe link are prerequisites for any production email sending, not a later enhancement.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline HTML strings for email templates | Fast to build, no dependencies | Unmaintainable, no preview, duplicated styling across notification types | MVP only -- extract to template functions by Phase 2 |
| Single cron endpoint for all notification types | Simple deployment, one vercel.json entry | Growing function that's hard to test, timeout risk, all-or-nothing failure | Phase 1 only -- split by Phase 2 when adding milestone/digest types |
| Hardcoded milestone thresholds (7, 30, 90...) | No config UI needed | Adding/removing thresholds requires code changes | Acceptable long-term for a solo dev project |
| No email queue/retry mechanism | Simpler architecture | Failed sends are lost, no visibility into delivery failures | Acceptable at small scale (<50 users) |
| `rejectUnauthorized: false` in TLS config | Works around cert issues in dev | MITM vulnerability, should never be in production | Never in production -- remove when switching to Send API (which uses HTTPS, not SMTP) |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Mailtrap Send API | Using sandbox SMTP credentials with the Send API endpoint | Send API uses `MAILTRAP_API_TOKEN` via HTTPS POST, completely separate from SMTP credentials. Two different auth mechanisms. |
| Mailtrap Send API | Sending from an unverified "from" address | The "from" email domain must match the verified sending domain in Mailtrap dashboard |
| Mailtrap Send API | Not including a plain-text version alongside HTML | Always send both `html` and `text` fields. Missing plain-text hurts deliverability and accessibility. |
| Vercel Cron | Expecting exact timing (e.g., midnight sharp) | Cron jobs trigger within a ~59 minute window. Never rely on exact execution time for logic like "send at 8am user local time." |
| Vercel Cron | Testing cron jobs in preview deployments | Cron jobs ONLY run on production deployments. Test by hitting the endpoint directly with the correct auth header. |
| Vercel Cron | Not exporting `dynamic = 'force-dynamic'` | Without this, Next.js may cache the route handler response, causing stale data in cron runs |
| Neon Postgres | Opening a new connection per email send | Use Neon's serverless driver or connection pooling. Serverless functions cold-start with fresh connections -- do not create connections inside loops. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all events in one query without pagination | Slow cron runs, memory spikes | Add `LIMIT` and process in batches | 500+ events with reminders |
| N+1 query: looking up user email per event | Linear DB calls scaling with event count | JOIN events with users table, or batch user lookups | 50+ users with active reminders |
| Generating HTML email bodies in the cron handler | Bloated function, mixing concerns | Extract template functions that accept data and return HTML | 3+ notification types |
| Sending emails synchronously in a loop | Function timeout | Use `Promise.allSettled()` for parallel sends (respect Mailtrap rate limits) | 10+ emails per cron run |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging full email content or user emails in console.log | PII in Vercel function logs, visible to anyone with dashboard access | Log only event IDs and send status, never email addresses or content |
| API token in `.env.local` committed to git | Token exposure, unauthorized sending from your domain | Verify `.gitignore` includes `.env.local`, use Vercel environment variables for production |
| No rate limiting on manual email trigger endpoints | Abuse vector -- someone could trigger thousands of emails | Add rate limiting or remove manual trigger endpoints; cron-only sending |
| CRON_SECRET as a weak/guessable value | Anyone can trigger the cron endpoint and force email sends | Use a cryptographically random string (32+ chars), store only in Vercel env vars |
| `rejectUnauthorized: false` in production | Man-in-the-middle attack on SMTP connection | Remove entirely when switching to Send API (uses HTTPS). If keeping SMTP for any reason, only disable in `NODE_ENV === 'development'` |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Sending milestone emails for events the user has not looked at in months | Annoying, feels like spam for forgotten events | Only send milestones for events with recent activity (reset or view in last 30 days), or let users archive events to stop notifications |
| No context in emails about WHY they are receiving it | Confusion, spam reports | Every email should say "You're receiving this because you track [event name] on Days Since" with a link to notification settings |
| Sending streak warnings the same day as a milestone celebration | Contradictory messages -- "congrats on 90 days!" and "your streak is at risk!" | Deduplicate per-event: milestone takes priority over streak warning for the same event on the same day |
| Weekly digest on a day the user already got milestone/streak emails | Email fatigue, redundant information | Exclude events from digest that already triggered a notification that week |
| No way to tell if emails are actually being delivered | User thinks the feature is broken | Add a "Send test email" button in notification settings (already exists in actions.ts, keep it) |

## "Looks Done But Isn't" Checklist

- [ ] **Email service module:** Has error handling for API failures -- verify it does not swallow errors silently (current code catches and logs but does not surface failures to users)
- [ ] **Milestone detection:** Handles events that skip milestones (e.g., event created 29 days ago, cron runs on day 31 -- should still detect the 30-day milestone was passed)
- [ ] **Notification toggle:** Database field exists AND cron query filters by it -- verify the query WHERE clause includes the opt-in check
- [ ] **Unsubscribe link:** Actually works -- clicking it toggles the preference, not just a dead link
- [ ] **Email templates:** Tested in Gmail, Outlook, and Apple Mail -- HTML email rendering varies wildly between clients
- [ ] **Timezone handling:** Day calculations use UTC consistently -- mixing local time and UTC causes off-by-one day errors in milestone detection
- [ ] **Cron auth:** `CRON_SECRET` matches between Vercel env vars and the code -- test by manually hitting the endpoint with curl
- [ ] **Domain verification:** Mailtrap sending domain is fully verified (all DNS records green) before first production deploy
- [ ] **`force-dynamic` export:** Present in all cron route files to prevent Next.js from caching responses

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate emails sent | LOW | Apologize if noticed, fix idempotency, no lasting damage |
| Domain reputation damaged by spam complaints | HIGH | Takes weeks to rebuild. May need to switch sending domain entirely. Prevention is far cheaper. |
| Cron secret exposed | MEDIUM | Rotate the secret in Vercel dashboard immediately, redeploy |
| Wrong userId-as-email sends to invalid addresses | LOW | Bounced emails, fix the lookup logic, no user data exposed |
| Function timeout mid-batch | LOW | Next run picks up unsent emails (if idempotency is correct). Add batching to prevent recurrence. |
| Missing milestone (event passed 30 days but no email) | LOW | Users likely do not notice missed milestones. Fix detection logic to catch "passed" milestones, not just exact-day matches. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Duplicate email sends | Phase 1: Email service consolidation | Unit test: calling send twice with same params only sends once |
| CRON_SECRET mismatch | Phase 1: Infrastructure fix | Manual curl test against production endpoint |
| Domain verification | Phase 1: Pre-coding setup | Mailtrap dashboard shows "Verified" badge |
| No unsubscribe/opt-out | Phase 1: Notification preferences | Email contains working unsubscribe link, DB has preference field |
| userId-as-email assumption | Phase 1: Email service consolidation | Email service resolves userId to email via users table JOIN |
| Function timeout | Phase 2-3: Multiple notification types | Load test with 50+ events, verify completion under 60 seconds |
| Conflicting notifications | Phase 3: Weekly digest | Integration test: event with milestone does not also appear as streak warning |
| Missed milestones (exact-day match) | Phase 2: Milestone detection | Test with event created 29 days ago, verify 30-day milestone still fires |
| Email template rendering | Phase 2: Template creation | Manual test in Gmail, Outlook, Apple Mail |
| `rejectUnauthorized: false` in production | Phase 1: Remove with SMTP-to-API switch | Code review confirms no TLS override in production paths |

## Sources

- [Mailtrap Sending Limits Documentation](https://docs.mailtrap.io/email-api-smtp/setup/sending-limits)
- [Mailtrap Sending Domain Setup](https://docs.mailtrap.io/email-api-smtp/setup/sending-domain)
- [Mailtrap Troubleshooting](https://docs.mailtrap.io/email-api-smtp/help/troubleshooting)
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Vercel Cron Jobs Usage and Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations)
- [Troubleshooting Vercel Cron Jobs](https://vercel.com/kb/guide/troubleshooting-vercel-cron-jobs)
- [Resend: Engineering Idempotency Keys](https://resend.com/blog/engineering-idempotency-keys)
- [How to Avoid Sending Duplicate Emails](https://flaky.build/how-to-avoid-sending-duplicate-emails-to-customers)
- Codebase analysis: `app/api/cron/check-reminders/route.ts`, `lib/db.ts`, `.env.local`, `vercel.json`

---
*Pitfalls research for: Email notifications in Next.js/Vercel with Mailtrap Send API*
*Researched: 2026-03-26*
