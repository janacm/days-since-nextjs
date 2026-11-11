# Codebase Concerns

**Analysis Date:** 2026-03-26

## Tech Debt

**Duplicate schema definitions:**
- Issue: The `events` and `eventResets` tables are defined in both `lib/db.ts` and `lib/schema.ts` with divergent columns. `lib/schema.ts` has an older version missing `reminderDays`, `reminderSent`, `lastReminderSentAt`, `isPrivate`, and `resettable` columns.
- Files: `lib/db.ts` (lines 51-65), `lib/schema.ts` (lines 10-24)
- Impact: Importing from the wrong file yields incomplete types and queries that silently omit columns. New developers will not know which file is canonical.
- Fix approach: Delete `lib/schema.ts` entirely or consolidate so there is exactly one schema definition file. All imports should reference the canonical source.

**Duplicate email transporter initialization:**
- Issue: A Nodemailer transporter is created at module scope in three separate files with slightly different configurations. `app/(dashboard)/actions.ts` omits `secure` and `tls` settings, while the other two include `tls: { rejectUnauthorized: false }`.
- Files: `app/(dashboard)/actions.ts` (lines 19-26), `app/api/reminders/route.ts` (lines 7-18), `app/api/cron/check-reminders/route.ts` (lines 7-18)
- Impact: Configuration drift between transporter instances. Fixing an SMTP issue requires changing three files. The inconsistent TLS settings mean the `sendTestEmail` action may behave differently from production reminder emails.
- Fix approach: Extract a shared `lib/email.ts` module that creates and exports a single configured transporter.

**Duplicate reminder query logic:**
- Issue: The SQL query for finding events needing reminders is copy-pasted between two route handlers, along with the email template and the update logic.
- Files: `app/api/reminders/route.ts` (lines 45-57), `app/api/cron/check-reminders/route.ts` (lines 46-58)
- Impact: Bug fixes or query changes must be applied in two places. Template changes risk divergence.
- Fix approach: Extract shared `lib/reminders.ts` with `findEventsNeedingReminders()` and `sendReminderEmails()` functions.

**Defensive resetCount handling in getEvents:**
- Issue: `getEvents()` in `lib/db.ts` maps over results to add a default `resetCount` value, checking `'resetCount' in event`. This suggests an older migration concern that may no longer apply.
- Files: `lib/db.ts` (lines 191-196)
- Impact: Minor performance overhead and code noise. Suggests incomplete confidence in the schema.
- Fix approach: Verify all rows have `resetCount` via a database query, then remove the defensive mapping.

**Stale "products" feature remnants:**
- Issue: The codebase includes a `products` table, `ProductsTable` component, `getProducts()`, `deleteProductById()`, and a `/customers` page that appear to be leftover from a starter template and not part of the "Days Since" app.
- Files: `lib/db.ts` (lines 41-49, 144-182), `app/(dashboard)/product.tsx`, `app/(dashboard)/products-table.tsx`, `app/(dashboard)/customers/page.tsx`, `app/(dashboard)/actions.ts` (lines 90-100)
- Impact: Dead code increases bundle size and confuses contributors about what the app actually does.
- Fix approach: Remove the products table definition, related DB functions, components, and the `/customers` route.

**Outdated error page references Vercel Postgres:**
- Issue: The `error.tsx` boundary displays setup instructions for "Vercel Postgres" with a `CREATE TABLE users` schema that is missing the `password_hash` column and does not reflect the actual schema.
- Files: `app/(dashboard)/error.tsx`
- Impact: If a user encounters this error, the instructions are misleading and incomplete.
- Fix approach: Update the error page to show the correct schema or provide a generic error message with a link to documentation.

**Debug mode enabled in NextAuth:**
- Issue: `debug: true` is hardcoded in the NextAuth configuration, which logs sensitive session and credential information to the server console in production.
- Files: `lib/auth.ts` (line 14)
- Impact: Credential data, tokens, and user objects are logged to server output. In a shared hosting or log aggregation environment, this is a data leak.
- Fix approach: Set `debug: process.env.NODE_ENV === 'development'` or remove entirely.

## Security Considerations

**Unprotected seed endpoint:**
- Risk: `GET /api/seed` is publicly accessible with no authentication. It deletes ALL events and inserts sample data.
- Files: `app/api/seed/route.ts`
- Current mitigation: None.
- Recommendations: Either remove this endpoint entirely, gate it behind `NODE_ENV === 'development'`, or require admin authentication.

**Unprotected reminders API endpoint:**
- Risk: `POST /api/reminders` has no authentication or authorization check. Anyone can trigger reminder emails for all users.
- Files: `app/api/reminders/route.ts` (line 20 -- no auth check)
- Current mitigation: None. The cron endpoint at `app/api/cron/check-reminders/route.ts` correctly checks `CRON_SECRET`, but the `/api/reminders` endpoint does not.
- Recommendations: Add bearer token authentication (matching the cron pattern) or remove this endpoint if it is redundant with the cron handler.

**Unprotected migration-status endpoint:**
- Risk: `GET /api/migration-status` exposes database schema details (table names, column names, migration file contents) with no authentication.
- Files: `app/api/migration-status/route.ts`
- Current mitigation: None.
- Recommendations: Add authentication or restrict to development environments.

**Admin page has no role-based access control:**
- Risk: The `/admin` page only checks if the user is logged in, not whether they have admin privileges. Any authenticated user can view database host, database name, user count, event count, and send test emails.
- Files: `app/(dashboard)/admin/page.tsx` (lines 15-19)
- Current mitigation: Session check only.
- Recommendations: Add an admin role to the user model and check it before rendering the admin page.

**Missing ownership check on deleteEvent:**
- Risk: The `deleteEvent` server action only checks that the user is logged in, then deletes the event by ID without verifying the event belongs to the calling user. Any authenticated user can delete any event.
- Files: `app/(dashboard)/actions.ts` (lines 76-88)
- Current mitigation: None. Contrast with `editEvent` at line 144 which also lacks an ownership WHERE clause, though the `resetEvent` action at line 160 is similarly unguarded.
- Recommendations: Add `AND user_id = ?` to the WHERE clause for delete, edit, and reset operations. The `getEventById()` function in `lib/db.ts` already supports userId-scoped queries.

**Missing ownership check on resetEvent and resetEventWithDate:**
- Risk: The `resetEvent` and `resetEventWithDate` server actions do not verify the event belongs to the authenticated user. Any user (or even an unauthenticated request, since `resetEvent` does not call `auth()`) can reset any event by ID.
- Files: `app/(dashboard)/actions.ts` (lines 151-191, 193-238)
- Current mitigation: None.
- Recommendations: Add `auth()` check and verify `event.userId === session.user.email` before allowing reset.

**TLS certificate validation disabled:**
- Risk: `rejectUnauthorized: false` in the Nodemailer TLS configuration disables certificate validation, making the SMTP connection vulnerable to man-in-the-middle attacks.
- Files: `app/api/cron/check-reminders/route.ts` (line 16), `app/api/reminders/route.ts` (line 16)
- Current mitigation: None.
- Recommendations: Remove `rejectUnauthorized: false` and ensure the SMTP server uses a valid certificate. If using a development SMTP service, gate this setting behind `NODE_ENV`.

**Excessive console.log of user emails and credentials:**
- Risk: User emails are logged at login (`lib/auth.ts` line 75, `app/login/actions.ts` line 9), signup (`app/signup/page.tsx` line 36), and user lookup (`lib/db.ts` line 105). Credentials object is logged in the signIn callback (`lib/auth.ts` lines 17-23).
- Files: `lib/auth.ts`, `lib/db.ts`, `app/login/actions.ts`, `app/signup/page.tsx`
- Current mitigation: None.
- Recommendations: Remove PII from log statements. Use structured logging with redaction.

**Non-null assertion on POSTGRES_URL:**
- Risk: `lib/db.ts` line 88 uses `process.env.POSTGRES_URL!` (non-null assertion) after only logging a warning if it is missing. If the env var is unset, the app will crash with an unhelpful error from the Neon driver.
- Files: `lib/db.ts` (line 88)
- Current mitigation: Console error at line 80-83.
- Recommendations: Throw a clear error at startup if `POSTGRES_URL` is missing, or use a validation library like `zod` for env vars.

## Performance Concerns

**Client-side search with Fuse.js loads all events:**
- Problem: `getEvents()` fetches all events for a user without pagination, then passes the entire array to the client. Fuse.js performs fuzzy search on the full dataset in the browser.
- Files: `lib/db.ts` (line 184-196), `app/(dashboard)/events-table.tsx` (lines 40-45)
- Cause: No server-side pagination or search. All events are loaded into client memory.
- Improvement path: Add pagination to `getEvents()` and consider server-side search for users with many events.

**Analytics calculation happens in application code:**
- Problem: `getEventAnalytics()` fetches all resets for an event, then computes averages, intervals, and longest periods in JavaScript. For events with hundreds of resets, this is multiple array iterations.
- Files: `lib/db.ts` (lines 266-375)
- Cause: Analytics are computed in JS rather than SQL aggregate queries.
- Improvement path: Move interval calculations to SQL window functions or materialized aggregates.

**Module-level transporter creation:**
- Problem: Nodemailer transporters are created at module scope (top-level `const transporter = ...`), which means they are initialized when the module is imported, even if the email functionality is not used in that request.
- Files: `app/(dashboard)/actions.ts` (line 19), `app/api/reminders/route.ts` (line 7), `app/api/cron/check-reminders/route.ts` (line 7)
- Cause: Eager initialization pattern.
- Improvement path: Lazily create the transporter inside the functions that need it, or use a shared singleton with lazy init.

## Fragile Areas

**Date handling inconsistency:**
- Files: `lib/db.ts` (line 55), `app/(dashboard)/actions.ts` (lines 56, 131, 156, 203)
- Why fragile: The `events.date` column is defined as `varchar(255)` but stores ISO 8601 datetime strings. Dates are stored via `date.toISOString()` but compared and sorted as strings. The "days since" calculation uses `(1000 * 3600 * 24)` as a magic number for milliseconds-per-day, duplicated in at least 5 locations across `lib/db.ts`, `app/(dashboard)/event-card.tsx`, and `app/(dashboard)/page.tsx`.
- Safe modification: Create a shared `daysSince(dateString: string): number` utility. Consider migrating the `date` column to a proper `timestamp` type.
- Test coverage: `lib/__tests__/date-utils.test.ts` exists but the main calculation is inline in components.

**Password format detection by string length:**
- Files: `lib/auth-helpers.ts` (lines 52-53, 65, 75, 82)
- Why fragile: Password format is identified by hash length (60 = bcrypt, 64 = SHA-256, 96 = PBKDF2). If a hash ever has a non-standard length, login silently fails. Bcrypt users are permanently locked out with no password reset flow.
- Safe modification: Add a format prefix to new hashes (e.g., `pbkdf2:...`) instead of relying on length. Implement a password reset flow for bcrypt users.
- Test coverage: `lib/__tests__/auth-helpers.test.ts` covers the happy paths.

**Event edit does not scope by userId:**
- Files: `app/(dashboard)/actions.ts` (lines 133-145)
- Why fragile: The `editEvent` action updates an event by ID without a `userId` WHERE clause. While `editEvent` on the edit page first loads the event scoped to the user, the server action itself can be called directly with any event ID.
- Safe modification: Add `.where(and(eq(events.id, id), eq(events.userId, session.user.email)))` to all mutation queries.

## Dependencies at Risk

**next-auth 5.0.0-beta.30:**
- Risk: Using a beta version of NextAuth v5. Beta APIs may change between releases, and there is no stable release to pin to.
- Impact: Upgrades may require auth flow rewrites. Security patches may lag behind stable releases.
- Migration plan: Monitor the NextAuth v5 stable release and upgrade when available. Lock the version precisely until then.

**next-pwa ^5.6.0:**
- Risk: `next-pwa` is listed as a dependency but there is no PWA configuration in `next.config.ts`. The package may be unused dead weight.
- Impact: Adds to install time and potential supply chain risk.
- Migration plan: Verify if PWA features are needed. If not, remove the dependency. If yes, configure it in `next.config.ts`.

**bcryptjs ^3.0.2:**
- Risk: `bcryptjs` is listed as a dependency but the codebase has migrated away from bcrypt to Web Crypto PBKDF2. The only reference to bcrypt is in `comparePasswords()` where bcrypt hashes are rejected.
- Impact: Unused dependency. Users with bcrypt passwords cannot log in.
- Migration plan: Remove `bcryptjs` from dependencies. Implement a password reset flow for any remaining bcrypt users, or run a migration script.

**prop-types ^15.8.1:**
- Risk: `prop-types` is a dependency but the codebase uses TypeScript for type checking. No `.jsx` files or PropTypes usage detected.
- Impact: Unused dependency.
- Migration plan: Remove from `package.json`.

## Missing Critical Features

**No password reset flow:**
- Problem: There is no "Forgot Password" link, no password reset endpoint, and no token-based reset mechanism.
- Blocks: Users who forget their password are permanently locked out. Users with legacy bcrypt password hashes (acknowledged in `lib/auth-helpers.ts` lines 65-71) cannot log in and have no way to recover their account.

**No form error display:**
- Problem: Login and signup pages have empty div placeholders for error messages (`{/* Error messages will be shown by Next.js built-in error handling */}`), but server actions throw errors that result in unhandled error pages rather than inline form validation messages.
- Files: `app/login/page.tsx` (line 47-49), `app/signup/page.tsx` (line 116-118)
- Blocks: Users see a full-page error instead of helpful "invalid email/password" feedback.

**No rate limiting:**
- Problem: Login, signup, and API endpoints have no rate limiting. The login endpoint can be brute-forced.
- Files: `app/login/actions.ts`, `app/signup/page.tsx`, `app/api/reminders/route.ts`
- Blocks: Production security posture. An attacker can attempt unlimited password guesses.

## Test Coverage Gaps

**Server actions untested for authorization:**
- What's not tested: The `deleteEvent`, `resetEvent`, and `resetEventWithDate` server actions lack tests verifying that unauthorized users cannot modify events belonging to other users.
- Files: `app/(dashboard)/actions.ts`
- Risk: The ownership verification bugs described above could go undetected.
- Priority: High

**No tests for signup flow:**
- What's not tested: User registration, duplicate email handling, and password hashing during signup.
- Files: `app/signup/page.tsx`
- Risk: Registration bugs silently break new user onboarding.
- Priority: Medium

**No tests for middleware:**
- What's not tested: The auth redirect logic in `middleware.ts` (redirect logged-in users away from login/signup).
- Files: `middleware.ts`
- Risk: Auth flow regressions.
- Priority: Low

**No end-to-end tests:**
- What's not tested: Full user flows (login -> add event -> reset event -> view analytics).
- Risk: Integration issues between server actions, database, and UI are not caught.
- Priority: Medium

---

*Concerns audit: 2026-03-26*
